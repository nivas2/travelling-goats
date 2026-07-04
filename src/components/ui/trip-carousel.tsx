"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn, formatCurrency, formatDateRange } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Chip } from "@/components/ui/chip";
import { FavoriteButton } from "@/components/ui/favorite-button";
import type { TripCardData } from "@/types";

interface TripCarouselProps {
  trips: TripCardData[];
  /** Auto-advance interval in ms. Set to 0 to disable autoplay. */
  interval?: number;
}

export function TripCarousel({ trips, interval = 5000 }: TripCarouselProps) {
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
      <div className="relative overflow-hidden rounded-3xl">
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

              {/* Trending badge */}
              <div className="absolute left-5 top-5 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-md">
                <Icon
                  name="local_fire_department"
                  size={16}
                  filled
                  className="text-tertiary"
                />
                <span className="text-label-sm font-semibold text-white">
                  Trending
                </span>
              </div>

              {/* Favourite heart */}
              <div className="absolute right-5 top-5">
                <FavoriteButton tripId={trip.id} size={20} />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                <Chip variant="filled" color="primary" className="mb-2">
                  {trip.category}
                </Chip>
                <h3 className="text-headline-md font-bold text-white text-shadow-premium md:text-headline-lg">
                  {trip.title}
                </h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-md text-white/85">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="location_on" size={16} />
                    {trip.destination}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="calendar_today" size={14} />
                    {formatDateRange(trip.startDate, trip.endDate)} &middot;{" "}
                    {trip.duration}D
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="star" size={15} filled className="text-tertiary" />
                    {trip.rating.toFixed(1)} ({trip.reviewCount})
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="rounded-full bg-white px-5 py-2 text-label-lg font-semibold text-primary">
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

        {/* Arrows */}
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous trip"
              onClick={() => goTo(index - 1)}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-on-surface shadow-md backdrop-blur transition hover:bg-white active:scale-95"
            >
              <Icon name="chevron_left" size={24} />
            </button>
            <button
              type="button"
              aria-label="Next trip"
              onClick={() => goTo(index + 1)}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-on-surface shadow-md backdrop-blur transition hover:bg-white active:scale-95"
            >
              <Icon name="chevron_right" size={24} />
            </button>
          </>
        )}

        {/* Dots */}
        {count > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {trips.map((trip, i) => (
              <button
                key={trip.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
