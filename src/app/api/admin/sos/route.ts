import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";

const logger = createLogger({ route: "admin-sos" });

// List SOS alerts (the current admin's SOS notifications).
export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const rows = await prisma.notification.findMany({
      where: { userId: authResult.user.id, type: "SOS" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: rows.map((n) => {
        const data = (n.data ?? {}) as Record<string, unknown>;
        return {
          id: n.id,
          body: n.body,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
          location: (data.location as string) ?? null,
          mapsLink: (data.mapsLink as string) ?? null,
          tripId: (data.tripId as string) ?? null,
        };
      }),
    });
  } catch (error) {
    logger.error("Admin SOS fetch error", error);
    return NextResponse.json({ success: false, error: "Failed to load SOS alerts" }, { status: 500 });
  }
}

// Acknowledge (mark read) an SOS alert.
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const body = await req.json();
    const id = String(body?.id ?? "");
    if (!id) {
      return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
    }
    await prisma.notification.updateMany({
      where: { id, userId: authResult.user.id, type: "SOS" },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Admin SOS ack error", error);
    return NextResponse.json({ success: false, error: "Failed to acknowledge" }, { status: 500 });
  }
}
