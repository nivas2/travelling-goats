import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";

const logger = createLogger({ route: "admin-private-requests" });

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const requests = await prisma.privateRequest.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { name: true, phone: true, avatar: true } },
        trip: { select: { title: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: requests.map((r) => ({
        id: r.id,
        status: r.status,
        tripTitle: r.trip.title,
        userName: r.user.name ?? "Traveller",
        userPhone: r.user.phone,
        userAvatar: r.user.avatar,
        lastMessage: r.messages[0]?.content ?? "",
        lastAt: (r.messages[0]?.createdAt ?? r.updatedAt).toISOString(),
        messageCount: r._count.messages,
      })),
    });
  } catch (error) {
    logger.error("Admin private requests fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
