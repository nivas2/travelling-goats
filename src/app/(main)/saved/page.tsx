"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, formatCurrency, formatDateRange, formatCategory } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/toast";
import type { TripCardData, ApiResponse } from "@/types";

// ---------------------------------------------------------------------------
// Saved Trip Card
// ---------------------------------------------------------------------------

function SavedTripCard({
  trip,
  onRemove,
}: {
  trip: TripCardData;
  onRemove: (id: string) => void;
}) {
  const spotsLeft = trip.maxGroupSize - trip.currentBookings;

  return (
    <div className="relative">
      <Link href={`/trips/${trip.id}`} className="block">
        <Card clickable className="flex gap-3.5 p-3">
          {/* Thumbnail */}
          <div className="relative h-[110px] w-[110px] shrink-0 overflow-hidden rounded-xl">
            <Image
              src={trip.coverImage || "/placeholder-trip.jpg"}
              alt={trip.title}
              fill
              className="object-cover"
              sizes="110px"
            />
            {/* Category chip */}
            <div className="absolute left-1.5 top-1.5">
              <Chip
                variant="filled"
                color="primary"
                className="text-[9px] px-1.5 py-0.5"
              >
                {formatCategory(trip.category)}
              </Chip>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col justify-between py-0.5">
            <div>
              <h3 className="text-title-md font-semibold text-on-surface line-clamp-1 pr-8">
                {trip.title}
              </h3>
              <div className="mt-1 flex items-center gap-1 text-body-md text-on-surface-variant">
                <Icon name="location_on" size={14} className="text-primary" />
                <span className="line-clamp-1">{trip.destination}</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-label-sm text-on-surface-variant">
                <Icon name="calendar_today" size={12} />
                <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                <span className="mx-0.5 text-outline-variant">|</span>
                <span>{trip.duration}D</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  <Icon name="star" size={14} filled className="text-tertiary" />
                  <span className="text-label-sm font-semibold">
                    {trip.rating.toFixed(1)}
                  </span>
                </div>
                {spotsLeft <= 5 && spotsLeft > 0 && (
                  <span className="text-[10px] font-bold text-error">
                    {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                  </span>
                )}
              </div>
              <span className="text-title-md font-bold text-primary">
                {formatCurrency(trip.basePricePaise)}
              </span>
            </div>
          </div>
        </Card>
      </Link>

      {/* Remove from wishlist button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(trip.id);
        }}
        className={cn(
          "absolute right-4 top-4 z-10",
          "flex h-9 w-9 items-center justify-center rounded-full",
          "bg-surface-container-lowest shadow-card",
          "transition-colors hover:bg-error/10"
        )}
        aria-label="Remove from wishlist"
      >
        <Icon name="favorite" size={20} filled className="text-primary" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Saved Page
// ---------------------------------------------------------------------------

export default function SavedPage() {
  const router = useRouter();
  const { error: toastError } = useToast();
  const [savedTrips, setSavedTrips] = useState<TripCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedTrips = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users/wishlist");
      const json: ApiResponse<TripCardData[]> = await res.json();
      if (json.success && json.data) {
        setSavedTrips(json.data);
      }
    } catch {
      toastError("Failed to load saved trips");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedTrips();
  }, [fetchSavedTrips]);

  const handleRemove = async (tripId: string) => {
    // Optimistic update
    setSavedTrips((prev) => prev.filter((t) => t.id !== tripId));

    try {
      await fetch("/api/users/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId }),
      });
    } catch {
      toastError("Failed to remove trip");
      fetchSavedTrips();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Dream Trails" />

      <div className="px-5 py-6">
        {/* Loading Skeletons */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="card" height={118} />
            ))}
          </div>
        )}

        {/* Saved trips count */}
        {!loading && savedTrips.length > 0 && (
          <p className="text-label-sm text-on-surface-variant mb-3">
            {savedTrips.length} saved trail{savedTrips.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Trip Cards */}
        {!loading && savedTrips.length > 0 && (
          <div className="space-y-3">
            {savedTrips.map((trip) => (
              <SavedTripCard
                key={trip.id}
                trip={trip}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && savedTrips.length === 0 && (
          <div className="py-16">
            <EmptyState
              icon="favorite_border"
              title="No Dream Trails Yet"
              description="No dream trails saved yet. Start exploring! Your next adventure is just a tap away."
              action={{
                label: "Explore Trails",
                onClick: () => router.push("/home"),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
