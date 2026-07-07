"use client";

import { useEffect, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SosAlert {
  id: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  location: string | null;
  mapsLink: string | null;
  tripId: string | null;
}

export default function AdminSosPage() {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/admin/sos");
      const json = await res.json();
      if (json.success) setAlerts(json.data ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/sos");
        const json = await res.json();
        if (active && json.success) setAlerts(json.data ?? []);
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

  async function acknowledge(id: string) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
    await fetch("/api/admin/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  const active = alerts.filter((a) => !a.isRead);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md font-headline-md text-on-surface">SOS Alerts</h1>
          <p className="text-body-md text-on-surface-variant">
            Emergency alerts triggered by travellers. {active.length} unacknowledged.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={load}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-container-low" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <Card variant="elevated" className="p-12 text-center text-on-surface-variant">
          No SOS alerts. All calm. 🕊️
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <Card
              key={a.id}
              variant="elevated"
              className={cn(
                "border-l-4 p-4",
                a.isRead ? "border-l-outline-variant opacity-70" : "border-l-error"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-error">sos</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-label-sm",
                        a.isRead ? "bg-surface-container text-on-surface-variant" : "bg-error/10 text-error"
                      )}
                    >
                      {a.isRead ? "Acknowledged" : "ACTIVE"}
                    </span>
                    <span className="text-label-sm text-on-surface-variant">{formatDate(a.createdAt)}</span>
                  </div>
                  <p className="text-body-md text-on-surface">{a.body}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {a.mapsLink && (
                  <a
                    href={a.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-label-md font-semibold text-primary"
                  >
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    Open in Maps
                  </a>
                )}
                {!a.isRead && (
                  <Button size="sm" onClick={() => acknowledge(a.id)}>
                    Acknowledge
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
