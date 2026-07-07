import { NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";
import { getContentMap } from "@/lib/content/server";

const logger = createLogger({ route: "content" });

// Public: effective site content (active blocks only), for client pages.
export async function GET() {
  try {
    const data = await getContentMap(false);
    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    logger.error("Content fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}
