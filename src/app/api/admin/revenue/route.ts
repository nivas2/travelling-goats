import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";

const logger = createLogger({ route: "admin-revenue" });

type TripCategory = "ongoing" | "upcoming" | "past";

// Per-trip revenue, categorised by whether the trip is ongoing / upcoming / past.
export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const now = new Date();

    const [trips, agg] = await Promise.all([
      prisma.trip.findMany({
        select: {
          id: true,
          title: true,
          destination: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      }),
      // Revenue = booking value of paid/active bookings (confirmed + completed).
      prisma.booking.groupBy({
        by: ["tripId"],
        where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
        _sum: { totalPricePaise: true, travelerCount: true },
        _count: { _all: true },
      }),
    ]);

    const byTrip = new Map(agg.map((a) => [a.tripId, a]));

    const rows = trips.map((t) => {
      const a = byTrip.get(t.id);
      const category: TripCategory =
        t.startDate <= now && t.endDate >= now
          ? "ongoing"
          : t.startDate > now
            ? "upcoming"
            : "past";
      return {
        tripId: t.id,
        title: t.title,
        destination: t.destination,
        startDate: t.startDate.toISOString(),
        endDate: t.endDate.toISOString(),
        category,
        bookings: a?._count._all ?? 0,
        travelers: a?._sum.travelerCount ?? 0,
        revenuePaise: a?._sum.totalPricePaise ?? 0,
      };
    });

    // Sort by revenue desc within the full list.
    rows.sort((x, y) => y.revenuePaise - x.revenuePaise);

    const totals = { ongoing: 0, upcoming: 0, past: 0, all: 0 };
    const counts = { ongoing: 0, upcoming: 0, past: 0, all: rows.length };
    for (const r of rows) {
      totals[r.category] += r.revenuePaise;
      totals.all += r.revenuePaise;
      counts[r.category] += 1;
    }

    return NextResponse.json({
      success: true,
      data: { rows, totals, counts, generatedAt: now.toISOString() },
    });
  } catch (error) {
    logger.error("Admin revenue error", error);
    return NextResponse.json(
      { success: false, error: "Failed to compute revenue" },
      { status: 500 }
    );
  }
}
