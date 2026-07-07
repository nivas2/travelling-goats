import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";

const logger = createLogger({ route: "admin-faqs-detail" });

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
    if (typeof body.question === "string") data.question = body.question.trim();
    if (typeof body.answer === "string") data.answer = body.answer.trim();
    if (typeof body.category === "string") data.category = body.category.trim() || "General";
    if (body.order !== undefined && Number.isFinite(Number(body.order))) data.order = Number(body.order);
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;

    const faq = await prisma.faq.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: faq });
  } catch (error) {
    logger.error("Admin faq update error", error);
    return NextResponse.json(
      { success: false, error: "Failed to update FAQ" },
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
    await prisma.faq.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Admin faq delete error", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete FAQ" },
      { status: 500 }
    );
  }
}
