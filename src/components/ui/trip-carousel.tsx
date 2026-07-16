"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn, formatCurrency, formatDateRange, formatCategory } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { FavoriteButton } from "@/components/ui/favorite-button";
import type { TripCardData } from "@/types";

interface TripCarouselProps {
  trips: TripCardData[];
  /** Auto-advance interval in ms. Set to 0 to disable autoplay. */
  interval?: number;
}

export function TripCarousel({ trips, interval = 3000 }: TripCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = trips.length;

  const goTo = (i: number) => setIndex(((i % count) + count) % count);

  // Autoplay — restarts whenever the slide changes so manual nav gets a full interval.
  useEffect(() => {
    if (paused || interval <= 0 || count <= 1) return;
    const id = setInterval(() => setIndex((p) => (p + 1) % count), interval);
    return () => clearInterval(id);
  }, [paused, interval, count, index]);

  if (count === 0) return null;

  return (
    <div
      className="px-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="group relative overflow-hidden rounded-3xl">
        {/* Slides track */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="relative block h-[300px] w-full shrink-0 md:h-[400px]"
            >
              <Image
                src={trip.coverImage || "/placeholder-trip.jpg"}
                alt={trip.title}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Spots-left badge — dark chip so the lime "Trending" pill stays the accent */}
              <div className="absolute left-5 top-16 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[12px] font-bold text-white backdrop-blur-md">
                <Icon name="event_seat" size={13} filled className="text-lime" />
                {Math.max(trip.maxGroupSize - trip.currentBookings, 0)}/{trip.maxGroupSize} left
              </div>

              {/* Trending badge */}
              <div className="absolute left-5 top-5 flex items-center gap-1.5 rounded-full bg-lime px-3 py-1.5">
                <Icon
                  name="local_fire_department"
                  size={16}
                  filled
                  className="text-on-surface"
                />
                <span className="text-label-sm font-semibold text-on-surface">
                  Trending
                </span>
              </div>

              {/* Favourite heart */}
              <div className="absolute right-5 top-5">
                <FavoriteButton tripId={trip.id} size={20} />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                <span className="mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur md:text-[12px]">
                  {formatCategory(trip.category)}
                </span>
                <h3 className="text-title-lg font-bold text-white text-shadow-premium md:text-headline-lg">
                  {trip.title}
                </h3>
                <div className="mt-2 flex min-w-0 items-center gap-2 text-[13px] font-medium text-white/85">
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <Icon name="location_on" size={15} filled className="shrink-0 text-lime" />
                    <span className="truncate">{trip.destination}</span>
                  </span>
                  <span className="text-white/35">·</span>
                  <span className="inline-flex shrink-0 items-center gap-1">
                    <Icon name="schedule" size={14} filled className="text-lime" />
                    {trip.duration}D / {Math.max(trip.duration - 1, 0)}N
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[12px] text-white/70">
                  <Icon name="calendar_today" size={13} filled className="text-lime" />
                  {formatDateRange(trip.startDate, trip.endDate)}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="rounded-full bg-lime px-5 py-2 text-label-lg font-semibold text-on-surface">
                    Explore Trip &rarr;
                  </span>
                  <span className="text-title-md font-bold text-white">
                    {formatCurrency(trip.basePricePaise)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Arrows — paired on the right (top area) so they never overlap the
            bottom-left content; fade in on hover. */}
        {count > 1 && (
          <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
            <button
              type="button"
              aria-label="Previous trip"
              onClick={() => goTo(index - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-on-surface shadow-md backdrop-blur transition hover:bg-white active:scale-95"
            >
              <Icon name="chevron_left" size={24} />
            </button>
            <button
              type="button"
              aria-label="Next trip"
              onClick={() => goTo(index + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-on-surface shadow-md backdrop-blur transition hover:bg-white active:scale-95"
            >
              <Icon name="chevron_right" size={24} />
            </button>
          </div>
        )}

      </div>

      {/* Dots — below the card so they never overlap the content */}
      {count > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {trips.map((trip, i) => (
            <button
              key={trip.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-on-surface/25 hover:bg-on-surface/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
