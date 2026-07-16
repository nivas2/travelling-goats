import Link from "next/link";
import type { TripCardData } from "@/types";

const norm = (s: string) => (s ?? "").toLowerCase().replace(/[\s_]+/g, "");

// Editorial shelves — each is a query into /search, illustrated by a real trip.
const COLLECTIONS: {
  title: string;
  sub: string;
  query: string;
  match: (t: TripCardData) => boolean;
}[] = [
  { title: "Weekend escapes", sub: "2–3 day trails", query: "duration=1,2,3", match: (t) => t.duration <= 3 },
  { title: "Under ₹10k", sub: "Budget-friendly", query: "maxPrice=1000000", match: (t) => t.basePricePaise <= 1_000_000 },
  { title: "Mountain calling", sub: "Peaks & valleys", query: "category=MOUNTAIN", match: (t) => norm(t.category) === "mountain" },
  { title: "Beach & chill", sub: "Coast & calm", query: "category=BEACH", match: (t) => norm(t.category) === "beach" },
  { title: "Cultural trails", sub: "Heritage & soul", query: "category=CULTURAL", match: (t) => norm(t.category) === "cultural" },
  { title: "Into the wild", sub: "Forests & safaris", query: "category=WILDLIFE", match: (t) => norm(t.category) === "wildlife" },
];

/** A row of themed collection tiles, illustrated by a matching trip's cover.
 *  Only collections that actually have trips are shown. */
export function CuratedCollections({ trips }: { trips: TripCardData[] }) {
  const shelves = COLLECTIONS.map((c) => {
    const matches = trips.filter(c.match);
    return { ...c, count: matches.length, image: matches[0]?.coverImage };
  }).filter((c) => c.count > 0 && c.image);

  if (shelves.length < 2) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 px-5 text-[30px] font-semibold tracking-[-0.02em] text-on-surface">
        Browse collections
      </h2>
      <div className="flex gap-3 overflow-x-auto px-5 pt-2 pb-2 hide-scrollbar md:gap-4">
        {shelves.map((c) => (
          <Link
            key={c.title}
            href={`/search?${c.query}`}
            className="lp-lift group relative h-[160px] w-[240px] shrink-0 overflow-hidden rounded-[24px] drop-shadow-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.image}
              alt={c.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-lime px-2.5 py-0.5 text-[11px] font-bold text-on-lime">
                {c.count} {c.count === 1 ? "trip" : "trips"}
              </span>
              <h3 className="mt-2 text-[18px] font-bold leading-tight text-white">{c.title}</h3>
              <p className="text-[12px] text-white/75">{c.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
