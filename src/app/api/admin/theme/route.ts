import { NextRequest, NextResponse } from "next/server";
import { createLogger, getClientIp } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";
import { auditLog } from "@/lib/audit";
import { getThemeValues, saveThemeValues } from "@/lib/theme/server";
import { defaultThemeValues, THEME_TOKENS } from "@/lib/theme/registry";

const logger = createLogger({ route: "admin-theme" });

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;
    const values = await getThemeValues();
    return NextResponse.json({ success: true, data: values });
  } catch (error) {
    logger.error("Theme fetch error", error);
    return NextResponse.json({ success: false, error: "Failed to load theme" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const body = await req.json();
    const incoming = (body?.values ?? {}) as Record<string, unknown>;

    // Only accept known token keys; coerce to strings.
    const known = new Set(THEME_TOKENS.map((t) => t.key));
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(incoming)) {
      if (known.has(k) && typeof v === "string") clean[k] = v;
    }

    // Merge over defaults so a full, valid set is always stored.
    const values = { ...defaultThemeValues(), ...clean };
    await saveThemeValues(values);

    auditLog({
      userId: authResult.user.id,
      action: "THEME_UPDATED",
      entityType: "theme",
      entityId: "theme.tokens",
      metadata: { keys: Object.keys(clean) },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, data: values });
  } catch (error) {
    logger.error("Theme save error", error);
    return NextResponse.json({ success: false, error: "Failed to save theme" }, { status: 500 });
  }
}
