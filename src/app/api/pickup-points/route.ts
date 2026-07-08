import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const withTripCounts = searchParams.get("withTripCounts") === "true";

    const cities = await prisma.pickupCity.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        pickupPoints: {
          where: { isActive: true },
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
      },
    });

    if (withTripCounts) {
      // Count published trips per city (via origin field)
      const cityNames = cities.map((c) => c.name);
      const tripCounts = await prisma.trip.groupBy({
        by: ["origin"],
        where: {
          status: "PUBLISHED",
          origin: { in: cityNames },
        },
        _count: { id: true },
      });

      const countMap = new Map(
        tripCounts.map((tc) => [tc.origin, tc._count.id])
      );

      const citiesWithCounts = cities.map((city) => ({
        ...city,
        tripCount: countMap.get(city.name) ?? 0,
      }));

      return NextResponse.json({ success: true, data: citiesWithCounts });
    }

    return NextResponse.json({ success: true, data: cities });
  } catch (error) {
    console.error("Pickup points fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pickup points" },
      { status: 500 }
    );
  }
}
