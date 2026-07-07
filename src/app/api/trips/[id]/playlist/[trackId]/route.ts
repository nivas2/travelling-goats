import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ route: "trip-playlist-track" });

// Remove a song — only the traveller who added it (or an admin).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; trackId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { trackId } = await params;

    const track = await prisma.playlistTrack.findUnique({
      where: { id: trackId },
      select: { addedById: true },
    });
    if (!track) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (track.addedById !== session.user.id && me?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "You can only remove songs you added" }, { status: 403 });
    }

    await prisma.playlistTrack.delete({ where: { id: trackId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Playlist delete error", error);
    return NextResponse.json({ success: false, error: "Failed to remove song" }, { status: 500 });
  }
}
