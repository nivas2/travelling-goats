import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ route: "chat-room" });

// Chat room metadata for a trip (title + member count) shown in the chat header.
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

    const [trip, chatRoom, memberCount] = await Promise.all([
      prisma.trip.findUnique({
        where: { id: tripId },
        select: { id: true, title: true },
      }),
      prisma.chatRoom.findUnique({
        where: { tripId },
        select: { id: true },
      }),
      prisma.booking.count({
        where: { tripId, status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] } },
      }),
    ]);

    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        roomId: chatRoom?.id ?? null,
        tripId: trip.id,
        tripTitle: trip.title,
        memberCount,
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
