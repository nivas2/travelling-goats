import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger, getClientIp } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";
import { validateBody } from "@/lib/validate";
import { createTripSchema } from "@/lib/validations/admin";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const logger = createLogger({ route: "admin-trips" });

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const rateLimitResponse = applyRateLimit("admin", authResult.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "50"), 1), 100);
    const skip = (page - 1) * limit;

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          destination: true,
          coverImage: true,
          startDate: true,
          endDate: true,
          basePricePaise: true,
          maxGroupSize: true,
          currentBookings: true,
          status: true,
          isFeatured: true,
          isTrending: true,
          createdAt: true,
        },
      }),
      prisma.trip.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        trips,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Admin trips list error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch trips" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const rateLimitResponse = applyRateLimit("admin", authResult.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const validation = validateBody(createTripSchema, body);
    if (!validation.success) return validation.response;

    const {
      title, slug, description, shortDescription, destination, origin,
      meetingPoint, meetingTime, coverImage, images, basePricePaise,
      couplePricePaise, groupPricePaise, platformFeePaise, startDate,
      endDate, duration, maxGroupSize, minGroupSize, category, difficulty,
      tags, isFeatured, isTrending, cancellationPolicy, bookingCutoffHours,
      status, itineraryDays, addOns, snackOptions, faqs,
    } = validation.data;

    // Check slug uniqueness
    const existing = await prisma.trip.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A trip with this slug already exists" },
        { status: 409 }
      );
    }

    const trip = await prisma.trip.create({
      data: {
        title,
        slug,
        description,
        shortDescription: shortDescription || null,
        destination,
        origin: origin || "Bengaluru",
        meetingPoint: meetingPoint || null,
        meetingTime: meetingTime || null,
        coverImage,
        images: images ?? [],
        basePricePaise,
        couplePricePaise: couplePricePaise ?? null,
        groupPricePaise: groupPricePaise ?? null,
        platformFeePaise: platformFeePaise ?? 9900,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        duration: duration ?? 1,
        maxGroupSize: maxGroupSize ?? 20,
        minGroupSize: minGroupSize ?? 6,
        category,
        difficulty: difficulty ?? "MODERATE",
        tags: tags ?? [],
        isFeatured: isFeatured ?? false,
        isTrending: isTrending ?? false,
        cancellationPolicy: cancellationPolicy ?? "MODERATE",
        bookingCutoffHours: bookingCutoffHours ?? 24,
        status: status ?? "DRAFT",
        itineraryDays: {
          create: (itineraryDays ?? []).map((day) => ({
            dayNumber: day.dayNumber,
            title: day.title,
            description: day.description ?? null,
            activities: day.activities ?? [],
            meals: day.meals ?? [],
            accommodation: day.accommodation ?? null,
          })),
        },
        addOns: {
          create: (addOns ?? []).map((addon) => ({
            name: addon.name,
            description: addon.description ?? null,
            pricePaise: addon.pricePaise,
            icon: addon.icon ?? null,
            maxQuantity: addon.maxQuantity ?? 1,
          })),
        },
        snackOptions: {
          create: (snackOptions ?? []).map((snack) => ({
            name: snack.name,
            description: snack.description ?? null,
            pricePaise: snack.pricePaise,
            category: snack.category ?? null,
            icon: snack.icon ?? null,
            isVeg: snack.isVeg ?? true,
          })),
        },
        faqs: {
          create: (faqs ?? []).map((faq) => ({
            question: faq.question,
            answer: faq.answer,
            order: faq.order ?? 0,
          })),
        },
      },
      include: {
        itineraryDays: true,
        addOns: true,
        snackOptions: true,
        faqs: true,
      },
    });

    const ip = getClientIp(req);
    auditLog({
      userId: authResult.user.id,
      action: "ADMIN_TRIP_CREATED",
      entityType: "trip",
      entityId: trip.id,
      metadata: { title, slug },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, data: trip }, { status: 201 });
  } catch (error) {
    logger.error("Admin create trip error", error);
    return NextResponse.json(
      { success: false, error: "Failed to create trip" },
      { status: 500 }
    );
  }
}
