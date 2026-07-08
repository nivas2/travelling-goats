"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { SeatPropertyEditor, type SeatProperties } from "./seat-property-editor";

type GridCellType = "SEAT" | "AISLE" | "EMPTY" | "DRIVER" | "DOOR" | "STAIRS";

export interface SeatData {
  seatNumber: string;
  row: number;
  col: number;
  deck: "SINGLE" | "LOWER" | "UPPER";
  seatType: string;
  category: string;
  priceDeltaPaise: number;
  genderRestriction: string;
  status: string;
  isAccessible: boolean;
  isPremium: boolean;
  order: number;
}

interface SeatLayoutBuilderProps {
  rows: number;
  cols: number;
  gridLayout: GridCellType[][];
  seats: SeatData[];
  deck: "SINGLE" | "LOWER" | "UPPER";
  onGridChange: (grid: GridCellType[][]) => void;
  onSeatsChange: (seats: SeatData[]) => void;
}

const CELL_TYPES: GridCellType[] = ["EMPTY", "SEAT", "AISLE", "DRIVER", "DOOR", "STAIRS"];

const CELL_ICONS: Record<GridCellType, string> = {
  SEAT: "event_seat",
  AISLE: "more_vert",
  EMPTY: "",
  DRIVER: "sports_motorsports",
  DOOR: "door_front",
  STAIRS: "stairs",
};

const CELL_COLORS: Record<GridCellType, string> = {
  SEAT: "bg-primary/15 border-primary/40 text-primary",
  AISLE: "bg-surface-container border-outline-variant/30 text-on-surface-variant/50",
  EMPTY: "bg-surface-container-lowest border-dashed border-outline-variant/40 text-on-surface-variant/40",
  DRIVER: "bg-tertiary/15 border-tertiary/40 text-tertiary",
  DOOR: "bg-error/10 border-error/30 text-error",
  STAIRS: "bg-secondary-container border-secondary/30 text-secondary",
};

const SEAT_TYPE_COLORS: Record<string, string> = {
  REGULAR: "bg-primary/15",
  PUSH_BACK: "bg-tertiary/15",
  SEMI_SLEEPER: "bg-secondary-container",
  SLEEPER: "bg-primary-container",
  BERTH: "bg-error/10",
};

function generateSeatNumber(row: number, col: number, deck: string): string {
  const prefix = deck === "UPPER" ? "U" : deck === "LOWER" ? "L" : "";
  return `${prefix}${row + 1}${String.fromCharCode(65 + col)}`;
}

function inferCategory(col: number, totalCols: number): string {
  if (col === 0 || col === totalCols - 1) return "WINDOW";
  if (col === 1 || col === totalCols - 2) return "AISLE";
  return "MIDDLE";
}

