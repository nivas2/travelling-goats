import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { validateBody } from "@/lib/validate";
import { sendMessageSchema, editMessageSchema } from "@/lib/validations/chat";
import { applyRateLimit } from "@/lib/rate-limit";

const logger = createLogger({ route: "chat" });

const REACTION_EMOJIS = ["heart", "thumbs_up", "laugh", "fire", "sad"] as const;
const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");
    const cursor = searchParams.get("cursor");

    if (!tripId) {
      return NextResponse.json({ success: false, error: "Trip ID required" }, { status: 400 });
    }

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { tripId },
    });

    if (!chatRoom) {
      return NextResponse.json({ success: false, error: "Chat room not found" }, { status: 404 });
    }

    // Update lastSeenAt (piggyback on poll) and lastReadAt in parallel
    const userId = session.user.id;
    prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: new Date() },
      }),
      prisma.chatRoomMember.upsert({
        where: { roomId_userId: { roomId: chatRoom.id, userId } },
        create: { roomId: chatRoom.id, userId, lastReadAt: new Date() },
        update: { lastReadAt: new Date() },
      }),
    ]).catch(() => {
      // Best-effort; never fail the message fetch
    });

    const [messages, pinnedMessages] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { roomId: chatRoom.id },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          replyTo: {
            select: { content: true, isDeleted: true, user: { select: { name: true } } },
          },
          reactions: {
            select: { emoji: true, userId: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      prisma.chatMessage.findMany({
        where: { roomId: chatRoom.id, isPinned: true, isDeleted: false },
        include: {
          user: { select: { name: true } },
        },
        orderBy: { pinnedAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        roomId: chatRoom.id,
        messages: messages.reverse().map((m) => {
          // Aggregate reactions: group by emoji, count, check if current user reacted
          const reactionMap = new Map<string, { count: number; reacted: boolean }>();
          for (const r of m.reactions) {
            const existing = reactionMap.get(r.emoji);
            if (existing) {
              existing.count++;
              if (r.userId === userId) existing.reacted = true;
            } else {
              reactionMap.set(r.emoji, { count: 1, reacted: r.userId === userId });
            }
          }
          const reactions = Array.from(reactionMap.entries()).map(([emoji, data]) => ({
            emoji,
            count: data.count,
            reacted: data.reacted,
          }));

          // Soft-deleted messages return empty content
          const replyToContent = m.replyTo
            ? m.replyTo.isDeleted
              ? "This message was deleted"
              : m.replyTo.content
            : null;

          return {
            id: m.id,
            roomId: m.roomId,
            userId: m.userId,
            userName: m.user.name ?? "Traveler",
            userAvatar: m.user.avatar,
            content: m.isDeleted ? "" : m.content,
            type: m.type,
            imageUrl: m.isDeleted ? null : m.imageUrl,
            replyToId: m.replyToId,
            replyToContent,
            isEdited: m.isEdited,
            isDeleted: m.isDeleted,
            isPinned: m.isPinned,
            createdAt: m.createdAt.toISOString(),
            reactions: m.isDeleted ? [] : reactions,
          };
        }),
        pinnedMessages: pinnedMessages.map((p) => ({
          id: p.id,
          content: p.content,
          userName: p.user.name ?? "Traveler",
          createdAt: p.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    logger.error("Chat fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = applyRateLimit("api", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const validation = validateBody(sendMessageSchema, body);
    if (!validation.success) return validation.response;

    const { tripId, content, type, imageUrl, replyToId } = validation.data;

    let chatRoom = await prisma.chatRoom.findUnique({ where: { tripId } });
    if (!chatRoom) {
      const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { title: true } });
      chatRoom = await prisma.chatRoom.create({
        data: { tripId, name: trip?.title ?? "Trip Chat" },
      });
    }

    const message = await prisma.chatMessage.create({
      data: {
        roomId: chatRoom.id,
        userId: session.user.id,
        content,
        type,
        imageUrl,
        replyToId,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Update lastReadAt for sender
    prisma.chatRoomMember.upsert({
      where: { roomId_userId: { roomId: chatRoom.id, userId: session.user.id } },
      create: { roomId: chatRoom.id, userId: session.user.id, lastReadAt: new Date() },
      update: { lastReadAt: new Date() },
    }).catch(() => {});

    // Notify the other trip members that a new message was posted.
    try {
      const members = await prisma.booking.findMany({
        where: { tripId, status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] } },
        select: { userId: true },
      });
      const recipientIds = [...new Set(members.map((m) => m.userId))].filter(
        (uid) => uid !== session.user!.id
      );
      if (recipientIds.length > 0) {
        const trip = await prisma.trip.findUnique({
          where: { id: tripId },
          select: { title: true },
        });
        const senderName = message.user.name ?? "A traveller";
        const preview = content ? content.slice(0, 80) : "sent a photo";
        await prisma.notification.createMany({
          data: recipientIds.map((uid) => ({
            userId: uid,
            title: `New message · ${trip?.title ?? "your trip"}`,
            body: `${senderName}: ${preview}`,
            type: "CHAT" as const,
            data: { tripId, roomId: chatRoom.id, kind: "group" },
          })),
        });
      }
    } catch {
      // Notifications are best-effort; never fail the message send.
    }

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        roomId: message.roomId,
        userId: message.userId,
        userName: message.user.name ?? "Traveler",
        userAvatar: message.user.avatar,
        content: message.content,
        type: message.type,
        imageUrl: message.imageUrl,
        replyToId: message.replyToId,
        replyToContent: null,
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        createdAt: message.createdAt.toISOString(),
        reactions: [],
      },
    });
  } catch (error) {
    logger.error("Chat send error", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// Toggle a reaction on a message
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = applyRateLimit("api", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const { messageId, emoji } = body as { messageId?: string; emoji?: string };

    if (!messageId || !emoji) {
      return NextResponse.json({ success: false, error: "messageId and emoji required" }, { status: 400 });
    }

    if (!REACTION_EMOJIS.includes(emoji as (typeof REACTION_EMOJIS)[number])) {
      return NextResponse.json({ success: false, error: "Invalid emoji" }, { status: 400 });
    }

    const userId = session.user.id;

    // Check if reaction exists — toggle
    const existing = await prisma.chatReaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });

    if (existing) {
      await prisma.chatReaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, data: { action: "removed" } });
    }

    await prisma.chatReaction.create({
      data: { messageId, userId, emoji },
    });

    return NextResponse.json({ success: true, data: { action: "added" } });
  } catch (error) {
    logger.error("Chat reaction error", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle reaction" },
      { status: 500 }
    );
  }
}

// Edit own message (within 15-minute window)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = applyRateLimit("api", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const validation = validateBody(editMessageSchema, body);
    if (!validation.success) return validation.response;

    const { messageId, content } = validation.data;
    const userId = session.user.id;

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { userId: true, type: true, isDeleted: true, createdAt: true },
    });

    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    if (message.userId !== userId) {
      return NextResponse.json({ success: false, error: "You can only edit your own messages" }, { status: 403 });
    }

    if (message.isDeleted) {
      return NextResponse.json({ success: false, error: "Cannot edit a deleted message" }, { status: 400 });
    }

    if (message.type !== "TEXT") {
      return NextResponse.json({ success: false, error: "Only text messages can be edited" }, { status: 400 });
    }

    const elapsed = Date.now() - message.createdAt.getTime();
    if (elapsed > EDIT_WINDOW_MS) {
      return NextResponse.json({ success: false, error: "Edit window expired (15 minutes)" }, { status: 400 });
    }

    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { content, isEdited: true },
    });

    return NextResponse.json({ success: true, data: { messageId, content, isEdited: true } });
  } catch (error) {
    logger.error("Chat edit error", error);
    return NextResponse.json(
      { success: false, error: "Failed to edit message" },
      { status: 500 }
    );
  }
}

