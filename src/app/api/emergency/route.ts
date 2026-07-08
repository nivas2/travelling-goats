import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ route: "emergency" });

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    // Fetch user phone
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    // Fetch emergency contacts
    let emergencyContacts: { id: string; name: string; phone: string; relationship: string }[] = [];
    try {
      emergencyContacts = await prisma.emergencyContact.findMany({
        where: { userId },
        select: { id: true, name: true, phone: true, relationship: true },
      });
    } catch {
      // Table may not exist yet — non-critical
    }

    // Find active trip and its shepherd/captain
    let tripCaptain: { name: string; phone: string; avatar: string | null } | null = null;
    const booking = await prisma.booking.findFirst({
      where: {
        userId,
        status: "CONFIRMED",
        trip: { startDate: { lte: now }, endDate: { gte: now } },
      },
      include: {
        trip: { select: { id: true, title: true, tripCaptainId: true } },
      },
    });

    if (booking?.trip?.tripCaptainId) {
      const captain = await prisma.user.findUnique({
        where: { id: booking.trip.tripCaptainId },
        select: { name: true, phone: true, avatar: true },
      });
      if (captain) {
        tripCaptain = {
          name: captain.name ?? "Shepherd",
          phone: captain.phone ?? "",
          avatar: captain.avatar ?? null,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        userPhone: user?.phone ?? "",
        emergencyContacts,
        tripCaptain,
        currentLocation: null, // Client-side geolocation handles this
      },
    });
  } catch (error) {
    logger.error("Emergency data fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to load emergency data" },
      { status: 500 }
    );
  }
}
