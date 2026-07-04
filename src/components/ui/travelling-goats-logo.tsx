import { cn } from "@/lib/utils";

interface TravellingGoatsLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

const sizeMap = {
  sm: { icon: 28, text: "text-title-md" },
  md: { icon: 36, text: "text-title-lg" },
  lg: { icon: 48, text: "text-headline-sm" },
};

export function TravellingGoatsLogo({
  size = "md",
  className,
  showText = true,
}: TravellingGoatsLogoProps) {
  const { icon, text } = sizeMap[size];

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* Goat-in-map-pin icon */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Map pin shape */}
        <path
          d="M32 2C19.85 2 10 11.85 10 24c0 16.5 22 38 22 38s22-21.5 22-38C54 11.85 44.15 2 32 2z"
          fill="#FF385C"
        />
        {/* Mountain silhouette inside pin */}
        <path
          d="M18 38l8-14 4 6 6-10 10 18H18z"
          fill="#FFFFFF"
          opacity="0.25"
        />
        {/* Goat head silhouette */}
        <g fill="#FFFFFF">
          {/* Head */}
          <ellipse cx="32" cy="22" rx="8" ry="7" />
          {/* Left horn */}
          <path d="M25 18c-2-5-1-9 1-10s3 2 3 5" />
          {/* Right horn */}
          <path d="M39 18c2-5 1-9-1-10s-3 2-3 5" />
          {/* Left ear */}
          <ellipse cx="24.5" cy="20" rx="2.5" ry="1.5" transform="rotate(-20 24.5 20)" />
          {/* Right ear */}
          <ellipse cx="39.5" cy="20" rx="2.5" ry="1.5" transform="rotate(20 39.5 20)" />
          {/* Beard */}
          <path d="M30 28c0 3 1 5 2 5s2-2 2-5" />
        </g>
        {/* Eyes */}
        <circle cx="29" cy="21" r="1.2" fill="#FF385C" />
        <circle cx="35" cy="21" r="1.2" fill="#FF385C" />
        {/* Nose */}
        <ellipse cx="32" cy="25" rx="2" ry="1" fill="#FF385C" opacity="0.6" />
      </svg>

      {showText && (
        <span className={cn("font-bold tracking-tight leading-none", text)}>
          <span className="text-on-surface">TRAVELLING</span>{" "}
          <span className="text-primary">GOATS</span>
        </span>
      )}
    </span>
  );
}
