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

    // Try updating as GlobalAddOn first
    const addOn = await prisma.globalAddOn.findUnique({ where: { id } });
    if (addOn) {
      const updated = await prisma.globalAddOn.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.pricePaise !== undefined && { pricePaise: body.pricePaise }),
          ...(body.icon !== undefined && { icon: body.icon }),
          ...(body.image !== undefined && { image: body.image }),
          ...(body.maxQuantity !== undefined && { maxQuantity: body.maxQuantity }),
          ...(body.isPopular !== undefined && { isPopular: body.isPopular }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // Try as GlobalSnack
    const snack = await prisma.globalSnack.findUnique({ where: { id } });
    if (snack) {
      const updated = await prisma.globalSnack.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.pricePaise !== undefined && { pricePaise: body.pricePaise }),
          ...(body.category !== undefined && { category: body.category }),
          ...(body.icon !== undefined && { icon: body.icon }),
          ...(body.image !== undefined && { image: body.image }),
          ...(body.isVeg !== undefined && { isVeg: body.isVeg }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json(
      { success: false, error: "Item not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Admin update addon error", error);
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

    // Try as GlobalAddOn
    const addOn = await prisma.globalAddOn.findUnique({ where: { id } });
    if (addOn) {
      const bookingCount = await prisma.bookingAddOn.count({ where: { addOnId: id } });
      if (bookingCount > 0) {
        await prisma.globalAddOn.update({ where: { id }, data: { isActive: false } });
        return NextResponse.json({
          success: true,
          data: { id, deactivated: true },
          message: "Item has bookings — deactivated instead of deleted",
        });
      }
      await prisma.globalAddOn.delete({ where: { id } });
      return NextResponse.json({ success: true, data: { id } });
    }

    // Try as GlobalSnack
    const snack = await prisma.globalSnack.findUnique({ where: { id } });
    if (snack) {
      const bookingCount = await prisma.bookingSnack.count({ where: { snackId: id } });
      if (bookingCount > 0) {
        await prisma.globalSnack.update({ where: { id }, data: { isActive: false } });
        return NextResponse.json({
          success: true,
          data: { id, deactivated: true },
          message: "Item has bookings — deactivated instead of deleted",
        });
      }
      await prisma.globalSnack.delete({ where: { id } });
      return NextResponse.json({ success: true, data: { id } });
    }

    return NextResponse.json(
      { success: false, error: "Item not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Admin delete addon error", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
