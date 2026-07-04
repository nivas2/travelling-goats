import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateQrToken } from "@/lib/qr";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ route: "ticket" });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: bookingId } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: {
          select: {
            id: true,
            title: true,
            destination: true,
            startDate: true,
            endDate: true,
            meetingPoint: true,
            meetingTime: true,
            coverImage: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { success: false, error: "Ticket is only available for confirmed bookings" },
        { status: 400 }
      );
    }

    // Generate QR token on first access
    let qrToken = booking.qrToken;
    if (!qrToken) {
      qrToken = generateQrToken({
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        userId: booking.userId,
        tripId: booking.tripId,
        travelerCount: booking.travelerCount,
      });

      await prisma.booking.update({
        where: { id: bookingId },
        data: { qrToken },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingNumber: booking.bookingNumber,
        qrToken,
        travelerCount: booking.travelerCount,
        travelers: booking.travelers,
        pickupPoint: booking.pickupPoint,
        trip: booking.trip,
      },
    });
  } catch (error) {
    logger.error("Ticket generation error", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate ticket" },
      { status: 500 }
    );
  }
}
