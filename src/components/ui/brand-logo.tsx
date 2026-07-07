"use client";

import { useEffect, useState } from "react";
import { TravellingGoatsLogo } from "./travelling-goats-logo";

/**
 * Renders the admin-configured logo (Site Content → Branding → Logo) in the
 * header, footer and login screen. Falls back to the built-in Travelling Goats
 * logo when none is set. Result is cached module-wide so the many logo
 * instances share a single fetch.
 */
type Branding = { url: string; height: number } | null;

// undefined = not loaded yet, null = loaded-but-none, object = custom logo
let cache: Branding | undefined;
let inflight: Promise<void> | null = null;

function load(): Promise<void> {
  if (cache !== undefined) return Promise.resolve();
  if (!inflight) {
    inflight = fetch("/api/content")
      .then((r) => r.json())
      .then((j) => {
        const b = j?.data?.["branding.logo"] ?? {};
        const url = typeof b.imageUrl === "string" ? b.imageUrl.trim() : "";
        cache = url ? { url, height: Number(b.height) || 32 } : null;
      })
      .catch(() => {
        cache = null;
      });
  }
  return inflight;
}

export function BrandLogo(props: {
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "wide" | "stacked";
}) {
  const [branding, setBranding] = useState<Branding | undefined>(cache);

  useEffect(() => {
    if (cache === undefined) load().then(() => setBranding(cache));
    else if (branding === undefined) setBranding(cache);
  }, [branding]);

  if (branding) {
    return (
      <TravellingGoatsLogo
        size={props.size}
        className={props.className}
        src={branding.url}
        srcHeight={branding.height}
      />
    );
  }

  // Not loaded yet, or no custom logo → built-in.
  return (
    <TravellingGoatsLogo
      size={props.size}
      className={props.className}
      variant={props.variant}
    />
  );
}
