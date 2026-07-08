"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

// ---------------------------------------------------------------------------
// Slides — travel perks paired with inspiration quotes over real photos
// ---------------------------------------------------------------------------

interface Slide {
  tag: string;
  icon: string;
  quote: string;
  author: string;
  img: string;
  /** object-position focal point so the subject stays framed in the wide crop */
  pos?: string;
}


// ---------------------------------------------------------------------------

interface InspirationCarouselProps {
  /** Auto-advance interval in ms. Set to 0 to disable autoplay. */
  interval?: number;
  /** Admin-editable slides; falls back to the built-in set. */
  slides?: Slide[];
}

export function InspirationCarousel({ interval = 4500, slides }: InspirationCarouselProps) {
  const data = slides && slides.length ? slides : [];
  if (data.length === 0) return null;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = data.length;

  const goTo = (i: number) => setIndex(((i % count) + count) % count);

  useEffect(() => {
    if (paused || interval <= 0 || count <= 1) return;
    const id = setInterval(() => setIndex((p) => (p + 1) % count), interval);
    return () => clearInterval(id);
  }, [paused, interval, count, index]);

  return (
    <div
      className="relative overflow-hidden rounded-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides track */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {data.map((slide) => (
          <div
            key={slide.tag}
            className="relative flex h-[210px] w-full shrink-0 items-end overflow-hidden md:h-[300px]"
          >
            {/* Photo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.img}
              alt={slide.tag}
              style={{ objectPosition: slide.pos ?? "50% 50%" }}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Readability scrim */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Content */}
            <div className="relative z-10 max-w-[80%] p-5 pb-8 md:max-w-[64%] md:p-7 md:pb-9">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-label-sm font-semibold text-white backdrop-blur-sm ring-1 ring-white/25">
                <Icon name={slide.icon} size={15} filled />
                {slide.tag}
              </span>
              <p className="mt-3 text-title-lg font-bold leading-snug text-white text-shadow-premium md:text-headline-md">
                &ldquo;{slide.quote}&rdquo;
              </p>
              <p className="mt-1.5 text-body-md font-medium text-white/85">
                — {slide.author}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows (desktop only — mobile swipes / uses dots) */}
      <button
        type="button"
        aria-label="Previous inspiration"
        onClick={() => goTo(index - 1)}
        className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-on-surface shadow-md backdrop-blur transition hover:bg-white active:scale-95 md:flex"
      >
        <Icon name="chevron_left" size={22} />
      </button>
      <button
        type="button"
        aria-label="Next inspiration"
        onClick={() => goTo(index + 1)}
        className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-on-surface shadow-md backdrop-blur transition hover:bg-white active:scale-95 md:flex"
      >
        <Icon name="chevron_right" size={22} />
      </button>

      {/* Dots — bottom-right so they never collide with the quote text */}
      <div className="absolute bottom-4 right-5 flex items-center gap-1.5">
        {data.map((slide, i) => (
          <button
            key={slide.tag}
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
    </div>
  );
}
