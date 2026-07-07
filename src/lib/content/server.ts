import prisma from "@/lib/prisma";
import {
  defaultContentMap,
  getBlockDef,
  type ContentMap,
  type ContentValue,
} from "./registry";

/**
 * Effective content map = registry defaults overlaid with any customised
 * blocks stored in the DB. `includeInactive` is used by the admin editor so it
 * can load/edit blocks that are toggled off; public reads leave it false.
 */
export async function getContentMap(includeInactive = false): Promise<ContentMap> {
  const map = defaultContentMap();
  try {
    const rows = await prisma.cmsContent.findMany(
      includeInactive ? undefined : { where: { isActive: true } }
    );
    for (const row of rows) {
      if (!getBlockDef(row.key)) continue; // ignore unknown/legacy keys
      try {
        map[row.key] = JSON.parse(row.content) as ContentValue;
      } catch {
        // Malformed JSON in DB — keep the default rather than crash the page.
      }
    }
  } catch {
    // DB unreachable — public pages still render with defaults.
  }
  return map;
}

/** Featured customer reviews to surface as testimonials on the landing page. */
export async function getFeaturedTestimonials(limit = 3) {
  try {
    return await prisma.review.findMany({
      where: { isFeatured: true, comment: { not: null } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        comment: true,
        overallRating: true,
        user: { select: { name: true } },
        trip: { select: { title: true } },
      },
    });
  } catch {
    return [];
  }
}

/** Active FAQs for the public landing page, ordered. */
export async function getActiveFaqs() {
  try {
    return await prisma.faq.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { question: "asc" }],
      select: { id: true, question: true, answer: true, category: true },
    });
  } catch {
    return [];
  }
}
