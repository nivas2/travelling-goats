"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { cityLandmark } from "@/lib/city-landmarks";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { ReferralCard } from "@/components/home/referral-card";
import { RecentlyViewed } from "@/components/home/recently-viewed";
import { CuratedCollections } from "@/components/home/curated-collections";
import { Skeleton } from "@/components/ui/skeleton";
import { TripCarousel } from "@/components/ui/trip-carousel";
import { TripCard } from "@/components/ui/trip-card";
import { OffersBanner } from "@/components/ui/offers-banner";
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

// Fallback category chips (used only when the CMS "home.categories" block is
// empty). `match` = the trip category/categories the chip filters by.
const CATEGORIES = [
  { label: "Treks", icon: "directions_walk", match: "TREK,ADVENTURE,MOUNTAIN" },
  { label: "Camping", icon: "camping", match: "CAMPFIRE" },
  { label: "Adventure", icon: "hiking", match: "ADVENTURE" },
  { label: "Beach", icon: "beach_access", match: "BEACH" },
  { label: "Mountain", icon: "landscape", match: "MOUNTAIN" },
  { label: "Cultural", icon: "temple_hindu", match: "CULTURAL" },
  { label: "Wildlife", icon: "pets", match: "WILDLIFE" },
  { label: "Road Trip", icon: "directions_car", match: "ROAD_TRIP" },
  { label: "City", icon: "location_city", match: "CITY" },
  { label: "Spiritual", icon: "self_improvement", match: "SPIRITUAL" },
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
    desc: "Verified, women-friendly groups",
    tint: "bg-primary/10",
    fg: "text-primary",
  },
  {
    icon: "diversity_3",
    title: "Meet New Friends",
    desc: "Bond with your travel crew",
    tint: "bg-secondary/10",
    fg: "text-secondary",
  },
  {
    icon: "map",
    title: "Fully Planned Trips",
    desc: "Just show up & explore",
    tint: "bg-success/10",
    fg: "text-success",
  },
  {
    icon: "verified_user",
    title: "Transparent Pricing",
    desc: "No hidden charges, ever",
    tint: "bg-tertiary/15",
    fg: "text-tertiary",
  },
];

