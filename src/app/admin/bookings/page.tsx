"use client";

import { useEffect, useState } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { handleAuthError } from "@/lib/auth-fetch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { useSortable } from "@/hooks/use-sortable";
import { SortHeader } from "@/components/admin/sort-header";
import { AdminTableToolbar } from "@/components/admin/admin-table-toolbar";
import { DateRange, filterByDateRange } from "@/components/admin/date-range-filter";
import { downloadCSV } from "@/lib/csv";

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
  checkedInAt: string | null;
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
  const [tripFilter, setTripFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [checkinFilter, setCheckinFilter] = useState<"ALL" | "IN" | "NOT">("ALL");
  const [actionBooking, setActionBooking] = useState<Booking | null>(null);
  const [actionType, setActionType] = useState<"confirm" | "cancel" | "refund" | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch("/api/admin/bookings");
        if (await handleAuthError(res, "/admin/login")) return;
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
      if (await handleAuthError(res, "/admin/login")) return;
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

  const preFiltered = bookings.filter((b) => {
    const matchesSearch =
      !search ||
      b.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
      (b.user.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      b.trip.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    const matchesTrip = tripFilter === "ALL" || b.trip.title === tripFilter;
    const matchesType = typeFilter === "ALL" || b.bookingType === typeFilter;
    const matchesCheckin =
      checkinFilter === "ALL" ||
      (checkinFilter === "IN" ? !!b.checkedInAt : !b.checkedInAt);
    return matchesSearch && matchesStatus && matchesTrip && matchesType && matchesCheckin;
  });

  const filtered = filterByDateRange(preFiltered, dateRange, "createdAt");

  const { sortedData, sortConfig, requestSort } = useSortable({ data: filtered });

  const statuses: StatusFilter[] = ["ALL", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
  const trailOptions = Array.from(new Set(bookings.map((b) => b.trip.title))).sort();
  const typeOptions = Array.from(new Set(bookings.map((b) => b.bookingType))).sort();
  const hasFilters = tripFilter !== "ALL" || typeFilter !== "ALL" || !!search || statusFilter !== "ALL" || checkinFilter !== "ALL" || !!dateRange.from || !!dateRange.to;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-headline-md text-on-surface">Trail Booking Management</h1>
        <p className="text-body-md text-on-surface-variant">Track and manage all bookings</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search booking #, user, trail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            inputSize="sm"
            iconLeft={<span className="material-symbols-outlined text-[20px]">search</span>}
          />
        </div>

        <select
          value={tripFilter}
          onChange={(e) => setTripFilter(e.target.value)}
          className="h-9 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-body-md text-on-surface outline-none focus:border-primary"
        >
          <option value="ALL">All Trails</option>
          {trailOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-body-md text-on-surface outline-none focus:border-primary"
        >
          <option value="ALL">All Types</option>
          {typeOptions.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </option>
          ))}
        </select>

        <select
          value={checkinFilter}
          onChange={(e) => setCheckinFilter(e.target.value as "ALL" | "IN" | "NOT")}
          className="h-9 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-body-md text-on-surface outline-none focus:border-primary"
        >
          <option value="ALL">All Check-in</option>
          <option value="IN">Checked in</option>
          <option value="NOT">Not checked in</option>
        </select>

        <span className="text-label-md text-on-surface-variant">
          {sortedData.length} of {bookings.length}
        </span>

        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
              setTripFilter("ALL");
              setTypeFilter("ALL");
              setCheckinFilter("ALL");
              setDateRange({ from: "", to: "" });
            }}
            className="text-label-md font-medium text-primary hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Toolbar */}
      <AdminTableToolbar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onExportCSV={() =>
          downloadCSV(sortedData, [
            { header: "Booking #", accessor: "bookingNumber" },
            { header: "User", accessor: "user.name" },
            { header: "Trip", accessor: "trip.title" },
            { header: "Type", accessor: "bookingType" },
            { header: "Travelers", accessor: "travelerCount" },
            { header: "Amount", accessor: (b: Booking) => (b.totalPricePaise / 100).toFixed(2) },
            { header: "Status", accessor: "status" },
            { header: "Checked In", accessor: (b: Booking) => b.checkedInAt ? "Yes" : "No" },
            { header: "Date", accessor: "createdAt" },
          ], `bookings-${new Date().toISOString().slice(0, 10)}.csv`)
        }
        csvDisabled={sortedData.length === 0}
      />

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
                <SortHeader label="Booking #" sortKey="bookingNumber" sortConfig={sortConfig} onSort={requestSort} className="text-left" />
                <SortHeader label="User" sortKey="user.name" sortConfig={sortConfig} onSort={requestSort} className="text-left" />
                <SortHeader label="Trip" sortKey="trip.title" sortConfig={sortConfig} onSort={requestSort} className="text-left" />
                <SortHeader label="Type" sortKey="bookingType" sortConfig={sortConfig} onSort={requestSort} className="text-center" />
                <SortHeader label="Travelers" sortKey="travelerCount" sortConfig={sortConfig} onSort={requestSort} className="text-center" />
                <SortHeader label="Amount" sortKey="totalPricePaise" sortConfig={sortConfig} onSort={requestSort} className="text-right" />
                <SortHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} className="text-center" />
                <SortHeader label="Checked In" sortKey="checkedInAt" sortConfig={sortConfig} onSort={requestSort} className="text-center" />
                <SortHeader label="Date" sortKey="createdAt" sortConfig={sortConfig} onSort={requestSort} className="text-right" />
                <th className="px-4 py-3 text-right font-label-lg text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/10">
                    <td colSpan={10} className="px-5 py-4">
                      <div className="h-5 animate-pulse rounded bg-surface-container-low" />
                    </td>
                  </tr>
                ))
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-on-surface-variant">No bookings found</td>
                </tr>
              ) : (
                sortedData.map((booking) => (
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
                    <td className="px-5 py-3 text-center">
                      {booking.checkedInAt ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-label-sm font-semibold text-success" title={formatDate(booking.checkedInAt)}>
                          <span className="material-symbols-outlined text-[14px]">check_circle</span> In
                        </span>
                      ) : (
                        <span className="text-label-sm text-on-surface-variant/60">—</span>
                      )}
                    </td>
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
