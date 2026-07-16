import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ route: "trip-memory-report" });

const MAX_REASON = 300;

// Report a memory photo as inappropriate. Any signed-in traveller (other than
// the uploader) can report; admins are notified so they can review/remove it.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memoryId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { memoryId } = await params;

    const body = await req.json().catch(() => ({}));
    const reason = String(body?.reason ?? "").trim().slice(0, MAX_REASON) || "Inappropriate content";

    const memory = await prisma.memoryEntry.findUnique({
      where: { id: memoryId },
      select: { id: true, userId: true, tripId: true },
    });
    if (!memory) {
      return NextResponse.json({ success: false, error: "Photo not found" }, { status: 404 });
    }
    if (memory.userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: "You can't report your own photo" },
        { status: 400 }
      );
    }

    // One report per user per photo — repeat taps are idempotent.
    const existing = await prisma.memoryReport.findUnique({
      where: { memoryId_reportedById: { memoryId, reportedById: session.user.id } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ success: true, data: { alreadyReported: true } });
    }

    await prisma.memoryReport.create({
      data: { memoryId, reportedById: session.user.id, reason },
    });

    // Notify admins so they can moderate the flagged photo.
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          title: "Photo reported",
          body: `A trip photo was reported as inappropriate: "${reason}".`,
          type: "SYSTEM" as const,
          data: { memoryId, tripId: memory.tripId, reason },
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Report memory error", error);
    return NextResponse.json({ success: false, error: "Failed to report photo" }, { status: 500 });
  }
}
