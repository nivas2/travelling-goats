"use client";

import { useEffect, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface ContactRow {
  id: string;
  type: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  status: string;
  createdAt: string;
}

const TYPE_LABEL: Record<string, string> = {
  PARTNER: "Partner",
  GENERAL: "Contact",
};

export default function AdminContactRequestsPage() {
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ContactRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "PARTNER" | "GENERAL">("ALL");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/contact-requests");
        const json = await res.json();
        if (alive && json.success) setRows(json.data ?? []);
      } catch {
        /* ignore */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function setStatus(id: string, status: string) {
    setBusy(true);
    try {
      await fetch(`/api/admin/contact-requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      setActive((prev) => (prev ? { ...prev, status } : prev));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/admin/contact-requests/${id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((r) => r.id !== id));
      setActive(null);
    } finally {
      setBusy(false);
    }
  }

  const visible = rows.filter((r) => filter === "ALL" || r.type === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-headline-md text-on-surface">Contact Requests</h1>
        <p className="text-body-md text-on-surface-variant">
          Enquiries submitted from the site footer — general contact and partnership requests.
        </p>
      </div>

      <div className="flex gap-2">
        {(["ALL", "GENERAL", "PARTNER"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-label-md transition-colors",
              filter === f
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            )}
          >
            {f === "ALL" ? "All" : f === "GENERAL" ? "Contact" : "Partner"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-container-low" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card variant="elevated" className="p-12 text-center text-on-surface-variant">
          No contact requests yet.
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <button key={r.id} onClick={() => setActive(r)} className="block w-full text-left">
              <Card variant="elevated" className="p-4 transition-colors hover:bg-surface-container/40">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-title-md font-title-md text-on-surface">{r.name}</span>
                      <span className="rounded-full bg-tertiary/15 px-2 py-0.5 text-label-sm text-tertiary">
                        {TYPE_LABEL[r.type] ?? r.type}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-label-sm",
                          r.status === "RESOLVED"
                            ? "bg-success/15 text-success"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-label-sm text-on-surface-variant">{r.email}</p>
                    <p className="mt-1 truncate text-body-md text-on-surface-variant">{r.message}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-label-sm text-on-surface-variant">{formatDate(r.createdAt)}</p>
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active ? `${active.name} · ${TYPE_LABEL[active.type] ?? active.type}` : ""}
        size="lg"
      >
        {active && (
          <div className="space-y-4">
            <div className="grid gap-2 rounded-xl bg-surface-container-low p-3 text-body-md">
              <div className="flex gap-2">
                <span className="w-20 shrink-0 text-on-surface-variant">Email</span>
                <a href={`mailto:${active.email}`} className="text-primary break-all">
                  {active.email}
                </a>
              </div>
              {active.phone && (
                <div className="flex gap-2">
                  <span className="w-20 shrink-0 text-on-surface-variant">Phone</span>
                  <a href={`tel:${active.phone}`} className="text-primary">
                    {active.phone}
                  </a>
                </div>
              )}
              {active.company && (
                <div className="flex gap-2">
                  <span className="w-20 shrink-0 text-on-surface-variant">Company</span>
                  <span className="text-on-surface">{active.company}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="w-20 shrink-0 text-on-surface-variant">Received</span>
                <span className="text-on-surface">{formatDate(active.createdAt)}</span>
              </div>
            </div>

            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="whitespace-pre-wrap break-words text-body-md text-on-surface">
                {active.message}
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(active.id)}
                disabled={busy}
              >
                Delete
              </Button>
              {active.status !== "RESOLVED" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setStatus(active.id, "RESOLVED")}
                  disabled={busy}
                >
                  Mark Resolved
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatus(active.id, "OPEN")}
                  disabled={busy}
                >
                  Reopen
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
