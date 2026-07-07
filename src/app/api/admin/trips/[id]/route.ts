import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger, getClientIp } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";
import { validateBody } from "@/lib/validate";
import { updateTripSchema } from "@/lib/validations/admin";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const logger = createLogger({ route: "admin-trips-detail" });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const { id } = await params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        itineraryDays: { orderBy: { dayNumber: "asc" } },
        addOns: true,
        snackOptions: true,
        faqs: { orderBy: { order: "asc" } },
        _count: { select: { bookings: true, reviews: true } },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: trip });
  } catch (error) {
    logger.error("Admin get trip error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch trip" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const rateLimitResponse = applyRateLimit("admin", authResult.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;

    const body = await req.json();
    const validation = validateBody(updateTripSchema, body);
    if (!validation.success) return validation.response;

    // Check trip exists
    const existing = await prisma.trip.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 }
      );
    }

    // If slug changed, check uniqueness
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await prisma.trip.findUnique({
        where: { slug: body.slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { success: false, error: "A trip with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // Build the update data (only include provided fields)
    const updateData: Record<string, unknown> = {};
    const directFields = [
      "title", "slug", "description", "shortDescription", "destination",
      "origin", "meetingPoint", "meetingTime", "coverImage", "images",
      "basePricePaise", "couplePricePaise", "groupPricePaise",
      "platformFeePaise", "duration", "maxGroupSize", "minGroupSize",
      "category", "difficulty", "tags", "isFeatured", "isTrending",
      "cancellationPolicy", "bookingCutoffHours", "status", "tripCaptainId",
    ];

    for (const field of directFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle date fields
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);

    // Update trip
    await prisma.trip.update({
      where: { id },
      data: updateData,
    });

    // Replace itinerary days if provided
    if (body.itineraryDays !== undefined) {
      await prisma.itineraryDay.deleteMany({ where: { tripId: id } });
      if (body.itineraryDays.length > 0) {
        await prisma.itineraryDay.createMany({
          data: body.itineraryDays.map(
            (day: {
              dayNumber: number;
              title: string;
              description?: string;
              activities?: unknown;
              meals?: string[];
              accommodation?: string;
            }) => ({
              tripId: id,
              dayNumber: day.dayNumber,
              title: day.title,
              description: day.description ?? null,
              activities: day.activities ?? [],
              meals: day.meals ?? [],
              accommodation: day.accommodation ?? null,
            })
          ),
        });
      }
    }

    // Replace add-ons if provided
    if (body.addOns !== undefined) {
      await prisma.tripAddOn.deleteMany({ where: { tripId: id } });
      if (body.addOns.length > 0) {
        await prisma.tripAddOn.createMany({
          data: body.addOns.map(
            (addon: {
              name: string;
              description?: string;
              pricePaise: number;
              icon?: string;
              maxQuantity?: number;
            }) => ({
              tripId: id,
              name: addon.name,
              description: addon.description ?? null,
              pricePaise: addon.pricePaise,
              icon: addon.icon ?? null,
              maxQuantity: addon.maxQuantity ?? 1,
            })
          ),
        });
      }
    }

    // Replace snack options if provided
    if (body.snackOptions !== undefined) {
      await prisma.snackOption.deleteMany({ where: { tripId: id } });
      if (body.snackOptions.length > 0) {
        await prisma.snackOption.createMany({
          data: body.snackOptions.map(
            (snack: {
              name: string;
              description?: string;
              pricePaise: number;
              category?: string;
              icon?: string;
              isVeg?: boolean;
            }) => ({
              tripId: id,
              name: snack.name,
              description: snack.description ?? null,
              pricePaise: snack.pricePaise,
              category: snack.category ?? null,
              icon: snack.icon ?? null,
              isVeg: snack.isVeg ?? true,
            })
          ),
        });
      }
    }

    // Replace FAQs if provided
    if (body.faqs !== undefined) {
      await prisma.tripFaq.deleteMany({ where: { tripId: id } });
      if (body.faqs.length > 0) {
        await prisma.tripFaq.createMany({
          data: body.faqs.map(
            (faq: { question: string; answer: string; order?: number }) => ({
              tripId: id,
              question: faq.question,
              answer: faq.answer,
              order: faq.order ?? 0,
            })
          ),
        });
      }
    }

    // Return the full updated trip
    const updated = await prisma.trip.findUnique({
      where: { id },
      include: {
        itineraryDays: { orderBy: { dayNumber: "asc" } },
        addOns: true,
        snackOptions: true,
        faqs: { orderBy: { order: "asc" } },
      },
    });

    const ip = getClientIp(req);
    auditLog({
      userId: authResult.user.id,
      action: "ADMIN_TRIP_UPDATED",
      entityType: "trip",
      entityId: id,
      metadata: { fields: Object.keys(body) },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    logger.error("Admin update trip error", error);
    return NextResponse.json(
      { success: false, error: "Failed to update trip" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const rateLimitResponse = applyRateLimit("admin", authResult.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;

    const existing = await prisma.trip.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 }
      );
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        tripId: id,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (activeBookings > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete trip with ${activeBookings} active booking(s). Cancel bookings first.`,
        },
        { status: 409 }
      );
    }

    await prisma.trip.delete({ where: { id } });

    const ip = getClientIp(req);
    auditLog({
      userId: authResult.user.id,
      action: "ADMIN_TRIP_DELETED",
      entityType: "trip",
      entityId: id,
      metadata: { title: existing.title },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    logger.error("Admin delete trip error", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete trip" },
      { status: 500 }
    );
  }
}
