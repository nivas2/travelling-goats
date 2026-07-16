import { NextRequest, NextResponse } from "next/server";

/**
 * Same-origin image proxy. The app's CSP allows external images in `img-src`
 * but restricts `connect-src` to 'self', so client-side canvas capture
 * (html-to-image for tickets) can't fetch/inline cross-origin images. Routing
 * them through this endpoint makes them same-origin, so the capture succeeds
 * without tainting the canvas. Hosts are allow-listed to avoid SSRF.
 */
const ALLOWED_HOSTS = new Set([
  "images.unsplash.com",
  "res.cloudinary.com",
  "lh3.googleusercontent.com",
  "avatars.githubusercontent.com",
]);

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 400 });
  }

  try {
    const res = await fetch(parsed.toString(), {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "TravellingGoats/1.0 (image proxy)" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "fetch failed" }, { status: 502 });
    }
    const type = res.headers.get("content-type") || "image/jpeg";
    if (!type.startsWith("image/")) {
      return NextResponse.json({ error: "not an image" }, { status: 400 });
    }
    const buf = await res.arrayBuffer();
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "proxy error" }, { status: 502 });
  }
}
