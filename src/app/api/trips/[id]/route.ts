import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const trip = await prisma.trip.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        itineraryDays: { orderBy: { dayNumber: "asc" } },
        addOns: true,
        snackOptions: true,
        faqs: { orderBy: { order: "asc" } },
        reviews: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 }
      );
    }

    // Ensure itinerary day activities are always arrays (handles double-encoded JSON strings)
    const data = {
      ...trip,
      itineraryDays: trip.itineraryDays.map((day) => ({
        ...day,
        activities:
          typeof day.activities === "string"
            ? JSON.parse(day.activities)
            : day.activities ?? [],
      })),
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Trip fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch trip" },
      { status: 500 }
    );
  }
}
