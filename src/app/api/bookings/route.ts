import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLogger, getClientIp } from "@/lib/logger";
import { validateBody } from "@/lib/validate";
import { createBookingSchema } from "@/lib/validations/booking";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const logger = createLogger({ route: "bookings" });

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const now = new Date();

    // Build where clause — map tab values (UPCOMING/ONGOING/COMPLETED) to date-based queries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let where: any = { userId: session.user.id };

    if (status === "UPCOMING") {
      where = {
        ...where,
        status: { in: ["PENDING", "CONFIRMED"] },
        trip: { startDate: { gt: now } },
      };
    } else if (status === "ONGOING") {
      where = {
        ...where,
        status: "CONFIRMED",
        trip: {
          startDate: { lte: now },
          endDate: { gte: now },
        },
      };
    } else if (status === "COMPLETED") {
      where = {
        ...where,
        OR: [
          { status: "COMPLETED" },
          { status: "CONFIRMED", trip: { endDate: { lt: now } } },
        ],
      };
    } else if (status) {
      // Direct status filter (e.g., CANCELLED, REFUNDED)
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
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
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    logger.error("Bookings fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookings" },
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

    // Rate limiting
    const rateLimitResponse = applyRateLimit("booking", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const validation = validateBody(createBookingSchema, body);
    if (!validation.success) return validation.response;

    const {
      tripId,
      bookingType,
      travelerCount,
      travelers,
      seatPreference,
      specialRequests,
      pickupPoint,
      addOns,
      snacks,
      couponCode,
    } = validation.data;

    // Fetch trip (outside transaction for initial checks)
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { addOns: true, snackOptions: true },
    });

    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
    }

    if (trip.status !== "PUBLISHED") {
      return NextResponse.json({ success: false, error: "Trip is not available" }, { status: 400 });
    }

    // Booking cutoff check
    const cutoffDate = new Date(trip.startDate.getTime() - trip.bookingCutoffHours * 60 * 60 * 1000);
    if (new Date() > cutoffDate) {
      return NextResponse.json(
        { success: false, error: "Booking is closed for this trip" },
        { status: 400 }
      );
    }

    // Calculate price
    let basePricePaise = trip.basePricePaise * travelerCount;
    if (bookingType === "COUPLE" && trip.couplePricePaise) {
      basePricePaise = trip.couplePricePaise;
    } else if (bookingType === "GROUP" && trip.groupPricePaise) {
      basePricePaise = trip.groupPricePaise * travelerCount;
    }

    let addonsPricePaise = 0;
    const bookingAddOns: { addOnId: string; quantity: number; pricePaise: number }[] = [];
    if (addOns?.length) {
      for (const ao of addOns) {
        const addon = trip.addOns.find((a) => a.id === ao.addOnId);
        if (addon) {
          const price = addon.pricePaise * ao.quantity;
          addonsPricePaise += price;
          bookingAddOns.push({ addOnId: ao.addOnId, quantity: ao.quantity, pricePaise: price });
        }
      }
    }

    let snacksPricePaise = 0;
    const bookingSnacks: { snackId: string; quantity: number; pricePaise: number }[] = [];
    if (snacks?.length) {
      for (const sn of snacks) {
        const snack = trip.snackOptions.find((s) => s.id === sn.snackId);
        if (snack) {
          const price = snack.pricePaise * sn.quantity;
          snacksPricePaise += price;
          bookingSnacks.push({ snackId: sn.snackId, quantity: sn.quantity, pricePaise: price });
        }
      }
    }

    const userId = session.user.id;

    // Use interactive transaction with row locking for concurrency safety
    const booking = await prisma.$transaction(async (tx) => {
      // Lock the trip row to prevent overselling
      const [lockedTrip] = await tx.$queryRaw<
        Array<{ id: string; maxGroupSize: number }>
      >(
        Prisma.sql`SELECT id, "maxGroupSize" FROM trips WHERE id = ${tripId} FOR UPDATE`
      );

      if (!lockedTrip) throw new Error("TRIP_NOT_FOUND");

      // Count actual active bookings (not relying on stale currentBookings field)
      const [{ count: activeBookingCount }] = await tx.$queryRaw<
        Array<{ count: bigint }>
      >(
        Prisma.sql`SELECT COUNT(*) as count FROM bookings WHERE "tripId" = ${tripId} AND status IN ('PENDING', 'CONFIRMED')`
      );

      const spotsLeft = lockedTrip.maxGroupSize - Number(activeBookingCount);
      if (travelerCount > spotsLeft) {
        throw new Error("NOT_ENOUGH_SPOTS");
      }

      // Coupon validation + per-user check
      let discountPaise = 0;
      let couponId: string | null = null;

      if (couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
        if (coupon && coupon.isActive && (!coupon.validUntil || coupon.validUntil > new Date())) {
          if (!coupon.maxUses || coupon.currentUses < coupon.maxUses) {
            // Per-user usage check
            if (coupon.maxUsesPerUser) {
              const userUsageCount = await tx.couponUsage.count({
                where: { couponId: coupon.id, userId: userId },
              });
              if (userUsageCount >= coupon.maxUsesPerUser) {
                throw new Error("COUPON_USER_LIMIT");
              }
            }

            if (basePricePaise >= coupon.minOrderPaise) {
              couponId = coupon.id;
              if (coupon.discountType === "PERCENTAGE") {
                discountPaise = Math.floor(basePricePaise * coupon.discountValue / 100);
                if (coupon.maxDiscountPaise) {
                  discountPaise = Math.min(discountPaise, coupon.maxDiscountPaise);
                }
              } else {
                discountPaise = coupon.discountValue;
              }
            }
          }
        }
      }

      const platformFeePaise = trip.platformFeePaise;
      const totalPricePaise = basePricePaise + addonsPricePaise + snacksPricePaise + platformFeePaise - discountPaise;

      // Generate booking number
      const bookingNumber = `PA${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      const newBooking = await tx.booking.create({
        data: {
          bookingNumber,
          userId: userId,
          tripId,
          bookingType,
          totalPricePaise,
          platformFeePaise,
          discountPaise,
          couponCode,
          couponId,
          travelerCount,
          travelers: JSON.parse(JSON.stringify(travelers ?? [])),
          seatPreference,
          specialRequests,
          pickupPoint,
          addOns: {
            create: bookingAddOns,
          },
          snacks: {
            create: bookingSnacks,
          },
        },
        include: {
          trip: { select: { title: true, coverImage: true } },
        },
      });

      // Update coupon usage atomically
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { currentUses: { increment: 1 } },
        });

        // Track per-user usage
        await tx.couponUsage.create({
          data: {
            couponId,
            userId: userId,
            bookingId: newBooking.id,
          },
        });
      }

      return newBooking;
    });

    const ip = getClientIp(req);
    auditLog({
      userId: session.user.id,
      action: "BOOKING_CREATED",
      entityType: "booking",
      entityId: booking.id,
      metadata: { tripId, bookingType, travelerCount, totalPricePaise: booking.totalPricePaise },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_ENOUGH_SPOTS") {
        return NextResponse.json(
          { success: false, error: "Not enough spots available" },
          { status: 400 }
        );
      }
      if (error.message === "COUPON_USER_LIMIT") {
        return NextResponse.json(
          { success: false, error: "You have already used this coupon" },
          { status: 400 }
        );
      }
      if (error.message === "TRIP_NOT_FOUND") {
        return NextResponse.json(
          { success: false, error: "Trip not found" },
          { status: 404 }
        );
      }
    }
    logger.error("Booking creation error", error);
    return NextResponse.json(
      { success: false, error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
