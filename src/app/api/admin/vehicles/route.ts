import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger, getClientIp } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";
import { validateBody } from "@/lib/validate";
import { createVehicleTemplateSchema } from "@/lib/validations/vehicle";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const logger = createLogger({ route: "admin-vehicles" });

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
    const vehicleTypeId = searchParams.get("vehicleTypeId");
    const status = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (vehicleTypeId) where.vehicleTypeId = vehicleTypeId;
    if (status) where.status = status;

    const [templates, total] = await Promise.all([
      prisma.vehicleTemplate.findMany({
        where,
        include: {
          vehicleType: { select: { id: true, name: true, icon: true } },
          _count: { select: { seats: true, trips: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.vehicleTemplate.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        templates,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    logger.error("Vehicle templates fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vehicle templates" },
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
    const validation = validateBody(createVehicleTemplateSchema, body);
    if (!validation.success) return validation.response;

    const {
      vehicleTypeId,
      name,
      registrationNumber,
      totalRows,
      totalColumns,
      hasUpperDeck,
      upperDeckRows,
      upperDeckColumns,
      amenities,
      gridLayout,
      upperGridLayout,
      seats,
    } = validation.data;

    // Verify vehicle type exists
    const vehicleType = await prisma.vehicleType.findUnique({
      where: { id: vehicleTypeId },
    });
    if (!vehicleType || !vehicleType.isActive) {
      return NextResponse.json(
        { success: false, error: "Vehicle type not found or inactive" },
        { status: 400 }
      );
    }

    // Validate grid dimensions
    if (gridLayout.length !== totalRows) {
      return NextResponse.json(
        { success: false, error: "Grid layout rows must match totalRows" },
        { status: 400 }
      );
    }
    for (const row of gridLayout) {
      if (row.length !== totalColumns) {
        return NextResponse.json(
          { success: false, error: "Each grid row must have totalColumns cells" },
          { status: 400 }
        );
      }
    }

    if (hasUpperDeck && upperGridLayout) {
      if (upperGridLayout.length !== (upperDeckRows ?? 0)) {
        return NextResponse.json(
          { success: false, error: "Upper grid layout rows must match upperDeckRows" },
          { status: 400 }
        );
      }
      for (const row of upperGridLayout) {
        if (row.length !== (upperDeckColumns ?? 0)) {
          return NextResponse.json(
            { success: false, error: "Each upper grid row must have upperDeckColumns cells" },
            { status: 400 }
          );
        }
      }
    }

    // Create template + seats in a transaction
    const template = await prisma.$transaction(async (tx) => {
      const created = await tx.vehicleTemplate.create({
        data: {
          vehicleTypeId,
          name,
          registrationNumber,
          totalSeats: seats.length,
          totalRows,
          totalColumns,
          hasUpperDeck,
          upperDeckRows: hasUpperDeck ? upperDeckRows : null,
          upperDeckColumns: hasUpperDeck ? upperDeckColumns : null,
          amenities,
          gridLayout,
          upperGridLayout: hasUpperDeck && upperGridLayout ? upperGridLayout : undefined,
        },
      });

      // Bulk create seats
      await tx.seat.createMany({
        data: seats.map((seat, index) => ({
          vehicleTemplateId: created.id,
          seatNumber: seat.seatNumber,
          row: seat.row,
          col: seat.col,
          deck: seat.deck,
          seatType: seat.seatType,
          category: seat.category,
          priceDeltaPaise: seat.priceDeltaPaise,
          genderRestriction: seat.genderRestriction,
          status: seat.status,
          isAccessible: seat.isAccessible,
          isPremium: seat.isPremium,
          order: seat.order || index,
        })),
      });

      return tx.vehicleTemplate.findUnique({
        where: { id: created.id },
        include: {
          vehicleType: { select: { id: true, name: true, icon: true } },
          seats: { orderBy: { order: "asc" } },
        },
      });
    });

    const ip = getClientIp(req);
    auditLog({
      userId: authResult.user.id,
      action: "VEHICLE_TEMPLATE_CREATED",
      entityType: "vehicleTemplate",
      entityId: template!.id,
      metadata: { name, seatCount: seats.length },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (error) {
    logger.error("Vehicle template creation error", error);
    return NextResponse.json(
      { success: false, error: "Failed to create vehicle template" },
      { status: 500 }
    );
  }
}
