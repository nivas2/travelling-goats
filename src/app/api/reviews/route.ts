import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger, getClientIp } from "@/lib/logger";
import { validateBody } from "@/lib/validate";
import { createReviewSchema } from "@/lib/validations/review";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const logger = createLogger({ route: "reviews" });

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = applyRateLimit("api", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const validation = validateBody(createReviewSchema, body);
    if (!validation.success) return validation.response;

    const { tripId, overallRating, safetyRating, valueRating, funRating, comment, images } =
      validation.data;

    // Check if user has a confirmed booking for this trip
    const booking = await prisma.booking.findFirst({
      where: {
        userId: session.user.id,
        tripId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "You must complete this trip to leave a review" },
        { status: 400 }
      );
    }

    const existingReview = await prisma.review.findUnique({
      where: { userId_tripId: { userId: session.user.id, tripId } },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: "You have already reviewed this trip" },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        tripId,
        overallRating,
        safetyRating,
        valueRating,
        funRating,
        comment,
        images: images ?? [],
        isVerified: true,
      },
    });

    // Update trip rating
    const allReviews = await prisma.review.findMany({
      where: { tripId },
      select: { overallRating: true },
    });

    const avgRating =
      allReviews.reduce((sum, r) => sum + r.overallRating, 0) / allReviews.length;

    await prisma.trip.update({
      where: { id: tripId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: allReviews.length,
      },
    });

    // Award points for review
    await prisma.user.update({
      where: { id: session.user.id },
      data: { rewardPoints: { increment: 100 } },
    });

    const ip = getClientIp(req);
    auditLog({
      userId: session.user.id,
      action: "REVIEW_CREATED",
      entityType: "review",
      entityId: review.id,
      metadata: { tripId, overallRating },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    logger.error("Review creation error", error);
    return NextResponse.json(
      { success: false, error: "Failed to create review" },
      { status: 500 }
    );
  }
}
