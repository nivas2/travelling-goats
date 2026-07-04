"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DropdownOption {
  label: string;
  value: string;
  /** Material Symbols icon name. */
  icon?: string;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  /** The controlled selected value. */
  value?: string;
  /** Default value for uncontrolled usage. */
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Error message or boolean. */
  error?: string | boolean;
  label?: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Animation                                                          */
/* ------------------------------------------------------------------ */

const menuVariants = {
  hidden: { opacity: 0, y: -4, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15 },
  },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.1 } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      options,
      value,
      defaultValue,
      onChange,
      placeholder = "Select...",
      disabled = false,
      error,
      label,
      className,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue ?? "");
    const selected = value ?? internalValue;
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((o) => o.value === selected);

    /* Close on outside click */
    useEffect(() => {
      if (!isOpen) return;
      function handleClick(e: MouseEvent) {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }, [isOpen]);

    /* Close on Escape */
    useEffect(() => {
      if (!isOpen) return;
      function handleKey(e: KeyboardEvent) {
        if (e.key === "Escape") setIsOpen(false);
      }
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }, [isOpen]);

    const handleSelect = useCallback(
      (opt: DropdownOption) => {
        if (opt.disabled) return;
        if (value === undefined) setInternalValue(opt.value);
        onChange?.(opt.value);
        setIsOpen(false);
      },
      [value, onChange],
    );

    const hasError = Boolean(error);

    return (
      <div
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current =
            node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn("relative w-full", className)}
      >
        {/* Label */}
        {label && (
          <label className="mb-1.5 block text-label-lg font-label-lg text-on-surface">
            {label}
          </label>
        )}

        {/* Trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={cn(
            "flex h-12 w-full items-center justify-between gap-2 rounded-xl border-2 bg-surface-container-lowest px-4 text-left transition-colors",
            hasError
              ? "border-error"
              : isOpen
                ? "border-primary"
                : "border-outline-variant hover:border-outline",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <span
            className={cn(
              "flex items-center gap-2 text-body-lg font-body-lg",
              selectedOption ? "text-on-surface" : "text-on-surface-variant",
            )}
          >
            {selectedOption?.icon && (
              <span className="material-symbols-outlined text-[20px]">
                {selectedOption.icon}
              </span>
            )}
            {selectedOption?.label ?? placeholder}
          </span>

          <span
            className={cn(
              "material-symbols-outlined text-[20px] text-on-surface-variant transition-transform",
              isOpen && "rotate-180",
            )}
          >
            expand_more
          </span>
        </button>

        {/* Error message */}
        {typeof error === "string" && error && (
          <p className="mt-1 text-label-sm font-label-sm text-error">
            {error}
          </p>
        )}

        {/* Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.ul
              role="listbox"
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-outline-variant bg-surface-container-lowest py-1 shadow-[0_10px_38px_-10px_rgba(0,0,0,0.15),0_4px_11px_-2px_rgba(0,0,0,0.08)]"
            >
              {options.map((opt) => {
                const isSelected = opt.value === selected;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-4 py-2.5 text-body-lg font-body-lg transition-colors",
                      isSelected
                        ? "bg-primary-fixed/20 text-primary"
                        : "text-on-surface hover:bg-surface-container-high",
                      opt.disabled && "pointer-events-none opacity-40",
                    )}
                  >
                    {opt.icon && (
                      <span className="material-symbols-outlined text-[20px]">
                        {opt.icon}
                      </span>
                    )}
                    <span className="flex-1">{opt.label}</span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        check
                      </span>
                    )}
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

Dropdown.displayName = "Dropdown";

export { Dropdown };
