import { NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";
import { getActiveFaqs } from "@/lib/content/server";

const logger = createLogger({ route: "faqs" });

// Public: active FAQs for the landing page.
export async function GET() {
  try {
    const faqs = await getActiveFaqs();
    return NextResponse.json(
      { success: true, data: faqs },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    logger.error("FAQ fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch FAQs" },
      { status: 500 }
    );
  }
}
