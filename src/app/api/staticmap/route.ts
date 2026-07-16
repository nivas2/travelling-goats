import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

/**
 * Static map image proxy. The browser CSP only allows same-origin images, so we
 * build the map server-side and stream it back. We fetch keyless raster tiles
 * (Esri World Street Map, OSM fallback) and stitch the ones around the point
 * into a single image centred on it, using sharp. Used by the trip detail
 * "Weather & location" module. On any failure we return 502 and the client
 * falls back to a styled placeholder with an "Open in Maps" link.
 */

const TILE = 256;

function projectToTile(lat: number, lng: number, z: number) {
  const n = 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y }; // fractional tile coordinates
}

function tileUrls(z: number, x: number, y: number): string[] {
  return [
    // Esri World Topo — terrain/shaded-relief base (keyless) — path is /z/row(y)/col(x)
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`,
    // OpenTopoMap — terrain fallback (PNG) — path is /z/x/y
    `https://a.tile.opentopomap.org/${z}/${x}/${y}.png`,
    // OpenStreetMap standard tiles — last-resort fallback
    `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
  ];
}

async function fetchTile(z: number, x: number, y: number): Promise<Buffer | null> {
  for (const url of tileUrls(z, x, y)) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(7000),
        headers: {
          "User-Agent":
            "TravellingGoats/1.0 (trip map preview; contact@travellinggoats.app)",
          Referer: "https://travellinggoats.app",
        },
      });
      if (!res.ok) continue;
      const type = res.headers.get("content-type") || "";
      if (!type.startsWith("image/")) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength < 500) continue;
      return buf;
    } catch {
      /* try next source */
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const z = Math.min(18, Math.max(1, parseInt(searchParams.get("zoom") ?? "10", 10)));
  const w = Math.min(1024, Math.max(64, parseInt(searchParams.get("w") ?? "640", 10)));
  const h = Math.min(1024, Math.max(64, parseInt(searchParams.get("h") ?? "320", 10)));

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  try {
    const n = 2 ** z;
    const { x: fx, y: fy } = projectToTile(lat, lng, z);
    // Centre pixel in global pixel space, and the target window around it.
    const cx = fx * TILE;
    const cy = fy * TILE;
    const left = cx - w / 2;
    const top = cy - h / 2;

    const minTx = Math.floor(left / TILE);
    const maxTx = Math.floor((left + w - 1) / TILE);
    const minTy = Math.floor(top / TILE);
    const maxTy = Math.floor((top + h - 1) / TILE);

    const jobs: { tx: number; ty: number; dx: number; dy: number }[] = [];
    for (let tx = minTx; tx <= maxTx; tx++) {
      for (let ty = minTy; ty <= maxTy; ty++) {
        // Wrap x, clamp y (poles). Skip out-of-range y tiles.
        const wx = ((tx % n) + n) % n;
        if (ty < 0 || ty >= n) continue;
        jobs.push({ tx: wx, ty, dx: (tx - minTx) * TILE, dy: (ty - minTy) * TILE });
      }
    }

    const tiles = await Promise.all(jobs.map((j) => fetchTile(z, j.tx, j.ty)));
    const composites = tiles
      .map((buf, i) => (buf ? { input: buf, left: jobs[i].dx, top: jobs[i].dy } : null))
      .filter((c): c is { input: Buffer; left: number; top: number } => c !== null);

    if (composites.length === 0) {
      return NextResponse.json({ error: "map unavailable" }, { status: 502 });
    }

    const canvasW = (maxTx - minTx + 1) * TILE;
    const canvasH = (maxTy - minTy + 1) * TILE;
    const cropX = Math.round(left - minTx * TILE);
    const cropY = Math.round(top - minTy * TILE);

    const out = await sharp({
      create: {
        width: canvasW,
        height: canvasH,
        channels: 3,
        background: { r: 231, g: 237, b: 226 },
      },
    })
      .composite(composites)
      .extract({
        left: Math.max(0, Math.min(cropX, canvasW - w)),
        top: Math.max(0, Math.min(cropY, canvasH - h)),
        width: w,
        height: h,
      })
      .png()
      .toBuffer();

    return new NextResponse(new Uint8Array(out), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "map unavailable" }, { status: 502 });
  }
}
