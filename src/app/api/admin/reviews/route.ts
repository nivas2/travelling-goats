import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";

const logger = createLogger({ route: "admin-reviews" });

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        user: { select: { name: true } },
        trip: { select: { title: true } },
        overallRating: true,
        comment: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    logger.error("Admin reviews fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
