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
        addOnSelections: { include: { globalAddOn: true } },
        snackSelections: { include: { globalSnack: true } },
        pickupPointSelections: { include: { pickupPoint: { include: { city: true } } } },
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
    // Shape add-on/snack selections into flat arrays for frontend compatibility
    const data = {
      ...trip,
      itineraryDays: trip.itineraryDays.map((day) => ({
        ...day,
        activities:
          typeof day.activities === "string"
            ? JSON.parse(day.activities)
            : day.activities ?? [],
      })),
      addOns: trip.addOnSelections.map((sel) => ({
        id: sel.globalAddOn.id,
        name: sel.globalAddOn.name,
        description: sel.globalAddOn.description,
        pricePaise: sel.priceOverridePaise ?? sel.globalAddOn.pricePaise,
        icon: sel.globalAddOn.icon,
        image: sel.globalAddOn.image,
        maxQuantity: sel.globalAddOn.maxQuantity,
        isPopular: sel.globalAddOn.isPopular,
        isAvailable: sel.globalAddOn.isActive,
      })),
      snackOptions: trip.snackSelections.map((sel) => ({
        id: sel.globalSnack.id,
        name: sel.globalSnack.name,
        description: sel.globalSnack.description,
        pricePaise: sel.priceOverridePaise ?? sel.globalSnack.pricePaise,
        category: sel.globalSnack.category,
        icon: sel.globalSnack.icon,
        image: sel.globalSnack.image,
        isVeg: sel.globalSnack.isVeg,
        isAvailable: sel.globalSnack.isActive,
      })),
      pickupPoints: trip.pickupPointSelections.map((sel) => ({
        id: sel.pickupPoint.id,
        name: sel.pickupPoint.name,
        address: sel.pickupPoint.address,
        icon: sel.pickupPoint.icon ?? "location_on",
        landmark: sel.pickupPoint.landmark,
        cityName: sel.pickupPoint.city.name,
      })),
      addOnSelections: undefined,
      snackSelections: undefined,
      pickupPointSelections: undefined,
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
