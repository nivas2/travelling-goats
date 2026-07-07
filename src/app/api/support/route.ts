import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { applyRateLimit } from "@/lib/rate-limit";

const logger = createLogger({ route: "support" });

const CATEGORIES = ["BOOKING", "PAYMENT", "TRIP", "ACCOUNT", "TECHNICAL", "OTHER"] as const;

function normalizeCategory(v: string): (typeof CATEGORIES)[number] {
  const up = (v || "").toUpperCase();
  return (CATEGORIES as readonly string[]).includes(up)
    ? (up as (typeof CATEGORIES)[number])
    : "OTHER";
}

// List the current user's support tickets.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 1 } },
    });

    return NextResponse.json({
      success: true,
      data: {
        tickets: tickets.map((t) => ({
          id: t.id,
          ticketNumber: t.ticketNumber,
          subject: t.subject,
          category: t.category,
          description: t.messages[0]?.content ?? "",
          status: t.status,
          createdAt: t.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    logger.error("Support list error", error);
    return NextResponse.json({ success: false, error: "Failed to load tickets" }, { status: 500 });
  }
}

// Raise a new support ticket.
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const rl = applyRateLimit("api", session.user.id);
    if (rl) return rl;

    const body = await req.json();
    const subject = String(body?.subject ?? "").trim();
    const description = String(body?.description ?? "").trim();
    if (!subject || !description) {
      return NextResponse.json(
        { success: false, error: "Subject and description are required" },
        { status: 400 }
      );
    }
    const category = normalizeCategory(String(body?.category ?? "OTHER"));

    const ticketNumber = `TG-${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .slice(2, 5)
      .toUpperCase()}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: session.user.id,
        subject,
        category,
        // Store the description as the first message in the thread.
        messages: { create: { userId: session.user.id, content: description, isStaff: false } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ticket: {
            id: ticket.id,
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            category: ticket.category,
            description,
            status: ticket.status,
            createdAt: ticket.createdAt.toISOString(),
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Support create error", error);
    return NextResponse.json({ success: false, error: "Failed to raise ticket" }, { status: 500 });
  }
}