// Delete message (own within 15 min, or moderator)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messageId } = body as { messageId?: string };

    if (!messageId) {
      return NextResponse.json({ success: false, error: "messageId required" }, { status: 400 });
    }

    const userId = session.user.id;

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: {
        userId: true,
        type: true,
        isDeleted: true,
        createdAt: true,
        room: {
          select: {
            trip: {
              select: { tripCaptainId: true },
            },
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    if (message.isDeleted) {
      return NextResponse.json({ success: false, error: "Message already deleted" }, { status: 400 });
    }

    if (message.type === "SYSTEM") {
      return NextResponse.json({ success: false, error: "System messages cannot be deleted" }, { status: 400 });
    }

    const isOwn = message.userId === userId;

    if (isOwn) {
      // Own message: enforce 15-min window
      const elapsed = Date.now() - message.createdAt.getTime();
      if (elapsed > EDIT_WINDOW_MS) {
        return NextResponse.json({ success: false, error: "Delete window expired (15 minutes)" }, { status: 400 });
      }
    } else {
      // Need moderator role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      const isModerator =
        user?.role === "ADMIN" ||
        user?.role === "SUPPORT" ||
        (user?.role === "TRIP_CAPTAIN" && message.room.trip.tripCaptainId === userId);

      if (!isModerator) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { isDeleted: true, deletedAt: new Date(), content: "" },
    });

    return NextResponse.json({ success: true, data: { messageId, isDeleted: true } });
  } catch (error) {
    logger.error("Chat delete error", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
