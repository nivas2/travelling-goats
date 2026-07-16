"use client";

import { useEffect, useState } from "react";
import { timeUntil, type TimeLeft } from "@/lib/countdown";

const pad = (n: number) => String(n).padStart(2, "0");

/** Live ticking departure countdown in a single box — days / hrs / min / sec.
 *  Hides once past. */
export function CountdownTimer({ date, label = "Departs in" }: { date: string; label?: string }) {
  const [t, setT] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const tick = () => setT(timeUntil(date));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [date]);

  if (!t || t.past) return null;

  const parts = [
    { v: t.days, l: "d" },
    { v: t.hours, l: "h" },
    { v: t.mins, l: "m" },
    { v: t.secs, l: "s" },
  ];

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-primary px-4 py-3 text-on-primary">
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-on-primary/80">
        <span
          className="material-symbols-outlined text-[18px] text-lime"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          schedule
        </span>
        {label}
      </span>
      <div className="flex items-baseline gap-1.5 tabular-nums">
        {parts.map((p, i) => (
          <span key={p.l} className="flex items-baseline">
            <span className="text-[22px] font-bold leading-none">{pad(p.v)}</span>
            <span className="ml-0.5 text-[11px] font-medium text-on-primary/55">{p.l}</span>
            {i < parts.length - 1 && (
              <span className="ml-1.5 text-[18px] font-semibold text-on-primary/25">:</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
