"use client";

import { useEffect, useState } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useSortable } from "@/hooks/use-sortable";
import { SortHeader } from "@/components/admin/sort-header";
import { AdminTableToolbar } from "@/components/admin/admin-table-toolbar";
import { DateRange, filterByDateRange } from "@/components/admin/date-range-filter";
import { downloadCSV } from "@/lib/csv";

/* ---------- Types ---------- */

interface Referral {
  id: string;
  referrer: { name: string | null; email: string | null };
  referred: { name: string | null; email: string | null };
  code: string;
  tier: number;
  rewardPaise: number;
  status: string;
  createdAt: string;
  convertedAt: string | null;
}

interface ReferralStats {
  totalReferrals: number;
  conversionRate: number;
  totalPayoutsPaise: number;
}

/* ---------- Status Badge ---------- */

function ReferralStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    COMPLETED: "bg-success/10 text-success",
    PENDING: "bg-warning/10 text-warning",
    EXPIRED: "bg-surface-container text-on-surface-variant",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-label-sm capitalize", colors[status] ?? "bg-surface-container text-on-surface-variant")}>
      {status.toLowerCase()}
    </span>
  );
}

/* ---------- Page ---------- */

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    conversionRate: 0,
    totalPayoutsPaise: 0,
  });
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });

  useEffect(() => {
    async function fetchReferrals() {
      try {
        const res = await fetch("/api/admin/referrals");
        const json = await res.json();
        if (json.success) {
          setReferrals(json.data?.referrals ?? json.data ?? []);
          if (json.data?.stats) setStats(json.data.stats);
        }
      } catch (err) {
        console.error("Failed to load referrals", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReferrals();
  }, []);

  const filtered = filterByDateRange(referrals, dateRange, "createdAt");

  const { sortedData, sortConfig, requestSort } = useSortable({ data: filtered });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-headline-md text-on-surface">Referral Dashboard</h1>
        <p className="text-body-md text-on-surface-variant">Track referral program performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card variant="elevated" className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <span className="material-symbols-outlined text-[24px] text-primary">share</span>
            </div>
            <div>
              <p className="text-body-md text-on-surface-variant">Total Referrals</p>
              <p className="text-headline-md font-headline-md text-on-surface">{stats.totalReferrals}</p>
            </div>
          </div>
        </Card>
        <Card variant="elevated" className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10">
              <span className="material-symbols-outlined text-[24px] text-success">trending_up</span>
            </div>
            <div>
              <p className="text-body-md text-on-surface-variant">Conversion Rate</p>
              <p className="text-headline-md font-headline-md text-on-surface">{stats.conversionRate}%</p>
            </div>
          </div>
        </Card>
        <Card variant="elevated" className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <span className="material-symbols-outlined text-[24px] text-primary">payments</span>
            </div>
            <div>
              <p className="text-body-md text-on-surface-variant">Total Payouts</p>
              <p className="text-headline-md font-headline-md text-on-surface">{formatCurrency(stats.totalPayoutsPaise)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <AdminTableToolbar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onExportCSV={() =>
          downloadCSV(sortedData, [
            { header: "Referrer", accessor: "referrer.name" },
            { header: "Referrer Email", accessor: "referrer.email" },
            { header: "Referred", accessor: "referred.name" },
            { header: "Referred Email", accessor: "referred.email" },
            { header: "Code", accessor: "code" },
            { header: "Tier", accessor: "tier" },
            { header: "Reward", accessor: (r: Referral) => (r.rewardPaise / 100).toFixed(2) },
            { header: "Status", accessor: "status" },
            { header: "Date", accessor: "createdAt" },
          ], `referrals-${new Date().toISOString().slice(0, 10)}.csv`)
        }
        csvDisabled={sortedData.length === 0}
      />

      {/* Table */}
      <Card variant="elevated" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container">
                <SortHeader label="Referrer" sortKey="referrer.name" sortConfig={sortConfig} onSort={requestSort} className="text-left" />
                <SortHeader label="Referred User" sortKey="referred.name" sortConfig={sortConfig} onSort={requestSort} className="text-left" />
                <SortHeader label="Code" sortKey="code" sortConfig={sortConfig} onSort={requestSort} className="text-center" />
                <SortHeader label="Tier" sortKey="tier" sortConfig={sortConfig} onSort={requestSort} className="text-center" />
                <SortHeader label="Reward" sortKey="rewardPaise" sortConfig={sortConfig} onSort={requestSort} className="text-right" />
                <SortHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} className="text-center" />
                <SortHeader label="Date" sortKey="createdAt" sortConfig={sortConfig} onSort={requestSort} className="text-right" />
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
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-on-surface-variant">No referrals yet</td>
                </tr>
              ) : (
                sortedData.map((ref) => (
                  <tr key={ref.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container/50 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-on-surface">{ref.referrer.name ?? "N/A"}</p>
                        <p className="text-label-sm text-on-surface-variant">{ref.referrer.email ?? ""}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-on-surface">{ref.referred.name ?? "N/A"}</p>
                        <p className="text-label-sm text-on-surface-variant">{ref.referred.email ?? ""}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="font-mono font-bold text-primary text-label-sm">{ref.code}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-label-sm font-bold text-primary">
                        {ref.tier}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium">{formatCurrency(ref.rewardPaise)}</td>
                    <td className="px-5 py-3 text-center"><ReferralStatusBadge status={ref.status} /></td>
                    <td className="px-4 py-3 text-right text-on-surface-variant text-label-sm">{formatDate(ref.createdAt)}</td>
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
