import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicPaths = [
  "/login",
  "/otp",
  "/admin/login",
  "/api/auth",
  "/api/otp",
  "/api/trips",
  "/api/health",
  "/_next",
  "/favicon.ico",
  "/manifest.json",
  "/icons",
  "/sw.js",
];

// Paths that require auth but are not admin - seat APIs are under /api/trips which is already public for GET
// POST/DELETE to /api/trips/.../seats/reserve requires auth and is handled by the route itself

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow the root page
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Admin routes — separate login flow
  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      return NextResponse.redirect(new URL("/admin/login", req.nextUrl.origin));
    }
    const user = req.auth.user as Record<string, unknown>;
    if (user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/home", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  // Check auth for protected routes
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json).*)"],
};
