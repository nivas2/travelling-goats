import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ route: "music-search" });

// Proxy the free iTunes Search API (no key, server-side to avoid CORS).
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    if (!q) {
      return NextResponse.json({ success: true, data: [] });
    }

    const url =
      "https://itunes.apple.com/search?" +
      new URLSearchParams({
        term: q,
        media: "music",
        entity: "song",
        limit: "15",
      }).toString();

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`iTunes responded ${res.status}`);
    const json = (await res.json()) as { results?: Record<string, unknown>[] };

    const data = (json.results ?? []).map((r) => ({
      externalId: String(r.trackId ?? ""),
      title: String(r.trackName ?? "Unknown"),
      artist: String(r.artistName ?? "Unknown"),
      // Bump artwork to a larger size.
      artworkUrl: String(r.artworkUrl100 ?? "").replace("100x100", "200x200") || null,
      previewUrl: (r.previewUrl as string) ?? null,
      sourceUrl: (r.trackViewUrl as string) ?? null,
    }));

    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "public, s-maxage=300" } }
    );
  } catch (error) {
    logger.error("Music search error", error);
    return NextResponse.json(
      { success: false, error: "Failed to search songs" },
      { status: 502 }
    );
  }
}
