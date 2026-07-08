"use client";

import { useEffect, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSortable } from "@/hooks/use-sortable";
import { SortHeader } from "@/components/admin/sort-header";
import { downloadCSV } from "@/lib/csv";

interface RevenueRow {
  tripId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  category: "ongoing" | "upcoming" | "past";
  bookings: number;
  travelers: number;
  revenuePaise: number;
}

interface RevenueData {
  rows: RevenueRow[];
  totals: { ongoing: number; upcoming: number; past: number; all: number };
  counts: { ongoing: number; upcoming: number; past: number; all: number };
}

type Filter = "all" | "ongoing" | "upcoming" | "past";

const CATEGORY_STYLE: Record<string, string> = {
  ongoing: "bg-success/10 text-success",
  upcoming: "bg-secondary/15 text-secondary",
  past: "bg-surface-container-high text-on-surface-variant",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/revenue");
        const json = await res.json();
        if (active && json.success) setData(json.data);
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

  const rows =
    data?.rows.filter((r) => filter === "all" || r.category === filter) ?? [];

  const { sortedData, sortConfig, requestSort } = useSortable({ data: rows });

  function exportCsv() {
    downloadCSV(sortedData, [
      { header: "Trail", accessor: "title" },
      { header: "Destination", accessor: "destination" },
      { header: "Status", accessor: "category" },
      { header: "Start", accessor: (r: RevenueRow) => fmtDate(r.startDate) },
      { header: "End", accessor: (r: RevenueRow) => fmtDate(r.endDate) },
      { header: "Bookings", accessor: "bookings" },
      { header: "Travelers", accessor: "travelers" },
      { header: "Revenue (INR)", accessor: (r: RevenueRow) => (r.revenuePaise / 100).toFixed(2) },
    ], `revenue-${filter}-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  const summary = [
    { key: "ongoing", label: "Ongoing", value: data?.totals.ongoing ?? 0, count: data?.counts.ongoing ?? 0 },
    { key: "upcoming", label: "Upcoming", value: data?.totals.upcoming ?? 0, count: data?.counts.upcoming ?? 0 },
    { key: "past", label: "Past", value: data?.totals.past ?? 0, count: data?.counts.past ?? 0 },
    { key: "all", label: "Total", value: data?.totals.all ?? 0, count: data?.counts.all ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md font-headline-md text-on-surface">Revenue by Trail</h1>
          <p className="text-body-md text-on-surface-variant">
            Revenue from confirmed &amp; completed bookings, per trip.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={exportCsv}
          disabled={sortedData.length === 0}
          icon={<span className="material-symbols-outlined text-[18px]">download</span>}
        >
          Export CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.key} variant="elevated" className="p-4">
            <p className="text-label-sm text-on-surface-variant">{s.label} revenue</p>
            <p className="mt-1 text-title-lg font-bold text-on-surface">
              {loading ? "—" : formatCurrency(s.value)}
            </p>
            <p className="text-label-sm text-on-surface-variant">{s.count} trail{s.count !== 1 ? "s" : ""}</p>
          </Card>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {(["all", "ongoing", "upcoming", "past"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-1.5 text-label-md font-label-md capitalize transition-colors",
              filter === f
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card variant="elevated" className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container">
                <SortHeader label="Trail" sortKey="title" sortConfig={sortConfig} onSort={requestSort} className="text-left" />
                <SortHeader label="Status" sortKey="category" sortConfig={sortConfig} onSort={requestSort} className="text-center" />
                <SortHeader label="Dates" sortKey="startDate" sortConfig={sortConfig} onSort={requestSort} className="text-left" />
                <SortHeader label="Bookings" sortKey="bookings" sortConfig={sortConfig} onSort={requestSort} className="text-center" />
                <SortHeader label="Travelers" sortKey="travelers" sortConfig={sortConfig} onSort={requestSort} className="text-center" />
                <SortHeader label="Revenue" sortKey="revenuePaise" sortConfig={sortConfig} onSort={requestSort} className="text-right" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/10">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-5 animate-pulse rounded bg-surface-container-low" />
                    </td>
                  </tr>
                ))
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-on-surface-variant">
                    No trails in this category.
                  </td>
                </tr>
              ) : (
                sortedData.map((r) => (
                  <tr key={r.tripId} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-on-surface">{r.title}</p>
                      <p className="text-label-sm text-on-surface-variant">{r.destination}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-label-sm capitalize", CATEGORY_STYLE[r.category])}>
                        {r.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant text-label-md">
                      {fmtDate(r.startDate)} – {fmtDate(r.endDate)}
                    </td>
                    <td className="px-4 py-3 text-center text-on-surface-variant">{r.bookings}</td>
                    <td className="px-4 py-3 text-center text-on-surface-variant">{r.travelers}</td>
                    <td className="px-4 py-3 text-right font-semibold text-on-surface">
                      {formatCurrency(r.revenuePaise)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && sortedData.length > 0 && (
              <tfoot>
                <tr className="border-t border-outline-variant/20 bg-surface-container/50">
                  <td colSpan={5} className="px-4 py-3 text-right font-label-lg text-on-surface-variant">
                    {filter === "all" ? "Total" : `${filter} total`}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-primary">
                    {formatCurrency(sortedData.reduce((s, r) => s + r.revenuePaise, 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}
