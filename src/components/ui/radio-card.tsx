"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface RadioCardProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  /** Whether this card is currently selected. */
  selected?: boolean;
  title: string;
  description?: string;
  /** Price text displayed on the trailing edge (e.g. "₹1,200"). */
  price?: string;
  /** Material Symbols icon name (e.g. "airline_seat_recline_normal"). */
  icon?: string;
  /** Fires when the user selects this card. */
  onChange?: () => void;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const RadioCard = forwardRef<HTMLButtonElement, RadioCardProps>(
  (
    {
      selected = false,
      title,
      description,
      price,
      icon,
      onChange,
      className,
      disabled,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={selected}
        disabled={disabled}
        onClick={onChange}
        className={cn(
          "group relative flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
          selected
            ? "border-primary bg-primary-fixed/20"
            : "border-outline-variant bg-surface-container-lowest hover:border-outline",
          disabled && "pointer-events-none opacity-50",
          className,
        )}
        {...rest}
      >
        {/* Icon */}
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              selected
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant",
            )}
          >
            <span className="material-symbols-outlined text-[22px]">
              {icon}
            </span>
          </div>
        )}

        {/* Text content */}
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "block text-title-md font-title-md",
              selected ? "text-primary" : "text-on-surface",
            )}
          >
            {title}
          </span>
          {description && (
            <span className="mt-0.5 block text-body-md font-body-md text-on-surface-variant">
              {description}
            </span>
          )}
        </div>

        {/* Price */}
        {price && (
          <span
            className={cn(
              "shrink-0 text-title-md font-title-md",
              selected ? "text-primary" : "text-on-surface",
            )}
          >
            {price}
          </span>
        )}

        {/* Selected checkmark */}
        {selected && (
          <div className="absolute -right-2.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary">
            <span className="material-symbols-outlined text-[14px]">
              check
            </span>
          </div>
        )}
      </button>
    );
  },
);

RadioCard.displayName = "RadioCard";

export { RadioCard };
