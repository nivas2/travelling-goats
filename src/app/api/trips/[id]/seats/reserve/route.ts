import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { applyRateLimit } from "@/lib/rate-limit";

const logger = createLogger({ route: "seat-reserve" });

const RESERVATION_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const rateLimitResponse = applyRateLimit("booking", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: tripId } = await params;
    const body = await req.json();
    const { seatIds, sessionId } = body;

    if (!Array.isArray(seatIds) || seatIds.length === 0 || !sessionId) {
      return NextResponse.json(
        { success: false, error: "seatIds and sessionId are required" },
        { status: 400 }
      );
    }

    // Clean up expired reservations
    await prisma.seatReservation.deleteMany({
      where: {
        tripId,
        expiresAt: { lt: new Date() },
      },
    });

    // Verify seats exist and belong to trip's vehicle
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { vehicleTemplateId: true },
    });

    if (!trip?.vehicleTemplateId) {
      return NextResponse.json(
        { success: false, error: "Trip has no vehicle assigned" },
        { status: 400 }
      );
    }

    const seats = await prisma.seat.findMany({
      where: {
        id: { in: seatIds },
        vehicleTemplateId: trip.vehicleTemplateId,
      },
    });

    if (seats.length !== seatIds.length) {
      return NextResponse.json(
        { success: false, error: "Some seats are invalid" },
        { status: 400 }
      );
    }

    // Check seat availability
    const bookedSeatIds = new Set(
      (
        await prisma.bookingSeat.findMany({
          where: {
            seatId: { in: seatIds },
            booking: {
              tripId,
              status: { in: ["PENDING", "CONFIRMED"] },
            },
          },
          select: { seatId: true },
        })
      ).map((bs) => bs.seatId)
    );

    const existingReservations = await prisma.seatReservation.findMany({
      where: {
        tripId,
        seatId: { in: seatIds },
        expiresAt: { gt: new Date() },
        NOT: { sessionId },
      },
      select: { seatId: true },
    });
    const reservedByOthers = new Set(existingReservations.map((r) => r.seatId));

    for (const seat of seats) {
      if (seat.status === "BLOCKED" || seat.status === "MAINTENANCE") {
        return NextResponse.json(
          { success: false, error: `Seat ${seat.seatNumber} is blocked` },
          { status: 400 }
        );
      }
      if (bookedSeatIds.has(seat.id)) {
        return NextResponse.json(
          { success: false, error: `Seat ${seat.seatNumber} is already booked` },
          { status: 400 }
        );
      }
      if (reservedByOthers.has(seat.id)) {
        return NextResponse.json(
          { success: false, error: `Seat ${seat.seatNumber} is reserved by someone else` },
          { status: 400 }
        );
      }
    }

    const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MS);

    // Delete any existing reservations for this session on this trip, then create new ones
    await prisma.$transaction(async (tx) => {
      await tx.seatReservation.deleteMany({
        where: { tripId, sessionId },
      });

      await tx.seatReservation.createMany({
        data: seatIds.map((seatId: string) => ({
          seatId,
          tripId,
          userId: session.user!.id!,
          sessionId,
          expiresAt,
        })),
      });
    });

    return NextResponse.json({
      success: true,
      data: { expiresAt: expiresAt.toISOString(), seatIds },
    });
  } catch (error) {
    logger.error("Seat reservation error", error);
    return NextResponse.json(
      { success: false, error: "Failed to reserve seats" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: tripId } = await params;
    const body = await req.json();
    const { seatIds, sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "sessionId is required" },
        { status: 400 }
      );
    }

    const where: { tripId: string; sessionId: string; seatId?: { in: string[] } } = {
      tripId,
      sessionId,
    };
    if (Array.isArray(seatIds) && seatIds.length > 0) {
      where.seatId = { in: seatIds };
    }

    await prisma.seatReservation.deleteMany({ where });

    return NextResponse.json({ success: true, message: "Reservations released" });
  } catch (error) {
    logger.error("Seat release error", error);
    return NextResponse.json(
      { success: false, error: "Failed to release reservations" },
      { status: 500 }
    );
  }
}
