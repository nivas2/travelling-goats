import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";

const logger = createLogger({ route: "admin-bookings" });

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        bookingNumber: true,
        userId: true,
        user: { select: { name: true, email: true } },
        trip: { select: { title: true } },
        bookingType: true,
        travelerCount: true,
        totalPricePaise: true,
        status: true,
        checkedInAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    logger.error("Admin bookings fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
