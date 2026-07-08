"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { asList, type ContentMap } from "@/lib/content/registry";

interface City {
  id: string;
  name: string;
  icon: string;
}

const DEFAULT_CITIES: City[] = [
  { id: "bengaluru", name: "Bengaluru", icon: "apartment" },
  { id: "mumbai", name: "Mumbai", icon: "location_city" },
  { id: "delhi-ncr", name: "Delhi NCR", icon: "domain" },
  { id: "hyderabad", name: "Hyderabad", icon: "mosque" },
  { id: "chennai", name: "Chennai", icon: "temple_hindu" },
  { id: "pune", name: "Pune", icon: "fort" },
];

export default function PickupCityPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cities, setCities] = useState<City[]>(DEFAULT_CITIES);

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then((j) => {
        if (j?.success) {
          const items = asList((j.data as ContentMap)["onboarding.cities"]);
          if (items.length > 0) {
            setCities(items.map((i) => ({ id: i.id, name: i.name, icon: i.icon })));
          }
        }
      })
      .catch(() => {});
  }, []);

  async function handleContinue() {
    if (!selected) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupCity: selected }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to save city.");
        return;
      }

      router.push("/permissions");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="px-6 pt-safe">
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 text-body-md text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <Icon name="arrow_back" size={20} />
          </button>

          <span className="text-label-sm text-on-surface-variant">
            Step 4 of 5
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-6 pt-6">
        <div className="mb-6">
          <h1 className="text-headline-md font-headline-md text-on-surface">
            Your pickup city
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Select the city you&apos;ll most likely depart from. We&apos;ll show
            trips near you.
          </p>
        </div>

        {/* City Grid */}
        <div className="grid grid-cols-2 gap-3">
          {cities.map((city) => {
            const isSelected = selected === city.id;
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => {
                  setSelected(city.id);
                  if (error) setError("");
                }}
                className={cn(
                  "relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary-fixed/20 shadow-md"
                    : "border-outline-variant bg-surface-container-lowest hover:border-outline hover:bg-surface-container-low"
                )}
              >
                {/* City icon */}
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                    isSelected
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant"
                  )}
                >
                  <Icon name={city.icon} size={24} />
                </div>

                {/* City name */}
                <span
                  className={cn(
                    "text-title-md font-semibold transition-colors",
                    isSelected ? "text-primary" : "text-on-surface"
                  )}
                >
                  {city.name}
                </span>

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary">
                    <Icon name="check" size={14} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <p
            className="mt-4 text-center text-label-sm text-error"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>

      {/* Bottom action */}
      <div className="px-6 pb-8 pb-safe pt-4">
        <Button
          type="button"
          fullWidth
          size="lg"
          loading={loading}
          disabled={!selected}
          onClick={handleContinue}
          className="rounded-full"
        >
          Keep Trekking
        </Button>
      </div>
    </div>
  );
}
