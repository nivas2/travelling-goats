import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const selections = await prisma.tripPickupPoint.findMany({
      where: {
        tripId: id,
        pickupPoint: { isActive: true },
      },
      include: {
        pickupPoint: {
          include: { city: true },
        },
      },
      orderBy: {
        pickupPoint: { order: "asc" },
      },
    });

    const pickupPoints = selections.map((sel) => ({
      id: sel.pickupPoint.id,
      name: sel.pickupPoint.name,
      address: sel.pickupPoint.address,
      icon: sel.pickupPoint.icon ?? "location_on",
      landmark: sel.pickupPoint.landmark,
      cityName: sel.pickupPoint.city.name,
      pickupTime: sel.pickupTime ?? null,
    }));

    return NextResponse.json({ success: true, data: pickupPoints });
  } catch (error) {
    console.error("Trip pickup points fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch trip pickup points" },
      { status: 500 }
    );
  }
}
