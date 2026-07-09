"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, formatCurrency, formatCategory } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { TripCarousel } from "@/components/ui/trip-carousel";
import { InspirationCarousel } from "@/components/ui/inspiration-carousel";
import { OffersBanner } from "@/components/ui/offers-banner";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { FavouritesFilter, type TripView } from "@/components/ui/favourites-filter";
import { StartingCityGate } from "@/components/ui/starting-city-notice";
import {
  TripFilterSheet,
  EMPTY_FILTERS,
  activeFilterCount,
  type TripFilters,
} from "@/components/ui/trip-filter-sheet";
import { useStartingCity } from "@/lib/use-starting-city";
import { useWishlistStore } from "@/stores/wishlist-store";
import { asList, asObject, type ContentMap } from "@/lib/content/registry";
import type { TripCardData, ApiResponse } from "@/types";

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { label: "Treks", icon: "terrain" },
  { label: "Adventure", icon: "hiking" },
  { label: "Beach", icon: "beach_access" },
  { label: "Mountain", icon: "landscape" },
  { label: "Cultural", icon: "temple_hindu" },
  { label: "Wildlife", icon: "pets" },
  { label: "Road Trip", icon: "directions_car" },
  { label: "City", icon: "location_city" },
  { label: "Spiritual", icon: "self_improvement" },
];

// Normalise category labels/enum values so "Road Trip" matches "ROAD_TRIP".
const normCategory = (s: string) => s.toLowerCase().replace(/[\s_]+/g, "");

// First segment of a destination, used as its "city" (e.g. "Coorg, Karnataka" → "Coorg").
const cityOf = (dest?: string) => (dest ? dest.split(",")[0].trim() : "");

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

