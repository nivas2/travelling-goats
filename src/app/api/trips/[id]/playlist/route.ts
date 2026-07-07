import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { applyRateLimit } from "@/lib/rate-limit";

const logger = createLogger({ route: "trip-playlist" });

function mapTrack(t: {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  previewUrl: string | null;
  sourceUrl: string | null;
  addedById: string;
  addedBy: { name: string | null };
  createdAt: Date;
}) {
  return {
    id: t.id,
    title: t.title,
    artist: t.artist,
    artworkUrl: t.artworkUrl,
    previewUrl: t.previewUrl,
    sourceUrl: t.sourceUrl,
    addedById: t.addedById,
    addedByName: t.addedBy.name ?? "Traveller",
    createdAt: t.createdAt.toISOString(),
  };
}

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
    const tracks = await prisma.playlistTrack.findMany({
      where: { tripId },
      orderBy: { createdAt: "asc" },
      include: { addedBy: { select: { name: true } } },
    });
    return NextResponse.json({ success: true, data: tracks.map(mapTrack) });
  } catch (error) {
    logger.error("Playlist fetch error", error);
    return NextResponse.json({ success: false, error: "Failed to load playlist" }, { status: 500 });
  }
}

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

    // Only travellers on the trip can suggest songs.
    const booking = await prisma.booking.findFirst({
      where: { tripId, userId: session.user.id },
      select: { id: true },
    });
    if (!booking) {
      return NextResponse.json(
        { success: false, error: "You need a booking on this trip to add songs" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const title = String(body?.title ?? "").trim();
    const artist = String(body?.artist ?? "").trim();
    if (!title || !artist) {
      return NextResponse.json({ success: false, error: "Song title and artist are required" }, { status: 400 });
    }
    const externalId = body?.externalId ? String(body.externalId) : null;

    // Prevent the same song being added twice to a trip.
    if (externalId) {
      const dup = await prisma.playlistTrack.findUnique({
        where: { tripId_externalId: { tripId, externalId } },
      });
      if (dup) {
        return NextResponse.json({ success: false, error: "Already in the playlist" }, { status: 409 });
      }
    }

    const track = await prisma.playlistTrack.create({
      data: {
        tripId,
        addedById: session.user.id,
        title,
        artist,
        artworkUrl: body?.artworkUrl ? String(body.artworkUrl) : null,
        previewUrl: body?.previewUrl ? String(body.previewUrl) : null,
        sourceUrl: body?.sourceUrl ? String(body.sourceUrl) : null,
        externalId,
      },
      include: { addedBy: { select: { name: true } } },
    });

    return NextResponse.json({ success: true, data: mapTrack(track) }, { status: 201 });
  } catch (error) {
    logger.error("Playlist add error", error);
    return NextResponse.json({ success: false, error: "Failed to add song" }, { status: 500 });
  }
}
