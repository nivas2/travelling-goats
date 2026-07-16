"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface Slide {
  overline: string;
  title: string;
  sub: string;
  image: string;
}

// Full-screen slides — evocative "curiosity" lines over full-bleed travel photos.
const slides: Slide[] = [
  {
    overline: "MEET MY ROUTE",
    title: "Your next story starts where the road ends.",
    sub: "Curated group trails across India — you bring the spirit, we handle the rest.",
    image:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80&auto=format&fit=crop",
  },
  {
    overline: "HANDPICKED TRAILS",
    title: "The best places aren't on any map.",
    sub: "Local experts craft every route, so all you do is show up and wander.",
    image:
      "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1200&q=80&auto=format&fit=crop",
  },
  {
    overline: "SAFE BY DESIGN",
    title: "Go far. Go wild. Never go alone.",
    sub: "ID-verified crews, live tracking and 24/7 support — adventure without the worry.",
    image:
      "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&q=80&auto=format&fit=crop",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const isLastSlide = currentSlide === slides.length - 1;

  // Native scroll-snap drives the paging (iOS-style swipe); we mirror the
  // active page into state for the dots + CTA label.
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setCurrentSlide(Math.max(0, Math.min(i, slides.length - 1)));
  }, []);

  const goToSlide = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }, []);

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      router.push("/basic-details");
    } else {
      goToSlide(currentSlide + 1);
    }
  }, [currentSlide, isLastSlide, goToSlide, router]);

  const handleSkip = useCallback(() => {
    router.push("/interests");
  }, [router]);

  // Keyboard navigation (desktop preview).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goToSlide(Math.min(currentSlide + 1, slides.length - 1));
      if (e.key === "ArrowLeft") goToSlide(Math.max(currentSlide - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentSlide, goToSlide]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      {/* ===== Full-screen swipeable pager ===== */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="hide-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
      >
        {slides.map((s, i) => (
          <section
            key={s.image}
            className="relative h-full w-full shrink-0 snap-center snap-always"
          >
            {/* Background image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.image}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Legibility gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/40" />

            {/* Copy — sits above the fixed bottom controls */}
            <div className="absolute inset-x-0 bottom-0 px-7 pb-[calc(env(safe-area-inset-bottom)+188px)]">
              <span className="inline-flex items-center gap-2 text-label-md font-semibold tracking-[0.18em] text-lime">
                <span className="h-[1px] w-6 bg-lime" />
                {s.overline}
              </span>
              <h1 className="mt-4 max-w-[15ch] text-[clamp(30px,8.5vw,40px)] font-bold leading-[1.08] tracking-[-0.02em] text-white">
                {s.title}
              </h1>
              <p className="mt-3 max-w-[34ch] text-body-lg leading-relaxed text-white/80">
                {s.sub}
              </p>
            </div>
          </section>
        ))}
      </div>

      {/* ===== Top bar: glass Skip pill ===== */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-end px-6 pt-[calc(env(safe-area-inset-top)+18px)]">
        {!isLastSlide && (
          <button
            type="button"
            onClick={handleSkip}
            className="pointer-events-auto rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-label-md font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/25"
          >
            Skip
          </button>
        )}
      </div>

      {/* ===== Bottom controls: dots + CTA (overlay all slides) ===== */}
      <div className="absolute inset-x-0 bottom-0 px-7 pb-[calc(env(safe-area-inset-bottom)+28px)]">
        {/* Dot indicators */}
        <div className="mb-6 flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === currentSlide ? "w-7 bg-lime" : "w-1.5 bg-white/40 hover:bg-white/70"
              )}
            />
          ))}
        </div>

        {/* Black-on-lime CTA */}
        <Button
          type="button"
          variant="accent"
          fullWidth
          size="lg"
          onClick={handleNext}
          className="rounded-full text-on-surface"
          iconRight={<Icon name="arrow_forward" size={20} />}
        >
          {isLastSlide ? "Let's Trek" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
