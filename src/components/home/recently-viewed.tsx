"use client";

import { useEffect, useState } from "react";
import { getViewedTripIds } from "@/lib/recently-viewed";
import { TripCard } from "@/components/ui/trip-card";
import type { TripCardData } from "@/types";

/** "Recently viewed" rail — resolves the user's viewed trip ids against the
 *  already-loaded trips (no extra fetch). Renders nothing until there's history. */
export function RecentlyViewed({ trips }: { trips: TripCardData[] }) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => setIds(getViewedTripIds()), []);

  const byId = new Map(trips.map((t) => [t.id, t]));
  const items = ids.map((id) => byId.get(id)).filter((t): t is TripCardData => !!t);
  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2 px-5">
        <span className="material-symbols-outlined text-[24px] text-on-surface">history</span>
        <h2 className="text-[30px] font-semibold tracking-[-0.02em] text-on-surface">Recently viewed</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto px-5 pt-1.5 pb-4 hide-scrollbar md:gap-4">
        {items.map((t) => (
          <div key={t.id} className="w-[200px] shrink-0 md:w-[240px]">
            <TripCard trip={t} />
          </div>
        ))}
      </div>
    </section>
  );
}
