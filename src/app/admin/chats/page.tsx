"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface ChatRoomRow {
  id: string;
  tripId: string;
  tripTitle: string;
  tripStatus: string;
  captainName: string | null;
  messageCount: number;
  memberCount: number;
  lastMessage: string | null;
  lastMessageBy: string | null;
  lastMessageAt: string | null;
  isActive: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-on-surface-variant/10 text-on-surface-variant",
  PUBLISHED: "bg-primary/10 text-primary",
  SOLD_OUT: "bg-warning/15 text-warning",
  ONGOING: "bg-success/15 text-success",
  COMPLETED: "bg-on-surface-variant/10 text-on-surface-variant",
  CANCELLED: "bg-error/10 text-error",
};

export default function AdminChatsPage() {
  const [rows, setRows] = useState<ChatRoomRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/chats");
        const json = await res.json();
        if (active && json.success) setRows(json.data ?? []);
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-headline-md text-on-surface">Group Chats</h1>
        <p className="text-body-md text-on-surface-variant">
          All trip group chat rooms. Click "Moderate" to join inline as admin.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-container-low" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card variant="elevated" className="p-12 text-center text-on-surface-variant">
          No chat rooms yet.
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id} variant="elevated" className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-title-md font-title-md text-on-surface">
                      {r.tripTitle}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-label-sm",
                        STATUS_COLORS[r.tripStatus] ?? "bg-surface-container text-on-surface-variant"
                      )}
                    >
                      {r.tripStatus}
                    </span>
                  </div>

                  {r.captainName && (
                    <p className="mt-0.5 text-label-sm text-on-surface-variant">
                      Captain: {r.captainName}
                    </p>
                  )}

                  <div className="mt-1.5 flex items-center gap-4 text-label-sm text-on-surface-variant">
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      {r.messageCount} messages
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">group</span>
                      {r.memberCount} members
                    </span>
                  </div>

                  {r.lastMessage && (
                    <p className="mt-1 truncate text-body-md text-on-surface-variant">
                      {r.lastMessageBy && (
                        <span className="font-medium">{r.lastMessageBy}: </span>
                      )}
                      {r.lastMessage}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right space-y-2">
                  {r.lastMessageAt && (
                    <p className="text-label-sm text-on-surface-variant">
                      {formatDate(r.lastMessageAt)}
                    </p>
                  )}
                  <Link
                    href={`/trips/${r.tripId}/chat`}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-label-md font-medium text-primary hover:bg-primary/15 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">shield</span>
                    Moderate
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
