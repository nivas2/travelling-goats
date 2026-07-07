"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, getInitials } from "@/lib/utils";
import type { UserProfile } from "@/types";

// ---------------------------------------------------------------------------
// Menu items
// ---------------------------------------------------------------------------

interface MenuItem {
  icon: string;
  label: string;
  href?: string;
  onClick?: () => void;
  destructive?: boolean;
  chevron?: boolean;
}

// Reward tier → badge display (matches the Rewards page tiers).
const TIER_BADGES: Record<string, { label: string; icon: string; className: string }> = {
  EXPLORER: { label: "Explorer", icon: "hiking", className: "bg-surface-container-high text-on-surface-variant" },
  ADVENTURER: { label: "Adventurer", icon: "landscape", className: "bg-secondary/15 text-secondary" },
  VOYAGER: { label: "Voyager", icon: "flight_takeoff", className: "bg-tertiary/15 text-tertiary" },
  LEGEND: { label: "Legend", icon: "diamond", className: "bg-primary/15 text-primary" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/users");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to load profile");
      const json = await res.json();
      setUser(json.data ?? json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const isCaptain =
    (user as { role?: string } | null)?.role === "TRIP_CAPTAIN" ||
    (user as { role?: string } | null)?.role === "ADMIN";

  const MENU_ITEMS: MenuItem[] = [
    ...(isCaptain
      ? [{ icon: "hiking", label: "Captain Dashboard", href: "/captain", chevron: true }]
      : []),
    { icon: "edit", label: "Edit Profile", href: "/profile/edit", chevron: true },
    { icon: "account_balance_wallet", label: "Wallet", href: "/wallet", chevron: true },
    { icon: "stars", label: "Rewards", href: "/rewards", chevron: true },
    { icon: "group_add", label: "Referral", href: "/referral", chevron: true },
    { icon: "settings", label: "Settings", href: "/profile/settings", chevron: true },
    { icon: "help", label: "Help & Support", href: "/help", chevron: true },
    { icon: "info", label: "About Travelling Goats", href: "/about", chevron: true },
    {
      icon: "logout",
      label: "Logout",
      onClick: handleLogout,
      destructive: true,
    },
  ];

  // -- Loading ---------------------------------------------------------------

  if (loading) {
    return (
      <div className="px-5 py-6 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Skeleton variant="circular" diameter={80} />
          <Skeleton variant="text" width={160} />
          <Skeleton variant="text" width={120} />
        </div>
        <Skeleton variant="card" height={80} />
        <Skeleton variant="card" height={300} />
      </div>
    );
  }

  // -- Error -----------------------------------------------------------------

  if (error) {
    return (
      <div className="px-5 py-6">
        <EmptyState
          icon="error"
          title="Could not load profile"
          description={error}
          action={{ label: "Retry", onClick: fetchUser }}
        />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="px-5 py-6 space-y-6">
      {/* -------- Avatar & Info -------- */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <Avatar src={user.avatar} name={user.name ?? "U"} size="xl" />
          <button
            type="button"
            onClick={() => router.push("/profile/edit")}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary shadow-elevated"
          >
            <Icon name="edit" size={16} />
          </button>
        </div>

        <h1 className="mt-3 text-headline-md font-headline-md text-on-surface">
          {user.name ?? "Travelling Goats Explorer"}
        </h1>

        {/* Current reward tier badge */}
        {(() => {
          const tier =
            TIER_BADGES[(user.rewardTier ?? "EXPLORER").toUpperCase()] ?? TIER_BADGES.EXPLORER;
          return (
            <button
              type="button"
              onClick={() => router.push("/rewards")}
              className={cn(
                "mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label-md font-semibold transition-transform active:scale-95",
                tier.className
              )}
            >
              <Icon name={tier.icon} size={16} filled />
              {tier.label}
              <span className="opacity-70">· {(user.rewardPoints ?? 0).toLocaleString("en-IN")} pts</span>
            </button>
          );
        })()}

        {user.phone && (
          <p className="mt-0.5 text-body-md text-on-surface-variant">
            {user.phone}
          </p>
        )}
        {user.email && (
          <p className="text-body-md text-on-surface-variant">{user.email}</p>
        )}
        {user.city && (
          <p className="text-body-md text-on-surface-variant flex items-center gap-1">
            <Icon name="location_on" size={16} />
            {user.city}
          </p>
        )}

        {/* Verified badges */}
        <div className="mt-3 flex gap-2">
          {user.phone && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Icon name="phone" size={14} /> Phone
            </Badge>
          )}
          {user.email && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Icon name="email" size={14} /> Email
            </Badge>
          )}
          {user.idVerified && (
            <Badge variant="default" className="flex items-center gap-1">
              <Icon name="verified" size={14} /> ID
            </Badge>
          )}
        </div>
      </div>

      {/* -------- Stats Row -------- */}
      <Card variant="outlined" className="flex items-center justify-around py-4">
        <div className="text-center">
          <p className="text-headline-md font-headline-md text-on-surface">
            {user.totalTrips ?? 0}
          </p>
          <p className="text-label-sm text-on-surface-variant">Trips</p>
        </div>
        <div className="h-8 w-px bg-outline-variant" />
        <div className="text-center">
          <p className="text-headline-md font-headline-md text-on-surface">
            0
          </p>
          <p className="text-label-sm text-on-surface-variant">Reviews</p>
        </div>
        <div className="h-8 w-px bg-outline-variant" />
        <div className="text-center">
          <p className="text-headline-md font-headline-md text-primary">
            {(user.rewardPoints ?? 0).toLocaleString("en-IN")}
          </p>
          <p className="text-label-sm text-on-surface-variant">Points</p>
        </div>
      </Card>

      {/* -------- Menu List -------- */}
      <Card variant="outlined" className="p-0 overflow-hidden">
        {MENU_ITEMS.map((item, idx) => {
          const isLast = idx === MENU_ITEMS.length - 1;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                } else if (item.href) {
                  router.push(item.href);
                }
              }}
              className={cn(
                "flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-surface-container",
                !isLast && "border-b border-outline-variant/50",
                item.destructive && "text-error"
              )}
            >
              <Icon
                name={item.icon}
                size={22}
                className={cn(
                  item.destructive
                    ? "text-error"
                    : "text-on-surface-variant"
                )}
              />
              <span
                className={cn(
                  "flex-1 text-body-lg",
                  item.destructive
                    ? "text-error font-medium"
                    : "text-on-surface"
                )}
              >
                {item.label}
              </span>
              {item.chevron && (
                <Icon
                  name="chevron_right"
                  size={20}
                  className="text-on-surface-variant"
                />
              )}
            </button>
          );
        })}
      </Card>
    </div>
  );
}
