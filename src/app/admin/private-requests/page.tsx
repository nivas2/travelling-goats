"use client";

import { useEffect, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface RequestRow {
  id: string;
  status: string;
  tripTitle: string;
  userName: string;
  userPhone: string | null;
  lastMessage: string;
  lastAt: string;
  messageCount: number;
}

interface ThreadMsg {
  id: string;
  content: string;
  isStaff: boolean;
  senderName: string;
  createdAt: string;
}

interface ThreadDetail {
  id: string;
  status: string;
  tripTitle: string;
  userName: string;
  userPhone: string | null;
  messages: ThreadMsg[];
}

export default function AdminPrivateRequestsPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ThreadDetail | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/admin/private-requests");
      const json = await res.json();
      if (json.success) setRows(json.data ?? []);
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
        const res = await fetch("/api/admin/private-requests");
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

  async function openThread(id: string) {
    setActive(null);
    const res = await fetch(`/api/admin/private-requests/${id}`);
    const json = await res.json();
    if (json.success) setActive(json.data as ThreadDetail);
  }

  async function sendReply() {
    if (!active || !reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/private-requests/${active.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setActive((prev) =>
          prev ? { ...prev, messages: [...prev.messages, json.data as ThreadMsg] } : prev
        );
        setReply("");
        load();
      }
    } finally {
      setSending(false);
    }
  }

  async function setStatus(status: string) {
    if (!active) return;
    await fetch(`/api/admin/private-requests/${active.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActive((prev) => (prev ? { ...prev, status } : prev));
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-headline-md text-on-surface">Private Requests</h1>
        <p className="text-body-md text-on-surface-variant">
          Confidential messages travellers raised privately to their shepherd.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-container-low" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card variant="elevated" className="p-12 text-center text-on-surface-variant">
          No private requests yet.
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <button
              key={r.id}
              onClick={() => openThread(r.id)}
              className="block w-full text-left"
            >
              <Card variant="elevated" className="p-4 transition-colors hover:bg-surface-container/40">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-title-md font-title-md text-on-surface">{r.userName}</span>
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
                    <p className="mt-0.5 text-label-sm text-on-surface-variant">{r.tripTitle}</p>
                    <p className="mt-1 truncate text-body-md text-on-surface-variant">{r.lastMessage}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-label-sm text-on-surface-variant">{formatDate(r.lastAt)}</p>
                    <p className="text-label-sm text-on-surface-variant">{r.messageCount} msg</p>
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      {/* Thread modal */}
      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active ? `${active.userName} · ${active.tripTitle}` : ""}
        size="lg"
      >
        {active && (
          <div className="space-y-4">
            {active.userPhone && (
              <a
                href={`tel:${active.userPhone}`}
                className="inline-flex items-center gap-1 text-label-md text-primary"
              >
                <span className="material-symbols-outlined text-[16px]">call</span>
                {active.userPhone}
              </a>
            )}

            <div className="max-h-[45vh] space-y-2 overflow-y-auto rounded-xl bg-surface-container-low p-3">
              {active.messages.map((m) => (
                <div key={m.id} className={cn("flex", m.isStaff ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2 text-body-md",
                      m.isStaff
                        ? "rounded-br-md bg-primary text-on-primary"
                        : "rounded-bl-md bg-surface-container-high text-on-surface"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p className="mt-1 text-right text-[10px] opacity-60">
                      {new Date(m.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {active.messages.length === 0 && (
                <p className="py-6 text-center text-on-surface-variant">No messages.</p>
              )}
            </div>

            <div className="flex items-end gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                placeholder="Reply as shepherd…"
                className="flex-1 resize-y rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
              />
              <Button size="sm" loading={sending} onClick={sendReply} disabled={!reply.trim()}>
                Send
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              {active.status !== "RESOLVED" ? (
                <Button variant="secondary" size="sm" onClick={() => setStatus("RESOLVED")}>
                  Mark Resolved
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setStatus("OPEN")}>
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
