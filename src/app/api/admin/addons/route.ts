import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { applyRateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const [addOns, snacks] = await Promise.all([
      prisma.globalAddOn.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.globalSnack.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    return NextResponse.json({ success: true, data: { addOns, snacks } });
  } catch (error) {
    console.error("Admin addons list error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch catalog" },
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

    if (type === "addon") {
      const item = await prisma.globalAddOn.create({
        data: {
          name: fields.name,
          description: fields.description ?? null,
          pricePaise: fields.pricePaise,
          icon: fields.icon ?? null,
          image: fields.image ?? null,
          maxQuantity: fields.maxQuantity ?? 1,
          isPopular: fields.isPopular ?? false,
        },
      });
      return NextResponse.json({ success: true, data: item }, { status: 201 });
    }

    if (type === "snack") {
      const item = await prisma.globalSnack.create({
        data: {
          name: fields.name,
          description: fields.description ?? null,
          pricePaise: fields.pricePaise,
          category: fields.category ?? null,
          icon: fields.icon ?? null,
          image: fields.image ?? null,
          isVeg: fields.isVeg ?? true,
        },
      });
      return NextResponse.json({ success: true, data: item }, { status: 201 });
    }

    return NextResponse.json(
      { success: false, error: "Invalid type. Use 'addon' or 'snack'." },
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
    console.error("Admin create addon error", error);
    return NextResponse.json(
      { success: false, error: "Failed to create item" },
      { status: 500 }
    );
  }
}
