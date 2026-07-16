import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { applyRateLimit } from "@/lib/rate-limit";

const logger = createLogger({ route: "private-request" });

const messageInclude = {
  messages: {
    orderBy: { createdAt: "asc" as const },
    include: { sender: { select: { name: true, avatar: true } } },
  },
};

async function shepherdFor(tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { title: true, tripCaptainId: true },
  });
  let shepherd: { name: string | null; avatar: string | null } | null = null;
  if (trip?.tripCaptainId) {
    shepherd = await prisma.user.findUnique({
      where: { id: trip.tripCaptainId },
      select: { name: true, avatar: true },
    });
  }
  return { tripTitle: trip?.title ?? "Your Trip", shepherd };
}

// The traveller's own private thread with their shepherd for this trip.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id: tripId } = await params;

    const thread = await prisma.privateRequest.findUnique({
      where: { tripId_userId: { tripId, userId: session.user.id } },
      include: messageInclude,
    });

    const { tripTitle, shepherd } = await shepherdFor(tripId);

    return NextResponse.json({
      success: true,
      data: {
        id: thread?.id ?? null,
        status: thread?.status ?? "OPEN",
        tripTitle,
        shepherd,
        messages: (thread?.messages ?? []).map((m) => ({
          id: m.id,
          content: m.content,
          isStaff: m.isStaff,
          senderName: m.sender.name ?? "User",
          senderAvatar: m.sender.avatar,
          createdAt: m.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    logger.error("Private request fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to load private request" },
      { status: 500 }
    );
  }
}

// Post a message from the traveller (creates the thread on first message).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const rl = applyRateLimit("api", session.user.id);
    if (rl) return rl;

    const { id: tripId } = await params;
    const body = await req.json();
    const content = String(body?.content ?? "").trim();
    if (!content) {
      return NextResponse.json({ success: false, error: "Message cannot be empty" }, { status: 400 });
    }

    // Only travellers with a booking on this trip can contact the shepherd.
    const booking = await prisma.booking.findFirst({
      where: { tripId, userId: session.user.id },
      select: { id: true },
    });
    if (!booking) {
      return NextResponse.json(
        { success: false, error: "You need a booking on this trip to contact your trip captain" },
        { status: 403 }
      );
    }

    const thread = await prisma.privateRequest.upsert({
      where: { tripId_userId: { tripId, userId: session.user.id } },
      create: { tripId, userId: session.user.id, status: "OPEN" },
      update: { status: "OPEN" },
    });

    const message = await prisma.privateRequestMessage.create({
      data: { requestId: thread.id, senderId: session.user.id, content, isStaff: false },
      include: { sender: { select: { name: true, avatar: true } } },
    });

    // Notify the shepherd (captain) + admins about the new private request.
    try {
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: { title: true, tripCaptainId: true },
      });
      const recipientIds = new Set<string>();
      if (trip?.tripCaptainId) recipientIds.add(trip.tripCaptainId);
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });
      admins.forEach((a) => recipientIds.add(a.id));
      recipientIds.delete(session.user.id);
      if (recipientIds.size > 0) {
        const who = message.sender.name ?? "A traveller";
        await prisma.notification.createMany({
          data: [...recipientIds].map((rid) => ({
            userId: rid,
            title: `Private request · ${trip?.title ?? "trip"}`,
            body: `${who}: ${content.slice(0, 80)}`,
            type: "CHAT" as const,
            data: { tripId, privateRequestId: thread.id, kind: "private" },
          })),
        });
      }
    } catch {
      /* best-effort */
    }

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        content: message.content,
        isStaff: false,
        senderName: message.sender.name ?? "You",
        senderAvatar: message.sender.avatar,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error("Private request send error", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}
