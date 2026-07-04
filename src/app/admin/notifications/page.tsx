"use client";

import { useEffect, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";

/* ---------- Types ---------- */

interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  type: string;
  recipientCount: number;
  createdAt: string;
}

const typeOptions = [
  { label: "System", value: "SYSTEM" },
  { label: "Promotion", value: "PROMOTION" },
  { label: "Trip Update", value: "TRIP_UPDATE" },
  { label: "Booking", value: "BOOKING" },
  { label: "Payment", value: "PAYMENT" },
  { label: "Reward", value: "REWARD" },
  { label: "Referral", value: "REFERRAL" },
];

/* ---------- Type Badge ---------- */

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    SYSTEM: "bg-surface-container text-on-surface-variant",
    PROMOTION: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    TRIP_UPDATE: "bg-primary/10 text-primary",
    BOOKING: "bg-success/10 text-success",
    PAYMENT: "bg-success/10 text-success",
    REWARD: "bg-warning/10 text-warning",
    REFERRAL: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-label-sm capitalize", colors[type] ?? "bg-surface-container text-on-surface-variant")}>
      {type.toLowerCase().replace("_", " ")}
    </span>
  );
}

/* ---------- Page ---------- */

export default function AdminNotificationsPage() {
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("SYSTEM");
  const [target, setTarget] = useState("all");
  const [targetUserId, setTargetUserId] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/admin/notifications");
        const json = await res.json();
        if (json.success) setHistory(json.data ?? []);
      } catch (err) {
        console.error("Failed to load notification history", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  async function sendNotification() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          type,
          target: target === "all" ? "all" : targetUserId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTitle("");
        setBody("");
        setType("SYSTEM");
        setTarget("all");
        setTargetUserId("");
        // Refresh history
        const histRes = await fetch("/api/admin/notifications");
        const histJson = await histRes.json();
        if (histJson.success) setHistory(histJson.data ?? []);
      } else {
        alert(json.error ?? "Failed to send notification");
      }
    } catch (err) {
      console.error("Failed to send notification", err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-headline-md text-on-surface">Notifications</h1>
        <p className="text-body-md text-on-surface-variant">Send notifications to users</p>
      </div>

      {/* Send Notification Form */}
      <Card variant="elevated" className="p-6">
        <h2 className="text-title-md font-title-md text-on-surface mb-5">Send Notification</h2>
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />
          <div>
            <label className="text-label-lg font-semibold text-on-surface mb-1.5 block">
              Body
            </label>
            <textarea
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[80px] resize-y"
              placeholder="Notification message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Dropdown
              label="Type"
              options={typeOptions}
              value={type}
              onChange={setType}
            />
            <Dropdown
              label="Target"
              options={[
                { label: "All Users", value: "all" },
                { label: "Specific User", value: "specific" },
              ]}
              value={target}
              onChange={setTarget}
            />
            {target === "specific" && (
              <Input
                label="User ID"
                placeholder="Enter user ID"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                fullWidth
              />
            )}
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              loading={sending}
              onClick={sendNotification}
              icon={<span className="material-symbols-outlined text-[18px]">send</span>}
            >
              Send Notification
            </Button>
          </div>
        </div>
      </Card>

      {/* Notification History */}
      <Card variant="elevated" className="p-0 overflow-hidden">
        <div className="border-b border-outline-variant/20 px-5 py-4">
          <h2 className="text-title-md font-title-md text-on-surface">Notification History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container">
                <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">Title</th>
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Type</th>
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Recipients</th>
                <th className="px-4 py-3 text-right font-label-lg text-on-surface-variant">Sent</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/10">
                    <td colSpan={4} className="px-5 py-4">
                      <div className="h-5 animate-pulse rounded bg-surface-container-low" />
                    </td>
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-on-surface-variant">No notifications sent yet</td>
                </tr>
              ) : (
                history.map((notif) => (
                  <tr key={notif.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container/50 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-on-surface">{notif.title}</p>
                        <p className="text-label-sm text-on-surface-variant mt-0.5 max-w-[300px] truncate">{notif.body}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center"><TypeBadge type={notif.type} /></td>
                    <td className="px-5 py-3 text-center text-on-surface-variant">{notif.recipientCount}</td>
                    <td className="px-4 py-3 text-right text-on-surface-variant text-label-sm">{formatDate(notif.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
