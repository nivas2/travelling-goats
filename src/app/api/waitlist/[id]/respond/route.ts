import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger, getClientIp } from "@/lib/logger";
import { validateBody } from "@/lib/validate";
import { respondWaitlistSchema } from "@/lib/validations/waitlist";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { promoteWaitlist } from "@/lib/waitlist";

const logger = createLogger({ route: "waitlist-respond" });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = applyRateLimit("booking", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: waitlistId } = await params;
    const body = await req.json();
    const validation = validateBody(respondWaitlistSchema, body);
    if (!validation.success) return validation.response;

    const { action } = validation.data;

    const item = await prisma.waitlistItem.findUnique({
      where: { id: waitlistId },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: "Waitlist item not found" }, { status: 404 });
    }

    if (item.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (item.status !== "OFFERED") {
      return NextResponse.json(
        { success: false, error: "This waitlist offer is not active" },
        { status: 400 }
      );
    }

    // Check if offer has expired
    if (item.expiresAt && item.expiresAt < new Date()) {
      await prisma.waitlistItem.update({
        where: { id: waitlistId },
        data: { status: "EXPIRED" },
      });
      // Promote next person
      promoteWaitlist(item.tripId).catch((err) => {
        logger.error("Waitlist promotion failed after expiry", err);
      });
      return NextResponse.json(
        { success: false, error: "This offer has expired" },
        { status: 400 }
      );
    }

    if (action === "accept") {
      await prisma.waitlistItem.update({
        where: { id: waitlistId },
        data: { status: "ACCEPTED" },
      });

      const ip = getClientIp(req);
      auditLog({
        userId: session.user.id,
        action: "WAITLIST_PROMOTED",
        entityType: "waitlist",
        entityId: waitlistId,
        metadata: { tripId: item.tripId, action: "accepted" },
        ipAddress: ip,
      });

      return NextResponse.json({
        success: true,
        data: {
          status: "ACCEPTED",
          message: "Offer accepted. Please proceed to book the trip.",
          tripId: item.tripId,
        },
      });
    }

    // Decline
    await prisma.waitlistItem.update({
      where: { id: waitlistId },
      data: { status: "CANCELLED" },
    });

    // Promote next person
    promoteWaitlist(item.tripId).catch((err) => {
      logger.error("Waitlist promotion failed after decline", err);
    });

    const ip = getClientIp(req);
    auditLog({
      userId: session.user.id,
      action: "WAITLIST_PROMOTED",
      entityType: "waitlist",
      entityId: waitlistId,
      metadata: { tripId: item.tripId, action: "declined" },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      data: { status: "CANCELLED", message: "Offer declined." },
    });
  } catch (error) {
    logger.error("Waitlist respond error", error);
    return NextResponse.json(
      { success: false, error: "Failed to respond to waitlist offer" },
      { status: 500 }
    );
  }
}
