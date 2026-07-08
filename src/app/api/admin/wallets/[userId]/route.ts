import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLogger, getClientIp } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";
import { validateBody } from "@/lib/validate";
import { adminWalletActionSchema } from "@/lib/validations/wallet";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const logger = createLogger({ route: "admin-wallet-user" });

interface RouteContext {
  params: Promise<{ userId: string }>;
}

// ---------------------------------------------------------------------------
// GET — User wallet + transaction history
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  context: RouteContext
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const { userId } = await context.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        wallet: {
          select: {
            id: true,
            balancePaise: true,
            isFrozen: true,
            frozenAt: true,
            frozenReason: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const transactions = await prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: { user, transactions },
    });
  } catch (error) {
    logger.error("Admin wallet user fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wallet data" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT — Admin wallet actions (credit/debit/freeze/unfreeze/refund)
// ---------------------------------------------------------------------------

export async function PUT(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const rateLimitResponse = applyRateLimit("admin", authResult.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const { userId } = await context.params;
    const body = await req.json();
    const validation = validateBody(adminWalletActionSchema, body);
    if (!validation.success) return validation.response;

    const { action, amountPaise, reason } = validation.data;

    // Freeze / Unfreeze — no balance change
    if (action === "freeze") {
      await prisma.wallet.upsert({
        where: { userId },
        update: {
          isFrozen: true,
          frozenAt: new Date(),
          frozenReason: reason,
        },
        create: {
          userId,
          isFrozen: true,
          frozenAt: new Date(),
          frozenReason: reason,
        },
      });

      auditLog({
        userId: authResult.user.id,
        action: "ADMIN_WALLET_FREEZE",
        entityType: "wallet",
        entityId: userId,
        metadata: { targetUserId: userId, reason },
        ipAddress: getClientIp(req),
      });

      return NextResponse.json({ success: true });
    }

    if (action === "unfreeze") {
      await prisma.wallet.update({
        where: { userId },
        data: {
          isFrozen: false,
          frozenAt: null,
          frozenReason: null,
        },
      });

      auditLog({
        userId: authResult.user.id,
        action: "ADMIN_WALLET_UNFREEZE",
        entityType: "wallet",
        entityId: userId,
        metadata: { targetUserId: userId, reason },
        ipAddress: getClientIp(req),
      });

      return NextResponse.json({ success: true });
    }

    // Credit / Debit / Refund — balance mutation with row locking
    if (!amountPaise || amountPaise <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount is required" },
        { status: 400 }
      );
    }

    const isDebit = action === "debit";
    const txType =
      action === "credit"
        ? "ADMIN_CREDIT"
        : action === "debit"
        ? "ADMIN_DEBIT"
        : "REFUND";

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

      if (isDebit && w.balancePaise < amountPaise) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const newBalance = isDebit
        ? w.balancePaise - amountPaise
        : w.balancePaise + amountPaise;

      const updatedWallet = await tx.wallet.update({
        where: { id: w.id },
        data: { balancePaise: newBalance },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: w.id,
          userId,
          type: txType,
          amountPaise,
          description: `Admin ${action}: ${reason}`,
          balanceAfterPaise: newBalance,
        },
      });

      return updatedWallet;
    });

    auditLog({
      userId: authResult.user.id,
      action: `ADMIN_WALLET_${action.toUpperCase()}`,
      entityType: "wallet",
      entityId: result.id,
      metadata: { targetUserId: userId, amountPaise, reason },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, data: { wallet: result } });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json(
        { success: false, error: "User has insufficient balance" },
        { status: 400 }
      );
    }
    logger.error("Admin wallet action error", error);
    return NextResponse.json(
      { success: false, error: "Wallet action failed" },
      { status: 500 }
    );
  }
}
