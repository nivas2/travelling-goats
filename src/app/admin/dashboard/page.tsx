"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ---------- Types ---------- */

interface DashboardStats {
  totalUsers: number;
  totalTrips: number;
  totalBookings: number;
  totalRevenuePaise: number;
  activeTrips: number;
  pendingBookings: number;
  userGrowth: number;
  revenueGrowth: number;
}

interface RecentBooking {
  id: string;
  bookingNumber: string;
  user: { name: string | null };
  trip: { title: string };
  totalPricePaise: number;
  status: string;
  createdAt: string;
}

interface RecentUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

/* ---------- Stat Card ---------- */

function StatCard({
  icon,
  label,
  value,
  growth,
}: {
  icon: string;
  label: string;
  value: string;
  growth: number;
}) {
  const isPositive = growth >= 0;
  return (
    <Card variant="elevated" className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <span className="material-symbols-outlined text-[24px] text-primary">
            {icon}
          </span>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-label-sm font-label-sm",
            isPositive
              ? "bg-success/10 text-success"
              : "bg-error/10 text-error"
          )}
        >
          <span className="material-symbols-outlined text-[14px]">
            {isPositive ? "arrow_upward" : "arrow_downward"}
          </span>
          {Math.abs(growth)}%
        </span>
      </div>
      <p className="mt-3 text-body-md text-on-surface-variant">{label}</p>
      <p className="mt-1 text-headline-md font-headline-md text-on-surface">{value}</p>
    </Card>
  );
}

/* ---------- Status Badge ---------- */

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    CONFIRMED: "bg-success/10 text-success",
    COMPLETED: "bg-success/10 text-success",
    PENDING: "bg-warning/10 text-warning",
    CANCELLED: "bg-error/10 text-error",
    REFUNDED: "bg-surface-container text-on-surface-variant",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-label-sm capitalize",
        colors[status] ?? "bg-surface-container text-on-surface-variant"
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}

/* ---------- Page ---------- */

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/admin");
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
          setRecentBookings(json.data.recentBookings ?? []);
          setRecentUsers(json.data.recentUsers ?? []);
        }
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-md font-headline-md text-on-surface">Dashboard</h1>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} variant="elevated" className="h-32 animate-pulse bg-surface-container-low" />
          ))}
        </div>
      </div>
    );
  }

  const s = stats ?? {
    totalUsers: 0,
    totalTrips: 0,
    totalBookings: 0,
    totalRevenuePaise: 0,
    activeTrips: 0,
    pendingBookings: 0,
    userGrowth: 0,
    revenueGrowth: 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-headline-md font-headline-md text-on-surface">Dashboard</h1>
          <p className="text-body-md text-on-surface-variant">
            Welcome back. Here is what is happening today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/trips/new">
            <Button
              size="sm"
              icon={
                <span className="material-symbols-outlined text-[18px]">
                  add
                </span>
              }
            >
              Create Trip
            </Button>
          </Link>
          <Link href="/admin/bookings">
            <Button variant="secondary" size="sm">
              View All Bookings
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="group"
          label="Total Users"
          value={s.totalUsers.toLocaleString("en-IN")}
          growth={s.userGrowth}
        />
        <StatCard
          icon="flight_takeoff"
          label="Total Trips"
          value={s.totalTrips.toLocaleString("en-IN")}
          growth={12}
        />
        <StatCard
          icon="confirmation_number"
          label="Total Bookings"
          value={s.totalBookings.toLocaleString("en-IN")}
          growth={8}
        />
        <StatCard
          icon="payments"
          label="Revenue"
          value={formatCurrency(s.totalRevenuePaise)}
          growth={s.revenueGrowth}
        />
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent Bookings */}
        <Card variant="elevated" className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4">
            <h2 className="text-title-md font-title-md text-on-surface">
              Recent Bookings
            </h2>
            <Link
              href="/admin/bookings"
              className="text-label-sm font-label-lg text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-body-md min-w-[600px]">
              <thead>
                <tr className="border-b border-outline-variant/10 bg-surface-container-low">
                  <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant whitespace-nowrap">
                    Booking #
                  </th>
                  <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant whitespace-nowrap">
                    User
                  </th>
                  <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant whitespace-nowrap">
                    Trip
                  </th>
                  <th className="px-4 py-3 text-right font-label-lg text-on-surface-variant whitespace-nowrap">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-label-lg text-on-surface-variant whitespace-nowrap">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-on-surface-variant"
                    >
                      No recent bookings
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-label-sm">
                        {b.bookingNumber}
                      </td>
                      <td className="px-5 py-3">{b.user.name ?? "N/A"}</td>
                      <td className="px-5 py-3 max-w-[140px] truncate">
                        {b.trip.title}
                      </td>
                      <td className="px-5 py-3 text-right font-medium">
                        {formatCurrency(b.totalPricePaise)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-5 py-3 text-right text-on-surface-variant">
                        {formatDate(b.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Users */}
        <Card variant="elevated" className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4">
            <h2 className="text-title-md font-title-md text-on-surface">
              Recent Users
            </h2>
            <Link
              href="/admin/users"
              className="text-label-sm font-label-lg text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-body-md min-w-[500px]">
              <thead>
                <tr className="border-b border-outline-variant/10 bg-surface-container-low">
                  <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant whitespace-nowrap">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant whitespace-nowrap">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant whitespace-nowrap">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-right font-label-lg text-on-surface-variant whitespace-nowrap">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-8 text-center text-on-surface-variant"
                    >
                      No recent users
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium">
                        {u.name ?? "Unnamed"}
                      </td>
                      <td className="px-5 py-3 text-on-surface-variant">
                        {u.email ?? "-"}
                      </td>
                      <td className="px-5 py-3 text-on-surface-variant">
                        {u.phone ?? "-"}
                      </td>
                      <td className="px-5 py-3 text-right text-on-surface-variant">
                        {formatDate(u.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
