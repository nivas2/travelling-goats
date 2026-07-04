import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicPaths = [
  "/login",
  "/otp",
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

const adminPaths = ["/admin"];

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

  // Check auth for protected routes
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin access
  if (adminPaths.some((p) => pathname.startsWith(p))) {
    const user = req.auth.user as Record<string, unknown>;
    if (user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/home", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json).*)"],
};
