import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger, getClientIp } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";
import { validateBody } from "@/lib/validate";
import { updateVehicleTemplateSchema } from "@/lib/validations/vehicle";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const logger = createLogger({ route: "admin-vehicles-id" });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const { id } = await params;

    const template = await prisma.vehicleTemplate.findUnique({
      where: { id },
      include: {
        vehicleType: { select: { id: true, name: true, icon: true } },
        seats: { orderBy: { order: "asc" } },
        _count: { select: { trips: true } },
      },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Vehicle template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    logger.error("Vehicle template fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vehicle template" },
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
    const validation = validateBody(updateVehicleTemplateSchema, body);
    if (!validation.success) return validation.response;

    const existing = await prisma.vehicleTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Vehicle template not found" },
        { status: 404 }
      );
    }

    const { seats, ...templateData } = validation.data;

    const template = await prisma.$transaction(async (tx) => {
      // Update template fields
      const updateData: Record<string, unknown> = {};
      if (templateData.vehicleTypeId !== undefined) updateData.vehicleTypeId = templateData.vehicleTypeId;
      if (templateData.name !== undefined) updateData.name = templateData.name;
      if (templateData.registrationNumber !== undefined) updateData.registrationNumber = templateData.registrationNumber;
      if (templateData.totalRows !== undefined) updateData.totalRows = templateData.totalRows;
      if (templateData.totalColumns !== undefined) updateData.totalColumns = templateData.totalColumns;
      if (templateData.hasUpperDeck !== undefined) updateData.hasUpperDeck = templateData.hasUpperDeck;
      if (templateData.upperDeckRows !== undefined) updateData.upperDeckRows = templateData.upperDeckRows;
      if (templateData.upperDeckColumns !== undefined) updateData.upperDeckColumns = templateData.upperDeckColumns;
      if (templateData.amenities !== undefined) updateData.amenities = templateData.amenities;
      if (templateData.gridLayout !== undefined) updateData.gridLayout = templateData.gridLayout;
      if (templateData.upperGridLayout !== undefined) updateData.upperGridLayout = templateData.upperGridLayout;
      if (templateData.status !== undefined) updateData.status = templateData.status;

      if (seats) {
        updateData.totalSeats = seats.length;
        // Delete existing seats and recreate
        await tx.seat.deleteMany({ where: { vehicleTemplateId: id } });
        await tx.seat.createMany({
          data: seats.map((seat, index) => ({
            vehicleTemplateId: id,
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
      }

      await tx.vehicleTemplate.update({
        where: { id },
        data: updateData,
      });

      return tx.vehicleTemplate.findUnique({
        where: { id },
        include: {
          vehicleType: { select: { id: true, name: true, icon: true } },
          seats: { orderBy: { order: "asc" } },
          _count: { select: { trips: true } },
        },
      });
    });

    const ip = getClientIp(req);
    auditLog({
      userId: authResult.user.id,
      action: "VEHICLE_TEMPLATE_UPDATED",
      entityType: "vehicleTemplate",
      entityId: id,
      metadata: { fieldsUpdated: Object.keys(validation.data) },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    logger.error("Vehicle template update error", error);
    return NextResponse.json(
      { success: false, error: "Failed to update vehicle template" },
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

    const existing = await prisma.vehicleTemplate.findUnique({
      where: { id },
      include: { _count: { select: { trips: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Vehicle template not found" },
        { status: 404 }
      );
    }

    if (existing._count.trips > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete template assigned to trips. Remove trip assignments first." },
        { status: 409 }
      );
    }

    await prisma.vehicleTemplate.delete({ where: { id } });

    const ip = getClientIp(req);
    auditLog({
      userId: authResult.user.id,
      action: "VEHICLE_TEMPLATE_DELETED",
      entityType: "vehicleTemplate",
      entityId: id,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, message: "Vehicle template deleted" });
  } catch (error) {
    logger.error("Vehicle template delete error", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete vehicle template" },
      { status: 500 }
    );
  }
}
