import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { verifyQrToken } from "@/lib/qr";
import { createLogger, getClientIp } from "@/lib/logger";
import { auditLog } from "@/lib/audit";

const logger = createLogger({ route: "verify-qr" });

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    const result = verifyQrToken(token);
    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: "Invalid or tampered QR code" },
        { status: 400 }
      );
    }

    // Verify booking exists and is confirmed
    const booking = await prisma.booking.findUnique({
      where: { id: result.payload.bookingId },
      include: {
        trip: {
          select: {
            id: true,
            title: true,
            destination: true,
            startDate: true,
            endDate: true,
          },
        },
        user: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json({
        success: false,
        error: `Booking is ${booking.status.toLowerCase()}, not confirmed`,
      }, { status: 400 });
    }

    // Verify the QR token matches
    if (booking.qrToken !== token) {
      return NextResponse.json(
        { success: false, error: "QR token does not match booking" },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    auditLog({
      userId: session.user.id,
      action: "QR_VERIFIED",
      entityType: "booking",
      entityId: booking.id,
      metadata: {
        bookingNumber: booking.bookingNumber,
        verifiedBy: session.user.id,
      },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      data: {
        verified: true,
        bookingNumber: booking.bookingNumber,
        travelerCount: booking.travelerCount,
        travelers: booking.travelers,
        user: booking.user,
        trip: booking.trip,
        status: booking.status,
      },
    });
  } catch (error) {
    logger.error("QR verification error", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify QR code" },
      { status: 500 }
    );
  }
}
