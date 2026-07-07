import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateQrToken } from "@/lib/qr";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ route: "ticket" });

function ageFromDob(dob: Date | null): number | undefined {
  if (!dob) return undefined;
  const ms = Date.now() - new Date(dob).getTime();
  if (ms <= 0) return undefined;
  return Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
}

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
            duration: true,
            meetingPoint: true,
            meetingTime: true,
            coverImage: true,
          },
        },
        user: {
          select: { name: true, dateOfBirth: true, gender: true, phone: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (booking.status === "CANCELLED" || booking.status === "REFUNDED") {
      return NextResponse.json(
        { success: false, error: "No ticket available for cancelled bookings" },
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

    // Use the travellers captured at booking time; if none were stored, fall
    // back to the booking owner's profile so the ticket always shows a name/age.
    const storedTravelers = Array.isArray(booking.travelers)
      ? (booking.travelers as unknown[])
      : [];
    const travelers =
      storedTravelers.length > 0
        ? storedTravelers
        : [
            {
              name: booking.user?.name ?? "Traveller",
              age: ageFromDob(booking.user?.dateOfBirth ?? null),
              gender: booking.user?.gender ?? undefined,
              phone: booking.user?.phone ?? undefined,
            },
          ];

    return NextResponse.json({
      success: true,
      data: {
        bookingNumber: booking.bookingNumber,
        qrToken,
        status: booking.status,
        bookingType: booking.bookingType,
        travelerCount: booking.travelerCount,
        travelers,
        pickupPoint: booking.pickupPoint,
        totalPricePaise: booking.totalPricePaise,
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
