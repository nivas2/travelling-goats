"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn, formatCurrency, formatCategory, formatDateRange } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { timeUntil, fullCountdown, type TimeLeft } from "@/lib/countdown";
import type { TripCardData } from "@/types";

/** Live running departure counter — a full-width ribbon across the top of the
 *  card ("Departs in 7d 12h 03m 02s"), ticking every second. */
function DepartureCountdown({ startDate }: { startDate: string }) {
  const [t, setT] = useState<TimeLeft | null>(null);
  useEffect(() => {
    const tick = () => setT(timeUntil(startDate));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [startDate]);

  if (!t || t.past) return null;

  return (
    <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-center gap-1.5 border-b border-lime/25 bg-black/45 px-3 py-1.5 backdrop-blur-md">
      <Icon name="schedule" filled size={12} className="shrink-0 text-lime" />
      <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/70">
        Departs in
      </span>
      <span className="text-[11px] font-bold tabular-nums tracking-tight text-white">
        {fullCountdown(t)}
      </span>
    </div>
  );
}

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
    <Link href={`/trips/${trip.id}`} className="lp-lift group block rounded-[24px]">
      <div className="relative h-[280px] overflow-hidden rounded-[24px] bg-primary transition-[box-shadow] duration-300 group-hover:shadow-[0_20px_34px_rgba(20,40,30,0.16)]">
        {/* Image stack — crossfade between the active photo */}
        {images.map((src, i) => (
          <Image
            key={src + i}
            src={src}
            alt={trip.title}
            fill
            className={cn(
              "object-cover transition-opacity duration-500",
              i === index ? "opacity-100" : "opacity-0"
            )}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#181818]/90 via-[#181818]/15 to-[#181818]/15" />

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

        {/* Live departure countdown ribbon across the top of the card */}
        <DepartureCountdown startDate={trip.startDate} />

        {/* top row: seats-left (left) + favourite (right) — below the ribbon */}
        <div className="absolute inset-x-3 top-10 z-10 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold text-on-surface">
            <Icon name="event_seat" filled size={12} />
            {spotsLeft > 0 ? `${spotsLeft}/${trip.maxGroupSize} left` : "Full"}
          </span>
          <FavoriteButton tripId={trip.id} size={18} />
        </div>

        {/* bottom content */}
        <div className="absolute inset-x-3 bottom-3 z-10 text-white">
          <span className="mb-1.5 inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
            {formatCategory(trip.category)}
          </span>
          <div className="mb-0.5 flex items-center gap-2 text-[11px] font-medium text-white/80">
            <span className="inline-flex min-w-0 flex-1 items-center gap-1">
              <Icon name="location_on" filled size={12} className="text-lime" />
              <span className="truncate">{trip.destination}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1">
              <Icon name="schedule" filled size={11} className="text-lime" />
              {trip.duration}D / {Math.max(trip.duration - 1, 0)}N
            </span>
          </div>
          <div className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-white/70">
            <Icon name="calendar_today" filled size={11} className="shrink-0 text-lime" />
            {formatDateRange(trip.startDate, trip.endDate)}
          </div>
          <h3 className="line-clamp-2 text-[15px] font-bold leading-tight">{trip.title}</h3>
          <div className="mt-2 flex items-end justify-between gap-2">
            <div>
              <span className="text-[9px] uppercase tracking-wide text-white/55">From</span>
              <div className="text-[15px] font-bold leading-none">{formatCurrency(trip.basePricePaise)}</div>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime text-on-surface transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
              <Icon name="arrow_outward" size={18} filled style={{ color: "#181818" }} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
