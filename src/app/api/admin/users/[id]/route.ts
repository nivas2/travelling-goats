import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";

const logger = createLogger({ route: "admin-users-detail" });

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
    if (body.role) data.role = body.role;
    if (body.status) data.status = body.status;

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        role: true,
        status: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    logger.error("Admin user update error", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}
