import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ route: "rewards" });

const TIER_THRESHOLDS = {
  EXPLORER: 0,
  ADVENTURER: 500,
  VOYAGER: 2000,
  LEGEND: 5000,
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        rewardPoints: true,
        rewardTier: true,
        totalTrips: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const currentTier = user.rewardTier;
    const tiers = Object.entries(TIER_THRESHOLDS);
    const currentTierIndex = tiers.findIndex(([k]) => k === currentTier);
    const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;

    return NextResponse.json({
      success: true,
      data: {
        points: user.rewardPoints,
        tier: user.rewardTier,
        totalTrips: user.totalTrips,
        nextTier: nextTier ? { name: nextTier[0], pointsNeeded: nextTier[1] - user.rewardPoints } : null,
        tiers: tiers.map(([name, threshold]) => ({ name, threshold })),
      },
    });
  } catch (error) {
    logger.error("Rewards fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rewards" },
      { status: 500 }
    );
  }
}
