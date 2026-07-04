"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBookingStore } from "@/stores/booking-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------

type SeatStatus = "available" | "selected" | "taken" | "aisle";
type SeatType = "window" | "aisle" | "middle";

interface Seat {
  id: string;
  row: number;
  col: number;
  label: string;
  status: SeatStatus;
  type: SeatType;
}

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

function generateSeatLayout(rows: number, cols: number): Seat[] {
  const seats: Seat[] = [];
  // Pre-mark some seats as taken for demo purposes
  const takenSeats = new Set([
    "1A", "1B", "2D", "3A", "3C", "4B", "5D", "6A",
    "7C", "8B", "8D", "9A", "10C",
  ]);

  for (let r = 1; r <= rows; r++) {
    for (let c = 0; c < cols; c++) {
      const colLabel = String.fromCharCode(65 + c); // A, B, C, D
      const label = `${r}${colLabel}`;

      // Determine seat type based on column position (4-col layout: A=window, B=aisle, C=aisle, D=window)
      let type: SeatType;
      if (c === 0 || c === cols - 1) {
        type = "window";
      } else if (c === 1 || c === cols - 2) {
        type = "aisle";
      } else {
        type = "middle";
      }

      seats.push({
        id: label,
        row: r,
        col: c,
        label,
        status: takenSeats.has(label) ? "taken" : "available",
        type,
      });
    }
  }
  return seats;
}

const ROWS = 12;
const COLS = 4; // A, B | aisle gap | C, D

// ---------------------------------------------------------------------------
//  Page Component
// ---------------------------------------------------------------------------

