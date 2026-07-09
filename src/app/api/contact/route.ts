import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ route: "contact" });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public endpoint — no auth. Accepts marketing-footer contact / partner enquiries.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const type = body?.type === "PARTNER" ? "PARTNER" : "GENERAL";
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const company = String(body?.company ?? "").trim();
    const message = String(body?.message ?? "").trim();

    if (!name || name.length > 120) {
      return NextResponse.json(
        { success: false, error: "Please enter your name." },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    if (!message || message.length < 10) {
      return NextResponse.json(
        { success: false, error: "Please tell us a little more (at least 10 characters)." },
        { status: 400 }
      );
    }
    if (message.length > 4000) {
      return NextResponse.json(
        { success: false, error: "Message is too long." },
        { status: 400 }
      );
    }

    await prisma.contactRequest.create({
      data: {
        type,
        name,
        email,
        phone: phone || null,
        company: company || null,
        message,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Contact request submit error", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
