// Departure countdown helpers. Time-to-departure drives urgency badges on
// trip cards and a live ticking timer on the trip detail page.

const DAY = 86_400_000;

export interface TimeLeft {
  ms: number;
  days: number;
  hours: number;
  mins: number;
  secs: number;
  past: boolean;
}

export function timeUntil(dateIso: string, now = Date.now()): TimeLeft {
  const ms = new Date(dateIso).getTime() - now;
  const clamped = Math.max(0, ms);
  return {
    ms,
    days: Math.floor(clamped / DAY),
    hours: Math.floor((clamped % DAY) / 3_600_000),
    mins: Math.floor((clamped % 3_600_000) / 60_000),
    secs: Math.floor((clamped % 60_000) / 1_000),
    past: ms <= 0,
  };
}

/** Compact card badge label. `text` is the full form ("Departs in 5d");
 *  `short` is a space-tight form ("5d" / "Today" / "Tomorrow") for narrow cards
 *  where it shares a row with the seats badge. Returns null once departed. */
export function departureLabel(
  dateIso: string,
  now = Date.now()
): { text: string; short: string; urgent: boolean } | null {
  const ms = new Date(dateIso).getTime() - now;
  if (ms <= 0) return null;
  if (ms < DAY) return { text: "Departs today", short: "Today", urgent: true };
  if (ms < 2 * DAY) return { text: "Departs tomorrow", short: "1d", urgent: true };
  const days = Math.floor(ms / DAY);
  return { text: `Departs in ${days}d`, short: `${days}d`, urgent: days <= 7 };
}

/** Space-tight live countdown for the trip-card badge — the two most significant
 *  non-zero units, so it stays short (max "59m 59s") yet ticks progressively
 *  faster as departure nears. Empty string once departed. */
export function compactCountdown(t: TimeLeft): string {
  if (t.past) return "";
  const { days: d, hours: h, mins: m, secs: s } = t;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Full live running counter, e.g. "7d 12h 03m 02s". Leading zero units are
 *  dropped (a same-day trip shows "12h 03m 02s"), lower units zero-padded so the
 *  width stays stable as it ticks. Empty string once departed. */
export function fullCountdown(t: TimeLeft): string {
  if (t.past) return "";
  const { days: d, hours: h, mins: m, secs: s } = t;
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  if (m > 0) return `${m}m ${pad(s)}s`;
  return `${s}s`;
}
