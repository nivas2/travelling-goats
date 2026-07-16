"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import { Chip } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { TripCard } from "@/components/ui/trip-card";
import {
  TripFilterSheet,
  activeFilterCount,
  type TripFilters,
} from "@/components/ui/trip-filter-sheet";
import type { TripCardData, ApiResponse } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_FILTERS = [
  { label: "All", value: "" },
  { label: "Adventure", value: "Adventure" },
  { label: "Beach", value: "Beach" },
  { label: "Mountain", value: "Mountain" },
  { label: "Cultural", value: "Cultural" },
  { label: "Wildlife", value: "Wildlife" },
  { label: "Road Trip", value: "Road Trip" },
  { label: "City", value: "City" },
  { label: "Spiritual", value: "Spiritual" },
];

const RECENT_SEARCHES_KEY = "travellinggoats_recent_searches";
const MAX_RECENT_SEARCHES = 8;

/** First segment of a "City, Region" destination string. */
const cityOf = (dest?: string) => (dest ? dest.split(",")[0].trim() : "");

/** Client-side filters that the /api/trips endpoint doesn't support. */
interface ClientFilters {
  durations: number[]; // 5 means "5+ days"
  city: string; // destination city
}

function matchesClientFilters(trip: TripCardData, f: ClientFilters): boolean {
  if (f.city && cityOf(trip.destination) !== f.city) return false;
  if (f.durations.length) {
    const ok = f.durations.some((d) =>
      d >= 5 ? trip.duration >= 5 : trip.duration === d
    );
    if (!ok) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (!query.trim()) return;
  const searches = getRecentSearches().filter(
    (s) => s.toLowerCase() !== query.toLowerCase()
  );
  searches.unshift(query.trim());
  localStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify(searches.slice(0, MAX_RECENT_SEARCHES))
  );
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

// ---------------------------------------------------------------------------
// Search Page
// ---------------------------------------------------------------------------

export default function SearchPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [results, setResults] = useState<TripCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Price bounds (paise) + client-side filters coming from the home filter sheet.
  const [minPrice, setMinPrice] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<string | null>(null);
  const [clientFilters, setClientFilters] = useState<ClientFilters>({
    durations: [],
    city: "",
  });
  const [filterOpen, setFilterOpen] = useState(false);
  // Destination cities to offer in the filter sheet (captured from results).
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  // Keep the latest price/client filters available to performSearch without
  // making it a dependency-churning callback. Updated wherever these filters
  // change (mount effect / applyFilterSheet / clearExtraFilters) — never during
  // render.
  const filtersRef = useRef({ minPrice, maxPrice, clientFilters });

  // Debounced search
  const performSearch = useCallback(
    async (searchQuery: string, category: string) => {
      const { minPrice, maxPrice, clientFilters } = filtersRef.current;
      const anyFilter =
        !!searchQuery.trim() ||
        !!category ||
        minPrice != null ||
        maxPrice != null ||
        clientFilters.durations.length > 0 ||
        !!clientFilters.city;

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      // The API filters on the enum value (e.g. ROAD_TRIP), but the chips use
      // display labels (e.g. "Road Trip") — normalise before querying.
      if (category) params.set("category", category.toUpperCase().replace(/\s+/g, "_"));
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      // Ask for a large page so client-side duration/city filters have enough
      // to work with (the API defaults to a small page).
      params.set("pageSize", "100");

      try {
        setLoading(true);
        setHasSearched(anyFilter);
        const res = await fetch(`/api/trips?${params.toString()}`);
        const json = await res.json();
        const items: TripCardData[] =
          json.success && json.data
            ? Array.isArray(json.data)
              ? json.data
              : (json.data.items ?? [])
            : [];
        // Grow the destination-city option list from the server-filtered set.
        setCityOptions((prev) => {
          const set = new Set(prev);
          items.forEach((t) => {
            const c = cityOf(t.destination);
            if (c) set.add(c);
          });
          return Array.from(set).sort();
        });
        setResults(items.filter((t) => matchesClientFilters(t, clientFilters)));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Focus input on mount + seed filters from the URL (?category, ?minPrice,
  // ?maxPrice, ?duration=1,2, ?city=...), then run the initial search.
  useEffect(() => {
    inputRef.current?.focus();
    setRecentSearches(getRecentSearches());

    const sp = new URLSearchParams(window.location.search);
    const category = sp.get("category") ?? "";
    const min = sp.get("minPrice");
    const max = sp.get("maxPrice");
    const durations = (sp.get("duration") ?? "")
      .split(",")
      .map((s) => parseInt(s, 10))
      .filter((n) => !Number.isNaN(n));
    const city = sp.get("city") ?? "";
    const q = sp.get("search") ?? "";

    setActiveCategory(category);
    setMinPrice(min);
    setMaxPrice(max);
    setClientFilters({ durations, city });
    setQuery(q);
    filtersRef.current = {
      minPrice: min,
      maxPrice: max,
      clientFilters: { durations, city },
    };
    performSearch(q, category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(value, activeCategory);
    }, 400);
  };

  const handleSubmit = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim()) {
      saveRecentSearch(query);
      setRecentSearches(getRecentSearches());
    }
    performSearch(query, activeCategory);
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    saveRecentSearch(search);
    setRecentSearches(getRecentSearches());
    performSearch(search, activeCategory);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    performSearch(query, category);
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  // Extra filters (price / duration / city) carried in from the home filter
  // sheet — surfaced as a clearable summary chip.
  const extraFilters = [
    ...clientFilters.durations.map((d) => (d >= 5 ? "5+ days" : `${d} day${d > 1 ? "s" : ""}`)),
    ...(minPrice || maxPrice
      ? [
          `${formatCurrency(Number(minPrice) || 0)}${maxPrice ? `–${formatCurrency(Number(maxPrice))}` : "+"}`,
        ]
      : []),
    ...(clientFilters.city ? [clientFilters.city] : []),
  ];

  const clearExtraFilters = () => {
    setMinPrice(null);
    setMaxPrice(null);
    setClientFilters({ durations: [], city: "" });
    filtersRef.current = {
      minPrice: null,
      maxPrice: null,
      clientFilters: { durations: [], city: "" },
    };
    performSearch(query, activeCategory);
  };

  // ----- Filter sheet (tune icon) --------------------------------------------
  const currentFilters: TripFilters = {
    durations: clientFilters.durations,
    minPriceRupees: minPrice ? Number(minPrice) / 100 : null,
    maxPriceRupees: maxPrice ? Number(maxPrice) / 100 : null,
    category: activeCategory,
    city: clientFilters.city,
  };

  const applyFilterSheet = (next: TripFilters) => {
    const nextMin = next.minPriceRupees != null ? String(next.minPriceRupees * 100) : null;
    const nextMax = next.maxPriceRupees != null ? String(next.maxPriceRupees * 100) : null;
    const nextClient = { durations: next.durations, city: next.city };
    setActiveCategory(next.category);
    setMinPrice(nextMin);
    setMaxPrice(nextMax);
    setClientFilters(nextClient);
    filtersRef.current = {
      minPrice: nextMin,
      maxPrice: nextMax,
      clientFilters: nextClient,
    };
    setFilterOpen(false);
    performSearch(query, next.category);
  };

  const totalFilterCount = activeFilterCount(currentFilters);

  return (
    <div className="min-h-screen bg-background">
      {/* ===== Filter sheet ===== */}
      <TripFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={currentFilters}
        categories={CATEGORY_FILTERS.filter((c) => c.value).map((c) => c.label)}
        cities={cityOptions}
        onApply={applyFilterSheet}
      />

      {/* ===== Search Header ===== */}
      <div className="sticky top-0 z-30 bg-background">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-5 py-3 md:px-6">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
            aria-label="Go back"
          >
            <Icon name="arrow_back" size={22} className="text-on-surface" />
          </button>

          <div className="relative flex-1">
            <Icon
              name="search"
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Search trips, destinations..."
              className={cn(
                "w-full rounded-full bg-surface-container-low",
                "border border-outline-variant",
                "h-11 pl-11 pr-11 text-body-md text-on-surface",
                "placeholder:text-on-surface-variant/50",
                "focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10",
                "transition-all"
              )}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                  performSearch("", activeCategory);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                aria-label="Clear search"
              >
                <Icon name="close" size={20} />
              </button>
            )}
          </div>

          {/* Filter (tune) */}
          <button
            onClick={() => setFilterOpen(true)}
            aria-label="Filter trips"
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container-low transition-colors hover:bg-surface-container-high"
          >
            <Icon name="tune" size={22} className="text-on-surface" />
            {totalFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-on-primary">
                {totalFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Category Quick Filters */}
        <div className="mx-auto flex w-full max-w-7xl gap-3 overflow-x-auto px-5 pb-3 hide-scrollbar md:px-6">
          {CATEGORY_FILTERS.map((cat) => (
            <Chip
              key={cat.value}
              variant={activeCategory === cat.value ? "selected" : "outlined"}
              color="primary"
              onClick={() => handleCategoryChange(cat.value)}
              className="shrink-0"
            >
              {cat.label}
            </Chip>
          ))}
        </div>

        {/* Active extra filters (from the home filter sheet) */}
        {extraFilters.length > 0 && (
          <div className="mx-auto flex w-full max-w-7xl items-center gap-2 overflow-x-auto px-5 pb-3 hide-scrollbar md:px-6">
            {extraFilters.map((label) => (
              <span
                key={label}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/12 px-3 py-1 text-label-sm font-medium text-primary"
              >
                {label}
              </span>
            ))}
            <button
              onClick={clearExtraFilters}
              className="inline-flex shrink-0 items-center gap-1 text-label-sm font-semibold text-on-surface-variant hover:text-on-surface"
            >
              <Icon name="close" size={14} />
              Clear
            </button>
          </div>
        )}
      </div>

      {/* ===== Content ===== */}
      <div className="px-5 py-4 md:px-6">
        {/* Recent Searches (show when no search/results) */}
        {!hasSearched && !loading && results.length === 0 && recentSearches.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-title-lg font-title-lg text-on-surface">
                Recent Searches
              </h3>
              <button
                onClick={handleClearRecent}
                className="text-label-sm font-semibold text-primary"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {recentSearches.map((search, i) => (
                <button
                  key={`${search}-${i}`}
                  onClick={() => handleRecentSearchClick(search)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5",
                    "text-left transition-colors",
                    "hover:bg-surface-container-low"
                  )}
                >
                  <Icon
                    name="history"
                    size={20}
                    className="text-on-surface-variant shrink-0"
                  />
                  <span className="text-body-md text-on-surface flex-1">
                    {search}
                  </span>
                  <Icon
                    name="north_west"
                    size={16}
                    className="text-on-surface-variant/50 shrink-0"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="card" height={280} className="rounded-[24px]" />
            ))}
          </div>
        )}

        {/* Trip list — Popular (browse) or Search results */}
        {!loading && results.length > 0 && (
          <div>
            <div className="mb-4 flex items-end justify-between">
              <h1 className="text-[26px] font-bold tracking-[-0.02em] text-on-surface">
                {hasSearched ? "Results" : "Popular trails"}
              </h1>
              <span className="text-label-sm font-medium text-on-surface-variant">
                {results.length} trail{results.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
              {results.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && hasSearched && results.length === 0 && (
          <EmptyState
            icon="search_off"
            title="No trails found"
            description={`No trails match your search. Try a different path.`}
            action={{
              label: "Explore Trails",
              onClick: () => {
                setQuery("");
                setActiveCategory("");
                setHasSearched(false);
                inputRef.current?.focus();
              },
            }}
            className="mt-12"
          />
        )}

        {/* Initial State (no recent searches) */}
        {!hasSearched && !loading && results.length === 0 && recentSearches.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center">
            <Icon
              name="travel_explore"
              size={64}
              className="text-on-surface-variant/30"
            />
            <h3 className="mt-4 text-title-lg font-semibold text-on-surface">
              Discover Your Next Adventure
            </h3>
            <p className="mt-2 max-w-xs text-body-md text-on-surface-variant">
              Search for trips by destination, activity, or anything that excites you
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
