import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { validateBody } from "@/lib/validate";
import { validateCouponSchema } from "@/lib/validations/coupon";
import { applyRateLimit } from "@/lib/rate-limit";

const logger = createLogger({ route: "coupons" });

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: coupons });
  } catch (error) {
    logger.error("Coupons fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

// Validate coupon
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = applyRateLimit("api", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const validation = validateBody(validateCouponSchema, body);
    if (!validation.success) return validation.response;

    const { code, orderAmountPaise } = validation.data;

    const coupon = await prisma.coupon.findUnique({ where: { code } });

    if (!coupon) {
      return NextResponse.json({ success: false, error: "Invalid coupon code" }, { status: 400 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ success: false, error: "Coupon is inactive" }, { status: 400 });
    }

    if (coupon.validUntil && coupon.validUntil < new Date()) {
      return NextResponse.json({ success: false, error: "Coupon has expired" }, { status: 400 });
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json({ success: false, error: "Coupon usage limit reached" }, { status: 400 });
    }

    // Per-user usage check
    if (coupon.maxUsesPerUser) {
      const userUsageCount = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId: session.user.id },
      });
      if (userUsageCount >= coupon.maxUsesPerUser) {
        return NextResponse.json(
          { success: false, error: "You have already used this coupon" },
          { status: 400 }
        );
      }
    }

    if (orderAmountPaise < coupon.minOrderPaise) {
      return NextResponse.json({
        success: false,
        error: `Minimum order amount is ₹${coupon.minOrderPaise / 100}`,
      }, { status: 400 });
    }

    let discountPaise = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountPaise = Math.floor(orderAmountPaise * coupon.discountValue / 100);
      if (coupon.maxDiscountPaise) {
        discountPaise = Math.min(discountPaise, coupon.maxDiscountPaise);
      }
    } else {
      discountPaise = coupon.discountValue;
    }

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        description: coupon.description,
        discountPaise,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
    });
  } catch (error) {
    logger.error("Coupon validation error", error);
    return NextResponse.json(
      { success: false, error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
