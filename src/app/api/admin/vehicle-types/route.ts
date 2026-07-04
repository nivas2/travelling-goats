import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger, getClientIp } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";
import { validateBody } from "@/lib/validate";
import { createVehicleTypeSchema } from "@/lib/validations/vehicle";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const logger = createLogger({ route: "admin-vehicle-types" });

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const rateLimitResponse = applyRateLimit("admin", authResult.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const vehicleTypes = await prisma.vehicleType.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: { select: { templates: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: vehicleTypes });
  } catch (error) {
    logger.error("Vehicle types fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vehicle types" },
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
    const validation = validateBody(createVehicleTypeSchema, body);
    if (!validation.success) return validation.response;

    const { name, icon, description } = validation.data;

    // Check for duplicate name
    const existing = await prisma.vehicleType.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Vehicle type with this name already exists" },
        { status: 409 }
      );
    }

    const vehicleType = await prisma.vehicleType.create({
      data: { name, icon, description },
    });

    const ip = getClientIp(req);
    auditLog({
      userId: authResult.user.id,
      action: "VEHICLE_TYPE_CREATED",
      entityType: "vehicleType",
      entityId: vehicleType.id,
      metadata: { name },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, data: vehicleType }, { status: 201 });
  } catch (error) {
    logger.error("Vehicle type creation error", error);
    return NextResponse.json(
      { success: false, error: "Failed to create vehicle type" },
      { status: 500 }
    );
  }
}
