import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ route: "chat-room" });

// Chat room metadata for a trip (title, members, unread count) shown in chat header.
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");
    if (!tripId) {
      return NextResponse.json({ success: false, error: "Trip ID required" }, { status: 400 });
    }

    const [trip, chatRoom, bookings] = await Promise.all([
      prisma.trip.findUnique({
        where: { id: tripId },
        select: { id: true, title: true, tripCaptainId: true },
      }),
      prisma.chatRoom.findUnique({
        where: { tripId },
        select: { id: true },
      }),
      prisma.booking.findMany({
        where: { tripId, status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] } },
        select: {
          user: {
            select: { id: true, name: true, avatar: true, lastSeenAt: true },
          },
        },
      }),
    ]);

    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
    }

    // Deduplicate members by userId
    const memberMap = new Map<string, {
      id: string;
      name: string | null;
      avatar: string | null;
      lastSeenAt: Date | null;
    }>();
    for (const b of bookings) {
      if (!memberMap.has(b.user.id)) {
        memberMap.set(b.user.id, b.user);
      }
    }

    const onlineThreshold = new Date(Date.now() - 60_000); // 1 minute
    const members = Array.from(memberMap.values())
      .map((u) => ({
        id: u.id,
        name: u.name ?? "Traveler",
        avatar: u.avatar,
        isCaptain: u.id === trip.tripCaptainId,
        online: u.lastSeenAt ? u.lastSeenAt > onlineThreshold : false,
      }))
      .sort((a, b) => {
        // Captain first, then alphabetical
        if (a.isCaptain !== b.isCaptain) return a.isCaptain ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    // Unread count: messages after user's lastReadAt
    let unreadCount = 0;
    if (chatRoom) {
      const membership = await prisma.chatRoomMember.findUnique({
        where: { roomId_userId: { roomId: chatRoom.id, userId: session.user.id } },
        select: { lastReadAt: true },
      });

      if (membership) {
        unreadCount = await prisma.chatMessage.count({
          where: {
            roomId: chatRoom.id,
            createdAt: { gt: membership.lastReadAt },
            userId: { not: session.user.id },
          },
        });
      } else {
        // Never visited — all messages are unread
        unreadCount = await prisma.chatMessage.count({
          where: {
            roomId: chatRoom.id,
            userId: { not: session.user.id },
          },
        });
      }
    }

    // Fetch current user's role for moderation UI
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        roomId: chatRoom?.id ?? null,
        tripId: trip.id,
        tripTitle: trip.title,
        memberCount: members.length,
        members,
        unreadCount,
        onlineCount: members.filter((m) => m.online).length,
        currentUserRole: currentUser?.role ?? "USER",
        isCurrentUserCaptain: trip.tripCaptainId === session.user.id,
      },
    });
  } catch (error) {
    logger.error("Chat room fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch chat room" },
      { status: 500 }
    );
  }
}
