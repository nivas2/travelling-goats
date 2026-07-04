"use client";

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
  { label: "My Trips", icon: "travel_explore", href: "/my-trips" },
  { label: "Saved", icon: "bookmark", href: "/saved" },
  { label: "Profile", icon: "person", href: "/profile" },
];

export function BottomNavBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === "/home";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50 md:hidden",
        "rounded-2xl bg-surface-container-lowest/90 backdrop-blur-xl shadow-nav",
        "border border-outline-variant/20"
      )}
    >
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 min-w-[64px] transition-all duration-200",
                active
                  ? "text-primary"
                  : "text-on-surface-variant/60 hover:text-on-surface-variant"
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center transition-all duration-200",
                  active
                    ? "bg-primary/12 rounded-xl px-4 py-1.5"
                    : "px-4 py-1.5"
                )}
              >
                <span
                  className={cn(
                    "material-symbols-outlined text-[22px]",
                    active && "filled"
                  )}
                >
                  {tab.icon}
                </span>
              </span>
              <span
                className={cn(
                  "text-[11px] leading-none",
                  active ? "font-semibold" : "font-normal"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
