"use client";

import { cn } from "@/lib/utils";

type GridCellType = "SEAT" | "AISLE" | "EMPTY" | "DRIVER" | "DOOR" | "STAIRS";

export type SeatAvailability = "available" | "selected" | "booked" | "reserved" | "blocked";

export interface SeatWithAvailability {
  id: string;
  seatNumber: string;
  row: number;
  col: number;
  seatType: string;
  category: string;
  priceDeltaPaise: number;
  genderRestriction: string;
  isPremium: boolean;
  isAccessible: boolean;
  availability: SeatAvailability;
}

interface SeatGridProps {
  gridLayout: GridCellType[][];
  seats: SeatWithAvailability[];
  selectedSeatIds: string[];
  onSeatToggle: (seatId: string) => void;
  maxSelectable: number;
  deck: "lower" | "upper";
}

const CELL_ICONS: Record<string, string> = {
  DRIVER: "sports_motorsports",
  DOOR: "door_front",
  STAIRS: "stairs",
};

function getSeatColorClass(seat: SeatWithAvailability, isSelected: boolean): string {
  if (isSelected) {
    return "bg-primary text-on-primary border-primary shadow-elevated";
  }
  switch (seat.availability) {
    case "booked":
      return "bg-outline-variant/30 text-on-surface-variant/40 border-outline-variant/30 cursor-not-allowed";
    case "reserved":
      return "bg-tertiary/30 text-on-surface-variant/60 border-tertiary/30 cursor-not-allowed";
    case "blocked":
      return "bg-error/20 text-error/40 border-error/30 cursor-not-allowed";
    case "available":
    default:
      return "bg-surface-container text-on-surface border-outline-variant hover:border-primary hover:bg-primary-fixed/20 cursor-pointer";
  }
}

export function SeatGrid({
  gridLayout,
  seats,
  selectedSeatIds,
  onSeatToggle,
  maxSelectable,
  deck,
}: SeatGridProps) {
  const cols = gridLayout[0]?.length ?? 0;

  // Build a lookup map for seats by row,col
  const seatMap = new Map<string, SeatWithAvailability>();
  seats.forEach((s) => {
    seatMap.set(`${s.row}-${s.col}`, s);
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
      {/* Front indicator */}
      <div className="mb-3 flex items-center justify-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[20px]">
          directions_bus
        </span>
        <span className="text-label-sm font-label-sm">
          {deck === "upper" ? "Upper Deck - Front" : "Front"}
        </span>
      </div>

      {/* Grid */}
      <div className="flex flex-col gap-1.5">
        {gridLayout.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="flex items-center justify-center gap-1.5"
          >
            {row.map((cellType, colIdx) => {
              const key = `${rowIdx}-${colIdx}`;

              if (cellType === "EMPTY") {
                return <div key={key} className="h-10 w-10" />;
              }

              if (cellType === "AISLE") {
                return (
                  <div key={key} className="flex h-10 w-3 items-center justify-center">
                    <span className="text-[8px] text-on-surface-variant/30">
                      {rowIdx + 1}
                    </span>
                  </div>
                );
              }

              if (cellType === "DRIVER" || cellType === "DOOR" || cellType === "STAIRS") {
                return (
                  <div
                    key={key}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant/20 bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50">
                      {CELL_ICONS[cellType] ?? ""}
                    </span>
                  </div>
                );
              }

              // SEAT cell
              const seat = seatMap.get(key);
              if (!seat) {
                return <div key={key} className="h-10 w-10" />;
              }

              const isSelected = selectedSeatIds.includes(seat.id);
              const isClickable = seat.availability === "available" || isSelected;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => isClickable && onSeatToggle(seat.id)}
                  disabled={!isClickable}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg border-2 text-label-sm font-label-sm transition-all duration-150",
                    getSeatColorClass(seat, isSelected)
                  )}
                  aria-label={`Seat ${seat.seatNumber} - ${seat.category.toLowerCase()} - ${
                    isSelected ? "selected" : seat.availability
                  }`}
                  title={`${seat.seatNumber} (${seat.seatType.replace(/_/g, " ")}${
                    seat.priceDeltaPaise ? ` +₹${seat.priceDeltaPaise / 100}` : ""
                  })`}
                >
                  {seat.seatNumber}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Rear indicator */}
      <div className="mt-3 flex items-center justify-center gap-2 border-t border-outline-variant/20 pt-3 text-on-surface-variant">
        <span className="text-label-sm font-label-sm">Rear</span>
      </div>
    </div>
  );
}
