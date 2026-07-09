"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn, getInitials } from "@/lib/utils";
import { BrandMark } from "@/components/ui/brand-mark";

interface TopNavBarProps {
  notificationCount?: number;
  userInitials?: string;
  avatarUrl?: string;
}

// Desktop navigation links (mirror the mobile bottom nav, which is hidden on md+)
const NAV_LINKS = [
  { label: "Explore", href: "/" },
  { label: "My Trails", href: "/my-trips" },
  { label: "Wishlist", href: "/saved" },
  { label: "Profile", href: "/profile" },
];

export function TopNavBar({
  notificationCount = 0,
  userInitials: userInitialsProp,
  avatarUrl: avatarUrlProp,
}: TopNavBarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const pathname = usePathname();
  const { data: session } = useSession();

  // Prefer session data over props for avatar
  const userName = session?.user?.name;
  const userInitials = userInitialsProp ?? (userName ? getInitials(userName) : "U");
  const avatarUrl = avatarUrlProp ?? session?.user?.image ?? undefined;

  // All hooks must run unconditionally before any early return (rules of hooks).
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Current location = the real device location (Geolocation → reverse-geocoded).
  // Deliberately independent of the opted departure city (tg_selected_city) — this
  // label reflects where the user actually is, not where their trip starts.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const r = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`);
          const d = await r.json();
          if (d?.city) setCity(d.city);
        } catch {
          /* leave as "India" */
        }
      },
      () => {
        /* permission denied — leave as "India" */
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  }, []);

  // Hide on trip detail pages (they have their own back/share/wishlist)
  const isTripDetail = /^\/trips\/[^/]+$/.test(pathname);
  if (isTripDetail) return null;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === "/home";
    return pathname.startsWith(href);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "bg-surface/95 backdrop-blur-md shadow-sm border-b border-outline-variant/10"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 pb-3 pt-[max(1.75rem,env(safe-area-inset-top))] md:px-6 md:pt-3">
        {/* Desktop: logo. Mobile: current location (logo hidden). */}
        <Link href="/" className="hidden items-center md:flex">
          <BrandMark size="sm" />
        </Link>
        <Link href="/search" className="flex items-center gap-1.5 md:hidden" aria-label="Current location">
          <span
            className="material-symbols-outlined text-[22px] text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            location_on
          </span>
          <span className="leading-tight">
            <span className="block text-[11px] font-medium text-on-surface-variant">Current location</span>
            <span className="flex items-center gap-0.5 text-[15px] font-semibold text-on-surface">
              {city || "India"}
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant/70">
                keyboard_arrow_down
              </span>
            </span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex md:items-center md:gap-1">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-label-lg font-semibold transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high/70 hover:text-on-surface"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <Link
            href="/notifications"
            className={cn(
              "relative flex items-center justify-center",
              "h-10 w-10 rounded-full",
              "hover:bg-surface-container-high/80 active:scale-95",
              "transition-all duration-200"
            )}
          >
            <span className="material-symbols-outlined text-[22px] text-on-surface-variant">
              notifications
            </span>
            {notificationCount > 0 && (
              <span
                className={cn(
                  "absolute top-1 right-1",
                  "flex items-center justify-center",
                  "min-w-[18px] h-[18px] px-1 rounded-full",
                  "bg-primary text-on-primary",
                  "text-[10px] font-bold leading-none"
                )}
              >
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </Link>

          {/* User Avatar */}
          <Link
            href="/profile"
            className={cn(
              "flex items-center justify-center",
              "h-9 w-9 rounded-full",
              "bg-primary-container/30 text-primary",
              "text-label-sm font-semibold",
              "hover:bg-primary-container/50 hover:scale-105",
              "transition-all duration-200",
              "overflow-hidden"
            )}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="User avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{userInitials}</span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
