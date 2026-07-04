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
      recentUserCount,
      previousUserCount,
      recentRevenue,
      previousRevenue,
      recentBookings,
      recentUsers,
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
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          bookingNumber: true,
          totalPricePaise: true,
          status: true,
          createdAt: true,
          user: { select: { name: true } },
          trip: { select: { title: true } },
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        where: { role: "USER" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      }),
    ]);

    const totalRevenuePaise = recentRevenue._sum.amountPaise ?? 0;
    const prevRevenuePaise = previousRevenue._sum.amountPaise ?? 0;

    const userGrowth = previousUserCount > 0 ? ((recentUserCount - previousUserCount) / previousUserCount) * 100 : 100;
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
        recentBookings,
        recentUsers,
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
