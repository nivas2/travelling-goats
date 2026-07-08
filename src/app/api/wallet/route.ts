import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLogger, getClientIp } from "@/lib/logger";
import { validateBody } from "@/lib/validate";
import { walletTransactionSchema } from "@/lib/validations/wallet";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const logger = createLogger({ route: "wallet" });

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: session.user.id },
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 50,
          },
        },
      });
    }

    const savingsGoals = await prisma.savingsGoal.findMany({
      where: { userId: session.user.id, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: { wallet, savingsGoals },
    });
  } catch (error) {
    logger.error("Wallet fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wallet" },
      { status: 500 }
    );
  }
}

// Add money / debit / transfer / create goal
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResponse = applyRateLimit("api", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();

    // Route by action
    if (body.action === "createGoal") {
      return handleCreateGoal(body, session.user.id, req);
    }

    // "add" action from frontend means CREDIT — set type if not provided
    if (body.action === "add" && !body.type) {
      body.type = "CREDIT";
    }

    // Default: wallet transaction (add money / debit / transfer)
    const validation = validateBody(walletTransactionSchema, body);
    if (!validation.success) return validation.response;
    const { amountPaise, type, description, recipientId } = validation.data;

    const userId = session.user.id;
    const userName = session.user.name ?? "User";
    const isDebit = ["DEBIT", "TRANSFER_OUT", "GIFT"].includes(type);

    // Use interactive transaction with row-level locking
    const result = await prisma.$transaction(async (tx) => {
      // Lock the sender's wallet row with FOR UPDATE
      const [senderWallet] = await tx.$queryRaw<
        Array<{ id: string; balancePaise: number }>
      >(
        Prisma.sql`SELECT id, "balancePaise" FROM wallets WHERE "userId" = ${userId} FOR UPDATE`
      );

      let wallet = senderWallet;
      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = await tx.wallet.create({
          data: { userId },
          select: { id: true, balancePaise: true },
        }) as { id: string; balancePaise: number };
      }

      if (isDebit && wallet.balancePaise < amountPaise) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const newBalance = isDebit
        ? wallet.balancePaise - amountPaise
        : wallet.balancePaise + amountPaise;

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balancePaise: newBalance },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: type ?? "CREDIT",
          amountPaise,
          description: description ?? (isDebit ? "Wallet debit" : "Added money to wallet"),
          balanceAfterPaise: newBalance,
        },
      });

      // Handle transfers atomically
      if (type === "TRANSFER_OUT" && recipientId) {
        // Lock recipient wallet
        const [recipientWallet] = await tx.$queryRaw<
          Array<{ id: string; balancePaise: number }>
        >(
          Prisma.sql`SELECT id, "balancePaise" FROM wallets WHERE "userId" = ${recipientId} FOR UPDATE`
        );

        let rWallet = recipientWallet;
        if (!rWallet) {
          rWallet = await tx.wallet.create({
            data: { userId: recipientId },
            select: { id: true, balancePaise: true },
          }) as { id: string; balancePaise: number };
        }

        const recipientNewBalance = rWallet.balancePaise + amountPaise;

        await tx.wallet.update({
          where: { id: rWallet.id },
          data: { balancePaise: recipientNewBalance },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: rWallet.id,
            userId: recipientId,
            type: "TRANSFER_IN",
            amountPaise,
            description: `Transfer from ${userName}`,
            balanceAfterPaise: recipientNewBalance,
          },
        });
      }

      return { wallet: updatedWallet, transaction };
    });

    const ip = getClientIp(req);
    auditLog({
      userId: session.user.id,
      action: isDebit ? "WALLET_DEBIT" : type === "TRANSFER_OUT" ? "WALLET_TRANSFER" : "WALLET_CREDIT",
      entityType: "wallet",
      entityId: result.wallet.id,
      metadata: { amountPaise, type, recipientId },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json(
        { success: false, error: "Insufficient balance" },
        { status: 400 }
      );
    }
    logger.error("Wallet transaction error", error);
    return NextResponse.json(
      { success: false, error: "Transaction failed" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Create savings goal handler
// ---------------------------------------------------------------------------

async function handleCreateGoal(
  body: Record<string, unknown>,
  userId: string,
  req: NextRequest
) {
  try {
    const name = String(body.name ?? "").trim();
    const targetPaise = Number(body.targetPaise);
    const targetDate = body.targetDate ? new Date(String(body.targetDate)) : null;

    if (!name || name.length < 1) {
      return NextResponse.json(
        { success: false, error: "Goal name is required" },
        { status: 400 }
      );
    }

    if (!targetPaise || targetPaise <= 0) {
      return NextResponse.json(
        { success: false, error: "Target amount must be greater than 0" },
        { status: 400 }
      );
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        userId,
        name,
        targetPaise,
        currentPaise: 0,
        targetDate,
        isActive: true,
      },
    });

    auditLog({
      userId,
      action: "SAVINGS_GOAL_CREATED",
      entityType: "savingsGoal",
      entityId: goal.id,
      metadata: { name, targetPaise, targetDate: targetDate?.toISOString() ?? null },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, data: goal });
  } catch (error) {
    logger.error("Create savings goal error", error);
    return NextResponse.json(
      { success: false, error: "Failed to create savings goal" },
      { status: 500 }
    );
  }
}
