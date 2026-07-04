"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, formatCurrency, formatDateRange } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { TripCarousel } from "@/components/ui/trip-carousel";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { FavouritesFilter, type TripView } from "@/components/ui/favourites-filter";
import { useWishlistStore } from "@/stores/wishlist-store";
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
// Perks / Value Props (shown in place of the hero)
// ---------------------------------------------------------------------------

const PERKS = [
  {
    icon: "health_and_safety",
    title: "Women-Safe Travel",
    desc: "Verified captains & women-friendly groups for worry-free trips.",
    tint: "bg-primary/10",
    fg: "text-primary",
  },
  {
    icon: "diversity_3",
    title: "Meet New Friends",
    desc: "Bond with like-minded travelers on every group journey.",
    tint: "bg-secondary/10",
    fg: "text-secondary",
  },
  {
    icon: "map",
    title: "Fully Planned Trips",
    desc: "Handpicked itineraries — just pack your bags and show up.",
    tint: "bg-success/10",
    fg: "text-success",
  },
  {
    icon: "verified_user",
    title: "Transparent Pricing",
    desc: "No hidden charges. Secure payments with clear inclusions.",
    tint: "bg-tertiary/15",
    fg: "text-tertiary",
  },
];

// Rotating "go travel" prompts shown under the greeting.
const PROVOCATIONS = [
  "The mountains are calling — answer with a group trip this weekend.",
  "New places, new friends, unforgettable memories. Your next adventure is one tap away.",
  "Life's short and India's big. Where will you wander next?",
  "Pack light, travel far — your crew is already waiting.",
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
          {/* Favourite heart */}
          <div className="absolute right-3 top-3">
            <FavoriteButton tripId={trip.id} size={18} />
          </div>
          {/* Spots left badge */}
          {spotsLeft <= 5 && spotsLeft > 0 && (
            <div className="absolute right-3 bottom-3">
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

// ---------------------------------------------------------------------------
// Skeleton Loaders
// ---------------------------------------------------------------------------

function GridCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 px-5 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
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
  const [view, setView] = useState<TripView>("all");

  const savedIds = useWishlistStore((s) => s.ids);
  const ensureWishlistLoaded = useWishlistStore((s) => s.ensureLoaded);

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("Welcome");
  const [provoke, setProvoke] = useState(PROVOCATIONS[0]);

  useEffect(() => {
    ensureWishlistLoaded();
  }, [ensureWishlistLoaded]);

  // Time-based greeting + a random travel prompt (client-only to avoid hydration mismatch).
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    setProvoke(PROVOCATIONS[Math.floor(Math.random() * PROVOCATIONS.length)]);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/users")
      .then((r) => r.json())
      .then((j) => {
        if (active) setDisplayName((j?.data ?? j?.user ?? j)?.name ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const firstName = displayName?.trim().split(" ")[0] || null;

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/trips");
      const json = await res.json();
      if (json.success && json.data) {
        // API returns paginated { items: [...], total, page, ... }
        const items = Array.isArray(json.data) ? json.data : (json.data.items ?? []);
        setTrips(items);
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

  const trendingTrips = trips.filter((t) => t.isTrending);
  const weekendGetaways = trips.filter((t) => t.duration <= 3);
  const favouriteCount = trips.filter((t) => savedIds.has(t.id)).length;

  const filteredPopular = trips
    .filter((t) =>
      selectedCategory
        ? t.category.toLowerCase() === selectedCategory.toLowerCase()
        : true
    )
    .filter((t) => (view === "favourites" ? savedIds.has(t.id) : true));

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

      {/* ===== Greeting + Perks ===== */}
      <section className="px-5 pt-5 md:pt-8">
        <p className="text-label-lg font-semibold text-primary">
          {greeting} &#128075;
        </p>
        <h1 className="mt-1 text-headline-md font-bold tracking-[-0.01em] text-on-surface md:text-headline-lg">
          {firstName
            ? `Hey ${firstName}, ready for your next adventure?`
            : "Ready for your next adventure?"}
        </h1>
        <p className="mt-1.5 max-w-2xl text-body-md text-on-surface-variant md:text-body-lg">
          {provoke}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:mt-6 md:grid-cols-4 md:gap-4">
          {PERKS.map((perk) => (
            <Card key={perk.title} className="flex flex-col gap-3 p-4">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl",
                  perk.tint
                )}
              >
                <Icon name={perk.icon} filled size={24} className={perk.fg} />
              </div>
              <div>
                <h3 className="text-title-md font-semibold text-on-surface">
                  {perk.title}
                </h3>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  {perk.desc}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ===== Trending Now ===== */}
      <section className="mt-8">
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="text-title-lg font-title-lg text-on-surface">
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
          <div className="px-5">
            <Skeleton
              variant="rectangular"
              height={300}
              className="rounded-3xl"
            />
          </div>
        ) : (
          <TripCarousel
            trips={trendingTrips.length > 0 ? trendingTrips : trips.slice(0, 5)}
          />
        )}
      </section>

      {/* ===== Weekend Getaways ===== */}
      <section className="mt-8">
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="text-title-lg font-title-lg text-on-surface">
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
          <div className="grid grid-cols-2 gap-3 px-5 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {(weekendGetaways.length > 0
              ? weekendGetaways
              : trips.slice(0, 4)
            ).map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>

      {/* ===== Category Chips ===== */}
      <section className="mt-8 px-5">
        <h2 className="text-title-lg font-title-lg text-on-surface mb-3">
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

      {/* ===== Popular Destinations / Favourites ===== */}
      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 mb-3">
          <h2 className="text-title-lg font-title-lg text-on-surface">
            {view === "favourites"
              ? selectedCategory
                ? `${selectedCategory} Favourites`
                : "Your Favourites"
              : selectedCategory
                ? `${selectedCategory} Trips`
                : "Popular Destinations"}
          </h2>
          <FavouritesFilter
            value={view}
            onChange={setView}
            favouriteCount={favouriteCount}
          />
        </div>

        {loading ? (
          <GridCardsSkeleton />
        ) : filteredPopular.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 px-5 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {filteredPopular.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : view === "favourites" ? (
          <div className="px-5 py-16 text-center">
            <Icon
              name="favorite"
              size={48}
              className="mx-auto text-on-surface-variant/40"
            />
            <p className="mt-3 text-body-md text-on-surface-variant">
              No favourites yet — tap the{" "}
              <Icon
                name="favorite"
                size={16}
                className="inline align-text-bottom text-primary"
              />{" "}
              on any trip to save it here.
            </p>
          </div>
        ) : (
          <div className="px-5 py-16 text-center">
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
