import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Extra blur intensity */
  intensity?: "light" | "medium" | "strong";
}

const intensityStyles: Record<NonNullable<GlassCardProps["intensity"]>, string> = {
  light: "",
  medium: "",
  strong: "backdrop-blur-[20px]",
};

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, intensity = "medium", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "glass-card rounded-[20px] p-4",
        intensityStyles[intensity],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
