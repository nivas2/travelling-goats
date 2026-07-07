import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ route: "trip-hub" });

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

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        title: true,
        destination: true,
        coverImage: true,
        startDate: true,
        endDate: true,
        duration: true,
        status: true,
        tripCaptainId: true,
      },
    });
    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
    }

    // Shepherd / trip captain (fallback to a placeholder so the UI never breaks).
    let captain: { id: string; name: string | null; avatar: string | null; phone: string | null; city: string | null } | null =
      null;
    if (trip.tripCaptainId) {
      captain = await prisma.user.findUnique({
        where: { id: trip.tripCaptainId },
        select: { id: true, name: true, avatar: true, phone: true, city: true },
      });
    }
    const tripCaptain = {
      id: captain?.id ?? "",
      name: captain?.name ?? "Shepherd (to be assigned)",
      avatar: captain?.avatar ?? null,
      phone: captain?.phone ?? "",
      city: captain?.city ?? "",
    };

    // Companions = everyone with an active booking on this trip.
    const bookings = await prisma.booking.findMany({
      where: { tripId, status: { in: ["CONFIRMED", "COMPLETED"] } },
      select: { user: { select: { id: true, name: true, avatar: true, city: true } } },
    });
    const seen = new Set<string>();
    const companions = bookings
      .map((b) => b.user)
      .filter((u) => (seen.has(u.id) ? false : (seen.add(u.id), true)))
      .map((u) => ({
        id: u.id,
        name: u.name ?? "Traveller",
        avatar: u.avatar,
        city: u.city ?? "",
        isCaptain: u.id === trip.tripCaptainId,
      }));

    // Shared trip memories/journal.
    const memoryRows = await prisma.memoryEntry.findMany({
      where: { tripId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    const memories = memoryRows.map((m) => ({
      id: m.id,
      imageUrl: m.imageUrl ?? "",
      caption: m.content ?? "",
      userId: m.userId,
      userName: m.user.name ?? "Traveller",
      userAvatar: m.user.avatar,
      createdAt: m.createdAt.toISOString(),
    }));

    // Which day of the trip is it (clamped to 1..duration).
    const dayMs = 24 * 60 * 60 * 1000;
    const elapsed = Math.ceil((Date.now() - new Date(trip.startDate).getTime()) / dayMs);
    const currentDay = Math.min(Math.max(elapsed, 1), trip.duration || 1);

    return NextResponse.json({
      success: true,
      data: {
        id: trip.id,
        tripTitle: trip.title,
        destination: trip.destination,
        coverImage: trip.coverImage ?? "",
        startDate: trip.startDate.toISOString(),
        endDate: trip.endDate.toISOString(),
        duration: trip.duration,
        currentDay,
        status: trip.status,
        tripCaptain,
        isCaptain: trip.tripCaptainId === session.user.id,
        companions,
        memories,
      },
    });
  } catch (error) {
    logger.error("Trip hub fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to load trip hub" },
      { status: 500 }
    );
  }
}
