"use client";

import { useEffect, useRef, useState } from "react";
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

interface InspirationCarouselProps {
  /** Auto-advance interval in ms. Set to 0 to disable autoplay. */
  interval?: number;
  /** Admin-editable slides; falls back to the built-in set. */
  slides?: Slide[];
}

// Single inspiration card (photo + quote), used for every card in the deck.
function SlideCard({ slide }: { slide: Slide }) {
  return (
    <div className="relative flex h-full w-full items-end overflow-hidden rounded-3xl shadow-[0_20px_44px_rgba(20,40,30,0.20)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slide.img}
        alt={slide.tag}
        draggable={false}
        style={{ objectPosition: slide.pos ?? "50% 50%" }}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

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
  );
}

export function InspirationCarousel({ interval = 4500, slides }: InspirationCarouselProps) {
  const data = slides && slides.length ? slides : [];
  const count = data.length;

  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);
  const animating = useRef(false);

  // Fling the top card away, then bring the next card forward.
  const advance = (dir: number) => {
    if (animating.current || count <= 1) return;
    animating.current = true;
    setDrag(dir * 700);
    window.setTimeout(() => {
      setIndex((i) => (i + 1) % count);
      setDrag(0);
      animating.current = false;
    }, 240);
  };

  useEffect(() => {
    if (paused || interval <= 0 || count <= 1) return;
    const id = setInterval(() => advance(-1), interval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, interval, count]);

  if (count === 0) return null;

  const depth = Math.min(3, count);
  const deck = Array.from({ length: depth }, (_, o) => ({
    slide: data[(index + o) % count],
    o,
  }));

  const onDown = (e: React.PointerEvent) => {
    if (animating.current) return;
    startX.current = e.clientX;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    setDrag(e.clientX - startX.current);
  };
  const onUp = () => {
    const dx = drag;
    startX.current = null;
    setDragging(false);
    if (Math.abs(dx) > 80) advance(dx > 0 ? 1 : -1);
    else setDrag(0);
  };

  return (
    <div
      className="relative h-[210px] touch-pan-y select-none md:h-[300px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {deck
        .slice()
        .reverse()
        .map(({ slide, o }) => {
          const isFront = o === 0;
          const style: React.CSSProperties = isFront
            ? {
                transform: `translateX(${drag}px) rotate(${drag * 0.02}deg)`,
                zIndex: 30,
                transition: dragging ? "none" : "transform 0.32s ease",
                cursor: count > 1 ? "grab" : "default",
              }
            : {
                transform: `translateX(${o * 16}px) scale(${1 - o * 0.045})`,
                transformOrigin: "center right",
                zIndex: 30 - o * 10,
                opacity: 1 - o * 0.3,
                transition: "transform 0.32s ease, opacity 0.32s ease",
              };
          return (
            <div
              key={`${slide.tag}-${o}`}
              className="absolute inset-0"
              style={style}
              onPointerDown={isFront ? onDown : undefined}
              onPointerMove={isFront ? onMove : undefined}
              onPointerUp={isFront ? onUp : undefined}
              onPointerCancel={
                isFront
                  ? () => {
                      startX.current = null;
                      setDragging(false);
                      setDrag(0);
                    }
                  : undefined
              }
            >
              <SlideCard slide={slide} />
            </div>
          );
        })}

      {/* Progress dots */}
      {count > 1 && (
        <div className="absolute bottom-4 right-5 z-40 flex items-center gap-1.5">
          {data.map((slide, i) => (
            <button
              key={slide.tag}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => !animating.current && setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
