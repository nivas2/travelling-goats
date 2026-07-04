import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "card";
  /** Width in pixels or CSS string. Used for text/rectangular/card. */
  width?: number | string;
  /** Height in pixels or CSS string. Used for text/rectangular. */
  height?: number | string;
  /** Diameter for circular variant (defaults to 40). */
  diameter?: number;
  /** Number of text lines (only for variant="text") */
  lines?: number;
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      variant = "rectangular",
      width,
      height,
      diameter = 40,
      lines = 1,
      ...props
    },
    ref
  ) => {
    const baseClasses = "animate-pulse bg-surface-container-high";

    if (variant === "circular") {
      return (
        <div
          ref={ref}
          className={cn(baseClasses, "rounded-full shrink-0", className)}
          style={{
            width: diameter,
            height: diameter,
          }}
          {...props}
        />
      );
    }

    if (variant === "text") {
      return (
        <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                baseClasses,
                "h-4 rounded-md",
                i === lines - 1 && lines > 1 && "w-3/4"
              )}
              style={{
                width: i === lines - 1 && lines > 1 ? "75%" : width ?? "100%",
              }}
            />
          ))}
        </div>
      );
    }

    if (variant === "card") {
      return (
        <div
          ref={ref}
          className={cn(
            baseClasses,
            "rounded-[20px]",
            className
          )}
          style={{
            width: width ?? "100%",
            height: height ?? 160,
          }}
          {...props}
        />
      );
    }

    // rectangular (default)
    return (
      <div
        ref={ref}
        className={cn(baseClasses, "rounded-xl", className)}
        style={{
          width: width ?? "100%",
          height: height ?? 48,
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

export { Skeleton };
