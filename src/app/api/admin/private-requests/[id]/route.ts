import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";

const logger = createLogger({ route: "admin-private-request-detail" });

// Full thread + messages.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;
    const { id } = await params;

    const thread = await prisma.privateRequest.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, phone: true, avatar: true } },
        trip: { select: { title: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { name: true, avatar: true } } },
        },
      },
    });
    if (!thread) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: thread.id,
        status: thread.status,
        tripTitle: thread.trip.title,
        userName: thread.user.name ?? "Traveller",
        userPhone: thread.user.phone,
        messages: thread.messages.map((m) => ({
          id: m.id,
          content: m.content,
          isStaff: m.isStaff,
          senderName: m.sender.name ?? "User",
          createdAt: m.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    logger.error("Admin private request detail error", error);
    return NextResponse.json(
      { success: false, error: "Failed to load request" },
      { status: 500 }
    );
  }
}

// Staff/shepherd reply, or status change.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;
    const { id } = await params;
    const body = await req.json();

    // Status-only update.
    if (body?.status && !body?.content) {
      await prisma.privateRequest.update({ where: { id }, data: { status: body.status } });
      return NextResponse.json({ success: true });
    }

    const content = String(body?.content ?? "").trim();
    if (!content) {
      return NextResponse.json({ success: false, error: "Reply cannot be empty" }, { status: 400 });
    }

    const message = await prisma.privateRequestMessage.create({
      data: {
        requestId: id,
        senderId: authResult.user.id,
        content,
        isStaff: true,
      },
    });
    await prisma.privateRequest.update({
      where: { id },
      data: { status: body?.status ?? "OPEN" },
    });

    // Notify the traveller that their Trip Captain replied.
    try {
      const thread = await prisma.privateRequest.findUnique({
        where: { id },
        select: { userId: true, tripId: true, trip: { select: { title: true } } },
      });
      if (thread) {
        await prisma.notification.create({
          data: {
            userId: thread.userId,
            title: `Reply from your Trip Captain · ${thread.trip.title}`,
            body: content.slice(0, 100),
            type: "CHAT",
            data: { tripId: thread.tripId, privateRequestId: id, kind: "private" },
          },
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
        isStaff: true,
        senderName: "Trip Captain",
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error("Admin private request reply error", error);
    return NextResponse.json(
      { success: false, error: "Failed to reply" },
      { status: 500 }
    );
  }
}
