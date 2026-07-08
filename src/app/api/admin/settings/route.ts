import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger, getClientIp } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { invalidateSettingsCache } from "@/lib/settings";

const logger = createLogger({ route: "admin-settings" });

const SECRET_KEYS = ["razorpay_key_secret"];
const MASK = "••••••••";

// ---------------------------------------------------------------------------
// GET — List all settings (mask secrets)
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const settings = await prisma.appSetting.findMany({
      orderBy: [{ group: "asc" }, { key: "asc" }],
    });

    const masked = settings.map((s) => ({
      ...s,
      value: SECRET_KEYS.includes(s.key) && s.value ? MASK : s.value,
    }));

    return NextResponse.json({ success: true, data: masked });
  } catch (error) {
    logger.error("Settings fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT — Bulk upsert settings
// ---------------------------------------------------------------------------

interface SettingInput {
  key: string;
  value: string;
  group?: string;
  label?: string;
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const rateLimitResponse = applyRateLimit("admin", authResult.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const settings: SettingInput[] = body.settings;

    if (!Array.isArray(settings) || settings.length === 0) {
      return NextResponse.json(
        { success: false, error: "settings array is required" },
        { status: 400 }
      );
    }

    const updates: SettingInput[] = [];
    for (const s of settings) {
      if (!s.key || typeof s.key !== "string") continue;
      // Skip masked secrets — user didn't change them
      if (SECRET_KEYS.includes(s.key) && s.value === MASK) continue;
      if (typeof s.value !== "string") continue;
      updates.push(s);
    }

    // Upsert each setting
    await prisma.$transaction(
      updates.map((s) =>
        prisma.appSetting.upsert({
          where: { key: s.key },
          update: {
            value: s.value,
            ...(s.group && { group: s.group }),
            ...(s.label && { label: s.label }),
          },
          create: {
            key: s.key,
            value: s.value,
            group: s.group ?? "general",
            label: s.label ?? null,
          },
        })
      )
    );

    invalidateSettingsCache();

    auditLog({
      userId: authResult.user.id,
      action: "SETTINGS_UPDATED",
      entityType: "settings",
      entityId: "bulk",
      metadata: { keys: updates.map((s) => s.key) },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Settings update error", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
