"use client";

import { useEffect, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";

/* ---------- Types ---------- */

interface TicketMessage {
  id: string;
  content: string;
  isStaff: boolean;
  userId: string | null;
  user?: { name: string | null } | null;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  ticketNumber: string;
  user: { name: string | null; email: string | null };
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  messages: TicketMessage[];
}

type StatusFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

/* ---------- Status Badge ---------- */

function TicketStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    OPEN: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    RESOLVED: "bg-green-100 text-green-800",
    CLOSED: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", colors[status] ?? "bg-gray-100 text-gray-700")}>
      {status.toLowerCase().replace("_", " ")}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    URGENT: "bg-red-100 text-red-800",
    HIGH: "bg-orange-100 text-orange-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    LOW: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", colors[priority] ?? "bg-gray-100 text-gray-700")}>
      {priority.toLowerCase()}
    </span>
  );
}

/* ---------- Page ---------- */

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    try {
      const res = await fetch("/api/admin/support");
      const json = await res.json();
      if (json.success) setTickets(json.data ?? []);
    } catch (err) {
      console.error("Failed to load tickets", err);
    } finally {
      setLoading(false);
    }
  }

  async function sendReply() {
    if (!selectedTicket || !replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/support/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText, isStaff: true }),
      });
      const json = await res.json();
      if (json.success) {
        // Append message locally
        const newMsg: TicketMessage = {
          id: json.data?.id ?? Date.now().toString(),
          content: replyText,
          isStaff: true,
          userId: null,
          createdAt: new Date().toISOString(),
        };
        setSelectedTicket((prev) =>
          prev ? { ...prev, messages: [...prev.messages, newMsg], status: "IN_PROGRESS" } : prev
        );
        setTickets((prev) =>
          prev.map((t) =>
            t.id === selectedTicket.id
              ? { ...t, messages: [...t.messages, newMsg], status: "IN_PROGRESS" }
              : t
          )
        );
        setReplyText("");
      }
    } catch (err) {
      console.error("Failed to send reply", err);
    } finally {
      setSending(false);
    }
  }

  async function updateTicketStatus(ticketId: string, status: string) {
    try {
      await fetch(`/api/admin/support/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => (prev ? { ...prev, status } : prev));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  }

  const filtered = tickets.filter(
    (t) => statusFilter === "ALL" || t.status === statusFilter
  );

  const statuses: StatusFilter[] = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

  // Detail view
  if (selectedTicket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedTicket(null)}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
              arrow_back
            </span>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-on-surface">
              {selectedTicket.ticketNumber}
            </h1>
            <p className="text-sm text-on-surface-variant">{selectedTicket.subject}</p>
          </div>
          <div className="flex items-center gap-2">
            <TicketStatusBadge status={selectedTicket.status} />
            <PriorityBadge priority={selectedTicket.priority} />
          </div>
        </div>

        {/* Ticket Info */}
        <Card variant="elevated" className="p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
            <div>
              <p className="text-on-surface-variant">User</p>
              <p className="font-medium text-on-surface">{selectedTicket.user.name ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-on-surface-variant">Email</p>
              <p className="font-medium text-on-surface">{selectedTicket.user.email ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-on-surface-variant">Category</p>
              <p className="font-medium text-on-surface capitalize">{selectedTicket.category.toLowerCase()}</p>
            </div>
            <div>
              <p className="text-on-surface-variant">Created</p>
              <p className="font-medium text-on-surface">{formatDate(selectedTicket.createdAt)}</p>
            </div>
          </div>
        </Card>

        {/* Status Actions */}
        <div className="flex gap-2">
          {selectedTicket.status !== "RESOLVED" && (
            <Button variant="secondary" size="sm" onClick={() => updateTicketStatus(selectedTicket.id, "RESOLVED")}>
              Mark Resolved
            </Button>
          )}
          {selectedTicket.status !== "CLOSED" && (
            <Button variant="ghost" size="sm" onClick={() => updateTicketStatus(selectedTicket.id, "CLOSED")}>
              Close Ticket
            </Button>
          )}
        </div>

        {/* Message Thread */}
        <Card variant="elevated" className="p-5">
          <h2 className="text-base font-semibold text-on-surface mb-4">Messages</h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {selectedTicket.messages.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-8">No messages yet</p>
            ) : (
              selectedTicket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "rounded-xl p-4 max-w-[80%]",
                    msg.isStaff
                      ? "ml-auto bg-[#ae2f34]/10 border border-[#ae2f34]/20"
                      : "bg-[#f9f9f9] border border-outline-variant/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-on-surface">
                      {msg.isStaff ? "Support Staff" : msg.user?.name ?? "User"}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">
                      {formatDate(msg.createdAt, "relative")}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Reply Form */}
        {selectedTicket.status !== "CLOSED" && (
          <Card variant="elevated" className="p-5">
            <h3 className="text-sm font-semibold text-on-surface mb-3">Reply</h3>
            <textarea
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[80px] resize-y text-sm"
              placeholder="Type your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <div className="flex justify-end mt-3">
              <Button
                size="sm"
                loading={sending}
                onClick={sendReply}
                icon={<span className="material-symbols-outlined text-[18px]">send</span>}
              >
                Send Reply
              </Button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Support Tickets</h1>
        <p className="text-sm text-on-surface-variant">Manage customer support requests</p>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabList className="overflow-x-auto">
          {statuses.map((s) => (
            <Tab key={s} value={s}>
              {s === "ALL" ? "All" : s === "IN_PROGRESS" ? "In Progress" : s.charAt(0) + s.slice(1).toLowerCase()}
            </Tab>
          ))}
        </TabList>
        {statuses.map((s) => (<TabPanel key={s} value={s}>{/* rendered below */}</TabPanel>))}
      </Tabs>

      {/* Table */}
      <Card variant="elevated" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-[#f9f9f9]">
                <th className="px-5 py-3 text-left font-medium text-on-surface-variant">Ticket #</th>
                <th className="px-5 py-3 text-left font-medium text-on-surface-variant">User</th>
                <th className="px-5 py-3 text-left font-medium text-on-surface-variant">Subject</th>
                <th className="px-5 py-3 text-center font-medium text-on-surface-variant">Category</th>
                <th className="px-5 py-3 text-center font-medium text-on-surface-variant">Priority</th>
                <th className="px-5 py-3 text-center font-medium text-on-surface-variant">Status</th>
                <th className="px-5 py-3 text-right font-medium text-on-surface-variant">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/10">
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-5 animate-pulse rounded bg-surface-container-low" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-on-surface-variant">No tickets found</td>
                </tr>
              ) : (
                filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="border-b border-outline-variant/10 last:border-0 hover:bg-[#f9f9f9]/50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-[#ae2f34] font-bold">{ticket.ticketNumber}</td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-on-surface">{ticket.user.name ?? "N/A"}</p>
                        <p className="text-xs text-on-surface-variant">{ticket.user.email ?? ""}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 max-w-[200px] truncate text-on-surface">{ticket.subject}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 capitalize">
                        {ticket.category.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center"><PriorityBadge priority={ticket.priority} /></td>
                    <td className="px-5 py-3 text-center"><TicketStatusBadge status={ticket.status} /></td>
                    <td className="px-5 py-3 text-right text-on-surface-variant text-xs">{formatDate(ticket.createdAt)}</td>
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
