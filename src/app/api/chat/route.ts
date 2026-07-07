import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { validateBody } from "@/lib/validate";
import { sendMessageSchema } from "@/lib/validations/chat";
import { applyRateLimit } from "@/lib/rate-limit";

const logger = createLogger({ route: "chat" });

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

    const messages = await prisma.chatMessage.findMany({
      where: { roomId: chatRoom.id },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        replyTo: {
          select: { content: true, user: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return NextResponse.json({
      success: true,
      data: {
        roomId: chatRoom.id,
        messages: messages.reverse().map((m) => ({
          id: m.id,
          roomId: m.roomId,
          userId: m.userId,
          userName: m.user.name ?? "Traveler",
          userAvatar: m.user.avatar,
          content: m.content,
          type: m.type,
          imageUrl: m.imageUrl,
          replyToId: m.replyToId,
          replyToContent: m.replyTo?.content ?? null,
          isEdited: m.isEdited,
          createdAt: m.createdAt.toISOString(),
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
        const preview = content ? content.slice(0, 80) : "📷 sent a photo";
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
        createdAt: message.createdAt.toISOString(),
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
