import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ route: "admin-chats" });

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const rooms = await prisma.chatRoom.findMany({
      include: {
        trip: {
          select: {
            id: true,
            title: true,
            status: true,
            tripCaptainId: true,
          },
        },
        members: { select: { id: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
            isDeleted: true,
            createdAt: true,
            user: { select: { name: true } },
          },
        },
        _count: { select: { messages: true, members: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Resolve captain names
    const captainIds = rooms
      .map((r) => r.trip.tripCaptainId)
      .filter((id): id is string => !!id);

    const captains = captainIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: captainIds } },
          select: { id: true, name: true },
        })
      : [];
    const captainMap = new Map(captains.map((c) => [c.id, c.name ?? "Unknown"]));

    const data = rooms.map((r) => {
      const lastMsg = r.messages[0];
      return {
        id: r.id,
        tripId: r.trip.id,
        tripTitle: r.trip.title,
        tripStatus: r.trip.status,
        captainName: r.trip.tripCaptainId
          ? captainMap.get(r.trip.tripCaptainId) ?? "Unknown"
          : null,
        messageCount: r._count.messages,
        memberCount: r._count.members,
        lastMessage: lastMsg
          ? lastMsg.isDeleted
            ? "This message was deleted"
            : lastMsg.content.slice(0, 80)
          : null,
        lastMessageBy: lastMsg?.user?.name ?? null,
        lastMessageAt: lastMsg?.createdAt?.toISOString() ?? null,
        isActive: r.isActive,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error("Admin chats fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch chat rooms" },
      { status: 500 }
    );
  }
}
