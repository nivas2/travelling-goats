"use client";

import { useEffect, useState } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";

/* ---------- Types ---------- */

interface Booking {
  id: string;
  bookingNumber: string;
  userId: string;
  user: { name: string | null; email: string | null };
  trip: { title: string };
  bookingType: string;
  travelerCount: number;
  totalPricePaise: number;
  status: string;
  createdAt: string;
}

type StatusFilter = "ALL" | "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

/* ---------- Helpers ---------- */

function BookingStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    CONFIRMED: "bg-success/10 text-success",
    COMPLETED: "bg-success/10 text-success",
    PENDING: "bg-warning/10 text-warning",
    CANCELLED: "bg-error/10 text-error",
    REFUNDED: "bg-surface-container text-on-surface-variant",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-label-sm capitalize", colors[status] ?? "bg-surface-container text-on-surface-variant")}>
      {status.toLowerCase()}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    SOLO: "bg-primary/10 text-primary",
    COUPLE: "bg-primary/10 text-primary",
    GROUP: "bg-surface-container text-on-surface-variant",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-label-sm font-label-sm capitalize", colors[type] ?? "bg-surface-container text-on-surface-variant")}>
      {type.toLowerCase()}
    </span>
  );
}

/* ---------- Page ---------- */

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [actionBooking, setActionBooking] = useState<Booking | null>(null);
  const [actionType, setActionType] = useState<"confirm" | "cancel" | "refund" | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch("/api/admin/bookings");
        const json = await res.json();
        if (json.success) setBookings(json.data ?? []);
      } catch (err) {
        console.error("Failed to load bookings", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  async function handleAction() {
    if (!actionBooking || !actionType) return;
    setProcessing(true);
    try {
      const statusMap = { confirm: "CONFIRMED", cancel: "CANCELLED", refund: "REFUNDED" };
      const res = await fetch(`/api/admin/bookings/${actionBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusMap[actionType] }),
      });
      const json = await res.json();
      if (json.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === actionBooking.id ? { ...b, status: statusMap[actionType] } : b
          )
        );
      }
    } catch (err) {
      console.error("Action failed", err);
    } finally {
      setProcessing(false);
      setActionBooking(null);
      setActionType(null);
    }
  }

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      !search ||
      b.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
      (b.user.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      b.trip.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses: StatusFilter[] = ["ALL", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-headline-md text-on-surface">Trail Booking Management</h1>
        <p className="text-body-md text-on-surface-variant">Track and manage all bookings</p>
      </div>

      {/* Search */}
      <div className="sm:w-80">
        <Input
          placeholder="Search bookings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          inputSize="sm"
          iconLeft={<span className="material-symbols-outlined text-[20px]">search</span>}
        />
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabList className="overflow-x-auto">
          {statuses.map((s) => (
            <Tab key={s} value={s}>
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </Tab>
          ))}
        </TabList>
        {statuses.map((s) => (
          <TabPanel key={s} value={s}>{/* rendered below */}</TabPanel>
        ))}
      </Tabs>

      {/* Table */}
      <Card variant="elevated" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container">
                <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">Booking #</th>
                <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">User</th>
                <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">Trip</th>
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Type</th>
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Travelers</th>
                <th className="px-4 py-3 text-right font-label-lg text-on-surface-variant">Amount</th>
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Status</th>
                <th className="px-4 py-3 text-right font-label-lg text-on-surface-variant">Date</th>
                <th className="px-4 py-3 text-right font-label-lg text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/10">
                    <td colSpan={9} className="px-5 py-4">
                      <div className="h-5 animate-pulse rounded bg-surface-container-low" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-on-surface-variant">No bookings found</td>
                </tr>
              ) : (
                filtered.map((booking) => (
                  <tr key={booking.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-label-sm">{booking.bookingNumber}</td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-on-surface">{booking.user.name ?? "N/A"}</p>
                        <p className="text-label-sm text-on-surface-variant">{booking.user.email ?? ""}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 max-w-[160px] truncate">{booking.trip.title}</td>
                    <td className="px-5 py-3 text-center"><TypeBadge type={booking.bookingType} /></td>
                    <td className="px-5 py-3 text-center">{booking.travelerCount}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatCurrency(booking.totalPricePaise)}</td>
                    <td className="px-5 py-3 text-center"><BookingStatusBadge status={booking.status} /></td>
                    <td className="px-4 py-3 text-right text-on-surface-variant text-label-sm">{formatDate(booking.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {booking.status === "PENDING" && (
                          <button
                            onClick={() => { setActionBooking(booking); setActionType("confirm"); }}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-success/10 transition-colors"
                            title="Confirm"
                          >
                            <span className="material-symbols-outlined text-[18px] text-success">check_circle</span>
                          </button>
                        )}
                        {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                          <button
                            onClick={() => { setActionBooking(booking); setActionType("cancel"); }}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-error/10 transition-colors"
                            title="Cancel"
                          >
                            <span className="material-symbols-outlined text-[18px] text-error">cancel</span>
                          </button>
                        )}
                        {booking.status === "CANCELLED" && (
                          <button
                            onClick={() => { setActionBooking(booking); setActionType("refund"); }}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors"
                            title="Refund"
                          >
                            <span className="material-symbols-outlined text-[18px] text-primary">currency_exchange</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action Modal */}
      <Modal
        open={!!actionBooking && !!actionType}
        onClose={() => { setActionBooking(null); setActionType(null); }}
        title={
          actionType === "confirm" ? "Confirm Booking" : actionType === "cancel" ? "Cancel Booking" : "Process Refund"
        }
        size="sm"
      >
        <p className="text-body-md text-on-surface-variant">
          {actionType === "confirm"
            ? `Confirm booking ${actionBooking?.bookingNumber}?`
            : actionType === "cancel"
            ? `Cancel booking ${actionBooking?.bookingNumber}? This will notify the user.`
            : `Process refund for booking ${actionBooking?.bookingNumber} (${actionBooking ? formatCurrency(actionBooking.totalPricePaise) : ""})?`}
        </p>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" size="sm" onClick={() => { setActionBooking(null); setActionType(null); }}>
            Cancel
          </Button>
          <Button
            variant={actionType === "cancel" ? "destructive" : "primary"}
            size="sm"
            loading={processing}
            onClick={handleAction}
          >
            {actionType === "confirm" ? "Confirm" : actionType === "cancel" ? "Cancel Booking" : "Process Refund"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
