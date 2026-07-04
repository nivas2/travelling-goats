import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";

const logger = createLogger({ route: "admin-analytics" });

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersCount,
      totalBookings,
      capturedPayments,
      revenueAgg,
      trips,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.booking.count(),
      prisma.payment.count({ where: { status: "CAPTURED" } }),
      prisma.payment.aggregate({
        _sum: { amountPaise: true },
        _avg: { amountPaise: true },
        where: { status: "CAPTURED" },
      }),
      prisma.trip.findMany({
        select: { destination: true },
      }),
    ]);

    // Top destinations
    const destCounts: Record<string, number> = {};
    trips.forEach((t) => {
      destCounts[t.destination] = (destCounts[t.destination] || 0) + 1;
    });
    const topDestinations = Object.entries(destCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Revenue trend (last 6 months)
    const revenueTrend: { month: string; revenuePaise: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthRevenue = await prisma.payment.aggregate({
        _sum: { amountPaise: true },
        where: {
          status: "CAPTURED",
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      });
      const monthName = monthStart.toLocaleDateString("en-IN", { month: "short" });
      revenueTrend.push({
        month: monthName,
        revenuePaise: monthRevenue._sum.amountPaise ?? 0,
      });
    }

    const returningUsers = totalUsers - newUsersCount;
    const bookingConversionRate = totalUsers > 0
      ? Math.round((totalBookings / totalUsers) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        dau: 0, // Would need session tracking; placeholder
        mau: newUsersCount + Math.floor(returningUsers * 0.3), // Approximation
        bookingConversionRate,
        avgOrderValuePaise: revenueAgg._avg.amountPaise ?? 0,
        topDestinations,
        revenueTrend,
        newUsers: newUsersCount,
        returningUsers: Math.max(returningUsers, 0),
      },
    });
  } catch (error) {
    logger.error("Admin analytics fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
