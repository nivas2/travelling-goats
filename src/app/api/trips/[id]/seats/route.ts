import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ route: "trip-seats" });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        vehicleTemplateId: true,
        vehicleTemplate: {
          include: {
            vehicleType: { select: { id: true, name: true, icon: true } },
            seats: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 }
      );
    }

    if (!trip.vehicleTemplate) {
      return NextResponse.json({
        success: true,
        data: { hasVehicle: false },
      });
    }

    // Clean up expired reservations lazily
    await prisma.seatReservation.deleteMany({
      where: {
        tripId,
        expiresAt: { lt: new Date() },
      },
    });

    // Get booked seats (from confirmed/pending bookings)
    const bookedSeats = await prisma.bookingSeat.findMany({
      where: {
        booking: {
          tripId,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      },
      select: { seatId: true },
    });
    const bookedSeatIds = new Set(bookedSeats.map((bs) => bs.seatId));

    // Get active reservations
    const reservations = await prisma.seatReservation.findMany({
      where: {
        tripId,
        expiresAt: { gt: new Date() },
      },
      select: { seatId: true, sessionId: true },
    });
    const reservedSeatMap = new Map<string, string>(); // seatId -> sessionId
    reservations.forEach((r) => {
      reservedSeatMap.set(r.seatId, r.sessionId);
    });

    // Get caller's sessionId from query params (to show their own reserved seats differently)
    const { searchParams } = new URL(req.url);
    const callerSession = searchParams.get("sessionId");

    // Build seat availability
    const seats = trip.vehicleTemplate.seats.map((seat) => {
      let availability: string = "available";

      if (seat.status === "BLOCKED" || seat.status === "MAINTENANCE") {
        availability = "blocked";
      } else if (bookedSeatIds.has(seat.id)) {
        availability = "booked";
      } else if (reservedSeatMap.has(seat.id)) {
        const reservedBy = reservedSeatMap.get(seat.id);
        availability = reservedBy === callerSession ? "available" : "reserved";
      }

      return {
        id: seat.id,
        seatNumber: seat.seatNumber,
        row: seat.row,
        col: seat.col,
        deck: seat.deck,
        seatType: seat.seatType,
        category: seat.category,
        priceDeltaPaise: seat.priceDeltaPaise,
        genderRestriction: seat.genderRestriction,
        isAccessible: seat.isAccessible,
        isPremium: seat.isPremium,
        availability,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        hasVehicle: true,
        vehicleTemplate: {
          id: trip.vehicleTemplate.id,
          name: trip.vehicleTemplate.name,
          totalSeats: trip.vehicleTemplate.totalSeats,
          totalRows: trip.vehicleTemplate.totalRows,
          totalColumns: trip.vehicleTemplate.totalColumns,
          hasUpperDeck: trip.vehicleTemplate.hasUpperDeck,
          upperDeckRows: trip.vehicleTemplate.upperDeckRows,
          upperDeckColumns: trip.vehicleTemplate.upperDeckColumns,
          amenities: trip.vehicleTemplate.amenities,
          gridLayout: trip.vehicleTemplate.gridLayout,
          upperGridLayout: trip.vehicleTemplate.upperGridLayout,
          vehicleType: trip.vehicleTemplate.vehicleType,
        },
        seats,
      },
    });
  } catch (error) {
    logger.error("Seat availability fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch seat availability" },
      { status: 500 }
    );
  }
}
