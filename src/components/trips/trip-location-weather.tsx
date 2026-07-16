"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";

// ---------------------------------------------------------------------------
// Live weather (Open-Meteo, keyless, fetched server-side via /api/weather) +
// a location map preview. CSP allows only same-origin images, so the real map
// tiles come through /api/staticmap; if that's unreachable we keep the styled
// topographic base and the "Open in Maps" link still works.
// ---------------------------------------------------------------------------

interface Weather {
  available: boolean;
  tempC: number;
  feelsLikeC: number;
  humidity: number;
  windKph: number;
  condition: string;
  icon: string;
  misty: boolean;
  humid: boolean;
  lat: number;
  lng: number;
}

function Stat({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white/85">
      <Icon name={icon} size={15} className="text-lime" filled />
      {label}
    </span>
  );
}

function MoodTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-lime px-3 py-1.5 text-[12px] font-semibold text-on-surface">
      {label}
    </span>
  );
}

export function TripLocationWeather({ destination }: { destination: string }) {
  const [w, setW] = useState<Weather | null>(null);
  const [failed, setFailed] = useState(false);
  const [mapOk, setMapOk] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/weather?place=${encodeURIComponent(destination)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        if (d?.available) setW(d as Weather);
        else setFailed(true);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [destination]);

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;

  // Styled topographic base — a soft contour grid, used behind the real tiles
  // and as the standalone look when tiles can't load.
  const topoStyle: React.CSSProperties = {
    backgroundImage: [
      "radial-gradient(circle at 28% 38%, rgba(198,241,53,0.16), transparent 42%)",
      "radial-gradient(circle at 74% 64%, rgba(24,29,39,0.08), transparent 46%)",
      "repeating-linear-gradient(0deg, rgba(24,29,39,0.055) 0 1px, transparent 1px 28px)",
      "repeating-linear-gradient(90deg, rgba(24,29,39,0.055) 0 1px, transparent 1px 28px)",
    ].join(","),
    backgroundColor: "#E7EDE2",
  };

  return (
    <div className="mt-8">
      <h3 className="mb-3 text-[20px] font-semibold tracking-[-0.02em] text-on-surface">
        Weather &amp; location
      </h3>

      {/* Weather + map, side by side */}
      <div className="grid grid-cols-2 items-stretch gap-3">
      {/* Weather card */}
      {w ? (
        <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] bg-primary p-5 text-white">
          <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-lime/20 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/50">
                Current weather
              </p>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-[46px] font-semibold leading-none tracking-[-0.02em]">
                  {w.tempC}°
                </span>
                <span className="mb-1.5 text-[13px] text-white/55">feels {w.feelsLikeC}°</span>
              </div>
              <p className="mt-1.5 text-[14px] text-white/85">{w.condition}</p>
            </div>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.08] text-lime">
              <Icon name={w.icon} size={30} filled />
            </span>
          </div>
          <div className="relative mt-4 flex flex-wrap gap-2">
            <Stat icon="water_drop" label={`${w.humidity}% humidity`} />
            <Stat icon="air" label={`${w.windKph} km/h wind`} />
            {w.misty && <MoodTag label="Misty" />}
            {w.humid && <MoodTag label="Humid" />}
          </div>
        </div>
      ) : (
        <div className="flex h-full min-h-[200px] items-center gap-2 rounded-[24px] bg-white p-5 text-[14px] text-on-surface-variant ring-1 ring-black/5">
          <Icon name="cloud" size={18} className="text-on-surface-variant/60" />
          {failed ? "Live weather unavailable right now." : "Fetching live conditions…"}
        </div>
      )}

      {/* Map card */}
      <a
        href={mapsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="group block h-full overflow-hidden rounded-[24px] ring-1 ring-black/5"
      >
        <div className="relative h-full min-h-[200px] w-full" style={topoStyle}>
          {w && mapOk && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`/api/staticmap?lat=${w.lat}&lng=${w.lng}&zoom=10&w=640&h=352`}
              alt={`Map of ${destination}`}
              onError={() => setMapOk(false)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* center pin */}
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[130%]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-on-surface shadow-[0_6px_16px_rgba(0,0,0,0.3)] ring-4 ring-lime/25 transition-transform group-hover:-translate-y-0.5">
              <Icon name="location_on" size={20} filled />
            </span>
          </span>

          {/* bottom bar */}
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-3">
            <span className="inline-flex min-w-0 items-center gap-1 text-[13px] font-semibold text-white">
              <Icon name="explore" size={15} filled className="shrink-0 text-lime" />
              <span className="truncate">{destination}</span>
            </span>
            <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[13px] font-semibold text-on-surface transition-colors group-hover:bg-lime">
              <Icon name="map" size={16} filled />
              Open in Maps
            </span>
          </div>
        </div>
      </a>
      </div>
    </div>
  );
}
