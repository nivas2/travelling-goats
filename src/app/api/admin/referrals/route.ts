import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";

const logger = createLogger({ route: "admin-referrals" });

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const referrals = await prisma.referral.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        referrer: { select: { name: true, email: true } },
        referred: { select: { name: true, email: true } },
      },
    });

    const totalReferrals = referrals.length;
    const completedCount = referrals.filter((r) => r.status === "COMPLETED").length;
    const conversionRate = totalReferrals > 0 ? Math.round((completedCount / totalReferrals) * 100) : 0;
    const totalPayoutsPaise = referrals.reduce((sum, r) => sum + r.rewardPaise, 0);

    return NextResponse.json({
      success: true,
      data: {
        referrals,
        stats: {
          totalReferrals,
          conversionRate,
          totalPayoutsPaise,
        },
      },
    });
  } catch (error) {
    logger.error("Admin referrals fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}
