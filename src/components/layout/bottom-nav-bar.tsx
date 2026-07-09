"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavTab {
  label: string;
  icon: string;
  href: string;
}

const tabs: NavTab[] = [
  { label: "Explore", icon: "home", href: "/" },
  { label: "My Trails", icon: "travel_explore", href: "/my-trips" },
  { label: "Wishlist", icon: "favorite", href: "/saved" },
  { label: "Profile", icon: "person", href: "/profile" },
];

export function BottomNavBar() {
  const pathname = usePathname();

  // Hide the bar while the user is actively scrolling; reveal it once scrolling
  // stops (idle). Hooks run before any early return (rules of hooks).
  const [scrolling, setScrolling] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const onScroll = () => {
      setScrolling(true);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setScrolling(false), 250);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  // Hide on trip detail pages (they have their own fixed bottom bar)
  const isTripDetail = /^\/trips\/[^/]+$/.test(pathname);
  if (isTripDetail) return null;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === "/home";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        "app-bottom-nav fixed left-4 right-4 z-50 md:hidden",
        "bottom-[max(1rem,env(safe-area-inset-bottom))]",
        "transition-all duration-300 ease-out",
        scrolling
          ? "pointer-events-none translate-y-[180%] opacity-0"
          : "translate-y-0 opacity-100"
      )}
    >
      {/* Floating dark liquid-glass pill with a lime-highlighted active tab */}
      <div className="glass-dark mx-auto flex max-w-sm items-center justify-around rounded-full px-2 py-2">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              className={cn(
                "flex h-12 items-center justify-center gap-1.5 rounded-full transition-all duration-300",
                active ? "bg-[#C6F135] px-5" : "w-12 text-white/80 hover:text-white"
              )}
            >
              <span
                className={cn(
                  "material-symbols-outlined text-[24px]",
                  active && "filled text-[#181D27]"
                )}
              >
                {tab.icon}
              </span>
              {active && (
                <span className="text-[13px] font-bold text-[#181D27]">{tab.label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
