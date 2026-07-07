import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ route: "trip-memory-delete" });

// Delete a memory — only the traveller who posted it (or an admin).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; memoryId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { memoryId } = await params;

    const memory = await prisma.memoryEntry.findUnique({
      where: { id: memoryId },
      select: { userId: true },
    });
    if (!memory) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (memory.userId !== session.user.id && me?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "You can only delete memories you added" },
        { status: 403 }
      );
    }

    await prisma.memoryEntry.delete({ where: { id: memoryId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete memory error", error);
    return NextResponse.json({ success: false, error: "Failed to delete memory" }, { status: 500 });
  }
}