// Colour palette applied to perk cards by index (content-editable perks only
// carry icon/title/desc; the tints stay design-controlled here).
// Consistent icon treatment across all perks: lime circle + dark icon.
const PERK_TINTS = [
  { tint: "bg-[#C6F135]", fg: "text-[#181D27]" },
  { tint: "bg-[#C6F135]", fg: "text-[#181D27]" },
  { tint: "bg-[#C6F135]", fg: "text-[#181D27]" },
  { tint: "bg-[#C6F135]", fg: "text-[#181D27]" },
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
    <Link href={`/trips/${trip.id}`} className="lp-lift group block">
      <div className="relative h-[280px] overflow-hidden rounded-[24px] bg-[#181D27] [transform:translateZ(0)]">
        <Image
          src={trip.coverImage || "/placeholder-trip.jpg"}
          alt={trip.title}
          fill
          className="object-cover transition-transform duration-[1.1s] group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F16]/90 via-[#0B0F16]/15 to-[#0B0F16]/15" />

        {/* top row: rating + favourite */}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <span className="lp-glass-dark inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold text-white">
            <Icon name="star" filled size={13} className="text-[#C6F135]" /> {trip.rating.toFixed(1)}
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur">
            <FavoriteButton tripId={trip.id} size={16} />
          </span>
        </div>

        {/* seats-left badge — shown on every trip (left / total) */}
        <span className="absolute left-3 top-12 inline-flex items-center gap-1 rounded-full bg-[#C6F135] px-2 py-0.5 text-[10px] font-bold text-[#181D27]">
          <Icon name="event_seat" filled size={12} />
          {spotsLeft > 0 ? `${spotsLeft}/${trip.maxGroupSize} left` : "Full"}
        </span>

        {/* bottom content */}
        <div className="absolute inset-x-3 bottom-3 text-white">
          <span className="mb-1.5 inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
            {formatCategory(trip.category)}
          </span>
          <div className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-white/80">
            <Icon name="location_on" filled size={12} className="text-[#C6F135]" />
            <span className="truncate">{trip.destination}</span>
          </div>
          <h3 className="line-clamp-2 text-[15px] font-bold leading-tight">{trip.title}</h3>
          <div className="mt-2 flex items-end justify-between gap-2">
            <div>
              <span className="text-[9px] uppercase tracking-wide text-white/55">From</span>
              <div className="text-[15px] font-bold leading-none">{formatCurrency(trip.basePricePaise)}</div>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C6F135] text-[#181D27] transition-transform group-hover:rotate-12">
              <Icon name="arrow_outward" size={18} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

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
  const [showAllPopular, setShowAllPopular] = useState(false);
  const POPULAR_LIMIT = 12; // ~6 rows on the 2-col mobile grid
  const [cityFilter, setCityFilter] = useState<string | null>(null); // destination city

  const savedIds = useWishlistStore((s) => s.ids);
  const ensureWishlistLoaded = useWishlistStore((s) => s.ensureLoaded);

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("Welcome");
  const [provoke, setProvoke] = useState(PROVOCATIONS[0]);
  const [content, setContent] = useState<ContentMap | null>(null);

  // City filtering
  const [cities, setCities] = useState<Array<{ id: string; name: string; icon?: string | null; tripCount?: number }>>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Starting-city coverage: detect (via geolocation) whether the user is in a
  // city we actually depart from, so we can nudge unserved users to pick one.
  const startingCity = useStartingCity();
  // User re-opened the chooser to switch to a different starting city.
  const [cityModalOpen, setCityModalOpen] = useState(false);

  // Trip filter sheet (opened via the tune icon beside search).
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<TripFilters>(EMPTY_FILTERS);
  const filterCount = activeFilterCount(filters);

  // Turn the chosen filters into a /search query and navigate there.
  function applyFilters(next: TripFilters) {
    setFilters(next);
    setFilterOpen(false);
    const params = new URLSearchParams();
    if (next.category) params.set("category", next.category);
    if (next.city) params.set("city", next.city);
    if (next.durations.length) params.set("duration", next.durations.join(","));
    if (next.minPriceRupees != null)
      params.set("minPrice", String(next.minPriceRupees * 100));
    if (next.maxPriceRupees != null)
      params.set("maxPrice", String(next.maxPriceRupees * 100));
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  }
  // Session flag: set once the user picks a starting city so the forced gate
  // shows only ONCE per session. Unlike component state it survives reloads and
  // in-app navigation (sessionStorage), but clears when the tab/session ends —
  // so a returning visitor is asked again next session, and the choice sticks
  // for the whole current one.
  const [cityChosenThisSession, setCityChosenThisSession] = useState(
    () =>
      typeof window !== "undefined" &&
      sessionStorage.getItem("tg_city_gate_done") === "1"
  );

  const markCityChosenThisSession = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("tg_city_gate_done", "1");
    }
    setCityChosenThisSession(true);
  }, []);

  // Force the location chooser only until the user picks a city this session.
  const forceCityGate = startingCity.shouldPrompt && !cityChosenThisSession;

  // The starting city currently in effect (a bookable one), if any.
  const activeStartingCity = startingCity.selectedServed
    ? selectedCity
    : startingCity.detectedServed
      ? startingCity.detectedCity
      : null;

  // Full record for the opted starting city (pickup points, trip count).
  const optedCity =
    startingCity.bookableCities.find(
      (c) => c.name.toLowerCase() === (activeStartingCity ?? "").toLowerCase()
    ) ?? null;

  // Filter trips by the opted starting city — but only if it actually has
  // pickup points to depart from. Falls back to any manual selection.
  const originFilter =
    optedCity && (optedCity.pickupPoints?.length ?? 0) > 0
      ? optedCity.name
      : selectedCity;

  useEffect(() => {
    ensureWishlistLoaded();
  }, [ensureWishlistLoaded]);

  // Fetch pickup cities
  useEffect(() => {
    let active = true;
    fetch("/api/pickup-points?withTripCounts=true")
      .then((r) => r.json())
      .then((j) => {
        if (active && j?.success) {
          setCities(j.data ?? []);
          // Restore persisted city selection
          const saved = localStorage.getItem("tg_selected_city");
          if (saved && j.data?.some((c: { name: string }) => c.name === saved)) {
            setSelectedCity(saved);
          }
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Persist city selection (and notify the nav's location display)
  function handleCityChange(city: string | null) {
    setSelectedCity(city);
    if (city) localStorage.setItem("tg_selected_city", city);
    else localStorage.removeItem("tg_selected_city");
    if (typeof window !== "undefined") window.dispatchEvent(new Event("tg-city-change"));
  }

  // Admin-editable content (perks, categories, greeting prompts).
  useEffect(() => {
    let active = true;
    fetch("/api/content")
      .then((r) => r.json())
      .then((j) => {
        if (active && j?.success) setContent(j.data as ContentMap);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Resolve content blocks, falling back to built-in defaults.
  const provocations = content
    ? asList(content["home.provocations"]).map((p) => p.text).filter(Boolean)
    : [];
  const provokeList = provocations.length ? provocations : PROVOCATIONS;

  const perkSource = content ? asList(content["home.perks"]) : [];
  const perks = (perkSource.length ? perkSource : PERKS).map((p, i) => ({
    icon: p.icon,
    title: p.title,
    desc: p.desc,
    ...PERK_TINTS[i % PERK_TINTS.length],
  }));

  const categorySource = content ? asList(content["home.categories"]) : [];
  const baseCategories = categorySource.length ? categorySource : CATEGORIES;
  // Always surface the "Treks" category first (even if CMS categories omit it).
  const categories = baseCategories.some((c) => c.label === "Treks")
    ? baseCategories
    : [{ label: "Treks", icon: "terrain" }, ...baseCategories];

  const greetingBlock = asObject(content?.["home.greeting"]);
  const greetingTemplate = greetingBlock.template || "Hey {name}, ready for your next adventure?";
  const greetingFallback = greetingBlock.fallback || "Ready for your next adventure?";

  const vis = asObject(content?.["home.visibility"]);
  const show = (k: string) => vis[k] !== "false"; // default: visible


  const offers = asList(content?.["home.offers"]).map((o) => ({
    title: o.title,
    subtitle: o.subtitle,
    badge: o.badge,
    color: o.color,
    ctaText: o.ctaText,
    link: o.link,
    image: o.image,
  }));

  const inspirationSlides = asList(content?.["home.inspirationSlides"]).map((sl) => ({
    img: sl.img,
    tag: sl.tag,
    icon: sl.icon,
    quote: sl.quote,
    author: sl.author,
  }));

  const s = asObject(content?.["home.sections"]);
  const sect = {
    searchPlaceholder: s.searchPlaceholder || "Search trips, destinations...",
    trendingTitle: s.trendingTitle || "Trending Now",
    weekendTitle: s.weekendTitle || "Weekend Getaways",
    categoriesTitle: s.categoriesTitle || "Explore by Category",
    popularTitle: s.popularTitle || "Popular Destinations",
  };

  // Time-based greeting + a random travel prompt (client-only to avoid hydration mismatch).
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    setProvoke(provokeList[Math.floor(Math.random() * provokeList.length)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

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
      const params = new URLSearchParams();
      if (originFilter) params.set("origin", originFilter);
      const res = await fetch(`/api/trips${params.toString() ? `?${params}` : ""}`);
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
  }, [originFilter]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const trendingTrips = trips.filter((t) => t.isTrending);
  const weekendGetaways = trips.filter((t) => t.duration <= 3);
  const favouriteCount = trips.filter((t) => savedIds.has(t.id)).length;
  const recommended = (trendingTrips.length ? trendingTrips : trips).slice(0, 6);

  // Cities with trips (for "no trips" suggestion)
  const citiesWithTrips = cities.filter((c) => (c.tripCount ?? 0) > 0);
  const noTripsForCity = selectedCity && !loading && trips.length === 0;

  const filteredPopular = trips
    .filter((t) => {
      if (!selectedCategory) return true;
      // "Treks" is a virtual category spanning trekking-style trips.
      if (selectedCategory === "Treks")
        return ["ADVENTURE", "MOUNTAIN"].includes(t.category.toUpperCase());
      return normCategory(t.category) === normCategory(selectedCategory);
    })
    .filter((t) => (cityFilter ? cityOf(t.destination) === cityFilter : true))
    .filter((t) => (view === "favourites" ? savedIds.has(t.id) : true));

  // Destination cities present in the loaded trips (for the city filter).
  const destCities = Array.from(
    new Set(trips.map((t) => cityOf(t.destination)).filter(Boolean))
  ).sort() as string[];

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* ===== Starting-city coverage gate =====
              Runs on every load. When the user isn't in a city we run trips from
              it's a hard block (must choose); the user can also reopen it any
              time via the pill below to switch to a different starting city. */}
      <StartingCityGate
        open={forceCityGate || cityModalOpen}
        onClose={() => setCityModalOpen(false)}
        dismissible={!forceCityGate}
        cities={startingCity.bookableCities}
        selectedCity={selectedCity}
        detectedCity={startingCity.detectedCity}
        onChoose={(name) => {
          handleCityChange(name);
          markCityChosenThisSession();
          setCityModalOpen(false);
        }}
      />

      {/* ===== Trip filter sheet (tune icon beside search) ===== */}
      <TripFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={filters}
        categories={CATEGORIES.map((c) => c.label)}
        cities={destCities}
        onApply={applyFilters}
      />

      {/* Location detail (mobile + desktop) — the user's current (detected)
          location and the starting point they've opted for, with its pickup
          points + trips. "Change" reopens the chooser. */}
      {startingCity.bookableCities.length > 0 && (
        <div className="px-5 pt-4">
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
              {/* Locations + meta */}
              <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-x-8 md:gap-y-2">
                {/* Current location (from geolocation) */}
                <div className="flex items-center gap-2">
                  <Icon name="my_location" size={16} className="text-on-surface-variant" />
                  <span className="text-label-sm text-on-surface-variant">Current location</span>
                  <span className="text-label-md font-medium text-on-surface">
                    {startingCity.detectedCity ?? "Unknown"}
                  </span>
                </div>
                {/* Opted starting point */}
                <div className="flex items-center gap-2">
                  <Icon name="directions_bus" size={16} filled className="text-primary" />
                  <span className="text-label-sm text-on-surface-variant">Departing from</span>
                  <span className="text-label-md font-semibold text-on-surface">
                    {activeStartingCity ?? "Not chosen"}
                  </span>
                </div>
                {/* Pickup points + trips for the opted city */}
                {optedCity && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-label-sm text-on-surface-variant">
                      <Icon name="pin_drop" size={14} />
                      {optedCity.pickupPoints?.length ?? 0} pickup point
                      {(optedCity.pickupPoints?.length ?? 0) === 1 ? "" : "s"}
                    </span>
                    <span className="text-on-surface-variant/40">·</span>
                    <span className="inline-flex items-center gap-1 text-label-sm text-on-surface-variant">
                      <Icon name="hiking" size={14} />
                      {optedCity.tripCount ?? 0} trip
                      {(optedCity.tripCount ?? 0) === 1 ? "" : "s"} available
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setCityModalOpen(true)}
                className="shrink-0 self-start rounded-full border border-outline-variant px-4 py-1.5 text-label-md font-medium text-primary transition-colors hover:bg-surface-container md:self-auto"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== No Trips Suggestion ===== */}
      {noTripsForCity && (
        <div className="mx-5 mt-3 rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <p className="text-body-md text-on-surface">
            No trips from <span className="font-semibold text-primary">{selectedCity}</span> right now.
          </p>
          {citiesWithTrips.length > 0 && (
            <p className="mt-1.5 text-body-sm text-on-surface-variant">
              Available from:{" "}
              {citiesWithTrips.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && ", "}
                  <button
                    onClick={() => handleCityChange(c.name)}
                    className="text-primary font-medium hover:underline"
                  >
                    {c.name}
                  </button>
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      {/* ===== Greeting + Perks ===== */}
      <section className="px-5 pt-5 md:pt-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-normal text-on-surface-variant">
              {greeting} &#128075;
            </p>
            <h1 className="mt-2 text-[clamp(40px,12vw,56px)] leading-[1.02] tracking-[-0.035em] text-on-surface">
              {(() => {
                const t = firstName
                  ? greetingTemplate.replace(/\{name\}/g, firstName)
                  : greetingFallback;
                const i = t.indexOf(",");
                if (i === -1) return <span className="font-semibold">{t}</span>;
                return (
                  <>
                    <span className="block font-light text-on-surface/80">{t.slice(0, i + 1)}</span>
                    <span className="block font-semibold">{t.slice(i + 1).trim()}</span>
                  </>
                );
              })()}
            </h1>
          </div>
          {/* Weather chip — reference element. Static placeholder; wire to a
              weather API keyed on the user's pickup city when available. */}
          <div className="flex shrink-0 items-center gap-2">
            <span
              className="material-symbols-outlined text-[26px] text-[#181D27]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              partly_cloudy_day
            </span>
            <div className="leading-tight">
              <div className="text-[10px] font-medium text-on-surface-variant">Weather</div>
              <div className="text-[14px] font-bold text-on-surface">24°C</div>
            </div>
          </div>
        </div>

        {/* Search + filter */}
        <div className="mt-5 flex items-center gap-2.5">
          <button
            onClick={() => router.push("/search")}
            className="glass flex h-12 flex-1 items-center gap-3 rounded-2xl px-4 text-left transition-transform active:scale-[0.99]"
          >
            <Icon name="search" size={22} className="text-on-surface-variant" />
            <span className="text-body-md text-on-surface-variant/60">{sect.searchPlaceholder}</span>
          </button>
          <button
            onClick={() => setFilterOpen(true)}
            aria-label="Filter trips"
            className="glass relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform active:scale-[0.97]"
          >
            <Icon name="tune" size={22} className="text-on-surface" />
            {filterCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-on-primary">
                {filterCount}
              </span>
            )}
          </button>
        </div>

        {/* ===== Explore by destination ===== */}
        {destCities.length > 1 && (
          <div className="mt-10">
            <h2 className="mb-4 text-[30px] font-semibold tracking-[-0.02em] text-on-surface">
              Explore by destination
            </h2>
            <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-2 hide-scrollbar">
              <Chip
                variant={!cityFilter ? "selected" : "outlined"}
                color="primary"
                icon={<Icon name="public" size={16} />}
                onClick={() => setCityFilter(null)}
                className="shrink-0"
              >
                All destinations
              </Chip>
              {destCities.map((c) => (
                <Chip
                  key={c}
                  variant={cityFilter === c ? "selected" : "outlined"}
                  color="primary"
                  icon={<Icon name="location_on" size={16} />}
                  onClick={() => setCityFilter((prev) => (prev === c ? null : c))}
                  className="shrink-0"
                >
                  {c}
                </Chip>
              ))}
            </div>

            {/* Results for the selected destination */}
            {cityFilter && (() => {
              const cityTrips = trips.filter((t) => cityOf(t.destination) === cityFilter);
              return (
                <div className="mt-5">
                  {cityTrips.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
                      {cityTrips.map((trip) => (
                        <TripCard key={trip.id} trip={trip} />
                      ))}
                    </div>
                  ) : (
                    <p className="py-6 text-center text-body-md text-on-surface-variant">
                      No trips to {cityFilter} right now.
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Recommended — horizontal snap-scroll carousel (mobile + desktop) */}
        {recommended.length > 0 && (
          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[30px] font-semibold tracking-[-0.02em] text-on-surface">Recommended trips</h2>
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-on-surface-variant">
                Swipe to explore
                <Icon name="arrow_forward" size={14} />
              </span>
            </div>
            <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {recommended.map((trip) => (
                <div
                  key={trip.id}
                  className="w-[82%] shrink-0 snap-start sm:w-[46%] lg:w-[31%]"
                >
                  <TripCard trip={trip} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming-trip "Pack Your Bags!" reminder now lives in Notifications. */}

        {/* Promotional offer banners */}
        {show("offers") && (
          <div className="-mx-5 mt-5">
            <OffersBanner offers={offers} />
          </div>
        )}

        {/* Inspiration carousel — travel perks + quotes to provoke wanderlust */}
        {show("inspiration") && (
          <div className="mt-5 md:mt-6">
            <InspirationCarousel slides={inspirationSlides} />
          </div>
        )}

        {show("perks") && (
        <div className="mt-5 grid grid-cols-2 gap-3 md:mt-6 md:grid-cols-4 md:gap-4">
          {perks.map((perk) => (
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
        )}
      </section>

      {/* ===== Trending Now ===== */}
      <section className="mt-8">
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="text-[30px] font-semibold tracking-[-0.02em] text-on-surface">
            {sect.trendingTitle}
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
          <h2 className="text-[30px] font-semibold tracking-[-0.02em] text-on-surface">
            {sect.weekendTitle}
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
      {show("categories") && (
      <section className="mt-8 px-5">
        <h2 className="text-[30px] font-semibold tracking-[-0.02em] text-on-surface mb-3">
          {sect.categoriesTitle}
        </h2>
        <div className="flex gap-2.5 overflow-x-auto pb-2 hide-scrollbar">
          {categories.map((cat) => (
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
      )}

      {/* ===== Popular Destinations / Favourites ===== */}
      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 mb-3">
          <h2 className="text-[30px] font-semibold tracking-[-0.02em] text-on-surface">
            {view === "favourites"
              ? selectedCategory
                ? `${selectedCategory} Favourites`
                : "Your Favourites"
              : selectedCategory
                ? `${selectedCategory} Trips`
                : sect.popularTitle}
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
          <>
            <div className="grid grid-cols-2 gap-3 px-5 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
              {(showAllPopular ? filteredPopular : filteredPopular.slice(0, POPULAR_LIMIT)).map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
            {filteredPopular.length > POPULAR_LIMIT && (
              <div className="mt-6 flex justify-center px-5">
                <button
                  onClick={() => setShowAllPopular((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-on-surface ring-1 ring-black/[0.06] shadow-[0_2px_10px_rgba(20,30,40,0.05)] transition active:scale-[0.98]"
                >
                  {showAllPopular ? "Show less" : `Show all ${filteredPopular.length} trips`}
                  <Icon name={showAllPopular ? "expand_less" : "expand_more"} size={18} />
                </button>
              </div>
            )}
          </>
        ) : view === "favourites" ? (
          <div className="py-8">
            <EmptyState
              icon="favorite"
              title="No favourites yet"
              description="Tap the heart on any trip to save it here for later."
              action={{ label: "Browse trips", onClick: () => setView("all") }}
            />
          </div>
        ) : (
          <div className="py-8">
            <EmptyState
              icon="travel_explore"
              title="No trips found"
              description={
                cityFilter || selectedCategory
                  ? "Nothing matches these filters yet — try clearing them."
                  : "No trips available right now. Check back soon!"
              }
              action={
                cityFilter || selectedCategory
                  ? {
                      label: "Clear filters",
                      onClick: () => {
                        setCityFilter(null);
                        setSelectedCategory(null);
                      },
                    }
                  : undefined
              }
            />
          </div>
        )}
      </section>

      {/* ===== #travellingGoats footer ===== */}
      <footer className="px-5 pb-10 pt-20 text-center">
        <h2 className="text-[clamp(38px,12vw,72px)] font-semibold leading-[0.9] tracking-[-0.045em] text-on-surface">
          #travelling<span className="text-[#C6F135]">Goats</span>
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-[14px] leading-relaxed text-on-surface-variant">
          Curated group adventures across India — planned end to end,
          so all you have to do is show up and explore.
        </p>
        <p className="mt-8 text-[12px] text-on-surface-variant/70">
          © 2026 Travelling Goats. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
