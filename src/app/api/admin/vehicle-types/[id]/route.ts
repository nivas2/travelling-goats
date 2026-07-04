import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger, getClientIp } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";
import { validateBody } from "@/lib/validate";
import { updateVehicleTypeSchema } from "@/lib/validations/vehicle";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const logger = createLogger({ route: "admin-vehicle-types-id" });

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
    const validation = validateBody(updateVehicleTypeSchema, body);
    if (!validation.success) return validation.response;

    const existing = await prisma.vehicleType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Vehicle type not found" },
        { status: 404 }
      );
    }

    // Check name uniqueness if changing name
    if (validation.data.name && validation.data.name !== existing.name) {
      const duplicate = await prisma.vehicleType.findUnique({
        where: { name: validation.data.name },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: "Vehicle type with this name already exists" },
          { status: 409 }
        );
      }
    }

    const vehicleType = await prisma.vehicleType.update({
      where: { id },
      data: validation.data,
    });

    const ip = getClientIp(req);
    auditLog({
      userId: authResult.user.id,
      action: "VEHICLE_TYPE_UPDATED",
      entityType: "vehicleType",
      entityId: id,
      metadata: validation.data,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, data: vehicleType });
  } catch (error) {
    logger.error("Vehicle type update error", error);
    return NextResponse.json(
      { success: false, error: "Failed to update vehicle type" },
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

    const existing = await prisma.vehicleType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            templates: { where: { status: "ACTIVE" } },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Vehicle type not found" },
        { status: 404 }
      );
    }

    if (existing._count.templates > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete vehicle type with active templates. Deactivate templates first." },
        { status: 409 }
      );
    }

    // Soft-delete
    await prisma.vehicleType.update({
      where: { id },
      data: { isActive: false },
    });

    const ip = getClientIp(req);
    auditLog({
      userId: authResult.user.id,
      action: "VEHICLE_TYPE_DELETED",
      entityType: "vehicleType",
      entityId: id,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, message: "Vehicle type deactivated" });
  } catch (error) {
    logger.error("Vehicle type delete error", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete vehicle type" },
      { status: 500 }
    );
  }
}
