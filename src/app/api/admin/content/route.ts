import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";
import { getBlockDef } from "@/lib/content/registry";
import { getContentMap } from "@/lib/content/server";

const logger = createLogger({ route: "admin-content" });

// Effective content map (defaults overlaid with DB), including inactive blocks
// so the admin editor can load everything.
export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const data = await getContentMap(true);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error("Admin content fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

// Upsert one content block by key.
export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const body = await req.json();
    const key: string = body?.key;
    const value = body?.content;

    const def = getBlockDef(key);
    if (!def) {
      return NextResponse.json(
        { success: false, error: "Unknown content block" },
        { status: 400 }
      );
    }

    // Shape check: list blocks must be arrays, single blocks must be objects.
    const isArray = Array.isArray(value);
    if (def.kind === "list" && !isArray) {
      return NextResponse.json(
        { success: false, error: "Expected a list of items" },
        { status: 400 }
      );
    }
    if (def.kind === "single" && (isArray || typeof value !== "object" || value === null)) {
      return NextResponse.json(
        { success: false, error: "Expected an object" },
        { status: 400 }
      );
    }

    const serialized = JSON.stringify(value);

    const saved = await prisma.cmsContent.upsert({
      where: { key },
      create: { key, title: def.label, content: serialized, type: "block", isActive: true },
      update: { title: def.label, content: serialized },
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    logger.error("Admin content update error", error);
    return NextResponse.json(
      { success: false, error: "Failed to save content" },
      { status: 500 }
    );
  }
}
