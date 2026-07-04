"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TopNavBarProps {
  notificationCount?: number;
  userInitials?: string;
  avatarUrl?: string;
}

export function TopNavBar({
  notificationCount = 0,
  userInitials = "U",
  avatarUrl,
}: TopNavBarProps) {
  const [scrolled, setScrolled] = useState(false);

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
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Logo / App Name */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-title-lg font-bold tracking-tight text-primary">
            Meet
          </span>
          <span className="text-title-lg font-bold tracking-tight text-on-surface">
            MyRoute
          </span>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <Link
            href="/notifications"
            className={cn(
              "relative flex items-center justify-center",
              "h-10 w-10 rounded-full",
              "hover:bg-surface-container-high transition-colors duration-200"
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
              "hover:bg-primary-container/50 transition-colors duration-200",
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
