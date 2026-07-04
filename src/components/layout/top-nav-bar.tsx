"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { TravellingGoatsLogo } from "@/components/ui/travelling-goats-logo";

interface TopNavBarProps {
  notificationCount?: number;
  userInitials?: string;
  avatarUrl?: string;
}

// Desktop navigation links (mirror the mobile bottom nav, which is hidden on md+)
const NAV_LINKS = [
  { label: "Explore", href: "/" },
  { label: "My Trails", href: "/my-trips" },
  { label: "Saved", href: "/saved" },
  { label: "Profile", href: "/profile" },
];

export function TopNavBar({
  notificationCount = 0,
  userInitials = "U",
  avatarUrl,
}: TopNavBarProps) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Hide on trip detail pages (they have their own back/share/wishlist)
  const isTripDetail = /^\/trips\/[^/]+$/.test(pathname);
  if (isTripDetail) return null;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === "/home";
    return pathname.startsWith(href);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "bg-surface/95 backdrop-blur-md shadow-sm border-b border-outline-variant/10"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3 md:px-6">
        {/* Logo / App Name */}
        <Link href="/" className="flex items-center">
          <TravellingGoatsLogo size="sm" />
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
