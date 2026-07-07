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

    const body = await req.json();
    const token: unknown = body?.token;
    // Captains scanning a ticket check the traveller in; pass checkIn:false to peek only.
    const checkIn: boolean = body?.checkIn !== false;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 });
    }

    const result = verifyQrToken(token);
    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: "Invalid or tampered QR code" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: result.payload.bookingId },
      include: {
        trip: { select: { id: true, title: true, destination: true, startDate: true, endDate: true, tripCaptainId: true } },
        user: { select: { id: true, name: true, phone: true, avatar: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    // Only the trip's captain (or an admin) may verify tickets for this trip.
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    const isAdmin = me?.role === "ADMIN";
    const isCaptain = booking.trip.tripCaptainId === session.user.id;
    if (!isAdmin && !isCaptain) {
      return NextResponse.json(
        { success: false, error: "Only this trip's captain can verify tickets." },
        { status: 403 }
      );
    }

    if (booking.qrToken !== token) {
      return NextResponse.json(
        { success: false, error: "QR does not match this booking" },
        { status: 400 }
      );
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { success: false, error: `Booking is ${booking.status.toLowerCase()}, not confirmed` },
        { status: 400 }
      );
    }

    // Already checked in? Report it (don't overwrite the original time).
    const alreadyCheckedIn = !!booking.checkedInAt;
    let checkedInAt = booking.checkedInAt;

    if (checkIn && !alreadyCheckedIn) {
      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: { checkedInAt: new Date(), checkedInById: session.user.id },
        select: { checkedInAt: true },
      });
      checkedInAt = updated.checkedInAt;

      auditLog({
        userId: session.user.id,
        action: "TICKET_CHECKED_IN",
        entityType: "booking",
        entityId: booking.id,
        metadata: { bookingNumber: booking.bookingNumber, tripId: booking.trip.id },
        ipAddress: getClientIp(req),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        verified: true,
        alreadyCheckedIn,
        checkedInAt: checkedInAt ? checkedInAt.toISOString() : null,
        bookingNumber: booking.bookingNumber,
        bookingType: booking.bookingType,
        travelerCount: booking.travelerCount,
        travelers: booking.travelers,
        user: booking.user,
        trip: {
          id: booking.trip.id,
          title: booking.trip.title,
          destination: booking.trip.destination,
          startDate: booking.trip.startDate,
          endDate: booking.trip.endDate,
        },
      },
    });
  } catch (error) {
    logger.error("QR verification error", error);
    return NextResponse.json({ success: false, error: "Failed to verify QR code" }, { status: 500 });
  }
}
