"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { handleAuthError } from "@/lib/auth-fetch";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";

interface Msg {
  id: string;
  content: string;
  isStaff: boolean;
  senderName: string;
  senderAvatar: string | null;
  createdAt: string;
}

interface ThreadData {
  id: string | null;
  status: string;
  tripTitle: string;
  shepherd: { name: string | null; avatar: string | null } | null;
  messages: Msg[];
}

// Quick one-tap requests travellers commonly need on a trip.
const QUICK_REQUESTS = [
  "🚻 Need a washroom stop",
  "☕ Need a short break",
  "🚨 I feel unsafe — please help",
  "🤕 Not feeling well",
  "🧕 I'd prefer a female roommate",
  "🥤 Need water / food",
  "⏱️ I'm running a little late",
];

export default function ShepherdRequestPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tripId = params.id;

  const [thread, setThread] = useState<ThreadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/private-request`);
        if (await handleAuthError(res)) return;
        const json = await res.json();
        if (active && json.success) setThread(json.data as ThreadData);
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [tripId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  async function send(preset?: string) {
    const content = (preset ?? text).trim();
    if (!content || sending) return;
    setSending(true);
    setErr(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/private-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (await handleAuthError(res)) return;
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to send");
      setThread((prev) =>
        prev ? { ...prev, messages: [...prev.messages, json.data as Msg] } : prev
      );
      if (!preset) setText("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  const shepherdName = thread?.shepherd?.name ?? "Your Shepherd";
  const messages = thread?.messages ?? [];

  return (
    <div className="flex h-dvh flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-outline-variant bg-surface-container-lowest/95 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-surface-container-high"
        >
          <Icon name="arrow_back" size={22} />
        </button>
        <Avatar src={thread?.shepherd?.avatar ?? null} name={shepherdName} size="sm" />
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-1 truncate text-title-md font-semibold text-on-surface">
            {shepherdName}
            <Icon name="lock" size={14} className="text-primary" />
          </h1>
          <p className="truncate text-label-sm text-on-surface-variant">
            Private · {thread?.tripTitle ?? ""}
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Privacy note */}
        <div className="mx-auto mb-4 max-w-sm rounded-2xl bg-primary/5 p-3 text-center">
          <Icon name="shield" size={20} className="mx-auto mb-1 text-primary" filled />
          <p className="text-label-md text-on-surface">
            This is a private, confidential channel with your Shepherd.
          </p>
          <p className="mt-0.5 text-label-sm text-on-surface-variant">
            Only you and your trip captain can see these messages. Reach out any time you
            need help or feel unsafe.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-2xl bg-surface-container-low" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className="mt-6 text-center text-body-md text-on-surface-variant">
            No messages yet. Start the conversation with your Shepherd below.
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn("flex", m.isStaff ? "justify-start" : "justify-end")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5",
                    m.isStaff
                      ? "rounded-bl-md bg-surface-container text-on-surface"
                      : "rounded-br-md bg-primary-container text-on-primary-container"
                  )}
                >
                  {m.isStaff && (
                    <p className="mb-0.5 text-label-sm font-semibold text-primary">
                      {shepherdName}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words text-body-md">{m.content}</p>
                  <p className="mt-1 text-right text-[10px] opacity-50">
                    {new Date(m.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 border-t border-outline-variant bg-surface-container-lowest px-4 py-3 pb-safe">
        {/* Quick one-tap requests */}
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {QUICK_REQUESTS.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={sending}
              className="shrink-0 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 text-label-md text-on-surface transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {err && <p className="mb-1.5 text-label-sm text-error">{err}</p>}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Message your Shepherd privately…"
            className="max-h-32 flex-1 resize-none rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-body-md text-on-surface outline-none focus:border-primary"
          />
          <button
            onClick={() => send()}
            disabled={!text.trim() || sending}
            aria-label="Send"
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition",
              text.trim() && !sending
                ? "bg-primary text-on-primary"
                : "bg-surface-container-high text-on-surface-variant"
            )}
          >
            <Icon name="send" size={20} filled />
          </button>
        </div>
      </div>
    </div>
  );
}
