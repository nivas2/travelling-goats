import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";

const logger = createLogger({ route: "admin-contact-request-detail" });

// Update status (OPEN | RESOLVED).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const status = body?.status === "RESOLVED" ? "RESOLVED" : "OPEN";

    await prisma.contactRequest.update({ where: { id }, data: { status } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Admin contact request update error", error);
    return NextResponse.json(
      { success: false, error: "Failed to update request" },
      { status: 500 }
    );
  }
}

// Delete a request.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;
    const { id } = await params;

    await prisma.contactRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Admin contact request delete error", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete request" },
      { status: 500 }
    );
  }
}
