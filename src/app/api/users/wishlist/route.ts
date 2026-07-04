import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { applyRateLimit } from "@/lib/rate-limit";

const logger = createLogger({ route: "wishlist" });

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      include: {
        trip: {
          select: {
            id: true,
            title: true,
            slug: true,
            destination: true,
            coverImage: true,
            startDate: true,
            endDate: true,
            duration: true,
            basePricePaise: true,
            maxGroupSize: true,
            currentBookings: true,
            category: true,
            difficulty: true,
            rating: true,
            reviewCount: true,
            isFeatured: true,
            isTrending: true,
            tags: true,
            highlights: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: wishlistItems.map((item) => ({ ...item.trip, wishlistId: item.id })),
    });
  } catch (error) {
    logger.error("Wishlist fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = applyRateLimit("api", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const { tripId } = await req.json();

    if (!tripId || typeof tripId !== "string") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: { tripId: ["Trip ID is required"] } },
        { status: 400 }
      );
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_tripId: { userId: session.user.id, tripId } },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, data: { wishlisted: false } });
    }

    await prisma.wishlistItem.create({
      data: { userId: session.user.id, tripId },
    });

    return NextResponse.json({ success: true, data: { wishlisted: true } });
  } catch (error) {
    logger.error("Wishlist toggle error", error);
    return NextResponse.json(
      { success: false, error: "Failed to update wishlist" },
      { status: 500 }
    );
  }
}
