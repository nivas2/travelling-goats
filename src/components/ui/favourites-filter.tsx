"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

export type TripView = "all" | "favourites";

interface FavouritesFilterProps {
  value: TripView;
  onChange: (value: TripView) => void;
  /** Optional badge count shown next to "Favourites". */
  favouriteCount?: number;
  className?: string;
}

/**
 * Segmented toggle to filter a trip list between everything and saved favourites.
 */
export function FavouritesFilter({
  value,
  onChange,
  favouriteCount,
  className,
}: FavouritesFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter trips"
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-surface-container-high/60 p-1",
        className
      )}
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "all"}
        onClick={() => onChange("all")}
        className={cn(
          "rounded-full px-4 py-1.5 text-label-lg font-semibold transition-colors",
          value === "all"
            ? "bg-surface-container-lowest text-on-surface shadow-sm"
            : "text-on-surface-variant hover:text-on-surface"
        )}
      >
        All
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "favourites"}
        onClick={() => onChange("favourites")}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-label-lg font-semibold transition-colors",
          value === "favourites"
            ? "bg-surface-container-lowest text-primary shadow-sm"
            : "text-on-surface-variant hover:text-on-surface"
        )}
      >
        <Icon name="favorite" filled={value === "favourites"} size={16} />
        Favourites
        {typeof favouriteCount === "number" && favouriteCount > 0 && (
          <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 text-label-sm font-bold text-primary">
            {favouriteCount}
          </span>
        )}
      </button>
    </div>
  );
}
