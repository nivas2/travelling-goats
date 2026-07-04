"use client";

import { useEffect, useState, useCallback } from "react";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { NotificationData } from "@/types";

// ---------------------------------------------------------------------------
// Notification type icon mapping
// ---------------------------------------------------------------------------

const NOTIF_ICONS: Record<string, { icon: string; bg: string; fg: string }> = {
  BOOKING: { icon: "confirmation_number", bg: "bg-primary-fixed", fg: "text-on-primary-fixed" },
  PAYMENT: { icon: "payment", bg: "bg-success-container", fg: "text-success" },
  REWARD: { icon: "stars", bg: "bg-tertiary-fixed", fg: "text-on-tertiary-fixed" },
  REFERRAL: { icon: "group_add", bg: "bg-secondary-fixed", fg: "text-on-secondary-fixed" },
  TRIP: { icon: "flight_takeoff", bg: "bg-primary-fixed", fg: "text-on-primary-fixed" },
  CHAT: { icon: "chat", bg: "bg-secondary-fixed", fg: "text-on-secondary-fixed" },
  SYSTEM: { icon: "info", bg: "bg-surface-container-high", fg: "text-on-surface-variant" },
  PROMO: { icon: "campaign", bg: "bg-tertiary-fixed", fg: "text-on-tertiary-fixed" },
  WALLET: { icon: "account_balance_wallet", bg: "bg-success-container", fg: "text-success" },
};

function getNotifIcon(type: string) {
  return (
    NOTIF_ICONS[type] ?? {
      icon: "notifications",
      bg: "bg-surface-container-high",
      fg: "text-on-surface-variant",
    }
  );
}

// ---------------------------------------------------------------------------
// Date grouping helpers
// ---------------------------------------------------------------------------

function getDateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === yesterday.getTime()) return "Yesterday";
  return "Earlier";
}

function groupNotifications(
  notifications: NotificationData[]
): { label: string; items: NotificationData[] }[] {
  const groups: Record<string, NotificationData[]> = {};
  const order = ["Today", "Yesterday", "Earlier"];

  for (const n of notifications) {
    const label = getDateGroup(n.createdAt);
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }

  return order
    .filter((label) => groups[label]?.length)
    .map((label) => ({ label, items: groups[label] }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to load notifications");
      const json = await res.json();
      setNotifications(json.data?.items ?? json.data ?? json.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: true }),
      });
    } catch {
      // silent
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch {
      // silent
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const grouped = groupNotifications(notifications);

  // -- Loading ---------------------------------------------------------------

  if (loading) {
    return (
      <div className="px-5 py-6 space-y-6">
        <Skeleton variant="text" width={200} />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="card" height={80} />
        ))}
      </div>
    );
  }

  // -- Error -----------------------------------------------------------------

  if (error) {
    return (
      <div className="px-5 py-6">
        <EmptyState
          icon="error"
          title="Could not load notifications"
          description={error}
          action={{ label: "Retry", onClick: fetchNotifications }}
        />
      </div>
    );
  }

  return (
    <div className="px-5 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-headline-md font-headline-md text-on-surface">
          Notifications
        </h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <div className="py-16">
          <EmptyState
            icon="notifications_none"
            title="Your bell is quiet for now"
            description="Adventure updates will appear here"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.label}>
              <h2 className="text-label-lg font-label-lg text-on-surface-variant mb-2">
                {group.label}
              </h2>
              <div className="space-y-3">
                {group.items.map((notif) => {
                  const meta = getNotifIcon(notif.type);
                  return (
                    <Card
                      key={notif.id}
                      variant="outlined"
                      className={cn(
                        "flex items-start gap-3 p-3 cursor-pointer transition-colors",
                        !notif.isRead && "bg-primary-fixed/5 border-primary/20"
                      )}
                      onClick={() => {
                        if (!notif.isRead) markAsRead(notif.id);
                      }}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          meta.bg
                        )}
                      >
                        <Icon
                          name={meta.icon}
                          size={20}
                          className={meta.fg}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-body-md text-on-surface truncate",
                              !notif.isRead && "font-semibold"
                            )}
                          >
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <Badge variant="dot" className="mt-1.5 shrink-0" />
                          )}
                        </div>
                        <p className="text-label-sm text-on-surface-variant mt-0.5 line-clamp-2">
                          {notif.body}
                        </p>
                        <p className="text-label-sm text-on-surface-variant/70 mt-1">
                          {formatTimestamp(notif.createdAt)}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timestamp formatter
// ---------------------------------------------------------------------------

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
