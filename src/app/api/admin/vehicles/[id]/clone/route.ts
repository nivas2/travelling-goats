import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger, getClientIp } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const logger = createLogger({ route: "admin-vehicles-clone" });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const rateLimitResponse = applyRateLimit("admin", authResult.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;

    const source = await prisma.vehicleTemplate.findUnique({
      where: { id },
      include: { seats: true },
    });

    if (!source) {
      return NextResponse.json(
        { success: false, error: "Vehicle template not found" },
        { status: 404 }
      );
    }

    // Deep clone in a transaction
    const cloned = await prisma.$transaction(async (tx) => {
      const newTemplate = await tx.vehicleTemplate.create({
        data: {
          vehicleTypeId: source.vehicleTypeId,
          name: `${source.name} (Copy)`,
          registrationNumber: null,
          totalSeats: source.totalSeats,
          totalRows: source.totalRows,
          totalColumns: source.totalColumns,
          hasUpperDeck: source.hasUpperDeck,
          upperDeckRows: source.upperDeckRows,
          upperDeckColumns: source.upperDeckColumns,
          amenities: source.amenities,
          gridLayout: source.gridLayout as object,
          upperGridLayout: source.upperGridLayout ? (source.upperGridLayout as object) : undefined,
        },
      });

      if (source.seats.length > 0) {
        await tx.seat.createMany({
          data: source.seats.map((seat) => ({
            vehicleTemplateId: newTemplate.id,
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
            order: seat.order,
          })),
        });
      }

      return tx.vehicleTemplate.findUnique({
        where: { id: newTemplate.id },
        include: {
          vehicleType: { select: { id: true, name: true, icon: true } },
          seats: { orderBy: { order: "asc" } },
        },
      });
    });

    const ip = getClientIp(req);
    auditLog({
      userId: authResult.user.id,
      action: "VEHICLE_TEMPLATE_CLONED",
      entityType: "vehicleTemplate",
      entityId: cloned!.id,
      metadata: { sourceId: id, sourceName: source.name },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, data: cloned }, { status: 201 });
  } catch (error) {
    logger.error("Vehicle template clone error", error);
    return NextResponse.json(
      { success: false, error: "Failed to clone vehicle template" },
      { status: 500 }
    );
  }
}
