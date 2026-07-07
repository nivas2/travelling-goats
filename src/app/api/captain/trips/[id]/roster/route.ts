import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireCaptain } from "@/lib/rbac";

const logger = createLogger({ route: "captain-roster" });

// Traveller roster for a trip the captain handles (admins allowed for any trip).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireCaptain();
    if (!authResult.success) return authResult.response;
    const { id: userId, role } = authResult.user;
    const { id: tripId } = await params;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, title: true, destination: true, startDate: true, endDate: true, tripCaptainId: true },
    });
    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
    }
    if (role !== "ADMIN" && trip.tripCaptainId !== userId) {
      return NextResponse.json(
        { success: false, error: "You don't handle this trip." },
        { status: 403 }
      );
    }

    const bookings = await prisma.booking.findMany({
      where: { tripId, status: "CONFIRMED" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        bookingNumber: true,
        travelerCount: true,
        travelers: true,
        checkedInAt: true,
        user: { select: { name: true, phone: true, avatar: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        trip: {
          id: trip.id,
          title: trip.title,
          destination: trip.destination,
          startDate: trip.startDate.toISOString(),
          endDate: trip.endDate.toISOString(),
        },
        bookings: bookings.map((b) => ({
          id: b.id,
          bookingNumber: b.bookingNumber,
          travelerCount: b.travelerCount,
          travelers: b.travelers,
          checkedInAt: b.checkedInAt ? b.checkedInAt.toISOString() : null,
          leadName: b.user?.name ?? "Traveller",
          phone: b.user?.phone ?? "",
          avatar: b.user?.avatar ?? null,
        })),
      },
    });
  } catch (error) {
    logger.error("Captain roster error", error);
    return NextResponse.json({ success: false, error: "Failed to load roster" }, { status: 500 });
  }
}
