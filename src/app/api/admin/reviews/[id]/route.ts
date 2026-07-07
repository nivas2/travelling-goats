import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";

const logger = createLogger({ route: "admin-reviews-detail" });

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (typeof body.isVerified === "boolean") data.isVerified = body.isVerified;
    if (typeof body.isFeatured === "boolean") data.isFeatured = body.isFeatured;
    // Backwards-compatible default: a bare PUT verifies the review.
    if (Object.keys(data).length === 0) data.isVerified = true;

    const review = await prisma.review.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    logger.error("Admin review update error", error);
    return NextResponse.json(
      { success: false, error: "Failed to update review" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const { id } = await params;

    await prisma.review.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Admin review delete error", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
