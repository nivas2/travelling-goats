import { NextRequest, NextResponse } from "next/server";

/**
 * Reverse-geocode lat/lng → city, server-side (the browser CSP blocks external
 * calls, but the server isn't subject to connect-src). Used by the top-nav
 * "Current location" to show the user's real device location.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
        lat
      )}&longitude=${encodeURIComponent(lng)}&localityLanguage=en`,
      { cache: "no-store", signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return NextResponse.json({ city: null });
    const d = await res.json();
    const city = d.city || d.locality || d.principalSubdivision || null;
    return NextResponse.json({ city, country: d.countryName ?? null });
  } catch {
    return NextResponse.json({ city: null });
  }
}
