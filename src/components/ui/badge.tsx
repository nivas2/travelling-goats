import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "dot";
  /** Position the badge absolutely (e.g. over an avatar or icon) */
  position?: "absolute" | "inline";
  /** Numeric count to display (auto-formats 99+) */
  count?: number;
}

const variantStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-primary text-on-primary shadow-sm",
  secondary: "bg-secondary-container text-on-secondary-container shadow-sm",
  outline: "bg-transparent border border-outline text-on-surface-variant",
  dot: "",
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "default",
      position = "inline",
      count,
      children,
      ...props
    },
    ref
  ) => {
    // Dot variant renders a small indicator circle
    if (variant === "dot") {
      return (
        <span
          ref={ref}
          className={cn(
            "inline-block h-2.5 w-2.5 rounded-full bg-primary",
            position === "absolute" && "absolute -top-0.5 -right-0.5",
            className
          )}
          {...props}
        />
      );
    }

    const displayContent = count !== undefined ? (count > 99 ? "99+" : count) : children;

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          "text-[11px] font-semibold leading-none",
          "min-w-[20px] h-5 px-1.5",
          variantStyles[variant],
          position === "absolute" &&
            "absolute -top-1.5 -right-1.5 z-10",
          className
        )}
        {...props}
      >
        {displayContent}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
