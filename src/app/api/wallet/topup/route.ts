import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import crypto from "crypto";
import Razorpay from "razorpay";
import prisma from "@/lib/prisma";
import { createLogger, getClientIp } from "@/lib/logger";
import { validateBody } from "@/lib/validate";
import {
  walletTopupCreateSchema,
  walletTopupVerifySchema,
} from "@/lib/validations/wallet";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { requireAuth } from "@/lib/rbac";
import { getRazorpayConfig, getWalletTopupConfig } from "@/lib/settings";

const logger = createLogger({ route: "wallet-topup" });

// ---------------------------------------------------------------------------
// POST — Create Razorpay order for wallet top-up
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult.response;
    const userId = authResult.user.id;

    const rateLimitResponse = applyRateLimit("payment", userId);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const validation = validateBody(walletTopupCreateSchema, body);
    if (!validation.success) return validation.response;

    const { amountPaise } = validation.data;

    // Validate amount against configured limits
    const topupConfig = await getWalletTopupConfig();
    if (amountPaise < topupConfig.minPaise) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum top-up amount is ₹${topupConfig.minPaise / 100}`,
        },
        { status: 400 }
      );
    }
    if (amountPaise > topupConfig.maxPaise) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum top-up amount is ₹${topupConfig.maxPaise / 100}`,
        },
        { status: 400 }
      );
    }

    // Check wallet is not frozen
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (wallet?.isFrozen) {
      return NextResponse.json(
        { success: false, error: "Wallet is frozen. Contact support." },
        { status: 403 }
      );
    }

    const razorpayConfig = await getRazorpayConfig();
    const isTestMode = !razorpayConfig.keyId || !razorpayConfig.keySecret;

    // Test mode: directly credit wallet
    if (isTestMode) {
      const result = await prisma.$transaction(async (tx) => {
        const [lockedWallet] = await tx.$queryRaw<
          Array<{ id: string; balancePaise: number }>
        >(
          Prisma.sql`SELECT id, "balancePaise" FROM wallets WHERE "userId" = ${userId} FOR UPDATE`
        );

        let w = lockedWallet;
        if (!w) {
          w = (await tx.wallet.create({
            data: { userId },
            select: { id: true, balancePaise: true },
          })) as { id: string; balancePaise: number };
        }

        const newBalance = w.balancePaise + amountPaise;

        const updatedWallet = await tx.wallet.update({
          where: { id: w.id },
          data: { balancePaise: newBalance },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: w.id,
            userId,
            type: "TOPUP",
            amountPaise,
            description: "Wallet top-up (test mode)",
            balanceAfterPaise: newBalance,
          },
        });

        return updatedWallet;
      });

      auditLog({
        userId,
        action: "WALLET_TOPUP",
        entityType: "wallet",
        entityId: result.id,
        metadata: { amountPaise, mode: "test" },
        ipAddress: getClientIp(req),
      });

      return NextResponse.json({
        success: true,
        data: { testMode: true, wallet: result },
      });
    }

    // Live mode: create Razorpay order
    const razorpay = new Razorpay({
      key_id: razorpayConfig.keyId,
      key_secret: razorpayConfig.keySecret,
    });

    const receipt = `wu_${userId.slice(-8)}_${Date.now()}`;
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: receipt.slice(0, 40),
      notes: { userId, type: "wallet_topup" },
    });

    auditLog({
      userId,
      action: "WALLET_TOPUP_ORDER_CREATED",
      entityType: "wallet",
      entityId: order.id,
      metadata: { amountPaise },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: amountPaise,
        currency: "INR",
        key: razorpayConfig.keyId,
      },
    });
  } catch (error) {
    logger.error("Wallet topup order error", error);

    // Surface Razorpay-specific error when available
    const rpError =
      error &&
      typeof error === "object" &&
      "error" in error &&
      (error as Record<string, unknown>).error;
    const detail =
      rpError && typeof rpError === "object" && "description" in rpError
        ? String((rpError as Record<string, unknown>).description)
        : null;

    return NextResponse.json(
      {
        success: false,
        error: detail || "Failed to create top-up order",
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT — Verify Razorpay payment and credit wallet
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult.response;
    const userId = authResult.user.id;

    const rateLimitResponse = applyRateLimit("payment", userId);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const validation = validateBody(walletTopupVerifySchema, body);
    if (!validation.success) return validation.response;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      validation.data;

    // Verify signature
    const razorpayConfig = await getRazorpayConfig();
    const signBody = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", razorpayConfig.keySecret)
      .update(signBody)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      auditLog({
        userId,
        action: "WALLET_TOPUP_FAILED",
        entityType: "wallet",
        entityId: razorpay_order_id,
        metadata: { reason: "Invalid signature" },
        ipAddress: getClientIp(req),
      });
      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Fetch order to get amount
    const razorpay = new Razorpay({
      key_id: razorpayConfig.keyId,
      key_secret: razorpayConfig.keySecret,
    });

    const order = await razorpay.orders.fetch(razorpay_order_id);
    const amountPaise = order.amount as number;

    // Credit wallet atomically
    const result = await prisma.$transaction(async (tx) => {
      const [lockedWallet] = await tx.$queryRaw<
        Array<{ id: string; balancePaise: number; isFrozen: boolean }>
      >(
        Prisma.sql`SELECT id, "balancePaise", "isFrozen" FROM wallets WHERE "userId" = ${userId} FOR UPDATE`
      );

      let w = lockedWallet;
      if (!w) {
        w = (await tx.wallet.create({
          data: { userId },
          select: { id: true, balancePaise: true, isFrozen: true },
        })) as { id: string; balancePaise: number; isFrozen: boolean };
      }

      if (w.isFrozen) {
        throw new Error("WALLET_FROZEN");
      }

      const newBalance = w.balancePaise + amountPaise;

      const updatedWallet = await tx.wallet.update({
        where: { id: w.id },
        data: { balancePaise: newBalance },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: w.id,
          userId,
          type: "TOPUP",
          amountPaise,
          description: "Wallet top-up via Razorpay",
          referenceId: razorpay_payment_id,
          balanceAfterPaise: newBalance,
        },
      });

      return updatedWallet;
    });

    auditLog({
      userId,
      action: "WALLET_TOPUP",
      entityType: "wallet",
      entityId: result.id,
      metadata: { amountPaise, razorpayPaymentId: razorpay_payment_id },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, data: { wallet: result } });
  } catch (error) {
    if (error instanceof Error && error.message === "WALLET_FROZEN") {
      return NextResponse.json(
        { success: false, error: "Wallet is frozen. Contact support." },
        { status: 403 }
      );
    }
    logger.error("Wallet topup verify error", error);
    return NextResponse.json(
      { success: false, error: "Top-up verification failed" },
      { status: 500 }
    );
  }
}
