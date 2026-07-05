import { cn } from "@/lib/utils";

interface TravellingGoatsLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

// Image is 763×327 (~2.33:1 ratio)
const sizeMap = {
  sm: { h: 36, w: 84 },
  md: { h: 48, w: 112 },
  lg: { h: 64, w: 149 },
};

export function TravellingGoatsLogo({
  size = "md",
  className,
}: TravellingGoatsLogoProps) {
  const { h, w } = sizeMap[size];

  return (
    <span className={cn("inline-flex items-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        width={w}
        height={h}
        alt="Travelling Goats"
      />
    </span>
  );
}
