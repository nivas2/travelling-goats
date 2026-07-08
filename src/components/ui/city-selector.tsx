"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

interface City {
  id: string;
  name: string;
  icon?: string | null;
  tripCount?: number;
}

interface CitySelectorProps {
  cities: City[];
  selectedCity: string | null;
  onCityChange: (city: string | null) => void;
  loading?: boolean;
}

export function CitySelector({
  cities,
  selectedCity,
  onCityChange,
  loading,
}: CitySelectorProps) {
  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-24 animate-pulse rounded-full bg-surface-container-low shrink-0"
          />
        ))}
      </div>
    );
  }

  if (cities.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
      <button
        onClick={() => onCityChange(null)}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-label-md font-medium shrink-0",
          "border transition-all duration-200",
          selectedCity === null
            ? "bg-primary text-on-primary border-primary"
            : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary/30"
        )}
      >
        <Icon name="public" size={16} />
        All Cities
      </button>
      {cities.map((city) => (
        <button
          key={city.id}
          onClick={() =>
            onCityChange(selectedCity === city.name ? null : city.name)
          }
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-label-md font-medium shrink-0",
            "border transition-all duration-200",
            selectedCity === city.name
              ? "bg-primary text-on-primary border-primary"
              : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary/30"
          )}
        >
          {city.icon && <Icon name={city.icon} size={16} />}
          {city.name}
        </button>
      ))}
    </div>
  );
}
