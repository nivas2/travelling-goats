import { cn } from "@/lib/utils";

interface TravellingGoatsLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** "wide" = horizontal wordmark image; "stacked" = goat-pin mark with the name below it */
  variant?: "wide" | "stacked";
  /** Admin-uploaded logo. When set, it replaces the built-in logo (rendered at `srcHeight`px). */
  src?: string;
  srcHeight?: number;
}

// Display height (px) used for a custom uploaded logo, per size.
const customHeightMap = { sm: 32, md: 44, lg: 60 };

// Wide wordmark image is 763×327 (~2.33:1 ratio) — keep w/h at this exact ratio to avoid distortion
const wideSizeMap = {
  sm: { h: 88, w: 205 },
  md: { h: 120, w: 280 },
  lg: { h: 176, w: 411 },
};

// Full logo (goat-pin mark + wordmark) is 1220×820 (~1.49:1 ratio) — keep w/h at this exact ratio to avoid distortion
const stackedSizeMap = {
  sm: { h: 60, w: 89 },
  md: { h: 140, w: 208 },
  lg: { h: 190, w: 283 },
};

export function TravellingGoatsLogo({
  size = "md",
  className,
  variant = "wide",
  src,
  srcHeight,
}: TravellingGoatsLogoProps) {
  // Admin-uploaded logo overrides everything.
  if (src) {
    const h = srcHeight || customHeightMap[size];
    return (
      <span className={cn("inline-flex items-center", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Logo" style={{ height: h }} className="w-auto object-contain" />
      </span>
    );
  }

  if (variant === "stacked") {
    const { h, w } = stackedSizeMap[size];
    return (
      <span className={cn("inline-flex items-center justify-center", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-full.png"
          width={w}
          height={h}
          alt="Meet My Route"
          className="h-auto max-w-full"
        />
      </span>
    );
  }

  const { h, w } = wideSizeMap[size];

  return (
    <span className={cn("inline-flex items-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" width={w} height={h} alt="Meet My Route" />
    </span>
  );
}
