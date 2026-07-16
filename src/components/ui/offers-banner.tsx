"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

export interface Offer {
  title: string;
  subtitle?: string;
  badge?: string;
  color?: string;
  ctaText?: string;
  link?: string;
  image?: string;
}

// Vibrant, harmonious palette — cards cycle through these so the row is
// colourful and lively (matches the production reference).
const OFFER_COLORS = ["#FF385C", "#7C4DFF", "#0EA5E9", "#F97316", "#10B981"];

export function OffersBanner({ offers }: { offers: Offer[] }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = async (code: string, i: number) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — ignore silently.
    }
    setCopiedIndex(i);
    setTimeout(() => setCopiedIndex((c) => (c === i ? null : c)), 1800);
  };

  if (!offers.length) return null;

  return (
    <section className="mt-2">
      <div className="mb-3 flex items-center gap-2 px-5">
        <Icon name="local_offer" size={18} className="text-primary" filled />
        <h2 className="text-[30px] font-semibold tracking-[-0.02em] text-on-surface">Offers for you</h2>
      </div>

      <div className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
        {offers.map((o, i) => {
          const color = OFFER_COLORS[i % OFFER_COLORS.length];
          const copied = copiedIndex === i;

          return (
            <div
              key={i}
              className="relative flex h-[128px] w-[300px] shrink-0 snap-start overflow-hidden rounded-2xl p-4 shadow-sm md:w-[340px]"
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, ${color} 82%, #fff) 0%, ${color} 100%)`,
              }}
            >
              <div className="relative z-10 flex flex-1 flex-col text-white">
                {o.badge && (
                  <span className="mb-1 inline-flex w-fit items-center gap-1 rounded-md bg-white/25 px-2 py-0.5 text-[11px] font-bold tracking-wide backdrop-blur-sm">
                    <Icon name="sell" size={12} />
                    {o.badge}
                  </span>
                )}
                <p className="text-title-md font-bold leading-tight drop-shadow-sm">
                  {o.title}
                </p>
                {o.subtitle && (
                  <p className="mt-0.5 text-label-md text-white/90">{o.subtitle}</p>
                )}
                {o.badge && (
                  <button
                    type="button"
                    onClick={() => copyCode(o.badge!, i)}
                    aria-label={copied ? "Code copied" : `Copy code ${o.badge}`}
                    className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-label-sm font-semibold transition-transform active:scale-95"
                    style={{ color }}
                  >
                    <Icon name={copied ? "check" : "content_copy"} size={14} />
                    {copied ? "Copied!" : "Copy code"}
                  </button>
                )}
              </div>

              {o.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={o.image}
                  alt=""
                  className="relative z-10 h-full w-[92px] shrink-0 self-center object-contain"
                />
              ) : (
                <Icon
                  name="redeem"
                  size={72}
                  className="absolute -bottom-3 -right-2 text-white/15"
                  filled
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
