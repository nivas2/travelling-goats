import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger, getClientIp } from "@/lib/logger";
import { validateBody } from "@/lib/validate";
import { applyReferralSchema } from "@/lib/validations/referral";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const logger = createLogger({ route: "referrals" });

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referralCode: true, rewardPoints: true, rewardTier: true },
    });

    const referrals = await prisma.referral.findMany({
      where: { referrerId: session.user.id },
      include: {
        referred: { select: { name: true, avatar: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      totalReferrals: referrals.length,
      completedReferrals: referrals.filter((r) => r.status === "COMPLETED").length,
      totalEarnings: referrals.reduce((sum, r) => sum + r.rewardPaise, 0),
    };

    return NextResponse.json({
      success: true,
      data: { referralCode: user?.referralCode, referrals, stats },
    });
  } catch (error) {
    logger.error("Referrals fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = applyRateLimit("api", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const validation = validateBody(applyReferralSchema, body);
    if (!validation.success) return validation.response;

    const { code } = validation.data;

    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
    });

    if (!referrer) {
      return NextResponse.json({ success: false, error: "Invalid referral code" }, { status: 400 });
    }

    if (referrer.id === session.user.id) {
      return NextResponse.json({ success: false, error: "Cannot refer yourself" }, { status: 400 });
    }

    // Anti-fraud: check if current user already has a referral
    const existingReferral = await prisma.referral.findFirst({
      where: { referredId: session.user.id },
    });

    if (existingReferral) {
      return NextResponse.json({ success: false, error: "Already referred" }, { status: 400 });
    }

    // Anti-fraud: account age check (must be >1 minute old to prevent bot signups)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { createdAt: true, phone: true, email: true },
    });

    if (currentUser) {
      const accountAgeMs = Date.now() - currentUser.createdAt.getTime();
      if (accountAgeMs < 60 * 1000) {
        return NextResponse.json(
          { success: false, error: "Please wait before applying a referral code" },
          { status: 400 }
        );
      }

      // Anti-fraud: shared phone/email detection
      if (currentUser.phone && currentUser.phone === referrer.phone) {
        return NextResponse.json(
          { success: false, error: "Invalid referral" },
          { status: 400 }
        );
      }
      if (currentUser.email && currentUser.email === referrer.email) {
        return NextResponse.json(
          { success: false, error: "Invalid referral" },
          { status: 400 }
        );
      }
    }

    // Anti-fraud: cap pending referrals per referrer (50 max)
    const pendingReferralCount = await prisma.referral.count({
      where: { referrerId: referrer.id, status: "PENDING" },
    });

    if (pendingReferralCount >= 50) {
      return NextResponse.json(
        { success: false, error: "Referral limit reached" },
        { status: 400 }
      );
    }

    // PRD alignment: Create referral as PENDING with rewardPaise = 0
    // Rewards are only credited when referred user completes their FIRST trip
    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: session.user.id,
        code,
        rewardPaise: 0,
        status: "PENDING",
        tier: 1,
      },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { referredBy: code },
    });

    const ip = getClientIp(req);
    auditLog({
      userId: session.user.id,
      action: "REFERRAL_APPLIED",
      entityType: "referral",
      entityId: referral.id,
      metadata: { referrerId: referrer.id, code, ipAddress: ip },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, data: referral });
  } catch (error) {
    logger.error("Referral creation error", error);
    return NextResponse.json(
      { success: false, error: "Failed to apply referral" },
      { status: 500 }
    );
  }
}
