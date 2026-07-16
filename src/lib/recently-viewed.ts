// Recently-viewed trips, persisted client-side in localStorage.
// Most-recent first, de-duplicated, capped so the list stays small.

const KEY = "tg_recently_viewed";
const MAX = 12;

export function getViewedTripIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function recordTripView(id: string): void {
  if (typeof window === "undefined" || !id) return;
  try {
    const next = [id, ...getViewedTripIds().filter((x) => x !== id)].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full / blocked — non-critical */
  }
}