// Colour palette applied to perk cards by index (content-editable perks only
// carry icon/title/desc; the tints stay design-controlled here).
// Consistent icon treatment across all perks: lime circle + dark icon.
const PERK_TINTS = [
  { tint: "bg-lime", fg: "text-on-surface" },
  { tint: "bg-lime", fg: "text-on-surface" },
  { tint: "bg-lime", fg: "text-on-surface" },
  { tint: "bg-lime", fg: "text-on-surface" },
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

  // Live weather for the greeting chip — uses the user's ACTUAL location
  // (geolocation → lat/lng, most accurate), falling back to the opted/detected
  // city name only when geolocation is denied or unavailable. (Open-Meteo via /api/weather.)
  const [weather, setWeather] = useState<{ tempC: number; icon: string } | null>(null);
  useEffect(() => {
    let active = true;
    const load = (url: string) =>
      fetch(url)
        .then((r) => r.json())
        .then((d) => {
          if (active && d?.available) setWeather({ tempC: d.tempC, icon: d.icon });
        })
        .catch(() => {});

    const place = activeStartingCity ?? startingCity.detectedCity;
    const byPlace = () => {
      if (place) load(`/api/weather?place=${encodeURIComponent(place)}`);
    };

    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (active) load(`/api/weather?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
        },
        () => byPlace(), // permission denied / error → fall back to city name
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
      );
    } else {
      byPlace();
    }

    return () => {
      active = false;
    };
  }, [activeStartingCity, startingCity.detectedCity]);

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
    : [{ label: "Treks", icon: "directions_walk", match: "TREK,ADVENTURE,MOUNTAIN" }, ...baseCategories];

  // Admin-controlled map of chip label → the trip categories it filters by,
  // read from each chip's CMS "match" field (comma-separated enum values).
  const categoryMatch: Record<string, string[]> = {};
  for (const c of categories) {
    if (c.match)
      categoryMatch[c.label] = c.match
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
  }

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
      // Load a large page so the client-side category/city/favourite filters
      // work across the full catalogue (the API defaults to just 10 trips).
      params.set("pageSize", "100");
      const res = await fetch(`/api/trips?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        // API returns paginated { items: [...], total, page, ... }
        const items = Array.isArray(json.data) ? json.data : (json.data.items ?? []);
        // Home only browses upcoming trips — drop any whose departure has
        // already passed (they can't be booked and show no countdown).
        const now = Date.now();
        const upcoming = items.filter(
          (t: TripCardData) => new Date(t.startDate).getTime() > now
        );
        setTrips(upcoming);
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

  // Does a trip belong to the given category label? Prefers the admin-configured
  // "match" filters (categoryMatch); falls back to built-in aliases for known
  // virtual chips, then to a plain label match.
  const matchesCategory = (t: TripCardData, category: string) => {
    const cat = t.category.toUpperCase();
    const configured = categoryMatch[category];
    if (configured?.length) return configured.includes(cat);
    if (category === "Treks") return ["TREK", "ADVENTURE", "MOUNTAIN"].includes(cat);
    if (category === "Camping" || category === "Campfire") return cat === "CAMPFIRE";
    return normCategory(t.category) === normCategory(category);
  };

  // Trips for the selected category — shown inline right under the category
  // chips (mirrors "Explore by destination"), so the result is next to the tap.
  const categoryTrips = selectedCategory
    ? trips.filter((t) => matchesCategory(t, selectedCategory))
    : [];

  // The Popular / Favourites grid is independent of the category + destination
  // chips (those drive their own inline results) — it only reacts to the
  // All / Favourites toggle.
  const filteredPopular = trips.filter((t) =>
    view === "favourites" ? savedIds.has(t.id) : true
  );

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

      {/* Departure city selector — pick a served city; trips re-render for it. */}
      {startingCity.bookableCities.length > 0 && (
        <div className="px-5 pt-4">
          <div className="mb-2 flex items-center gap-1.5 text-label-sm font-semibold text-on-surface-variant">
            <Icon name="directions_bus" size={15} filled className="text-primary" />
            Departing from
          </div>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 hide-scrollbar">
            {startingCity.bookableCities.map((c) => {
              const active =
                c.name.toLowerCase() === (activeStartingCity ?? "").toLowerCase();
              const landmark = cityLandmark(c.name, 64);
              return (
                <button
                  key={c.id ?? c.name}
                  type="button"
                  onClick={() => handleCityChange(c.name)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border py-1.5 pr-3.5 text-label-md font-medium transition-colors",
                    landmark ? "pl-1.5" : "pl-3.5",
                    active
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant bg-surface text-on-surface hover:border-primary/40"
                  )}
                >
                  {landmark ? (
                    /* Iconic city landmark (Charminar, Vidhana Soudha, …) */
                    <span
                      className={cn(
                        "relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1",
                        active ? "ring-on-primary/40" : "ring-black/10"
                      )}
                    >
                      <Image src={landmark} alt="" fill sizes="28px" className="object-cover" />
                    </span>
                  ) : (
                    <Icon
                      name="location_city"
                      size={16}
                      filled
                      className={active ? "text-on-primary" : "text-primary"}
                    />
                  )}
                  {c.name}
                  {typeof c.tripCount === "number" && (
                    <span
                      className={cn(
                        "text-label-sm",
                        active ? "text-on-primary/80" : "text-on-surface-variant"
                      )}
                    >
                      · {c.tripCount}
                    </span>
                  )}
                </button>
              );
            })}
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
            <p className="text-[17px] font-medium text-on-surface-variant">
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
          {/* Live weather chip — keyed on the active city; hidden until data loads. */}
          {weather && (
            <div className="flex shrink-0 items-center gap-2">
              <span
                className="material-symbols-outlined text-[26px] text-on-surface"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {weather.icon}
              </span>
              <div className="leading-tight">
                <div className="text-[10px] font-medium text-on-surface-variant">Weather</div>
                <div className="text-[14px] font-bold text-on-surface">{weather.tempC}°C</div>
              </div>
            </div>
          )}
        </div>

        {/* Search + filter */}
        <div className="mt-5 flex items-center gap-2.5">
          <button
            onClick={() => router.push("/search")}
            className="glass flex h-12 flex-1 items-center gap-3 rounded-2xl px-4 text-left transition-transform active:scale-[0.99]"
          >
            <Icon name="search" size={22} className="text-on-surface-variant" />
            <span className="text-body-md text-on-surface-variant">{sect.searchPlaceholder}</span>
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

        {/* ===== Trust strip — quick reassurance under the search ===== */}
        {show("perks") && (
          <div className="-mx-5 mt-4 flex gap-2.5 overflow-x-auto px-5 pb-1 hide-scrollbar md:mx-0 md:grid md:grid-cols-4 md:gap-3 md:overflow-visible md:px-0">
            {perks.map((perk) => (
              <div
                key={perk.title}
                className="flex w-[230px] shrink-0 items-start gap-2.5 rounded-2xl border border-outline-variant bg-surface px-3.5 py-3 md:w-auto md:shrink"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime">
                  <Icon name={perk.icon} filled size={18} style={{ color: "#181818" }} />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[13px] font-semibold leading-tight text-on-surface">
                    {perk.title}
                  </span>
                  {perk.desc && (
                    <span className="mt-0.5 text-[11px] leading-snug text-on-surface-variant">
                      {perk.desc}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ===== Explore by destination ===== */}
        {destCities.length > 1 && (
          <div className="mt-10">
            <h2 className="mb-4 text-[30px] font-semibold tracking-[-0.02em] text-on-surface">
              Explore by destination
            </h2>
            <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pt-1.5 pb-4 hide-scrollbar">
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

        {/* ===== Explore by Category ===== */}
        {show("categories") && (
          <div className="mt-10">
            <h2 className="mb-4 text-[30px] font-semibold tracking-[-0.02em] text-on-surface">
              {sect.categoriesTitle}
            </h2>
            <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pt-1.5 pb-4 hide-scrollbar">
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

            {/* Results for the selected category */}
            {selectedCategory && (
              <div className="mt-5">
                {categoryTrips.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
                    {categoryTrips.map((trip) => (
                      <TripCard key={trip.id} trip={trip} />
                    ))}
                  </div>
                ) : (
                  <p className="py-6 text-center text-body-md text-on-surface-variant">
                    No {selectedCategory} trips right now.
                  </p>
                )}
              </div>
            )}
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
            <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pt-5 pb-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
      </section>

      {/* ===== Recently viewed ===== */}
      <RecentlyViewed trips={trips} />

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

      {/* ===== Browse collections ===== */}
      {!loading && <CuratedCollections trips={trips} />}

      {/* ===== Weekend Getaways ===== */}
      <section className="mt-8">
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="text-[30px] font-semibold tracking-[-0.02em] text-on-surface">
            {sect.weekendTitle}
          </h2>
          <button
            onClick={() => router.push("/search?duration=1,2,3")}
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

      {/* ===== Promotional offer banners (mid-scroll break) ===== */}
      {show("offers") && (
        <section className="mt-8 px-5">
          <div className="-mx-5">
            <OffersBanner offers={offers} />
          </div>
        </section>
      )}

      {/* ===== Popular Destinations / Favourites ===== */}
      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 mb-3">
          <h2 className="text-[30px] font-semibold tracking-[-0.02em] text-on-surface">
            {view === "favourites" ? "Your Favourites" : sect.popularTitle}
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
                  className="inline-flex items-center gap-2 rounded-full bg-surface px-6 py-3 text-label-lg font-semibold text-on-surface border border-outline-variant shadow-[0_2px_10px_rgba(20,30,40,0.05)] transition active:scale-[0.98]"
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
              description="No trips available right now. Check back soon!"
            />
          </div>
        )}
      </section>

      {/* ===== Refer & earn ===== */}
      <ReferralCard />

      {/* ===== #meetMyRoute footer ===== */}
      <footer className="px-5 pb-10 pt-20 text-center">
        <h2 className="text-[clamp(38px,12vw,72px)] font-semibold leading-[0.9] tracking-[-0.045em] text-on-surface">
          Meet My{" "}
          <span className="inline-block rounded-[0.12em] bg-lime px-[0.12em] leading-none">
            Route
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-[14px] leading-relaxed text-on-surface-variant">
          Curated group adventures across India — planned end to end,
          so all you have to do is show up and explore.
        </p>
        <p className="mt-8 text-[12px] text-on-surface-variant/70">
          © 2026 Meet My Route. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
