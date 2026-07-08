import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { applyRateLimit } from "@/lib/rate-limit";

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

    // Try as PickupCity first
    const city = await prisma.pickupCity.findUnique({ where: { id } });
    if (city) {
      const updated = await prisma.pickupCity.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.state !== undefined && { state: body.state }),
          ...(body.icon !== undefined && { icon: body.icon }),
          ...(body.order !== undefined && { order: body.order }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // Try as PickupPoint
    const point = await prisma.pickupPoint.findUnique({ where: { id } });
    if (point) {
      const updated = await prisma.pickupPoint.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.address !== undefined && { address: body.address }),
          ...(body.icon !== undefined && { icon: body.icon }),
          ...(body.landmark !== undefined && { landmark: body.landmark }),
          ...(body.cityId !== undefined && { cityId: body.cityId }),
          ...(body.order !== undefined && { order: body.order }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
        },
        include: { city: true },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json(
      { success: false, error: "Item not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Admin update pickup point error", error);
    return NextResponse.json(
      { success: false, error: "Failed to update item" },
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

    // Try as PickupCity
    const city = await prisma.pickupCity.findUnique({ where: { id } });
    if (city) {
      // Check if any trip references points in this city
      const tripRefs = await prisma.tripPickupPoint.count({
        where: { pickupPoint: { cityId: id } },
      });
      if (tripRefs > 0) {
        await prisma.pickupCity.update({ where: { id }, data: { isActive: false } });
        return NextResponse.json({
          success: true,
          data: { id, deactivated: true },
          message: "City has trip references — deactivated instead of deleted",
        });
      }
      await prisma.pickupCity.delete({ where: { id } });
      return NextResponse.json({ success: true, data: { id } });
    }

    // Try as PickupPoint
    const point = await prisma.pickupPoint.findUnique({ where: { id } });
    if (point) {
      const tripRefs = await prisma.tripPickupPoint.count({
        where: { pickupPointId: id },
      });
      if (tripRefs > 0) {
        await prisma.pickupPoint.update({ where: { id }, data: { isActive: false } });
        return NextResponse.json({
          success: true,
          data: { id, deactivated: true },
          message: "Point has trip references — deactivated instead of deleted",
        });
      }
      await prisma.pickupPoint.delete({ where: { id } });
      return NextResponse.json({ success: true, data: { id } });
    }

    return NextResponse.json(
      { success: false, error: "Item not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Admin delete pickup point error", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
