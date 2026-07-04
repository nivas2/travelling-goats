"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { useBookingStore } from "@/stores/booking-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { BookingBottomBar } from "@/components/booking/booking-bottom-bar";
import { SeatGrid, type SeatWithAvailability } from "@/components/booking/seat-grid";
import { SeatLegend } from "@/components/booking/seat-legend";

type GridCellType = "SEAT" | "AISLE" | "EMPTY" | "DRIVER" | "DOOR" | "STAIRS";

interface VehicleData {
  id: string;
  name: string;
  totalSeats: number;
  totalRows: number;
  totalColumns: number;
  hasUpperDeck: boolean;
  upperDeckRows: number | null;
  upperDeckColumns: number | null;
  amenities: string[];
  gridLayout: GridCellType[][];
  upperGridLayout: GridCellType[][] | null;
  vehicleType: { id: string; name: string; icon: string | null };
}

export default function SeatsPage() {
  const params = useParams<{ tripId: string }>();
  const router = useRouter();
  const tripId = params.tripId;
  const { success: toastSuccess, error: toastError } = useToast();

  const {
    travelerCount,
    selectedSeatIds,
    seatReservationExpiry,
    sessionId,
    setSelectedSeats,
    setSeatReservationExpiry,
    setSeatPreference,
    setStep,
  } = useBookingStore();

  const [loading, setLoading] = useState(true);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [seats, setSeats] = useState<SeatWithAvailability[]>([]);
  const [activeDeck, setActiveDeck] = useState<"lower" | "upper">("lower");
  const [timerDisplay, setTimerDisplay] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setStep(3);
    fetchSeats();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer effect
  useEffect(() => {
    if (!seatReservationExpiry) {
      setTimerDisplay(null);
      return;
    }

    function updateTimer() {
      const expiry = new Date(seatReservationExpiry!).getTime();
      const remaining = Math.max(0, expiry - Date.now());

      if (remaining <= 0) {
        setTimerDisplay(null);
        setSeatReservationExpiry(null);
        setSelectedSeats([]);
        toastError("Seat reservation expired. Please select seats again.");
        fetchSeats();
        return;
      }

      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimerDisplay(`${mins}:${secs.toString().padStart(2, "0")}`);
    }

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seatReservationExpiry]);

  async function fetchSeats() {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/trips/${tripId}/seats?sessionId=${encodeURIComponent(sessionId)}`
      );
      if (!res.ok) throw new Error("Failed to load seats");
      const json = await res.json();
      const data = json.data;

      setHasVehicle(data.hasVehicle);
      if (data.hasVehicle) {
        setVehicle(data.vehicleTemplate);
        setSeats(data.seats);
      }
    } catch {
      toastError("Failed to load seat availability");
    } finally {
      setLoading(false);
    }
  }

  const handleSeatToggle = useCallback(
    async (seatId: string) => {
      const isCurrentlySelected = selectedSeatIds.includes(seatId);

      let newSelection: string[];
      if (isCurrentlySelected) {
        newSelection = selectedSeatIds.filter((id) => id !== seatId);
      } else {
        if (selectedSeatIds.length >= travelerCount) {
          // Replace the first selected
          newSelection = [...selectedSeatIds.slice(1), seatId];
        } else {
          newSelection = [...selectedSeatIds, seatId];
        }
      }

      setSelectedSeats(newSelection);

      // Reserve seats
      if (newSelection.length > 0) {
        try {
          const res = await fetch(`/api/trips/${tripId}/seats/reserve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seatIds: newSelection, sessionId }),
          });

          if (!res.ok) {
            const json = await res.json();
            toastError(json.error || "Failed to reserve seat");
            // Revert selection
            setSelectedSeats(selectedSeatIds);
            fetchSeats();
            return;
          }

          const json = await res.json();
          setSeatReservationExpiry(json.data.expiresAt);
        } catch {
          toastError("Failed to reserve seat");
          setSelectedSeats(selectedSeatIds);
        }
      } else {
        // Release all reservations
        try {
          await fetch(`/api/trips/${tripId}/seats/reserve`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seatIds: [], sessionId }),
          });
          setSeatReservationExpiry(null);
        } catch {
          // Non-critical
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedSeatIds, travelerCount, tripId, sessionId]
  );

  const handleContinue = () => {
    // Store as legacy seatPreference for backward compatibility
    const seatNumbers = seats
      .filter((s) => selectedSeatIds.includes(s.id))
      .map((s) => s.seatNumber);
    setSeatPreference(seatNumbers.length > 0 ? seatNumbers.join(",") : null);
    router.push(`/${tripId}/addons`);
  };

  const handleSkip = () => {
    setSelectedSeats([]);
    setSeatPreference(null);
    setSeatReservationExpiry(null);
    router.push(`/${tripId}/addons`);
  };

  const handleBack = async () => {
    // Release reservations
    if (selectedSeatIds.length > 0) {
      try {
        await fetch(`/api/trips/${tripId}/seats/reserve`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seatIds: selectedSeatIds, sessionId }),
        });
      } catch {
        // Non-critical
      }
    }
    setSelectedSeats([]);
    setSeatReservationExpiry(null);
    router.push(`/${tripId}/details`);
  };

  // Calculate price delta
  const priceDelta = seats
    .filter((s) => selectedSeatIds.includes(s.id))
    .reduce((sum, s) => sum + s.priceDeltaPaise, 0);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-5">
        <Skeleton variant="text" lines={2} />
        <Skeleton height={48} />
        <Skeleton height={400} />
      </div>
    );
  }

  // No vehicle assigned — skip or show message
  if (!hasVehicle) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-5 py-16 text-center">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40">
          airline_seat_recline_normal
        </span>
        <div>
          <h2 className="text-title-lg font-title-lg text-on-surface">
            No Seat Selection
          </h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Seats will be assigned by the trip captain
          </p>
        </div>
        <BookingBottomBar
          step={3}
          totalSteps={6}
          onNext={() => router.push(`/${tripId}/addons`)}
          onBack={() => router.push(`/${tripId}/details`)}
          nextLabel="Continue"
        />
      </div>
    );
  }

  const lowerSeats = seats.filter(
    (s) => s.row < (vehicle?.totalRows ?? 0) || !vehicle?.hasUpperDeck
  );
  const seatTypes = [...new Set(seats.map((s) => s.seatType))];

  return (
    <div className="flex flex-col gap-6 p-5 pb-32">
      {/* Heading */}
      <div>
        <h2 className="text-headline-md font-headline-md text-on-surface">
          Choose Your Seats
        </h2>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Select {travelerCount} {travelerCount === 1 ? "seat" : "seats"} &mdash;{" "}
          {selectedSeatIds.length}/{travelerCount} selected
        </p>
      </div>

      {/* Reservation timer */}
      {timerDisplay && (
        <div className="flex items-center gap-2 rounded-lg bg-tertiary/10 px-3 py-2">
          <span className="material-symbols-outlined text-[18px] text-tertiary">
            timer
          </span>
          <span className="text-label-lg font-label-lg text-tertiary">
            {timerDisplay} remaining
          </span>
          <span className="text-label-sm text-on-surface-variant">
            to complete selection
          </span>
        </div>
      )}

      {/* Legend */}
      <SeatLegend showSeatTypes={seatTypes.length > 1} seatTypes={seatTypes} />

      {/* Deck tabs */}
      {vehicle?.hasUpperDeck && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveDeck("lower")}
            className={cn(
              "flex-1 rounded-lg px-4 py-2.5 text-label-lg font-label-lg transition-colors",
              activeDeck === "lower"
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            Lower Deck
          </button>
          <button
            type="button"
            onClick={() => setActiveDeck("upper")}
            className={cn(
              "flex-1 rounded-lg px-4 py-2.5 text-label-lg font-label-lg transition-colors",
              activeDeck === "upper"
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            Upper Deck
          </button>
        </div>
      )}

      {/* Seat grid */}
      {vehicle && (
        <SeatGrid
          gridLayout={
            activeDeck === "upper" && vehicle.upperGridLayout
              ? vehicle.upperGridLayout
              : vehicle.gridLayout
          }
          seats={seats}
          selectedSeatIds={selectedSeatIds}
          onSeatToggle={handleSeatToggle}
          maxSelectable={travelerCount}
          deck={activeDeck}
        />
      )}

      {/* Seat type info cards */}
      {selectedSeatIds.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-title-md font-title-md text-on-surface">
            Selected Seats
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedSeatIds.map((id) => {
              const seat = seats.find((s) => s.id === id);
              if (!seat) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5"
                >
                  <span className="text-label-lg font-label-lg text-primary">
                    {seat.seatNumber}
                  </span>
                  <span className="text-label-sm text-on-surface-variant">
                    {seat.seatType.replace(/_/g, " ")}
                  </span>
                  {seat.priceDeltaPaise !== 0 && (
                    <span className="text-label-sm text-tertiary">
                      {seat.priceDeltaPaise > 0 ? "+" : ""}
                      {formatCurrency(seat.priceDeltaPaise)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <BookingBottomBar
        step={3}
        totalSteps={6}
        onNext={handleContinue}
        onBack={handleBack}
        priceSummary={
          priceDelta !== 0
            ? {
                label: "Seat price delta",
                amountPaise: priceDelta,
              }
            : undefined
        }
        leftAction={
          <Button variant="ghost" size="lg" onClick={handleSkip}>
            Skip
          </Button>
        }
      />
    </div>
  );
}
