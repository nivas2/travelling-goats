"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CountdownProps {
  /** Target date/time to count down to. */
  targetDate: Date | string;
  /** Fires once the countdown reaches zero. */
  onComplete?: () => void;
  /** Extra classes on the container. */
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function calcTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now());

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function Countdown({ targetDate, onComplete, className }: CountdownProps) {
  const target =
    targetDate instanceof Date ? targetDate : new Date(targetDate);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calcTimeLeft(target));
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      const tl = calcTimeLeft(target);
      setTimeLeft(tl);

      if (
        tl.days === 0 &&
        tl.hours === 0 &&
        tl.minutes === 0 &&
        tl.seconds === 0
      ) {
        setIsComplete(true);
        clearInterval(id);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.getTime()]);

  const segments: { label: string; value: string }[] = [
    { label: "Days", value: pad(timeLeft.days) },
    { label: "Hours", value: pad(timeLeft.hours) },
    { label: "Minutes", value: pad(timeLeft.minutes) },
    { label: "Seconds", value: pad(timeLeft.seconds) },
  ];

  return (
    <div
      className={cn("inline-flex items-center gap-3", className)}
      role="timer"
      aria-label={
        isComplete
          ? "Countdown complete"
          : `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s remaining`
      }
    >
      {segments.map((seg, idx) => (
        <React.Fragment key={seg.label}>
          <div className="flex flex-col items-center">
            <span className="min-w-[2.5rem] rounded-lg bg-surface-container px-2 py-1.5 text-center text-headline-md font-headline-md tabular-nums text-on-surface">
              {seg.value}
            </span>
            <span className="mt-1 text-label-sm font-label-sm text-on-surface-variant">
              {seg.label}
            </span>
          </div>

          {/* Separator colon */}
          {idx < segments.length - 1 && (
            <span
              className="mb-5 text-title-lg font-bold text-on-surface-variant"
              aria-hidden
            >
              :
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

Countdown.displayName = "Countdown";

export { Countdown };
