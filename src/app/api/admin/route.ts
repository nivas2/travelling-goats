import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";

const logger = createLogger({ route: "admin-dashboard" });

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalTrips,
      totalBookings,
      activeTrips,
      pendingBookings,
      recentUsers,
      previousUsers,
      recentRevenue,
      previousRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.trip.count(),
      prisma.booking.count(),
      prisma.trip.count({ where: { status: { in: ["PUBLISHED", "ONGOING"] } } }),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      prisma.payment.aggregate({
        _sum: { amountPaise: true },
        where: { status: "CAPTURED", createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.payment.aggregate({
        _sum: { amountPaise: true },
        where: { status: "CAPTURED", createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
    ]);

    const totalRevenuePaise = recentRevenue._sum.amountPaise ?? 0;
    const prevRevenuePaise = previousRevenue._sum.amountPaise ?? 0;

    const userGrowth = previousUsers > 0 ? ((recentUsers - previousUsers) / previousUsers) * 100 : 100;
    const revenueGrowth = prevRevenuePaise > 0 ? ((totalRevenuePaise - prevRevenuePaise) / prevRevenuePaise) * 100 : 100;

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalTrips,
        totalBookings,
        totalRevenuePaise,
        activeTrips,
        pendingBookings,
        userGrowth: Math.round(userGrowth),
        revenueGrowth: Math.round(revenueGrowth),
      },
    });
  } catch (error) {
    logger.error("Admin dashboard error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
