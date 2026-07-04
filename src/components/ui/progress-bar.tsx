import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ProgressVariant = "linear" | "circular";
type ProgressColor = "primary" | "secondary" | "success";

export interface ProgressBarProps {
  /** Percentage value 0-100. */
  value: number;
  /** @default "linear" */
  variant?: ProgressVariant;
  /** @default "primary" */
  color?: ProgressColor;
  /** Pixel size for the circular variant. @default 48 */
  circularSize?: number;
  /** Stroke width for the circular variant in px. @default 4 */
  strokeWidth?: number;
  /** Show the numeric percentage label. @default false */
  showLabel?: boolean;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Color map                                                          */
/* ------------------------------------------------------------------ */

const trackColorMap: Record<ProgressColor, string> = {
  primary: "bg-primary-fixed",
  secondary: "bg-secondary-fixed",
  success: "bg-success-container",
};

const fillColorMap: Record<ProgressColor, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  success: "bg-success",
};

const strokeColorMap: Record<ProgressColor, string> = {
  primary: "stroke-primary",
  secondary: "stroke-secondary",
  success: "stroke-success",
};

const trackStrokeMap: Record<ProgressColor, string> = {
  primary: "stroke-primary-fixed",
  secondary: "stroke-secondary-fixed",
  success: "stroke-success-container",
};

/* ------------------------------------------------------------------ */
/*  Linear variant                                                     */
/* ------------------------------------------------------------------ */

function LinearProgress({
  value,
  color,
  showLabel,
  className,
}: {
  value: number;
  color: ProgressColor;
  showLabel: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-1 flex justify-end">
          <span className="text-label-sm font-label-sm text-on-surface-variant">
            {Math.round(clamped)}%
          </span>
        </div>
      )}
      <div
        className={cn("h-2 w-full overflow-hidden rounded-full", trackColorMap[color])}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            fillColorMap[color],
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Circular variant                                                   */
/* ------------------------------------------------------------------ */

function CircularProgress({
  value,
  color,
  circularSize,
  strokeWidth,
  showLabel,
  className,
}: {
  value: number;
  color: ProgressColor;
  circularSize: number;
  strokeWidth: number;
  showLabel: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (circularSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        width={circularSize}
        height={circularSize}
        viewBox={`0 0 ${circularSize} ${circularSize}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={circularSize / 2}
          cy={circularSize / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackStrokeMap[color]}
        />
        {/* Fill */}
        <circle
          cx={circularSize / 2}
          cy={circularSize / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(strokeColorMap[color], "transition-all duration-500 ease-out")}
        />
      </svg>

      {showLabel && (
        <span className="absolute text-label-sm font-label-sm text-on-surface">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ProgressBar (public API)                                           */
/* ------------------------------------------------------------------ */

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      variant = "linear",
      color = "primary",
      circularSize = 48,
      strokeWidth = 4,
      showLabel = false,
      className,
    },
    ref,
  ) => {
    return (
      <div ref={ref} className={cn("inline-flex", className)}>
        {variant === "linear" ? (
          <LinearProgress
            value={value}
            color={color}
            showLabel={showLabel}
            className="w-full"
          />
        ) : (
          <CircularProgress
            value={value}
            color={color}
            circularSize={circularSize}
            strokeWidth={strokeWidth}
            showLabel={showLabel}
          />
        )}
      </div>
    );
  },
);

ProgressBar.displayName = "ProgressBar";

export { ProgressBar };
