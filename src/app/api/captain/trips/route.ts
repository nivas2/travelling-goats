import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireCaptain } from "@/lib/rbac";

const logger = createLogger({ route: "captain-trips" });

// Trips this captain handles (admins see all). Includes booking + check-in counts.
export async function GET() {
  try {
    const authResult = await requireCaptain();
    if (!authResult.success) return authResult.response;
    const { id, role } = authResult.user;

    const trips = await prisma.trip.findMany({
      where: role === "ADMIN" ? {} : { tripCaptainId: id },
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        title: true,
        destination: true,
        coverImage: true,
        startDate: true,
        endDate: true,
        status: true,
        bookings: {
          where: { status: "CONFIRMED" },
          select: { travelerCount: true, checkedInAt: true },
        },
      },
    });

    const data = trips.map((t) => {
      const confirmed = t.bookings.length;
      const travellers = t.bookings.reduce((s, b) => s + (b.travelerCount || 1), 0);
      const checkedIn = t.bookings.filter((b) => b.checkedInAt).length;
      return {
        id: t.id,
        title: t.title,
        destination: t.destination,
        coverImage: t.coverImage ?? "",
        startDate: t.startDate.toISOString(),
        endDate: t.endDate.toISOString(),
        status: t.status,
        confirmedBookings: confirmed,
        travellers,
        checkedIn,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error("Captain trips error", error);
    return NextResponse.json({ success: false, error: "Failed to load trips" }, { status: 500 });
  }
}
