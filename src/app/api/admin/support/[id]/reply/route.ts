import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";

const logger = createLogger({ route: "admin-support-reply" });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const { id } = await params;
    const body = await req.json();

    if (!body.content?.trim()) {
      return NextResponse.json(
        { success: false, error: "Reply content is required" },
        { status: 400 }
      );
    }

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        content: body.content,
        isStaff: true,
      },
    });

    // Auto-update ticket status to IN_PROGRESS if it was OPEN
    await prisma.supportTicket.updateMany({
      where: { id, status: "OPEN" },
      data: { status: "IN_PROGRESS" },
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    logger.error("Admin support reply error", error);
    return NextResponse.json(
      { success: false, error: "Failed to send reply" },
      { status: 500 }
    );
  }
}
