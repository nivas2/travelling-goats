"use client";

import { useEffect, useState } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { handleAuthError } from "@/lib/auth-fetch";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";

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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
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

  const filtered = payments.filter((p) => {
    const matchesSearch =
      !search ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      (p.booking?.bookingNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.razorpayPaymentId ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    let matchesDate = true;
    if (dateFrom) matchesDate = matchesDate && new Date(p.createdAt) >= new Date(dateFrom);
    if (dateTo) matchesDate = matchesDate && new Date(p.createdAt) <= new Date(dateTo + "T23:59:59");
    return matchesSearch && matchesStatus && matchesDate;
  });

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
        <div className="flex gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            inputSize="sm"
          />
          <span className="flex items-center text-on-surface-variant text-body-md">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            inputSize="sm"
          />
        </div>
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
                <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">Payment ID</th>
                <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">Booking</th>
                <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">User</th>
                <th className="px-4 py-3 text-right font-label-lg text-on-surface-variant">Amount</th>
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Method</th>
                <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">Razorpay ID</th>
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Status</th>
                <th className="px-4 py-3 text-right font-label-lg text-on-surface-variant">Date</th>
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-on-surface-variant">No payments found</td>
                </tr>
              ) : (
                filtered.map((payment) => (
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
