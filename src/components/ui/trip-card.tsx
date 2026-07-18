"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn, formatCurrency, formatCategory, formatDateRange } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { FavoriteButton } from "@/components/ui/favorite-button";
import type { TripCardData } from "@/types";

/**
 * Shared trip card used across Home, Search and other browse surfaces so the
 * card design stays consistent everywhere. Compact image card with a lime
 * accent, seats-left badge, days/nights, price and an animated arrow button.
 *
 * When a trip has more than one image the cover becomes a mini gallery:
 * left/right arrows appear on hover so the user can flip through manually.
 */
export function TripCard({ trip }: { trip: TripCardData }) {
  const spotsLeft = trip.maxGroupSize - trip.currentBookings;

  // Cover first, then the rest — de-duplicated (the images array usually already
  // leads with the cover). Falls back to a placeholder when there's nothing.
  const images = Array.from(
    new Set([trip.coverImage, ...(trip.images ?? [])].filter(Boolean))
  );
  if (images.length === 0) images.push("/placeholder-trip.jpg");
  const hasMultiple = images.length > 1;

  const [index, setIndex] = useState(0);

  // Arrows/dots live inside the card <Link>, so stop navigation on interaction.
  const step = (e: React.MouseEvent, dir: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + dir + images.length) % images.length);
  };

  return (
    <Link href={`/trips/${trip.id}`} className="group block rounded-[24px]">
      <div className="relative h-[228px] overflow-hidden rounded-[24px] bg-primary sm:h-[280px]">
        {/* Image stack — crossfade between the active photo */}
        {images.map((src, i) => (
          <Image
            key={src + i}
            src={src}
            alt={trip.title}
            fill
            className={cn(
              "object-cover transition-[opacity,transform] duration-[600ms] ease-out group-hover:scale-[1.07]",
              i === index ? "opacity-100" : "opacity-0"
            )}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ))}
        {/* Tint overlay — darker toward the bottom to highlight the info, fading
            to transparent so the top of the photo stays bright. */}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Gallery controls — hover-only manual arrows + dots (multi-image only) */}
        {hasMultiple && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={(e) => step(e, -1)}
              className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:bg-black/60 group-hover:opacity-100"
            >
              <Icon name="chevron_left" size={20} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={(e) => step(e, 1)}
              className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:bg-black/60 group-hover:opacity-100"
            >
              <Icon name="chevron_right" size={20} />
            </button>
          </>
        )}

        {/* top row: seats-left (left) + favourite (right) */}
        <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold text-on-surface">
            <Icon name="event_seat" filled size={12} />
            {spotsLeft > 0 ? `${spotsLeft}/${trip.maxGroupSize} left` : "Full"}
          </span>
          <FavoriteButton tripId={trip.id} size={18} />
        </div>

        {/* bottom content — text-shadow keeps it readable now that the dark
            gradient is gone */}
        <div className="absolute inset-x-3 bottom-3 z-10 text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.85)]">
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
              {formatCategory(trip.category)}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-white/80">
              <Icon name="schedule" filled size={11} className="text-lime" />
              {trip.duration}D / {Math.max(trip.duration - 1, 0)}N
            </span>
          </div>
          <div className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-white/80">
            <Icon name="location_on" filled size={12} className="shrink-0 text-lime" />
            <span className="truncate">{trip.destination}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-white/70">
            <Icon name="calendar_today" filled size={11} className="shrink-0 text-lime" />
            {formatDateRange(trip.startDate, trip.endDate)}
          </div>
          <div className="mt-2 flex items-end justify-between gap-2">
            <div>
              <span className="text-[9px] uppercase tracking-wide text-white/55">From</span>
              <div className="text-[15px] font-bold leading-none">{formatCurrency(trip.basePricePaise)}</div>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime text-on-surface transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 [text-shadow:none]">
              <Icon name="arrow_outward" size={18} filled style={{ color: "#181818" }} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
