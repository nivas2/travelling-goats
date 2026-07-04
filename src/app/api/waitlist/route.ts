import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger, getClientIp } from "@/lib/logger";
import { validateBody } from "@/lib/validate";
import { joinWaitlistSchema } from "@/lib/validations/waitlist";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { expireStaleOffers } from "@/lib/waitlist";

const logger = createLogger({ route: "waitlist" });

// GET: List user's waitlist items
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.waitlistItem.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["WAITING", "OFFERED"] },
      },
      include: {
        trip: {
          select: {
            id: true,
            title: true,
            slug: true,
            destination: true,
            coverImage: true,
            startDate: true,
            endDate: true,
            maxGroupSize: true,
            currentBookings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    logger.error("Waitlist fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }
}

// POST: Join waitlist
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = applyRateLimit("api", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const validation = validateBody(joinWaitlistSchema, body);
    if (!validation.success) return validation.response;

    const { tripId } = validation.data;

    // Verify trip exists
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, status: true, maxGroupSize: true, currentBookings: true },
    });

    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
    }

    if (trip.status === "CANCELLED" || trip.status === "COMPLETED") {
      return NextResponse.json(
        { success: false, error: "Trip is no longer available" },
        { status: 400 }
      );
    }

    // Check if user already has an active waitlist entry
    const existing = await prisma.waitlistItem.findUnique({
      where: { userId_tripId: { userId: session.user.id, tripId } },
    });

    if (existing && ["WAITING", "OFFERED"].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: "Already on the waitlist for this trip" },
        { status: 400 }
      );
    }

    // Expire stale offers first
    await expireStaleOffers(tripId);

    // Create or update waitlist item
    const item = existing
      ? await prisma.waitlistItem.update({
          where: { id: existing.id },
          data: { status: "WAITING", offeredAt: null, expiresAt: null },
        })
      : await prisma.waitlistItem.create({
          data: {
            userId: session.user.id,
            tripId,
            status: "WAITING",
          },
        });

    const ip = getClientIp(req);
    auditLog({
      userId: session.user.id,
      action: "WAITLIST_JOINED",
      entityType: "waitlist",
      entityId: item.id,
      metadata: { tripId },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    logger.error("Waitlist join error", error);
    return NextResponse.json(
      { success: false, error: "Failed to join waitlist" },
      { status: 500 }
    );
  }
}
