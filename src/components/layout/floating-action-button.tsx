"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}

const sizeStyles: Record<NonNullable<FloatingActionButtonProps["size"]>, string> = {
  sm: "h-12 w-12",
  md: "h-14 w-14",
  lg: "h-16 min-w-16",
};

const iconSizeStyles: Record<NonNullable<FloatingActionButtonProps["size"]>, string> = {
  sm: "text-[20px]",
  md: "text-[24px]",
  lg: "text-[26px]",
};

const FloatingActionButton = forwardRef<
  HTMLButtonElement,
  FloatingActionButtonProps
>(({ icon, label, size = "md", className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "fixed z-50 tactile-btn",
        "bottom-24 right-4 md:bottom-8 md:right-8",
        "flex items-center justify-center gap-2",
        "coral-gradient text-on-primary",
        "shadow-elevated hover:shadow-lg",
        "rounded-2xl",
        "transition-all duration-200",
        "active:scale-[0.95]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        label ? "px-6 h-14" : sizeStyles[size],
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "material-symbols-outlined",
          iconSizeStyles[size]
        )}
      >
        {icon}
      </span>
      {label && (
        <span className="text-label-lg font-semibold whitespace-nowrap">
          {label}
        </span>
      )}
    </button>
  );
});

FloatingActionButton.displayName = "FloatingActionButton";

export { FloatingActionButton };
