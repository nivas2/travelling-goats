import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { applyRateLimit } from "@/lib/rate-limit";

const logger = createLogger({ route: "trip-memories" });

// List uploaded photos for a trip (photos only — entries with an image).
// `isMine` lets the client show a delete control on the viewer's own photos.
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

    const rows = await prisma.memoryEntry.findMany({
      where: { tripId, imageUrl: { not: null } },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, avatar: true } } },
    });

    const data = rows.map((m) => ({
      id: m.id,
      imageUrl: m.imageUrl ?? "",
      caption: m.content ?? "",
      userName: m.user.name ?? "Traveller",
      userAvatar: m.user.avatar,
      createdAt: m.createdAt.toISOString(),
      isMine: m.userId === session.user!.id,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error("List memories error", error);
    return NextResponse.json({ success: false, error: "Failed to load memories" }, { status: 500 });
  }
}

// Add a memory/photo to the shared trip journal.
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

    // Only travellers on the trip can post memories.
    const booking = await prisma.booking.findFirst({
      where: { tripId, userId: session.user.id },
      select: { id: true },
    });
    if (!booking) {
      return NextResponse.json(
        { success: false, error: "You need a booking on this trip to add memories" },
        { status: 403 }
      );
    }

    const form = await req.formData();
    const caption = String(form.get("caption") ?? "").trim();
    const image = form.get("image");

    let imageUrl = "";
    if (image && typeof image !== "string") {
      const file = image as File;
      const bytes = Buffer.from(await file.arrayBuffer());
      // Stored as a data URL (matches the app's current no-CDN approach).
      imageUrl = `data:${file.type || "image/jpeg"};base64,${bytes.toString("base64")}`;
    }

    if (!imageUrl && !caption) {
      return NextResponse.json(
        { success: false, error: "Add a photo or a caption" },
        { status: 400 }
      );
    }

    const memory = await prisma.memoryEntry.create({
      data: {
        userId: session.user.id,
        tripId,
        content: caption,
        imageUrl: imageUrl || null,
        isPublic: true,
      },
      include: { user: { select: { name: true, avatar: true } } },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: memory.id,
        imageUrl: memory.imageUrl ?? "",
        caption: memory.content ?? "",
        userId: memory.userId,
        userName: memory.user.name ?? "You",
        userAvatar: memory.user.avatar,
        createdAt: memory.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error("Add memory error", error);
    return NextResponse.json(
      { success: false, error: "Failed to add memory" },
      { status: 500 }
    );
  }
}
