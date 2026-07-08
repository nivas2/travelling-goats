import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLogger, getClientIp } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";
import { auditLog } from "@/lib/audit";

const logger = createLogger({ route: "admin-bookings-detail" });

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const { id } = await params;
    const body = await req.json();

    if (!body.status) {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 }
      );
    }

    // For REFUNDED status, credit wallet in a transaction
    if (body.status === "REFUNDED") {
      const result = await prisma.$transaction(async (tx) => {
        // Lock booking row
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
          Prisma.sql`SELECT id, "userId", "tripId", status, "totalPricePaise", "travelerCount", "bookingNumber" FROM bookings WHERE id = ${id} FOR UPDATE`
        );

        if (!booking) throw new Error("BOOKING_NOT_FOUND");
        if (booking.status === "REFUNDED") throw new Error("ALREADY_REFUNDED");

        const refundPaise = booking.totalPricePaise;

        // Check for existing cancellation to avoid duplicate
        const existingCancellation = await tx.bookingCancellation.findUnique({
          where: { bookingId: id },
        });

        if (!existingCancellation) {
          // Create cancellation record
          await tx.bookingCancellation.create({
            data: {
              bookingId: id,
              reason: "Admin refund",
              refundPaise,
              refundStatus: "COMPLETED",
            },
          });
        } else {
          // Update existing cancellation with refund info
          await tx.bookingCancellation.update({
            where: { bookingId: id },
            data: {
              refundPaise,
              refundStatus: "COMPLETED",
            },
          });
        }

        // Update booking status
        await tx.booking.update({
          where: { id },
          data: { status: "REFUNDED" },
        });

        // Decrement trip bookings if was CONFIRMED
        if (booking.status === "CONFIRMED") {
          await tx.trip.update({
            where: { id: booking.tripId },
            data: { currentBookings: { decrement: booking.travelerCount } },
          });
        }

        // Credit wallet
        const [wallet] = await tx.$queryRaw<
          Array<{ id: string; balancePaise: number }>
        >(
          Prisma.sql`SELECT id, "balancePaise" FROM wallets WHERE "userId" = ${booking.userId} FOR UPDATE`
        );

        let walletRecord = wallet;
        if (!walletRecord) {
          walletRecord = (await tx.wallet.create({
            data: { userId: booking.userId },
            select: { id: true, balancePaise: true },
          })) as { id: string; balancePaise: number };
        }

        const newBalance = walletRecord.balancePaise + refundPaise;

        await tx.wallet.update({
          where: { id: walletRecord.id },
          data: { balancePaise: newBalance },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: walletRecord.id,
            userId: booking.userId,
            type: "REFUND",
            amountPaise: refundPaise,
            description: `Admin refund for booking ${booking.bookingNumber}`,
            referenceId: id,
            balanceAfterPaise: newBalance,
          },
        });

        return {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: "REFUNDED" as const,
          refundPaise,
        };
      });

      const ip = getClientIp(req);
      auditLog({
        userId: authResult.user.id,
        action: "ADMIN_REFUND",
        entityType: "booking",
        entityId: id,
        metadata: {
          refundPaise: result.refundPaise,
          bookingNumber: result.bookingNumber,
        },
        ipAddress: ip,
      });

      return NextResponse.json({ success: true, data: result });
    }

    // Non-refund status updates
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: body.status },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
      },
    });

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    if (error instanceof Error) {
      const errorMap: Record<string, { message: string; status: number }> = {
        BOOKING_NOT_FOUND: { message: "Booking not found", status: 404 },
        ALREADY_REFUNDED: { message: "Booking already refunded", status: 400 },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return NextResponse.json(
          { success: false, error: mapped.message },
          { status: mapped.status }
        );
      }
    }
    logger.error("Admin booking update error", error);
    return NextResponse.json(
      { success: false, error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
