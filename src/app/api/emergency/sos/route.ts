import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger, getClientIp } from "@/lib/logger";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const logger = createLogger({ route: "emergency-sos" });

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    // Generous limit so a panicking user can retry, but not unbounded.
    const rl = applyRateLimit("api", session.user.id);
    if (rl) return rl;

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const location = String(body?.location ?? "").trim() || "Location unavailable";
    const hasCoords = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(location);
    const mapsLink = hasCoords
      ? `https://www.google.com/maps?q=${encodeURIComponent(location)}`
      : null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, phone: true },
    });
    const who = user?.name ?? "A traveller";
    const now = new Date();

    // Which trip is the user currently on (if any)?
    const booking = await prisma.booking.findFirst({
      where: {
        userId,
        status: "CONFIRMED",
        trip: { startDate: { lte: now }, endDate: { gte: now } },
      },
      include: { trip: { select: { id: true, title: true, tripCaptainId: true } } },
    });
    const trip = booking?.trip ?? null;

    const alertBody =
      `🚨 SOS EMERGENCY — ${who} needs immediate help.` +
      (trip ? ` Trip: ${trip.title}.` : "") +
      ` Location: ${location}.` +
      (mapsLink ? ` Map: ${mapsLink}` : "") +
      (user?.phone ? ` Phone: ${user.phone}.` : "");

    // 1) Drop the SOS into the traveller's private Whistle thread so the shepherd
    //    sees it in the Private Requests inbox.
    if (trip) {
      const thread = await prisma.privateRequest.upsert({
        where: { tripId_userId: { tripId: trip.id, userId } },
        create: { tripId: trip.id, userId, status: "OPEN" },
        update: { status: "OPEN" },
      });
      await prisma.privateRequestMessage.create({
        data: { requestId: thread.id, senderId: userId, content: alertBody, isStaff: false },
      });
    }

    // 2) Notify the shepherd (if assigned) + all admins with an SOS notification.
    const recipientIds = new Set<string>();
    if (trip?.tripCaptainId) recipientIds.add(trip.tripCaptainId);
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    admins.forEach((a) => recipientIds.add(a.id));
    recipientIds.delete(userId);

    if (recipientIds.size > 0) {
      await prisma.notification.createMany({
        data: [...recipientIds].map((rid) => ({
          userId: rid,
          title: "🚨 SOS Alert",
          body: alertBody,
          type: "SOS" as const,
          data: { fromUserId: userId, tripId: trip?.id ?? null, location, mapsLink },
        })),
      });
    }

    // 3) Emergency contacts (name/phone only — real SMS dispatch is a Phase-2 integration).
    const emergencyContacts = await prisma.emergencyContact.count({ where: { userId } });

    auditLog({
      userId,
      action: "SOS_TRIGGERED",
      entityType: "trip",
      entityId: trip?.id ?? "none",
      metadata: { location, tripId: trip?.id ?? null },
      ipAddress: getClientIp(req),
    });
    logger.error("SOS TRIGGERED", { userId, tripId: trip?.id ?? null, location });

    return NextResponse.json({
      success: true,
      data: {
        notifiedShepherd: !!trip?.tripCaptainId,
        notifiedAdmins: admins.length,
        emergencyContacts,
        tripTitle: trip?.title ?? null,
        mapsLink,
      },
    });
  } catch (error) {
    logger.error("SOS handler error", error);
    return NextResponse.json(
      { success: false, error: "Failed to send SOS alert" },
      { status: 500 }
    );
  }
}
