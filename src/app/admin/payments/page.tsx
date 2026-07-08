"use client";

import { useEffect, useState } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { handleAuthError } from "@/lib/auth-fetch";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { useSortable } from "@/hooks/use-sortable";
import { SortHeader } from "@/components/admin/sort-header";
import { AdminTableToolbar } from "@/components/admin/admin-table-toolbar";
import { filterByDateRange } from "@/components/admin/date-range-filter";
import type { DateRange } from "@/components/admin/date-range-filter";
import { downloadCSV } from "@/lib/csv";

/* ---------- Types ---------- */

interface Payment {
  id: string;
  bookingId: string;
  booking: { bookingNumber: string; user: { name: string | null } };
  amountPaise: number;
  method: string | null;
  razorpayPaymentId: string | null;
  status: string;
  createdAt: string;
}

interface RevenueSummary {
  totalRevenuePaise: number;
  capturedCount: number;
  pendingCount: number;
  failedCount: number;
}

type StatusFilter = "ALL" | "PENDING" | "CAPTURED" | "FAILED" | "REFUNDED";

/* ---------- Status Badge ---------- */

function PaymentStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    CAPTURED: "bg-success/10 text-success",
    AUTHORIZED: "bg-primary/10 text-primary",
    PENDING: "bg-warning/10 text-warning",
    FAILED: "bg-error/10 text-error",
    REFUNDED: "bg-surface-container text-on-surface-variant",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-label-sm capitalize", colors[status] ?? "bg-surface-container text-on-surface-variant")}>
      {status.toLowerCase()}
    </span>
  );
}

/* ---------- Page ---------- */

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
  const [summary, setSummary] = useState<RevenueSummary>({
    totalRevenuePaise: 0,
    capturedCount: 0,
    pendingCount: 0,
    failedCount: 0,
  });

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetch("/api/admin/payments");
        if (await handleAuthError(res, "/admin/login")) return;
        const json = await res.json();
        if (json.success) {
          setPayments(json.data?.payments ?? json.data ?? []);
          if (json.data?.summary) setSummary(json.data.summary);
        }
      } catch (err) {
        console.error("Failed to load payments", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  const preFiltered = payments.filter((p) => {
    const matchesSearch =
      !search ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      (p.booking?.bookingNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.razorpayPaymentId ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filtered = filterByDateRange(preFiltered, dateRange, "createdAt");

  const { sortedData, sortConfig, requestSort } = useSortable({ data: filtered });

  const statuses: StatusFilter[] = ["ALL", "PENDING", "CAPTURED", "FAILED", "REFUNDED"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-headline-md text-on-surface">Payment Management</h1>
        <p className="text-body-md text-on-surface-variant">Track all payments and revenue</p>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="elevated" className="p-5">
          <p className="text-body-md text-on-surface-variant">Total Revenue</p>
          <p className="text-headline-md font-headline-md text-on-surface mt-1">{formatCurrency(summary.totalRevenuePaise)}</p>
        </Card>
        <Card variant="elevated" className="p-5">
          <p className="text-body-md text-on-surface-variant">Captured</p>
          <p className="text-headline-md font-headline-md text-success mt-1">{summary.capturedCount}</p>
        </Card>
        <Card variant="elevated" className="p-5">
          <p className="text-body-md text-on-surface-variant">Pending</p>
          <p className="text-headline-md font-headline-md text-warning mt-1">{summary.pendingCount}</p>
        </Card>
        <Card variant="elevated" className="p-5">
          <p className="text-body-md text-on-surface-variant">Failed</p>
          <p className="text-headline-md font-headline-md text-error mt-1">{summary.failedCount}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="sm:w-72">
          <Input
            placeholder="Search by ID or Razorpay ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            inputSize="sm"
            iconLeft={<span className="material-symbols-outlined text-[20px]">search</span>}
          />
        </div>
        <AdminTableToolbar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onExportCSV={() =>
            downloadCSV(sortedData, [
              { header: "Payment ID", accessor: "id" },
              { header: "Booking #", accessor: "booking.bookingNumber" },
              { header: "User", accessor: "booking.user.name" },
              { header: "Amount", accessor: (p: Payment) => (p.amountPaise / 100).toFixed(2) },
              { header: "Method", accessor: "method" },
              { header: "Razorpay ID", accessor: "razorpayPaymentId" },
              { header: "Status", accessor: "status" },
              { header: "Date", accessor: "createdAt" },
            ], `payments-${new Date().toISOString().slice(0, 10)}.csv`)
          }
          csvDisabled={sortedData.length === 0}
        />
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabList className="overflow-x-auto">
          {statuses.map((s) => (
            <Tab key={s} value={s}>{s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}</Tab>
          ))}
        </TabList>
        {statuses.map((s) => (<TabPanel key={s} value={s}>{/* rendered below */}</TabPanel>))}
      </Tabs>

      {/* Table */}
      <Card variant="elevated" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container">
                <SortHeader label="Payment ID" sortKey="id" sortConfig={sortConfig} onSort={requestSort} className="text-left" />
                <SortHeader label="Booking" sortKey="booking.bookingNumber" sortConfig={sortConfig} onSort={requestSort} className="text-left" />
                <SortHeader label="User" sortKey="booking.user.name" sortConfig={sortConfig} onSort={requestSort} className="text-left" />
                <SortHeader label="Amount" sortKey="amountPaise" sortConfig={sortConfig} onSort={requestSort} className="text-right" />
                <SortHeader label="Method" sortKey="method" sortConfig={sortConfig} onSort={requestSort} className="text-center" />
                <SortHeader label="Razorpay ID" sortKey="razorpayPaymentId" sortConfig={sortConfig} onSort={requestSort} className="text-left" />
                <SortHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} className="text-center" />
                <SortHeader label="Date" sortKey="createdAt" sortConfig={sortConfig} onSort={requestSort} className="text-right" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/10">
                    <td colSpan={8} className="px-5 py-4">
                      <div className="h-5 animate-pulse rounded bg-surface-container-low" />
                    </td>
                  </tr>
                ))
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-on-surface-variant">No payments found</td>
                </tr>
              ) : (
                sortedData.map((payment) => (
                  <tr key={payment.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-label-sm text-on-surface-variant">{payment.id.slice(0, 12)}...</td>
                    <td className="px-4 py-3 font-mono text-label-sm">{payment.booking?.bookingNumber ?? "-"}</td>
                    <td className="px-5 py-3">{payment.booking?.user?.name ?? "N/A"}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatCurrency(payment.amountPaise)}</td>
                    <td className="px-5 py-3 text-center text-on-surface-variant capitalize">{payment.method ?? "-"}</td>
                    <td className="px-4 py-3 font-mono text-label-sm text-on-surface-variant">{payment.razorpayPaymentId ?? "-"}</td>
                    <td className="px-5 py-3 text-center"><PaymentStatusBadge status={payment.status} /></td>
                    <td className="px-4 py-3 text-right text-on-surface-variant text-label-sm">{formatDate(payment.createdAt)}</td>
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
