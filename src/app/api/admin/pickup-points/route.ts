import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { applyRateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const [cities, points] = await Promise.all([
      prisma.pickupCity.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: {
          pickupPoints: {
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          },
        },
      }),
      prisma.pickupPoint.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: { city: true },
      }),
    ]);

    return NextResponse.json({ success: true, data: { cities, points } });
  } catch (error) {
    console.error("Admin pickup points list error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pickup points" },
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
    const { type, ...fields } = body;

    if (type === "city") {
      const item = await prisma.pickupCity.create({
        data: {
          name: fields.name,
          state: fields.state ?? null,
          icon: fields.icon ?? null,
          order: fields.order ?? 0,
        },
      });
      return NextResponse.json({ success: true, data: item }, { status: 201 });
    }

    if (type === "point") {
      const item = await prisma.pickupPoint.create({
        data: {
          cityId: fields.cityId,
          name: fields.name,
          address: fields.address,
          icon: fields.icon ?? null,
          landmark: fields.landmark ?? null,
          order: fields.order ?? 0,
        },
        include: { city: true },
      });
      return NextResponse.json({ success: true, data: item }, { status: 201 });
    }

    return NextResponse.json(
      { success: false, error: "Invalid type. Use 'city' or 'point'." },
      { status: 400 }
    );
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { success: false, error: "An item with this name already exists" },
        { status: 409 }
      );
    }
    console.error("Admin create pickup point error", error);
    return NextResponse.json(
      { success: false, error: "Failed to create item" },
      { status: 500 }
    );
  }
}
