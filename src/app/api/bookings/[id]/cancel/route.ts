import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLogger, getClientIp } from "@/lib/logger";
import { validateBody } from "@/lib/validate";
import { cancelBookingSchema } from "@/lib/validations/booking";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { promoteWaitlist } from "@/lib/waitlist";

const logger = createLogger({ route: "booking-cancel" });

const PROCESSING_FEE_PAISE = 5000; // Rs. 50

function calculateRefund(
  totalPricePaise: number,
  tripStartDate: Date
): { refundPaise: number; reason: string } {
  const now = new Date();
  const msUntilTrip = tripStartDate.getTime() - now.getTime();
  const daysUntilTrip = msUntilTrip / (1000 * 60 * 60 * 24);

  if (daysUntilTrip > 7) {
    // >7 days: full refund minus Rs. 50 processing fee
    const refund = Math.max(0, totalPricePaise - PROCESSING_FEE_PAISE);
    return { refundPaise: refund, reason: "Full refund minus processing fee (>7 days)" };
  }

  if (daysUntilTrip >= 3) {
    // 3-7 days: 50% to wallet
    const refund = Math.floor(totalPricePaise * 0.5);
    return { refundPaise: refund, reason: "50% refund to wallet (3-7 days)" };
  }

  // <3 days: no refund
  return { refundPaise: 0, reason: "No refund (<3 days before trip)" };
}

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

    const { id: bookingId } = await params;
    const body = await req.json();
    const validation = validateBody(cancelBookingSchema, body);
    if (!validation.success) return validation.response;

    const { reason } = validation.data;
    const userId = session.user.id;

    const result = await prisma.$transaction(async (tx) => {
      // Lock the booking row
      const [booking] = await tx.$queryRaw<
        Array<{
          id: string;
          userId: string;
          tripId: string;
          status: string;
          totalPricePaise: number;
          travelerCount: number;
          bookingNumber: string;
        }>
      >(
        Prisma.sql`SELECT id, "userId", "tripId", status, "totalPricePaise", "travelerCount", "bookingNumber" FROM bookings WHERE id = ${bookingId} FOR UPDATE`
      );

      if (!booking) throw new Error("BOOKING_NOT_FOUND");
      if (booking.userId !== userId) throw new Error("FORBIDDEN");
      if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
        throw new Error("INVALID_STATUS");
      }

      // Check for existing cancellation
      const existingCancellation = await tx.bookingCancellation.findUnique({
        where: { bookingId },
      });
      if (existingCancellation) throw new Error("ALREADY_CANCELLED");

      // Get trip start date for refund calculation
      const trip = await tx.trip.findUnique({
        where: { id: booking.tripId },
        select: { startDate: true },
      });
      if (!trip) throw new Error("TRIP_NOT_FOUND");

      const { refundPaise, reason: refundReason } = calculateRefund(
        booking.totalPricePaise,
        trip.startDate
      );

      // Create cancellation record
      const cancellation = await tx.bookingCancellation.create({
        data: {
          bookingId,
          reason,
          refundPaise,
          refundStatus: refundPaise > 0 ? "PROCESSING" : "COMPLETED",
        },
      });

      // Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      });

      // Decrement trip bookings if was CONFIRMED
      if (booking.status === "CONFIRMED") {
        await tx.trip.update({
          where: { id: booking.tripId },
          data: { currentBookings: { decrement: booking.travelerCount } },
        });
      }

      // Credit refund to wallet if applicable
      if (refundPaise > 0) {
        // Lock wallet
        const [wallet] = await tx.$queryRaw<
          Array<{ id: string; balancePaise: number }>
        >(
          Prisma.sql`SELECT id, "balancePaise" FROM wallets WHERE "userId" = ${userId} FOR UPDATE`
        );

        let walletRecord = wallet;
        if (!walletRecord) {
          walletRecord = await tx.wallet.create({
            data: { userId: userId },
            select: { id: true, balancePaise: true },
          }) as { id: string; balancePaise: number };
        }

        const newBalance = walletRecord.balancePaise + refundPaise;

        await tx.wallet.update({
          where: { id: walletRecord.id },
          data: { balancePaise: newBalance },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: walletRecord.id,
            userId: userId,
            type: "REFUND",
            amountPaise: refundPaise,
            description: `Refund for booking ${booking.bookingNumber}: ${refundReason}`,
            referenceId: bookingId,
            balanceAfterPaise: newBalance,
          },
        });

        // Mark refund as completed
        await tx.bookingCancellation.update({
          where: { id: cancellation.id },
          data: { refundStatus: "COMPLETED" },
        });
      }

      return {
        cancellation,
        refundPaise,
        refundReason,
        tripId: booking.tripId,
      };
    });

    // Fire-and-forget: promote waitlist
    promoteWaitlist(result.tripId).catch((err) => {
      logger.error("Waitlist promotion failed after cancellation", err);
    });

    const ip = getClientIp(req);
    auditLog({
      userId: session.user.id,
      action: "BOOKING_CANCELLED",
      entityType: "booking",
      entityId: bookingId,
      metadata: {
        reason,
        refundPaise: result.refundPaise,
        refundReason: result.refundReason,
      },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      data: {
        cancellation: result.cancellation,
        refundPaise: result.refundPaise,
        refundReason: result.refundReason,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      const errorMap: Record<string, { message: string; status: number }> = {
        BOOKING_NOT_FOUND: { message: "Booking not found", status: 404 },
        FORBIDDEN: { message: "You can only cancel your own bookings", status: 403 },
        INVALID_STATUS: { message: "Booking cannot be cancelled in its current status", status: 400 },
        ALREADY_CANCELLED: { message: "Booking is already cancelled", status: 400 },
        TRIP_NOT_FOUND: { message: "Trip not found", status: 404 },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return NextResponse.json(
          { success: false, error: mapped.message },
          { status: mapped.status }
        );
      }
    }
    logger.error("Booking cancellation error", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
