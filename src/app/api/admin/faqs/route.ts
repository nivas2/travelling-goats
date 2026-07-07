import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";

const logger = createLogger({ route: "admin-faqs" });

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const faqs = await prisma.faq.findMany({
      orderBy: [{ order: "asc" }, { question: "asc" }],
    });
    return NextResponse.json({ success: true, data: faqs });
  } catch (error) {
    logger.error("Admin faqs fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch FAQs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const body = await req.json();
    const question = (body?.question ?? "").trim();
    const answer = (body?.answer ?? "").trim();
    if (!question || !answer) {
      return NextResponse.json(
        { success: false, error: "Question and answer are required" },
        { status: 400 }
      );
    }

    const faq = await prisma.faq.create({
      data: {
        question,
        answer,
        category: (body?.category ?? "General").trim() || "General",
        order: Number.isFinite(body?.order) ? Number(body.order) : 0,
        isActive: body?.isActive ?? true,
      },
    });
    return NextResponse.json({ success: true, data: faq }, { status: 201 });
  } catch (error) {
    logger.error("Admin faq create error", error);
    return NextResponse.json(
      { success: false, error: "Failed to create FAQ" },
      { status: 500 }
    );
  }
}