export function SeatLayoutBuilder({
  rows,
  cols,
  gridLayout,
  seats,
  deck,
  onGridChange,
  onSeatsChange,
}: SeatLayoutBuilderProps) {
  const [editingSeat, setEditingSeat] = useState<{ row: number; col: number } | null>(null);

  const findSeat = useCallback(
    (row: number, col: number) => {
      return seats.find((s) => s.row === row && s.col === col && s.deck === deck);
    },
    [seats, deck]
  );

  const handleCellClick = (row: number, col: number) => {
    const currentType = gridLayout[row]?.[col] ?? "EMPTY";
    const currentIndex = CELL_TYPES.indexOf(currentType);
    const nextType = CELL_TYPES[(currentIndex + 1) % CELL_TYPES.length];

    const newGrid = gridLayout.map((r) => [...r]);
    newGrid[row][col] = nextType;
    onGridChange(newGrid);

    // If changing to SEAT, add a seat entry
    if (nextType === "SEAT") {
      const seatNumber = generateSeatNumber(row, col, deck);
      const existing = findSeat(row, col);
      if (!existing) {
        onSeatsChange([
          ...seats,
          {
            seatNumber,
            row,
            col,
            deck,
            seatType: "REGULAR",
            category: inferCategory(col, cols),
            priceDeltaPaise: 0,
            genderRestriction: "NONE",
            status: "AVAILABLE",
            isAccessible: false,
            isPremium: false,
            order: row * cols + col,
          },
        ]);
      }
    } else {
      // Remove seat if cell is no longer a SEAT
      onSeatsChange(seats.filter((s) => !(s.row === row && s.col === col && s.deck === deck)));
    }

    // Close property editor if open for this cell
    if (editingSeat?.row === row && editingSeat?.col === col) {
      setEditingSeat(null);
    }
  };

  const handleSeatRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (gridLayout[row]?.[col] === "SEAT") {
      setEditingSeat({ row, col });
    }
  };

  const handleSeatPropertyChange = (updated: SeatProperties) => {
    if (!editingSeat) return;
    const { row, col } = editingSeat;

    onSeatsChange(
      seats.map((s) => {
        if (s.row === row && s.col === col && s.deck === deck) {
          return {
            ...s,
            seatNumber: updated.seatNumber,
            seatType: updated.seatType,
            category: updated.category,
            priceDeltaPaise: updated.priceDeltaPaise,
            genderRestriction: updated.genderRestriction,
            isPremium: updated.isPremium,
            isAccessible: updated.isAccessible,
          };
        }
        return s;
      })
    );
  };

  const seatCount = seats.filter((s) => s.deck === deck).length;
  const editingSeatData = editingSeat ? findSeat(editingSeat.row, editingSeat.col) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Info bar */}
      <div className="flex items-center justify-between">
        <p className="text-body-md text-on-surface-variant">
          Click to cycle cell type. Right-click seats to edit properties.
        </p>
        <span className="text-label-lg font-label-lg text-primary">
          {seatCount} seats
        </span>
      </div>

      {/* Cell type legend */}
      <div className="flex flex-wrap items-center gap-3">
        {CELL_TYPES.map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded border",
                CELL_COLORS[type]
              )}
            >
              {CELL_ICONS[type] && (
                <span className="material-symbols-outlined text-[12px]">
                  {CELL_ICONS[type]}
                </span>
              )}
            </div>
            <span className="text-label-sm text-on-surface-variant capitalize">
              {type.toLowerCase()}
            </span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
        <div
          className="inline-grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${cols}, 48px)`,
          }}
        >
          {Array.from({ length: rows }).map((_, rowIdx) =>
            Array.from({ length: cols }).map((_, colIdx) => {
              const cellType = gridLayout[rowIdx]?.[colIdx] ?? "EMPTY";
              const seat = cellType === "SEAT" ? findSeat(rowIdx, colIdx) : null;

              return (
                <button
                  key={`${rowIdx}-${colIdx}`}
                  type="button"
                  onClick={() => handleCellClick(rowIdx, colIdx)}
                  onContextMenu={(e) => handleSeatRightClick(e, rowIdx, colIdx)}
                  className={cn(
                    "flex h-12 w-12 flex-col items-center justify-center rounded-lg border-2 text-[10px] font-medium transition-all",
                    "hover:ring-2 hover:ring-primary/30",
                    cellType === "SEAT" && seat
                      ? cn(SEAT_TYPE_COLORS[seat.seatType] || "bg-primary/15", "border-primary/40 text-primary")
                      : CELL_COLORS[cellType],
                    editingSeat?.row === rowIdx &&
                      editingSeat?.col === colIdx &&
                      "ring-2 ring-primary"
                  )}
                  title={
                    cellType === "SEAT" && seat
                      ? `${seat.seatNumber} (${seat.seatType})`
                      : cellType
                  }
                >
                  {cellType === "SEAT" && seat ? (
                    <>
                      <span className="material-symbols-outlined text-[14px]">
                        event_seat
                      </span>
                      <span className="leading-none">{seat.seatNumber}</span>
                    </>
                  ) : CELL_ICONS[cellType] ? (
                    <span className="material-symbols-outlined text-[18px]">
                      {CELL_ICONS[cellType]}
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[14px] opacity-40">
                      add
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Seat property editor */}
      {editingSeatData && editingSeat && (
        <SeatPropertyEditor
          seat={{
            seatNumber: editingSeatData.seatNumber,
            seatType: editingSeatData.seatType,
            category: editingSeatData.category,
            priceDeltaPaise: editingSeatData.priceDeltaPaise,
            genderRestriction: editingSeatData.genderRestriction,
            isPremium: editingSeatData.isPremium,
            isAccessible: editingSeatData.isAccessible,
          }}
          onChange={handleSeatPropertyChange}
          onClose={() => setEditingSeat(null)}
        />
      )}
    </div>
  );
}
