"use client";

import { cn } from "@/lib/utils";

interface LegendItem {
  label: string;
  colorClass: string;
}

const LEGEND_ITEMS: LegendItem[] = [
  { label: "Available", colorClass: "bg-surface-container border-outline-variant" },
  { label: "Selected", colorClass: "bg-primary border-primary" },
  { label: "Booked", colorClass: "bg-outline-variant/30 border-outline-variant/30" },
  { label: "Reserved", colorClass: "bg-tertiary/30 border-tertiary/30" },
  { label: "Blocked", colorClass: "bg-error/20 border-error/30" },
];

interface SeatLegendProps {
  showSeatTypes?: boolean;
  seatTypes?: string[];
}

const SEAT_TYPE_ICONS: Record<string, string> = {
  REGULAR: "event_seat",
  PUSH_BACK: "airline_seat_recline_normal",
  SEMI_SLEEPER: "airline_seat_recline_extra",
  SLEEPER: "airline_seat_flat",
  BERTH: "single_bed",
};

export function SeatLegend({ showSeatTypes = false, seatTypes = [] }: SeatLegendProps) {
  const uniqueTypes = [...new Set(seatTypes)];

  return (
    <div className="flex flex-col gap-3">
      {/* Availability legend */}
      <div className="flex flex-wrap items-center gap-3">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className={cn(
                "h-4 w-4 rounded border",
                item.colorClass
              )}
            />
            <span className="text-label-sm text-on-surface-variant">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Seat type legend (if mixed types) */}
      {showSeatTypes && uniqueTypes.length > 1 && (
        <div className="flex flex-wrap items-center gap-3 border-t border-outline-variant/10 pt-2">
          {uniqueTypes.map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                {SEAT_TYPE_ICONS[type] ?? "event_seat"}
              </span>
              <span className="text-label-sm text-on-surface-variant capitalize">
                {type.replace(/_/g, " ").toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
