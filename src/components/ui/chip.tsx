"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "filled" | "outlined" | "selected";
  color?: "primary" | "secondary" | "tertiary";
  icon?: ReactNode;
  /** Show a close button on the right */
  closeable?: boolean;
  onClose?: () => void;
  disabled?: boolean;
}

const colorFilled: Record<NonNullable<ChipProps["color"]>, string> = {
  primary: "bg-primary-container text-on-primary-container",
  secondary: "bg-secondary-container text-on-secondary-container",
  tertiary: "bg-tertiary-container text-on-tertiary-container",
};

const colorOutlined: Record<NonNullable<ChipProps["color"]>, string> = {
  primary: "border-primary text-primary",
  secondary: "border-secondary text-secondary",
  tertiary: "border-tertiary text-tertiary",
};

const colorSelected: Record<NonNullable<ChipProps["color"]>, string> = {
  primary: "bg-primary text-on-primary",
  secondary: "bg-secondary text-on-secondary",
  tertiary: "bg-tertiary text-on-tertiary",
};

// Inline color guarantee for selected variant.
// tailwind-merge can strip `text-on-primary` when className includes other
// `text-*` utilities (e.g. `text-body-md`). The style prop bypasses twMerge.
const selectedColorStyle: Record<NonNullable<ChipProps["color"]>, string> = {
  primary: "var(--color-on-primary)",
  secondary: "var(--color-on-secondary)",
  tertiary: "var(--color-on-tertiary)",
};

const Chip = forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      className,
      variant = "filled",
      color = "primary",
      icon,
      closeable = false,
      onClose,
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      filled: colorFilled[color],
      outlined: cn("bg-transparent border", colorOutlined[color]),
      selected: colorSelected[color],
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2",
          "text-label-sm font-medium transition-all duration-200 ease-out",
          "select-none",
          variantStyles[variant],
          disabled && "pointer-events-none opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer hover:opacity-90 hover:shadow-sm",
          className
        )}
        style={variant === "selected" ? { color: selectedColorStyle[color] } : undefined}
        role={props.onClick ? "button" : undefined}
        tabIndex={props.onClick && !disabled ? 0 : undefined}
        {...props}
      >
        {icon && <span className="shrink-0 [&>*]:h-4 [&>*]:w-4">{icon}</span>}
        <span>{children}</span>
        {closeable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            className="ml-0.5 shrink-0 rounded-full p-0.5 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Remove"
            disabled={disabled}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Chip.displayName = "Chip";

export { Chip };
