import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ service: "waitlist" });

const OFFER_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours per PRD

/**
 * Expire stale OFFERED waitlist items that have passed their expiresAt.
 * Called lazily before waitlist operations.
 */
export async function expireStaleOffers(tripId: string): Promise<void> {
  const now = new Date();
  const stale = await prisma.waitlistItem.findMany({
    where: {
      tripId,
      status: "OFFERED",
      expiresAt: { lt: now },
    },
  });

  if (stale.length === 0) return;

  await prisma.waitlistItem.updateMany({
    where: {
      id: { in: stale.map((s) => s.id) },
    },
    data: { status: "EXPIRED" },
  });

  logger.info("Expired stale waitlist offers", {
    tripId,
    count: stale.length,
  });

  // Promote next user for each expired offer
  for (const item of stale) {
    await promoteNext(item.tripId);
  }
}

/**
 * Promote the next WAITING user on the waitlist for a trip.
 * Called after a cancellation or when an offered spot expires/is declined.
 */
export async function promoteWaitlist(tripId: string): Promise<void> {
  // First expire any stale offers
  await expireStaleOffers(tripId);

  // Check if there's actually a spot available
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { maxGroupSize: true, currentBookings: true },
  });

  if (!trip) return;

  const activeBookings = await prisma.booking.count({
    where: {
      tripId,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  // Also check if there's already an outstanding OFFERED item
  const outstandingOffer = await prisma.waitlistItem.findFirst({
    where: { tripId, status: "OFFERED" },
  });

  if (activeBookings >= trip.maxGroupSize || outstandingOffer) return;

  await promoteNext(tripId);
}

async function promoteNext(tripId: string): Promise<void> {
  const next = await prisma.waitlistItem.findFirst({
    where: { tripId, status: "WAITING" },
    orderBy: { createdAt: "asc" },
  });

  if (!next) return;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + OFFER_WINDOW_MS);

  await prisma.waitlistItem.update({
    where: { id: next.id },
    data: {
      status: "OFFERED",
      offeredAt: now,
      expiresAt,
      notified: true,
    },
  });

  // Create notification for the user
  await prisma.notification.create({
    data: {
      userId: next.userId,
      title: "Spot Available!",
      body: "A spot has opened up on a trip you're waitlisted for. You have 2 hours to book.",
      type: "BOOKING",
      data: { tripId, waitlistItemId: next.id, expiresAt: expiresAt.toISOString() },
    },
  });

  logger.info("Promoted waitlist user", {
    tripId,
    userId: next.userId,
    waitlistItemId: next.id,
    expiresAt: expiresAt.toISOString(),
  });
}
