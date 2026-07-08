import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";

const logger = createLogger({ route: "admin-wallets" });

// ---------------------------------------------------------------------------
// GET — List users with wallet balances, searchable
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() ?? "";

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where,
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
            frozenReason: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Summary stats
    const stats = await prisma.wallet.aggregate({
      _sum: { balancePaise: true },
      _count: { _all: true },
    });

    const frozenCount = await prisma.wallet.count({
      where: { isFrozen: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        users,
        stats: {
          totalBalancePaise: stats._sum.balancePaise ?? 0,
          totalWallets: stats._count._all,
          frozenWallets: frozenCount,
        },
      },
    });
  } catch (error) {
    logger.error("Admin wallets list error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wallets" },
      { status: 500 }
    );
  }
}
