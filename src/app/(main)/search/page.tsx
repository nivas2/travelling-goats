"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, formatCurrency, formatDateRange } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
  { label: "Camping", value: "Camping" },
];

const RECENT_SEARCHES_KEY = "meetmyroute_recent_searches";
const MAX_RECENT_SEARCHES = 8;

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
// Search Result Card
// ---------------------------------------------------------------------------

function SearchResultCard({ trip }: { trip: TripCardData }) {
  const spotsLeft = trip.maxGroupSize - trip.currentBookings;

  return (
    <Link href={`/trips/${trip.id}`} className="block">
      <Card clickable className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-xl">
          <Image
            src={trip.coverImage || "/placeholder-trip.jpg"}
            alt={trip.title}
            fill
            className="object-cover"
            sizes="100px"
          />
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-between py-0.5">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-label-lg font-semibold text-on-surface line-clamp-1 flex-1">
                {trip.title}
              </h3>
              <Chip
                variant="filled"
                color="secondary"
                className="text-[10px] px-2 py-0.5 shrink-0"
              >
                {trip.category}
              </Chip>
            </div>

            <div className="mt-1 flex items-center gap-1 text-label-sm text-on-surface-variant">
              <Icon name="location_on" size={13} className="text-primary" />
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
            <div className="flex items-center gap-1">
              <Icon name="star" size={14} filled className="text-tertiary" />
              <span className="text-label-sm font-semibold">
                {trip.rating.toFixed(1)}
              </span>
              {spotsLeft <= 5 && spotsLeft > 0 && (
                <span className="ml-1 text-[10px] font-bold text-error">
                  {spotsLeft} left
                </span>
              )}
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

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    setRecentSearches(getRecentSearches());
  }, []);

  // Debounced search
  const performSearch = useCallback(
    async (searchQuery: string, category: string) => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (category) params.set("category", category);

      if (!searchQuery.trim() && !category) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      try {
        setLoading(true);
        setHasSearched(true);
        const res = await fetch(`/api/trips?${params.toString()}`);
        const json = await res.json();
        if (json.success && json.data) {
          const items = Array.isArray(json.data) ? json.data : (json.data.items ?? []);
          setResults(items);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

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

  return (
    <div className="min-h-screen bg-background">
      {/* ===== Search Header ===== */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-outline-variant/10">
        <div className="flex items-center gap-2 px-4 py-3">
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
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Search trips, destinations..."
              className={cn(
                "w-full rounded-xl bg-surface-container-low",
                "border border-outline-variant",
                "h-11 pl-10 pr-10 text-body-md text-on-surface",
                "placeholder:text-on-surface-variant/50",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                "transition-all"
              )}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setHasSearched(false);
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                aria-label="Clear search"
              >
                <Icon name="close" size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Category Quick Filters */}
        <div className="flex gap-3 overflow-x-auto px-4 pb-3 hide-scrollbar">
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
      </div>

      {/* ===== Content ===== */}
      <div className="px-5 py-4">
        {/* Recent Searches (show when no search/results) */}
        {!hasSearched && !loading && recentSearches.length > 0 && (
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
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="card" height={108} />
            ))}
          </div>
        )}

        {/* Search Results */}
        {!loading && hasSearched && results.length > 0 && (
          <div>
            <p className="text-label-sm text-on-surface-variant mb-3">
              {results.length} trip{results.length !== 1 ? "s" : ""} found
            </p>
            <div className="flex flex-col gap-3">
              {results.map((trip) => (
                <SearchResultCard key={trip.id} trip={trip} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && hasSearched && results.length === 0 && (
          <EmptyState
            icon="search_off"
            title="No trips found"
            description={`We couldn't find any trips matching "${query || activeCategory}". Try adjusting your search or explore other categories.`}
            action={{
              label: "Explore Trips",
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
        {!hasSearched && !loading && recentSearches.length === 0 && (
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
