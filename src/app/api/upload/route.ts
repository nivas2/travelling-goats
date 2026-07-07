import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { applyRateLimit } from "@/lib/rate-limit";

const logger = createLogger({ route: "upload" });

// Upload constraints (kept in sync with the ImageUpload component hints).
export const UPLOAD_LIMITS = {
  types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as Record<string, string>,
  maxBytes: 5 * 1024 * 1024, // 5 MB
  minWidth: 400,
  minHeight: 300,
  maxWidth: 6000,
  maxHeight: 6000,
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const rl = applyRateLimit("api", session.user.id);
    if (rl) return rl;

    const form = await req.formData();
    const file = form.get("image");
    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
    }
    const f = file as File;

    const ext = UPLOAD_LIMITS.types[f.type];
    if (!ext) {
      return NextResponse.json(
        { success: false, error: "Unsupported file type. Use JPG, PNG, or WebP." },
        { status: 400 }
      );
    }
    if (f.size > UPLOAD_LIMITS.maxBytes) {
      return NextResponse.json(
        { success: false, error: `File too large. Max ${UPLOAD_LIMITS.maxBytes / (1024 * 1024)} MB.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await f.arrayBuffer());

    // Read real dimensions (also validates it's a genuine image).
    let meta;
    try {
      meta = await sharp(buffer).metadata();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid or corrupt image" }, { status: 400 });
    }
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (
      width < UPLOAD_LIMITS.minWidth ||
      height < UPLOAD_LIMITS.minHeight ||
      width > UPLOAD_LIMITS.maxWidth ||
      height > UPLOAD_LIMITS.maxHeight
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Image must be between ${UPLOAD_LIMITS.minWidth}×${UPLOAD_LIMITS.minHeight} and ${UPLOAD_LIMITS.maxWidth}×${UPLOAD_LIMITS.maxHeight}px (got ${width}×${height}).`,
        },
        { status: 400 }
      );
    }

    const filename = `${randomUUID()}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);

    return NextResponse.json({
      success: true,
      data: { url: `/uploads/${filename}`, width, height, sizeBytes: f.size },
    });
  } catch (error) {
    logger.error("Upload error", error);
    return NextResponse.json({ success: false, error: "Failed to upload image" }, { status: 500 });
  }
}
