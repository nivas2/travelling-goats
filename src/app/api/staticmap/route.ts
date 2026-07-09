import { NextRequest, NextResponse } from "next/server";

/**
 * Static map image proxy. The browser CSP only allows same-origin images, so we
 * fetch an OpenStreetMap static render server-side and stream it back. Used by
 * the trip detail "Location" module. On any failure we return 502 and the client
 * falls back to a styled placeholder with an "Open in Maps" link.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const zoom = searchParams.get("zoom") || "10";
  const w = searchParams.get("w") || "640";
  const h = searchParams.get("h") || "320";
  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  // Candidate keyless static-map renderers, tried in order. Wikimedia has no
  // marker param (we overlay a pin in the UI); the community OSM renderer does.
  const candidates = [
    `https://maps.wikimedia.org/img/osm-intl,${zoom},${lat},${lng},${w}x${h}.png`,
    `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${w}x${h}&maptype=mapnik&markers=${lat},${lng},lightgreen`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(7000),
        headers: {
          "User-Agent": "TravellingGoats/1.0 (trip map preview; contact@travellinggoats.app)",
          Referer: "https://travellinggoats.app",
        },
      });
      if (!res.ok) continue;
      const type = res.headers.get("content-type") || "image/png";
      if (!type.startsWith("image/")) continue;
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 500) continue; // guard against error placeholders
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": type,
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    } catch {
      /* try next candidate */
    }
  }
  return NextResponse.json({ error: "map unavailable" }, { status: 502 });
}
