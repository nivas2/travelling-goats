"use client";

import { useEffect, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/* ---------- Types ---------- */

interface AnalyticsData {
  dau: number;
  mau: number;
  bookingConversionRate: number;
  avgOrderValuePaise: number;
  topDestinations: { name: string; count: number }[];
  revenueTrend: { month: string; revenuePaise: number }[];
  newUsers: number;
  returningUsers: number;
}

/* ---------- Placeholder Bar Chart ---------- */

function BarChart({
  data,
  maxValue,
}: {
  data: { label: string; value: number }[];
  maxValue: number;
}) {
  return (
    <div className="flex items-end gap-2 h-44">
      {data.map((item) => {
        const heightPct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-on-surface-variant">
              {formatCurrency(item.value)}
            </span>
            <div className="w-full flex flex-col justify-end h-32">
              <div
                className="w-full rounded-t-md bg-primary transition-all duration-500"
                style={{ height: `${Math.max(heightPct, 2)}%` }}
              />
            </div>
            <span className="text-[10px] text-on-surface-variant">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Page ---------- */

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/admin/analytics");
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  // Fallback data for display when API has not returned yet
  const analytics: AnalyticsData = data ?? {
    dau: 0,
    mau: 0,
    bookingConversionRate: 0,
    avgOrderValuePaise: 0,
    topDestinations: [],
    revenueTrend: [],
    newUsers: 0,
    returningUsers: 0,
  };

  const revenueChartData = analytics.revenueTrend.map((t) => ({
    label: t.month,
    value: t.revenuePaise,
  }));
  const maxRevenue = Math.max(...revenueChartData.map((d) => d.value), 1);

  const totalAcquisition = analytics.newUsers + analytics.returningUsers;
  const newPct = totalAcquisition > 0 ? (analytics.newUsers / totalAcquisition) * 100 : 50;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-headline-md text-on-surface">Herd Analytics</h1>
        <p className="text-body-md text-on-surface-variant">Key metrics and performance insights</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card variant="elevated" className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <span className="material-symbols-outlined text-[24px] text-primary">person</span>
            </div>
            <div>
              <p className="text-body-md text-on-surface-variant">DAU / MAU</p>
              <p className="text-title-lg font-title-lg text-on-surface">
                {analytics.dau.toLocaleString()} / {analytics.mau.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        <Card variant="elevated" className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10">
              <span className="material-symbols-outlined text-[24px] text-success">conversion_path</span>
            </div>
            <div>
              <p className="text-body-md text-on-surface-variant">Booking Conversion</p>
              <p className="text-title-lg font-title-lg text-on-surface">{analytics.bookingConversionRate}%</p>
            </div>
          </div>
        </Card>
        <Card variant="elevated" className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <span className="material-symbols-outlined text-[24px] text-primary">shopping_cart</span>
            </div>
            <div>
              <p className="text-body-md text-on-surface-variant">Avg Order Value</p>
              <p className="text-title-lg font-title-lg text-on-surface">{formatCurrency(analytics.avgOrderValuePaise)}</p>
            </div>
          </div>
        </Card>
        <Card variant="elevated" className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <span className="material-symbols-outlined text-[24px] text-primary">group_add</span>
            </div>
            <div>
              <p className="text-body-md text-on-surface-variant">New vs Returning</p>
              <p className="text-title-lg font-title-lg text-on-surface">
                {analytics.newUsers} / {analytics.returningUsers}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Revenue Trend */}
        <Card variant="elevated" className="p-5">
          <h3 className="text-title-md font-title-md text-on-surface mb-4">Revenue Trend</h3>
          {revenueChartData.length > 0 ? (
            <BarChart data={revenueChartData} maxValue={maxRevenue} />
          ) : (
            <div className="flex h-44 items-center justify-center text-on-surface-variant">
              {loading ? (
                <div className="h-full w-full animate-pulse rounded bg-surface-container-low" />
              ) : (
                "No revenue data available"
              )}
            </div>
          )}
        </Card>

        {/* Top Destinations */}
        <Card variant="elevated" className="p-5">
          <h3 className="text-title-md font-title-md text-on-surface mb-4">Top Destinations</h3>
          {analytics.topDestinations.length > 0 ? (
            <div className="space-y-3">
              {analytics.topDestinations.map((dest, i) => {
                const maxCount = Math.max(...analytics.topDestinations.map((d) => d.count), 1);
                const pct = (dest.count / maxCount) * 100;
                return (
                  <div key={dest.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-body-md font-label-lg text-on-surface">
                        {i + 1}. {dest.name}
                      </span>
                      <span className="text-body-md text-on-surface-variant">
                        {dest.count} trips
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-44 items-center justify-center text-on-surface-variant">
              {loading ? (
                <div className="h-full w-full animate-pulse rounded bg-surface-container-low" />
              ) : (
                "No destination data available"
              )}
            </div>
          )}
        </Card>

        {/* User Acquisition */}
        <Card variant="elevated" className="p-5">
          <h3 className="text-title-md font-title-md text-on-surface mb-4">User Acquisition</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-body-md text-on-surface-variant">New Users</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-body-md text-on-surface-variant">Returning</span>
              </div>
            </div>
            <div className="h-4 rounded-full bg-surface-container overflow-hidden flex">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${newPct}%` }}
              />
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${100 - newPct}%` }}
              />
            </div>
            <div className="flex justify-between text-body-md text-on-surface-variant">
              <span>{analytics.newUsers} new ({Math.round(newPct)}%)</span>
              <span>{analytics.returningUsers} returning ({Math.round(100 - newPct)}%)</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
