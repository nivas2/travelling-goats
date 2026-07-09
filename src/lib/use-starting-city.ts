"use client";

import { useCallback, useEffect, useState } from "react";

export interface ServedCity {
  id: string;
  name: string;
  icon?: string | null;
  tripCount?: number;
  pickupPoints?: { id: string; name: string }[];
}

// Collapse spelling variants / nearby twins onto a single comparison key so a
// geolocated "Bengaluru" matches a pickup city stored as "Bangalore", etc.
const ALIASES: Record<string, string> = {
  bengaluru: "bangalore",
  bengalooru: "bangalore",
  bangalore: "bangalore",
  secunderabad: "hyderabad",
  hyderabad: "hyderabad",
};

function norm(name?: string | null): string {
  if (!name) return "";
  const key = name.trim().toLowerCase().replace(/\s+/g, " ");
  return ALIASES[key] ?? key;
}

/**
 * Central logic for "which starting city is the user served from".
 *
 * Trips currently depart only from a small set of pickup cities (Bengaluru,
 * Hyderabad…). This hook detects the user's city purely from device
 * geolocation (profile city is intentionally ignored), compares it against the
 * served pickup cities, and exposes helpers so the UI can nudge users from
 * unserved locations to pick one of the available starting cities.
 */
export function useStartingCity() {
  const [servedCities, setServedCities] = useState<ServedCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("tg_selected_city")
      : null
  );
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  // True once the geolocation attempt has settled (granted, denied, or errored).
  const [geoResolved, setGeoResolved] = useState(false);
  // Fallback: the permission prompt can stay pending forever if the user never
  // answers it (the getCurrentPosition timeout only starts after a grant), so
  // after a short grace period we stop waiting on geolocation.
  const [waited, setWaited] = useState(false);

  // Served pickup cities.
  useEffect(() => {
    let alive = true;
    fetch("/api/pickup-points?withTripCounts=true")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive && j?.success) setServedCities(j.data ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Manually selected city (shared with the top-nav location via localStorage).
  // Initial value comes from the lazy useState initializer above; here we only
  // subscribe to later changes.
  useEffect(() => {
    const read = () => setSelectedCity(localStorage.getItem("tg_selected_city"));
    window.addEventListener("storage", read);
    window.addEventListener("tg-city-change", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("tg-city-change", read);
    };
  }, []);

  // Stop waiting on a pending permission prompt after a short grace period.
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Device geolocation → reverse-geocoded city. Detection is geolocation-only.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      queueMicrotask(() => setGeoResolved(true));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const r = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`);
          const d = await r.json();
          setDetectedCity(d?.city ?? null);
        } catch {
          /* keep unresolved */
        } finally {
          setGeoResolved(true);
        }
      },
      () => setGeoResolved(true),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  }, []);

  const chooseCity = useCallback((name: string | null) => {
    if (name) localStorage.setItem("tg_selected_city", name);
    else localStorage.removeItem("tg_selected_city");
    setSelectedCity(name);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("tg-city-change"));
    }
  }, []);

  // Only cities that actually have trips departing are choosable — a served city
  // with zero trips (e.g. a newly added one) shouldn't be recommended.
  const bookableCities = servedCities.filter((c) => (c.tripCount ?? 0) > 0);

  const bookableNorms = new Set(bookableCities.map((c) => norm(c.name)));
  const selectedServed =
    !!selectedCity && bookableNorms.has(norm(selectedCity));
  const detectedServed =
    !!detectedCity && bookableNorms.has(norm(detectedCity));

  // The user has a valid starting city if they explicitly picked a bookable one
  // OR their geolocation resolves to a bookable city.
  const isServed = selectedServed || detectedServed;

  // Only meaningful once we actually know the served cities.
  const ready = !loading && servedCities.length > 0;

  // Geolocation has settled enough to act on (resolved, or grace window elapsed
  // because the permission prompt was ignored).
  const resolved = geoResolved || waited;

  // Whether to surface the "pick a starting city" prompt. This is keyed on
  // GEOLOCATION only (not the persisted selection) so it re-runs on every load —
  // a past choice doesn't permanently suppress it. The consumer handles
  // per-load dismissal once the user picks a city. Requires at least one
  // bookable city to offer.
  const shouldPrompt =
    ready &&
    bookableCities.length > 0 &&
    !detectedServed &&
    resolved;

  return {
    servedCities,
    bookableCities,
    selectedCity,
    detectedCity,
    geoResolved,
    resolved,
    ready,
    isServed,
    shouldPrompt,
    selectedServed,
    detectedServed,
    chooseCity,
  };
}
