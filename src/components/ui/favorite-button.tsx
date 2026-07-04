"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { useWishlistStore } from "@/stores/wishlist-store";

interface FavoriteButtonProps {
  tripId: string;
  /** Heart icon size in px. Defaults to 20. */
  size?: number;
  className?: string;
}

/**
 * Heart toggle for saving a trip to favourites. Safe to place inside a card
 * <Link> — it stops the click from navigating.
 */
export function FavoriteButton({ tripId, size = 20, className }: FavoriteButtonProps) {
  const saved = useWishlistStore((s) => s.ids.has(tripId));
  const toggle = useWishlistStore((s) => s.toggle);
  const ensureLoaded = useWishlistStore((s) => s.ensureLoaded);

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from favourites" : "Save to favourites"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(tripId);
      }}
      className={cn(
        "flex items-center justify-center rounded-full bg-white/85 shadow-md backdrop-blur",
        "transition hover:bg-white active:scale-90",
        className
      )}
      style={{ width: size + 16, height: size + 16 }}
    >
      <Icon
        name="favorite"
        filled={saved}
        size={size}
        className={cn(
          "transition-colors duration-200",
          saved ? "text-primary" : "text-on-surface-variant"
        )}
      />
    </button>
  );
}
