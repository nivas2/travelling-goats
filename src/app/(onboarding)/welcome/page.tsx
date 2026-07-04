"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface Slide {
  title: string;
  description: string;
  icon: string;
  bgGradient: string;
  accentColor: string;
}

const slides: Slide[] = [
  {
    title: "Travel with a tribe",
    description:
      "Join curated group trips with like-minded travelers. Make friends, share stories, and create memories that last a lifetime.",
    icon: "groups",
    bgGradient: "from-primary-container/40 to-primary-fixed/20",
    accentColor: "bg-primary",
  },
  {
    title: "Curated experiences",
    description:
      "Every trip is handcrafted by local experts. From hidden gems to must-see spots, we plan so you can enjoy.",
    icon: "explore",
    bgGradient: "from-secondary-container/40 to-secondary-fixed/20",
    accentColor: "bg-secondary",
  },
  {
    title: "Safety first",
    description:
      "All travelers are ID-verified. Real-time tracking, 24/7 support, and transparent policies keep you safe on every journey.",
    icon: "verified_user",
    bgGradient: "from-success-container/40 to-tertiary-fixed/20",
    accentColor: "bg-success",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const isLastSlide = currentSlide === slides.length - 1;

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(Math.max(0, Math.min(index, slides.length - 1)));
  }, []);

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      router.push("/interests");
    } else {
      goToSlide(currentSlide + 1);
    }
  }, [currentSlide, isLastSlide, goToSlide, router]);

  const handleSkip = useCallback(() => {
    router.push("/interests");
  }, [router]);

  // Touch / swipe handling
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchEndX.current = e.touches[0].clientX;
  }

  function handleTouchEnd() {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) < threshold) return;

    if (diff > 0 && currentSlide < slides.length - 1) {
      // Swipe left -> next slide
      goToSlide(currentSlide + 1);
    } else if (diff < 0 && currentSlide > 0) {
      // Swipe right -> previous slide
      goToSlide(currentSlide - 1);
    }
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goToSlide(currentSlide + 1);
      if (e.key === "ArrowLeft") goToSlide(currentSlide - 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, goToSlide]);

  const slide = slides[currentSlide];

  return (
    <div className="flex flex-1 flex-col">
      {/* Skip button */}
      {!isLastSlide && (
        <div className="flex justify-end px-6 pt-safe">
          <button
            type="button"
            onClick={handleSkip}
            className="mt-4 text-label-lg font-semibold text-on-surface-variant transition-colors hover:text-primary"
          >
            Skip
          </button>
        </div>
      )}

      {/* Slide content area */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-6"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Illustration placeholder */}
        <div
          className={cn(
            "mb-10 flex h-64 w-64 items-center justify-center rounded-[32px] bg-gradient-to-br transition-all duration-500",
            slide.bgGradient
          )}
        >
          <div
            className={cn(
              "flex h-24 w-24 items-center justify-center rounded-3xl shadow-lg transition-all duration-500",
              slide.accentColor
            )}
          >
            <Icon
              name={slide.icon}
              size={48}
              className="text-on-primary"
              filled
            />
          </div>
        </div>

        {/* Text */}
        <div className="max-w-sm text-center transition-all duration-500">
          <h1 className="text-headline-lg font-headline-lg text-on-surface">
            {slide.title}
          </h1>
          <p className="mt-3 text-body-lg text-on-surface-variant leading-relaxed">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Bottom section */}
      <div className="px-6 pb-8 pb-safe">
        {/* Dot indicators */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "w-2 bg-outline-variant hover:bg-outline"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Action button */}
        <Button
          type="button"
          fullWidth
          size="lg"
          onClick={handleNext}
          className="rounded-full"
          iconRight={
            <Icon
              name={isLastSlide ? "arrow_forward" : "arrow_forward"}
              size={20}
            />
          }
        >
          {isLastSlide ? "Get Started" : "Next"}
        </Button>
      </div>
    </div>
  );
}
