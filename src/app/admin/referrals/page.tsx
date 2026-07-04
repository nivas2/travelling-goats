"use client";

import { useEffect, useState } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";

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
    COMPLETED: "bg-green-100 text-green-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    EXPIRED: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", colors[status] ?? "bg-gray-100 text-gray-700")}>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Referral Dashboard</h1>
        <p className="text-sm text-on-surface-variant">Track referral program performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card variant="elevated" className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ae2f34]/10">
              <span className="material-symbols-outlined text-[24px] text-[#ae2f34]">share</span>
            </div>
            <div>
              <p className="text-sm text-on-surface-variant">Total Referrals</p>
              <p className="text-2xl font-bold text-on-surface">{stats.totalReferrals}</p>
            </div>
          </div>
        </Card>
        <Card variant="elevated" className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
              <span className="material-symbols-outlined text-[24px] text-green-700">trending_up</span>
            </div>
            <div>
              <p className="text-sm text-on-surface-variant">Conversion Rate</p>
              <p className="text-2xl font-bold text-on-surface">{stats.conversionRate}%</p>
            </div>
          </div>
        </Card>
        <Card variant="elevated" className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
              <span className="material-symbols-outlined text-[24px] text-blue-700">payments</span>
            </div>
            <div>
              <p className="text-sm text-on-surface-variant">Total Payouts</p>
              <p className="text-2xl font-bold text-on-surface">{formatCurrency(stats.totalPayoutsPaise)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card variant="elevated" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-[#f9f9f9]">
                <th className="px-5 py-3 text-left font-medium text-on-surface-variant">Referrer</th>
                <th className="px-5 py-3 text-left font-medium text-on-surface-variant">Referred User</th>
                <th className="px-5 py-3 text-center font-medium text-on-surface-variant">Code</th>
                <th className="px-5 py-3 text-center font-medium text-on-surface-variant">Tier</th>
                <th className="px-5 py-3 text-right font-medium text-on-surface-variant">Reward</th>
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
              ) : referrals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-on-surface-variant">No referrals yet</td>
                </tr>
              ) : (
                referrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-[#f9f9f9]/50 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-on-surface">{ref.referrer.name ?? "N/A"}</p>
                        <p className="text-xs text-on-surface-variant">{ref.referrer.email ?? ""}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-on-surface">{ref.referred.name ?? "N/A"}</p>
                        <p className="text-xs text-on-surface-variant">{ref.referred.email ?? ""}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="font-mono font-bold text-[#ae2f34] text-xs">{ref.code}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ae2f34]/10 text-xs font-bold text-[#ae2f34]">
                        {ref.tier}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium">{formatCurrency(ref.rewardPaise)}</td>
                    <td className="px-5 py-3 text-center"><ReferralStatusBadge status={ref.status} /></td>
                    <td className="px-5 py-3 text-right text-on-surface-variant text-xs">{formatDate(ref.createdAt)}</td>
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
