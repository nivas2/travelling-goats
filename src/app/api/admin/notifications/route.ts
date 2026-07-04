import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";

const logger = createLogger({ route: "admin-notifications" });

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    // Get distinct notifications grouped by title (admin-sent ones)
    const notifications = await prisma.notification.findMany({
      where: { type: { not: "SYSTEM" } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        createdAt: true,
      },
    });

    // Group by title+body+type to get recipient counts
    const grouped = new Map<string, { id: string; title: string; body: string; type: string; recipientCount: number; createdAt: Date }>();
    for (const n of notifications) {
      const key = `${n.title}|${n.body}|${n.type}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.recipientCount++;
      } else {
        grouped.set(key, {
          id: n.id,
          title: n.title,
          body: n.body,
          type: n.type,
          recipientCount: 1,
          createdAt: n.createdAt,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: Array.from(grouped.values()),
    });
  } catch (error) {
    logger.error("Admin notifications fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const body = await req.json();
    const { title, body: notifBody, type, target } = body;

    if (!title || !notifBody) {
      return NextResponse.json(
        { success: false, error: "Title and body are required" },
        { status: 400 }
      );
    }

    if (target === "all") {
      // Send to all users
      const users = await prisma.user.findMany({
        where: { status: "ACTIVE" },
        select: { id: true },
      });

      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          title,
          body: notifBody,
          type: type || "SYSTEM",
        })),
      });

      return NextResponse.json({
        success: true,
        data: { recipientCount: users.length },
      });
    } else {
      // Send to specific user
      await prisma.notification.create({
        data: {
          userId: target,
          title,
          body: notifBody,
          type: type || "SYSTEM",
        },
      });

      return NextResponse.json({
        success: true,
        data: { recipientCount: 1 },
      });
    }
  } catch (error) {
    logger.error("Admin notification send error", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