export default function SeatsPage() {
  const params = useParams<{ tripId: string }>();
  const router = useRouter();
  const tripId = params.tripId;

  const {
    travelerCount,
    seatPreference,
    setSeatPreference,
    setStep,
  } = useBookingStore();

  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  useEffect(() => {
    setStep(3);
    setSeats(generateSeatLayout(ROWS, COLS));

    // Restore previously selected seats
    if (seatPreference) {
      setSelectedSeats(seatPreference.split(",").filter(Boolean));
    }
  }, [setStep, seatPreference]);

  const handleSeatToggle = (seatId: string) => {
    const seat = seats.find((s) => s.id === seatId);
    if (!seat || seat.status === "taken") return;

    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      }
      // Limit selection to traveler count
      if (prev.length >= travelerCount) {
        // Replace the first selected seat
        return [...prev.slice(1), seatId];
      }
      return [...prev, seatId];
    });
  };

  const handleContinue = () => {
    setSeatPreference(selectedSeats.length > 0 ? selectedSeats.join(",") : null);
    router.push(`/${tripId}/addons`);
  };

  const handleSkip = () => {
    setSeatPreference(null);
    router.push(`/${tripId}/addons`);
  };

  // Group seats by row for rendering
  const seatsByRow = useMemo(() => {
    const map = new Map<number, Seat[]>();
    seats.forEach((s) => {
      const row = map.get(s.row) || [];
      row.push(s);
      map.set(s.row, row);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [seats]);

  const getSeatColorClass = (seat: Seat): string => {
    if (selectedSeats.includes(seat.id)) {
      return "bg-primary text-on-primary border-primary shadow-elevated";
    }
    if (seat.status === "taken") {
      return "bg-outline-variant/30 text-on-surface-variant/40 border-outline-variant/30 cursor-not-allowed";
    }
    return "bg-surface-container text-on-surface border-outline-variant hover:border-primary hover:bg-primary-fixed/20 cursor-pointer";
  };

  return (
    <div className="flex flex-col gap-6 p-5 pb-32">
      {/* Heading */}
      <div>
        <h2 className="text-headline-md font-headline-md text-on-surface">
          Choose Your Seats
        </h2>
        <p className="mt-1 text-body-md font-body-md text-on-surface-variant">
          Select {travelerCount} {travelerCount === 1 ? "seat" : "seats"} &mdash;{" "}
          {selectedSeats.length}/{travelerCount} selected
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded border border-outline-variant bg-surface-container" />
          <span className="text-label-sm text-on-surface-variant">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded border border-primary bg-primary" />
          <span className="text-label-sm text-on-surface-variant">Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded border border-outline-variant/30 bg-outline-variant/30" />
          <span className="text-label-sm text-on-surface-variant">Taken</span>
        </div>
      </div>

      {/* Seat layout */}
      <Card variant="outlined" className="overflow-hidden">
        {/* Bus front indicator */}
        <div className="mb-4 flex items-center justify-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px]">
            directions_bus
          </span>
          <span className="text-label-sm font-label-sm">Front</span>
        </div>

        {/* Column headers */}
        <div className="mb-2 grid grid-cols-[1fr_1fr_24px_1fr_1fr] gap-1.5 px-2">
          {["A", "B", "", "C", "D"].map((label, i) =>
            label ? (
              <div
                key={i}
                className="text-center text-label-sm font-label-sm text-on-surface-variant"
              >
                {label}
              </div>
            ) : (
              <div key={i} /> // aisle gap
            ),
          )}
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-1.5 px-2 pb-2">
          {seatsByRow.map(([rowNum, rowSeats]) => (
            <motion.div
              key={rowNum}
              className="grid grid-cols-[1fr_1fr_24px_1fr_1fr] gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: rowNum * 0.03 }}
            >
              {/* Seats A, B */}
              {rowSeats.slice(0, 2).map((seat) => (
                <button
                  key={seat.id}
                  type="button"
                  onClick={() => handleSeatToggle(seat.id)}
                  disabled={seat.status === "taken"}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-lg border-2 text-label-sm font-label-sm transition-all duration-150",
                    getSeatColorClass(seat),
                  )}
                  aria-label={`Seat ${seat.label} - ${seat.type} - ${
                    seat.status === "taken"
                      ? "taken"
                      : selectedSeats.includes(seat.id)
                        ? "selected"
                        : "available"
                  }`}
                >
                  {seat.label}
                </button>
              ))}

              {/* Aisle */}
              <div className="flex items-center justify-center">
                <span className="text-[10px] text-on-surface-variant/40">
                  {rowNum}
                </span>
              </div>

              {/* Seats C, D */}
              {rowSeats.slice(2, 4).map((seat) => (
                <button
                  key={seat.id}
                  type="button"
                  onClick={() => handleSeatToggle(seat.id)}
                  disabled={seat.status === "taken"}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-lg border-2 text-label-sm font-label-sm transition-all duration-150",
                    getSeatColorClass(seat),
                  )}
                  aria-label={`Seat ${seat.label} - ${seat.type} - ${
                    seat.status === "taken"
                      ? "taken"
                      : selectedSeats.includes(seat.id)
                        ? "selected"
                        : "available"
                  }`}
                >
                  {seat.label}
                </button>
              ))}
            </motion.div>
          ))}
        </div>

        {/* Bus rear indicator */}
        <div className="mt-2 flex items-center justify-center gap-2 border-t border-outline-variant/20 pt-3 text-on-surface-variant">
          <span className="text-label-sm font-label-sm">Rear</span>
        </div>
      </Card>

      {/* Seat type info */}
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            { type: "window", icon: "window", label: "Window" },
            { type: "aisle", icon: "airline_seat_recline_normal", label: "Aisle" },
            { type: "middle", icon: "event_seat", label: "Middle" },
          ] as const
        ).map((info) => {
          const count = selectedSeats.filter((id) => {
            const seat = seats.find((s) => s.id === id);
            return seat?.type === info.type;
          }).length;
          return (
            <Card
              key={info.type}
              variant="outlined"
              className={cn(
                "flex flex-col items-center gap-1 py-3",
                count > 0 && "border-primary bg-primary-fixed/10",
              )}
            >
              <span
                className={cn(
                  "material-symbols-outlined text-[20px]",
                  count > 0 ? "text-primary" : "text-on-surface-variant",
                )}
              >
                {info.icon}
              </span>
              <span className="text-label-sm font-label-sm text-on-surface">
                {info.label}
              </span>
              {count > 0 && (
                <span className="text-label-sm text-primary">{count} selected</span>
              )}
            </Card>
          );
        })}
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 border-t border-outline-variant/10 bg-surface/95 backdrop-blur-md p-4 pb-safe">
        <div className="flex gap-3">
          <Button variant="ghost" size="lg" onClick={handleSkip} className="flex-1">
            Skip
          </Button>
          <Button fullWidth size="lg" onClick={handleContinue} className="flex-[2]">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
