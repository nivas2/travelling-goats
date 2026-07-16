"use client";

import { useState } from "react";
import { INDIA_PATH } from "./india-path";

export interface MapDest {
  place: string;
  location: string;
  image: string;
  x: number; // 0..1024 viewBox coords
  y: number;
}

/** Interactive map of India — glowing pins drive a destination preview card.
 *  Tap/hover a pin to cue that destination. */
export function IndiaMap({ destinations }: { destinations: MapDest[] }) {
  const [active, setActive] = useState(0);
  const a = destinations[active] ?? destinations[0];

  return (
    <section id="map" className="px-3 pb-14 md:px-6 md:pb-20">
      <div className="mx-auto max-w-[1240px]">
        <div className="lp-reveal overflow-hidden rounded-[32px] bg-[#181818] p-6 text-white md:p-10 lg:p-12">
          <div className="mb-8 max-w-2xl">
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#D8FF07]">Where we roam</span>
            <h2 className="mt-2 text-[clamp(24px,3vw,38px)] font-semibold tracking-[-0.02em]">
              Trails across every corner of India
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/60">
              Tap a pin to peek at where the community is headed next.
            </p>
          </div>

          <div className="grid items-center gap-8 md:grid-cols-[1.05fr_0.95fr]">
            {/* ---- map ---- */}
            <div className="relative mx-auto w-full max-w-[460px]">
              <svg viewBox="0 0 1024 1024" className="w-full" aria-hidden>
                <defs>
                  <linearGradient id="tg-india-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#3A3A3A" />
                    <stop offset="1" stopColor="#242424" />
                  </linearGradient>
                </defs>
                <g transform="translate(0,1024) scale(0.1,-0.1)">
                  <path d={INDIA_PATH} fill="url(#tg-india-fill)" stroke="#D8FF07" strokeOpacity="0.18" strokeWidth="14" />
                </g>
              </svg>

              {/* pins overlaid in the same 0..1024 coordinate space */}
              {destinations.map((d, i) => {
                const on = i === active;
                return (
                  <button
                    key={d.place}
                    type="button"
                    onClick={() => setActive(i)}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    aria-label={`Show ${d.place}`}
                    aria-pressed={on}
                    className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 outline-none"
                    style={{ left: `${(d.x / 1024) * 100}%`, top: `${(d.y / 1024) * 100}%` }}
                  >
                    <span className="relative flex items-center justify-center">
                      {on && <span className="absolute h-6 w-6 animate-ping rounded-full bg-[#D8FF07]/40" />}
                      <span
                        className={`block rounded-full ring-white/20 transition-all duration-300 ${
                          on
                            ? "h-4 w-4 bg-[#D8FF07] ring-4 ring-[#D8FF07]/25"
                            : "h-2.5 w-2.5 bg-white/70 ring-2 group-hover:bg-[#D8FF07]"
                        }`}
                      />
                    </span>
                    <span
                      className={`pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold transition-colors ${
                        on ? "text-[#D8FF07]" : "text-white/55 group-hover:text-white"
                      }`}
                    >
                      {d.place}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ---- detail card ---- */}
            <div key={active} className="lp-hero-fade">
              <div
                className="relative h-[240px] overflow-hidden rounded-[24px] border border-white/10 bg-cover bg-center md:h-[280px]"
                style={{ backgroundImage: `url('${a.image}')` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#181818]/92 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                    <span className="material-symbols-outlined text-[13px] text-[#D8FF07]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      location_on
                    </span>
                    {a.location}
                  </span>
                  <h3 className="mt-2 text-[22px] font-semibold text-white">{a.place}</h3>
                </div>
              </div>

              <a
                href="#trips"
                className="group mt-4 inline-flex items-center gap-2 rounded-full bg-[#D8FF07] px-6 py-3 text-[14px] font-semibold text-[#181818] transition-transform hover:-translate-y-0.5"
              >
                View {a.place} trips
                <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
