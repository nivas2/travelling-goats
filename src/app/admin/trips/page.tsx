"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn, formatCurrency, formatDate, formatDateRange } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";

/* ---------- Types ---------- */

interface Trip {
  id: string;
  title: string;
  slug: string;
  destination: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  basePricePaise: number;
  maxGroupSize: number;
  currentBookings: number;
  status: string;
  isFeatured: boolean;
  isTrending: boolean;
}

type StatusFilter = "ALL" | "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED";

/* ---------- Status Badge ---------- */

function TripStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PUBLISHED: "bg-success/10 text-success",
    DRAFT: "bg-surface-container text-on-surface-variant",
    ONGOING: "bg-primary/10 text-primary",
    COMPLETED: "bg-success/10 text-success",
    CANCELLED: "bg-error/10 text-error",
    SOLD_OUT: "bg-warning/10 text-warning",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-label-sm capitalize",
        colors[status] ?? "bg-surface-container text-on-surface-variant"
      )}
    >
      {status.toLowerCase().replace("_", " ")}
    </span>
  );
}

/* ---------- Page ---------- */

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  async function fetchTrips() {
    try {
      const res = await fetch("/api/admin/trips");
      const json = await res.json();
      if (json.success) setTrips(json.data.trips ?? json.data ?? []);
    } catch (err) {
      console.error("Failed to load trips", err);
    } finally {
      setLoading(false);
    }
  }

  async function togglePublish(trip: Trip) {
    const newStatus = trip.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      await fetch(`/api/admin/trips/${trip.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setTrips((prev) =>
        prev.map((t) => (t.id === trip.id ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  }

  async function deleteTrip() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/trips/${deleteTarget.id}`, { method: "DELETE" });
      setTrips((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete trip", err);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = trips.filter((t) => {
    const matchesSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.destination.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses: StatusFilter[] = [
    "ALL",
    "DRAFT",
    "PUBLISHED",
    "ONGOING",
    "COMPLETED",
    "CANCELLED",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-headline-md font-headline-md text-on-surface">Trail Management</h1>
          <p className="text-body-md text-on-surface-variant">
            Manage all trips, drafts, and schedules
          </p>
        </div>
        <Link href="/admin/trips/new">
          <Button
            size="sm"
            icon={
              <span className="material-symbols-outlined text-[18px]">add</span>
            }
          >
            Create Trip
          </Button>
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="sm:w-80">
          <Input
            placeholder="Search by title or destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            inputSize="sm"
            iconLeft={
              <span className="material-symbols-outlined text-[20px]">
                search
              </span>
            }
          />
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabList className="overflow-x-auto">
          {statuses.map((s) => (
            <Tab key={s} value={s}>
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
            </Tab>
          ))}
        </TabList>

        {statuses.map((s) => (
          <TabPanel key={s} value={s}>
            {/* table rendered below for all panels */}
          </TabPanel>
        ))}
      </Tabs>

      {/* Table */}
      <Card variant="elevated" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container">
                <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">
                  Trip
                </th>
                <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">
                  Destination
                </th>
                <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">
                  Dates
                </th>
                <th className="px-4 py-3 text-right font-label-lg text-on-surface-variant">
                  Price
                </th>
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">
                  Spots
                </th>
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-label-lg text-on-surface-variant">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/10">
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-5 animate-pulse rounded bg-surface-container-low" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-on-surface-variant"
                  >
                    No trips found
                  </td>
                </tr>
              ) : (
                filtered.map((trip) => (
                  <tr
                    key={trip.id}
                    className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
                          {trip.coverImage && (
                            <img
                              src={trip.coverImage}
                              alt={trip.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <span className="font-medium text-on-surface max-w-[200px] truncate">
                          {trip.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-on-surface-variant">
                      {trip.destination}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant text-label-sm">
                      {formatDateRange(trip.startDate, trip.endDate)}
                    </td>
                    <td className="px-5 py-3 text-right font-medium">
                      {formatCurrency(trip.basePricePaise)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-on-surface-variant">
                        {trip.currentBookings}/{trip.maxGroupSize}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <TripStatusBadge status={trip.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/trips/${trip.id}/edit`}>
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                              edit
                            </span>
                          </button>
                        </Link>
                        <button
                          onClick={() => togglePublish(trip)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors"
                          title={
                            trip.status === "PUBLISHED" ? "Unpublish" : "Publish"
                          }
                        >
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                            {trip.status === "PUBLISHED"
                              ? "visibility_off"
                              : "visibility"}
                          </span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(trip)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-error/10 transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[18px] text-error">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Trip"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        size="sm"
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            loading={deleting}
            onClick={deleteTrip}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
