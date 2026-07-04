"use client";

import React, { forwardRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type RatingSize = "sm" | "md" | "lg";

export interface RatingProps {
  /** Current rating value (can be fractional for display) */
  value: number;
  /** Maximum number of stars. @default 5 */
  max?: number;
  /** Visual size of each star. @default "md" */
  size?: RatingSize;
  /** When true the rating cannot be changed by the user. @default false */
  readonly?: boolean;
  /** Fires when the user selects a rating (whole numbers 1-max). */
  onChange?: (value: number) => void;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const sizeMap: Record<RatingSize, string> = {
  sm: "text-[18px]",
  md: "text-[24px]",
  lg: "text-[32px]",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Rating = forwardRef<HTMLDivElement, RatingProps>(
  (
    {
      value,
      max = 5,
      size = "md",
      readonly = false,
      onChange,
      className,
    },
    ref,
  ) => {
    const [hovered, setHovered] = useState<number | null>(null);

    const handleClick = useCallback(
      (starIndex: number) => {
        if (!readonly && onChange) {
          onChange(starIndex);
        }
      },
      [readonly, onChange],
    );

    const displayValue = hovered ?? value;

    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center gap-0.5", className)}
        role={readonly ? "img" : "radiogroup"}
        aria-label={`Rating: ${value} out of ${max}`}
        onMouseLeave={() => !readonly && setHovered(null)}
      >
        {Array.from({ length: max }, (_, i) => {
          const starNumber = i + 1;
          const isFilled = starNumber <= Math.round(displayValue);

          return (
            <button
              key={i}
              type="button"
              disabled={readonly}
              className={cn(
                "transition-colors focus-visible:outline-none",
                readonly ? "cursor-default" : "cursor-pointer",
                isFilled ? "text-tertiary" : "text-outline-variant",
              )}
              onClick={() => handleClick(starNumber)}
              onMouseEnter={() => !readonly && setHovered(starNumber)}
              aria-label={`${starNumber} star${starNumber !== 1 ? "s" : ""}`}
            >
              <span
                className={cn(
                  "material-symbols-outlined",
                  isFilled && "filled",
                  sizeMap[size],
                )}
              >
                star
              </span>
            </button>
          );
        })}
      </div>
    );
  },
);

Rating.displayName = "Rating";

export { Rating };
