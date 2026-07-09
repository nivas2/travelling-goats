import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { createLogger } from "@/lib/logger";
import { validateBody } from "@/lib/validate";
import { moderateMessageSchema, sendAnnouncementSchema } from "@/lib/validations/chat";
import { applyRateLimit } from "@/lib/rate-limit";

const logger = createLogger({ route: "chat-moderate" });

const MAX_PINS_PER_ROOM = 5;

async function checkModerator(userId: string, roomId: string) {
  const [user, room] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    }),
    prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { trip: { select: { tripCaptainId: true } } },
    }),
  ]);

  if (!user || !room) return false;

  if (user.role === "ADMIN" || user.role === "SUPPORT") return true;
  if (user.role === "TRIP_CAPTAIN" && room.trip.tripCaptainId === userId) return true;

  return false;
}

// POST — pin/unpin/delete-any
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult.response;
    const userId = authResult.user.id;

    const rateLimitResponse = applyRateLimit("api", userId);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const validation = validateBody(moderateMessageSchema, body);
    if (!validation.success) return validation.response;

    const { messageId, action } = validation.data;

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { id: true, roomId: true, type: true, isDeleted: true, isPinned: true },
    });

    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    const canModerate = await checkModerator(userId, message.roomId);
    if (!canModerate) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (action === "delete") {
      if (message.isDeleted) {
        return NextResponse.json({ success: false, error: "Message already deleted" }, { status: 400 });
      }
      if (message.type === "SYSTEM") {
        return NextResponse.json({ success: false, error: "System messages cannot be deleted" }, { status: 400 });
      }

      await prisma.chatMessage.update({
        where: { id: messageId },
        data: { isDeleted: true, deletedAt: new Date(), content: "" },
      });

      return NextResponse.json({ success: true, data: { messageId, action: "deleted" } });
    }

    if (action === "pin") {
      if (message.isDeleted) {
        return NextResponse.json({ success: false, error: "Cannot pin a deleted message" }, { status: 400 });
      }
      if (message.type === "SYSTEM") {
        return NextResponse.json({ success: false, error: "System messages cannot be pinned" }, { status: 400 });
      }
      if (message.isPinned) {
        return NextResponse.json({ success: false, error: "Message already pinned" }, { status: 400 });
      }

      const pinnedCount = await prisma.chatMessage.count({
        where: { roomId: message.roomId, isPinned: true },
      });
      if (pinnedCount >= MAX_PINS_PER_ROOM) {
        return NextResponse.json(
          { success: false, error: `Maximum ${MAX_PINS_PER_ROOM} pinned messages per room` },
          { status: 400 }
        );
      }

      await prisma.chatMessage.update({
        where: { id: messageId },
        data: { isPinned: true, pinnedById: userId, pinnedAt: new Date() },
      });

      return NextResponse.json({ success: true, data: { messageId, action: "pinned" } });
    }

    if (action === "unpin") {
      if (!message.isPinned) {
        return NextResponse.json({ success: false, error: "Message is not pinned" }, { status: 400 });
      }

      await prisma.chatMessage.update({
        where: { id: messageId },
        data: { isPinned: false, pinnedById: null, pinnedAt: null },
      });

      return NextResponse.json({ success: true, data: { messageId, action: "unpinned" } });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error("Chat moderation error", error);
    return NextResponse.json(
      { success: false, error: "Failed to moderate message" },
      { status: 500 }
    );
  }
}

// PUT — send announcement (SYSTEM message)
export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult.response;
    const userId = authResult.user.id;

    const rateLimitResponse = applyRateLimit("api", userId);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const validation = validateBody(sendAnnouncementSchema, body);
    if (!validation.success) return validation.response;

    const { tripId, content } = validation.data;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, title: true, tripCaptainId: true },
    });

    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
    }

    // Authorization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true },
    });

    const canAnnounce =
      user?.role === "ADMIN" ||
      user?.role === "SUPPORT" ||
      (user?.role === "TRIP_CAPTAIN" && trip.tripCaptainId === userId);

    if (!canAnnounce) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    let chatRoom = await prisma.chatRoom.findUnique({ where: { tripId } });
    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: { tripId, name: trip.title },
      });
    }

    const message = await prisma.chatMessage.create({
      data: {
        roomId: chatRoom.id,
        userId,
        content,
        type: "SYSTEM",
      },
    });

    // Notify all trip members
    try {
      const members = await prisma.booking.findMany({
        where: { tripId, status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] } },
        select: { userId: true },
      });
      const recipientIds = [...new Set(members.map((m) => m.userId))].filter(
        (uid) => uid !== userId
      );
      if (recipientIds.length > 0) {
        const senderName = user?.name ?? "Admin";
        await prisma.notification.createMany({
          data: recipientIds.map((uid) => ({
            userId: uid,
            title: `Announcement · ${trip.title}`,
            body: `${senderName}: ${content.slice(0, 80)}`,
            type: "CHAT" as const,
            data: { tripId, roomId: chatRoom.id, kind: "announcement" },
          })),
        });
      }
    } catch {
      // Best-effort
    }

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        roomId: message.roomId,
        content: message.content,
        type: "SYSTEM",
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error("Chat announcement error", error);
    return NextResponse.json(
      { success: false, error: "Failed to send announcement" },
      { status: 500 }
    );
  }
}
