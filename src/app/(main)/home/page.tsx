"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, formatCurrency, formatDateRange } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Rating } from "@/components/ui/rating";
import type { TripCardData, ApiResponse } from "@/types";

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { label: "Adventure", icon: "hiking" },
  { label: "Beach", icon: "beach_access" },
  { label: "Mountain", icon: "landscape" },
  { label: "Cultural", icon: "temple_hindu" },
  { label: "Wildlife", icon: "pets" },
  { label: "Road Trip", icon: "directions_car" },
  { label: "Camping", icon: "camping" },
  { label: "Spiritual", icon: "self_improvement" },
];

// ---------------------------------------------------------------------------
// Trip Card Component
// ---------------------------------------------------------------------------

function TripCard({ trip }: { trip: TripCardData }) {
  const spotsLeft = trip.maxGroupSize - trip.currentBookings;

  return (
    <Link href={`/trips/${trip.id}`} className="block">
      <Card clickable className="overflow-hidden p-0">
        {/* Cover Image */}
        <div className="relative h-[180px] w-full overflow-hidden">
          <Image
            src={trip.coverImage || "/placeholder-trip.jpg"}
            alt={trip.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {/* Category chip */}
          <div className="absolute left-3 top-3">
            <Chip variant="filled" color="primary" className="text-[11px] px-2.5 py-1">
              {trip.category}
            </Chip>
          </div>
          {/* Spots left badge */}
          {spotsLeft <= 5 && spotsLeft > 0 && (
            <div className="absolute right-3 top-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-error px-2.5 py-1 text-[11px] font-semibold text-on-error">
                <Icon name="local_fire_department" size={14} />
                {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-3.5">
          <h3 className="text-title-md font-semibold text-on-surface line-clamp-1">
            {trip.title}
          </h3>

          <div className="mt-1 flex items-center gap-1 text-body-md text-on-surface-variant">
            <Icon name="location_on" size={16} className="text-primary" />
            <span className="line-clamp-1">{trip.destination}</span>
          </div>

          <div className="mt-2 flex items-center gap-1 text-body-md text-on-surface-variant">
            <Icon name="calendar_today" size={14} />
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
            <span className="mx-1 text-outline-variant">|</span>
            <span>{trip.duration}D</span>
          </div>

          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Icon name="star" size={16} filled className="text-tertiary" />
              <span className="text-label-lg font-semibold text-on-surface">
                {trip.rating.toFixed(1)}
              </span>
              <span className="text-label-sm text-on-surface-variant">
                ({trip.reviewCount})
              </span>
            </div>
            <p className="text-title-md font-bold text-primary">
              {formatCurrency(trip.basePricePaise)}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Horizontal Trip Card (for scrollable rows)
// ---------------------------------------------------------------------------

function HorizontalTripCard({ trip }: { trip: TripCardData }) {
  const spotsLeft = trip.maxGroupSize - trip.currentBookings;

  return (
    <Link href={`/trips/${trip.id}`} className="block w-[260px] shrink-0">
      <Card clickable className="overflow-hidden p-0 h-full">
        <div className="relative h-[140px] w-full overflow-hidden">
          <Image
            src={trip.coverImage || "/placeholder-trip.jpg"}
            alt={trip.title}
            fill
            className="object-cover"
            sizes="260px"
          />
          {spotsLeft <= 5 && spotsLeft > 0 && (
            <div className="absolute right-2 top-2">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-error/90 px-2 py-0.5 text-[10px] font-bold text-on-error">
                {spotsLeft} left
              </span>
            </div>
          )}
        </div>
        <div className="p-3">
          <h4 className="text-label-lg font-semibold text-on-surface line-clamp-1">
            {trip.title}
          </h4>
          <div className="mt-1 flex items-center gap-1 text-label-sm text-on-surface-variant">
            <Icon name="location_on" size={13} className="text-primary" />
            <span className="line-clamp-1">{trip.destination}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              <Icon name="star" size={14} filled className="text-tertiary" />
              <span className="text-label-sm font-semibold">{trip.rating.toFixed(1)}</span>
            </div>
            <span className="text-label-lg font-bold text-primary">
              {formatCurrency(trip.basePricePaise)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Loaders
// ---------------------------------------------------------------------------

function HeroSkeleton() {
  return <Skeleton variant="rectangular" height={400} className="rounded-none" />;
}

function HorizontalCardsSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden px-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="w-[260px] shrink-0">
          <Skeleton variant="card" height={220} />
        </div>
      ))}
    </div>
  );
}

function GridCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 px-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="card" height={260} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Home Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const router = useRouter();
  const [trips, setTrips] = useState<TripCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/trips");
      const json: ApiResponse<TripCardData[]> = await res.json();
      if (json.success && json.data) {
        setTrips(json.data);
      }
    } catch {
      // Silently handle fetch errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const featuredTrip = trips.find((t) => t.isFeatured) ?? trips[0];
  const trendingTrips = trips.filter((t) => t.isTrending);
  const weekendGetaways = trips.filter((t) => t.duration <= 3);
  const filteredPopular = selectedCategory
    ? trips.filter(
        (t) => t.category.toLowerCase() === selectedCategory.toLowerCase()
      )
    : trips;

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* ===== Search Bar ===== */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md px-5 py-3">
        <button
          onClick={() => router.push("/search")}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl",
            "bg-surface-container-low border border-outline-variant",
            "h-12 px-4 text-left transition-colors",
            "hover:border-primary/30"
          )}
        >
          <Icon name="search" size={22} className="text-on-surface-variant" />
          <span className="text-body-md text-on-surface-variant/60">
            Search trips, destinations...
          </span>
        </button>
      </div>

      {/* ===== Hero Section ===== */}
      {loading ? (
        <HeroSkeleton />
      ) : featuredTrip ? (
        <Link href={`/trips/${featuredTrip.id}`} className="block">
          <section className="relative h-[400px] w-full overflow-hidden">
            <Image
              src={featuredTrip.coverImage || "/placeholder-trip.jpg"}
              alt={featuredTrip.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Location badge */}
            <div className="absolute left-5 top-5">
              <GlassCard className="flex items-center gap-2 rounded-full px-3 py-1.5">
                <Icon name="location_on" size={16} className="text-primary" />
                <span className="text-label-sm font-semibold text-on-surface">
                  {featuredTrip.destination}
                </span>
              </GlassCard>
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <Chip variant="filled" color="secondary" className="mb-2">
                Featured
              </Chip>
              <h1 className="text-headline-lg font-bold text-white text-shadow-premium">
                {featuredTrip.title}
              </h1>
              <p className="mt-1 text-body-md text-white/80">
                {formatDateRange(featuredTrip.startDate, featuredTrip.endDate)} &middot;{" "}
                {featuredTrip.duration} Days
              </p>
              <div className="mt-4">
                <Button size="md">
                  Explore Trip &rarr;
                </Button>
              </div>
            </div>
          </section>
        </Link>
      ) : null}

      {/* ===== Trending Now ===== */}
      <section className="mt-6">
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="text-headline-md font-bold text-on-surface">
            Trending Now
          </h2>
          <button
            onClick={() => router.push("/search?sort=popularity")}
            className="text-label-lg font-semibold text-primary"
          >
            See All
          </button>
        </div>

        {loading ? (
          <HorizontalCardsSkeleton />
        ) : (
          <div className="flex gap-4 overflow-x-auto px-5 pb-2 hide-scrollbar">
            {trendingTrips.length > 0
              ? trendingTrips.map((trip) => (
                  <HorizontalTripCard key={trip.id} trip={trip} />
                ))
              : trips.slice(0, 5).map((trip) => (
                  <HorizontalTripCard key={trip.id} trip={trip} />
                ))}
          </div>
        )}
      </section>

      {/* ===== Weekend Getaways - Bento Grid ===== */}
      <section className="mt-8">
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="text-headline-md font-bold text-on-surface">
            Weekend Getaways
          </h2>
          <button
            onClick={() => router.push("/search?duration=1-3")}
            className="text-label-lg font-semibold text-primary"
          >
            See All
          </button>
        </div>

        {loading ? (
          <GridCardsSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-3 px-5">
            {/* Large featured card spanning 2 columns */}
            {weekendGetaways[0] && (
              <Link
                href={`/trips/${weekendGetaways[0].id}`}
                className="col-span-2 block"
              >
                <div className="relative h-[200px] w-full overflow-hidden rounded-[20px]">
                  <Image
                    src={weekendGetaways[0].coverImage || "/placeholder-trip.jpg"}
                    alt={weekendGetaways[0].title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-title-lg font-bold text-white">
                      {weekendGetaways[0].title}
                    </h3>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-body-md text-white/80">
                        {weekendGetaways[0].destination}
                      </span>
                      <span className="text-label-lg font-bold text-white">
                        {formatCurrency(weekendGetaways[0].basePricePaise)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Smaller cards */}
            {weekendGetaways.slice(1, 3).map((trip) => (
              <Link key={trip.id} href={`/trips/${trip.id}`} className="block">
                <div className="relative h-[160px] w-full overflow-hidden rounded-[20px]">
                  <Image
                    src={trip.coverImage || "/placeholder-trip.jpg"}
                    alt={trip.title}
                    fill
                    className="object-cover"
                    sizes="50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h4 className="text-label-lg font-semibold text-white line-clamp-1">
                      {trip.title}
                    </h4>
                    <span className="text-label-sm text-white/80">
                      {formatCurrency(trip.basePricePaise)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===== Category Chips ===== */}
      <section className="mt-8 px-5">
        <h2 className="text-headline-md font-bold text-on-surface mb-3">
          Explore by Category
        </h2>
        <div className="flex gap-2.5 overflow-x-auto pb-2 hide-scrollbar">
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.label}
              variant={selectedCategory === cat.label ? "selected" : "outlined"}
              color="primary"
              icon={<Icon name={cat.icon} size={16} />}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.label ? null : cat.label
                )
              }
              className="shrink-0"
            >
              {cat.label}
            </Chip>
          ))}
        </div>
      </section>

      {/* ===== Popular Destinations ===== */}
      <section className="mt-6">
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="text-headline-md font-bold text-on-surface">
            {selectedCategory
              ? `${selectedCategory} Trips`
              : "Popular Destinations"}
          </h2>
        </div>

        {loading ? (
          <GridCardsSkeleton />
        ) : filteredPopular.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 px-5">
            {filteredPopular.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <Icon
              name="travel_explore"
              size={48}
              className="mx-auto text-on-surface-variant/40"
            />
            <p className="mt-3 text-body-md text-on-surface-variant">
              No trips found for this category
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
