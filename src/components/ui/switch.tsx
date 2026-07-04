"use client";

import React, { forwardRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  /** Controlled checked state. */
  checked?: boolean;
  /** Default value for uncontrolled usage. */
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  /** Optional label displayed next to the switch. */
  label?: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      defaultChecked = false,
      onChange,
      label,
      className,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const [internalChecked, setInternalChecked] = useState(defaultChecked);
    const isChecked = checked ?? internalChecked;

    const toggle = useCallback(() => {
      const next = !isChecked;
      if (checked === undefined) setInternalChecked(next);
      onChange?.(next);
    }, [isChecked, checked, onChange]);

    return (
      <label
        className={cn(
          "inline-flex cursor-pointer items-center gap-3",
          disabled && "pointer-events-none opacity-50",
          className,
        )}
      >
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={isChecked}
          disabled={disabled}
          onClick={toggle}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            isChecked ? "bg-primary" : "bg-outline-variant",
          )}
          {...rest}
        >
          <motion.span
            className={cn(
              "inline-block h-5 w-5 rounded-full shadow-sm",
              isChecked ? "bg-on-primary" : "bg-surface-container-lowest",
            )}
            animate={{ x: isChecked ? 24 : 4 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>

        {label && (
          <span className="text-body-lg font-body-lg text-on-surface">
            {label}
          </span>
        )}
      </label>
    );
  },
);

Switch.displayName = "Switch";

export { Switch };
