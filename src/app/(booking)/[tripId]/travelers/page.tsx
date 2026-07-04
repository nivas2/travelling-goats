"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { useBookingStore } from "@/stores/booking-store";
import { RadioCard } from "@/components/ui/radio-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------

type BookingType = "SOLO" | "COUPLE" | "GROUP";

interface BookingOption {
  type: BookingType;
  icon: string;
  title: string;
  description: string;
  pricePaise: number;
  defaultCount: number;
}

interface TripPricing {
  basePricePaise: number;
  couplePricePaise: number | null;
  groupPricePaise: number | null;
  maxGroupSize: number;
}

// ---------------------------------------------------------------------------
//  Constants
// ---------------------------------------------------------------------------

const MIN_GROUP_SIZE = 3;
const MAX_GROUP_SIZE_DEFAULT = 10;

// ---------------------------------------------------------------------------
//  Page Component
// ---------------------------------------------------------------------------

export default function TravelersPage() {
  const params = useParams<{ tripId: string }>();
  const router = useRouter();
  const tripId = params.tripId;

  const {
    bookingType,
    travelerCount,
    setTripId,
    setBookingType,
    setTravelerCount,
    setStep,
  } = useBookingStore();

  const [pricing, setPricing] = useState<TripPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch trip pricing on mount
  useEffect(() => {
    setTripId(tripId);
    setStep(1);

    async function fetchTrip() {
      try {
        setLoading(true);
        const res = await fetch(`/api/trips/${tripId}`);
        if (!res.ok) throw new Error("Failed to load trip details");
        const json = await res.json();
        const trip = json.data ?? json;
        setPricing({
          basePricePaise: trip.basePricePaise,
          couplePricePaise: trip.couplePricePaise,
          groupPricePaise: trip.groupPricePaise,
          maxGroupSize: trip.maxGroupSize ?? MAX_GROUP_SIZE_DEFAULT,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchTrip();
  }, [tripId, setTripId, setStep]);

  const bookingOptions: BookingOption[] = pricing
    ? [
        {
          type: "SOLO",
          icon: "person",
          title: "Solo",
          description: "Traveling alone? Join the pack!",
          pricePaise: pricing.basePricePaise,
          defaultCount: 1,
        },
        {
          type: "COUPLE",
          icon: "favorite",
          title: "Couple",
          description: "Travel with your partner",
          pricePaise: pricing.couplePricePaise ?? pricing.basePricePaise * 2,
          defaultCount: 2,
        },
        {
          type: "GROUP",
          icon: "groups",
          title: "Group",
          description: `${MIN_GROUP_SIZE}-${pricing.maxGroupSize} travelers`,
          pricePaise:
            pricing.groupPricePaise ?? pricing.basePricePaise,
          defaultCount: MIN_GROUP_SIZE,
        },
      ]
    : [];

  const selectedOption = bookingOptions.find((o) => o.type === bookingType);

  const handleTypeChange = (type: BookingType) => {
    setBookingType(type);
    const opt = bookingOptions.find((o) => o.type === type);
    if (opt) {
      setTravelerCount(opt.defaultCount);
    }
  };

  const handleGroupCountChange = (delta: number) => {
    if (!pricing) return;
    const next = travelerCount + delta;
    if (next >= MIN_GROUP_SIZE && next <= pricing.maxGroupSize) {
      setTravelerCount(next);
    }
  };

  const handleContinue = () => {
    router.push(`/${tripId}/details`);
  };

  // ------ Loading state ------
  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-5">
        <Skeleton variant="text" lines={2} />
        <Skeleton height={88} />
        <Skeleton height={88} />
        <Skeleton height={88} />
        <Skeleton height={48} />
      </div>
    );
  }

  // ------ Error state ------
  if (error || !pricing) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="material-symbols-outlined text-[48px] text-error">
          error
        </span>
        <p className="text-title-md font-title-md text-on-surface">
          {error ?? "Trip not found"}
        </p>
        <Button variant="secondary" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  // ------ Price calculation ------
  const totalPricePaise =
    bookingType === "GROUP" && selectedOption
      ? selectedOption.pricePaise * travelerCount
      : selectedOption?.pricePaise ?? 0;

  return (
    <div className="flex flex-col gap-6 p-5 pb-32">
      {/* Heading */}
      <div>
        <h2 className="text-headline-md font-headline-md text-on-surface">
          How are you traveling?
        </h2>
        <p className="mt-1 text-body-md font-body-md text-on-surface-variant">
          Choose your booking type to get started
        </p>
      </div>

      {/* Booking type radio cards */}
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Booking type">
        {bookingOptions.map((opt) => (
          <motion.div
            key={opt.type}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: bookingOptions.indexOf(opt) * 0.08 }}
          >
            <RadioCard
              selected={bookingType === opt.type}
              icon={opt.icon}
              title={opt.title}
              description={opt.description}
              price={
                opt.type === "GROUP"
                  ? `${formatCurrency(opt.pricePaise)}/person`
                  : formatCurrency(opt.pricePaise)
              }
              onChange={() => handleTypeChange(opt.type)}
            />
          </motion.div>
        ))}
      </div>

      {/* Group size selector */}
      {bookingType === "GROUP" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card variant="outlined" className="flex items-center justify-between">
            <div>
              <p className="text-title-md font-title-md text-on-surface">
                Number of Travelers
              </p>
              <p className="text-body-md font-body-md text-on-surface-variant">
                {MIN_GROUP_SIZE}-{pricing.maxGroupSize} people
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Minus */}
              <button
                type="button"
                onClick={() => handleGroupCountChange(-1)}
                disabled={travelerCount <= MIN_GROUP_SIZE}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  travelerCount <= MIN_GROUP_SIZE
                    ? "border-outline-variant text-on-surface-variant/40 cursor-not-allowed"
                    : "border-primary text-primary hover:bg-primary/5",
                )}
                aria-label="Decrease travelers"
              >
                <span className="material-symbols-outlined text-[20px]">
                  remove
                </span>
              </button>

              {/* Count */}
              <span className="min-w-[2ch] text-center text-headline-md font-headline-md text-on-surface">
                {travelerCount}
              </span>

              {/* Plus */}
              <button
                type="button"
                onClick={() => handleGroupCountChange(1)}
                disabled={travelerCount >= pricing.maxGroupSize}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  travelerCount >= pricing.maxGroupSize
                    ? "border-outline-variant text-on-surface-variant/40 cursor-not-allowed"
                    : "border-primary text-primary hover:bg-primary/5",
                )}
                aria-label="Increase travelers"
              >
                <span className="material-symbols-outlined text-[20px]">
                  add
                </span>
              </button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Price summary */}
      {selectedOption && (
        <Card className="flex items-center justify-between bg-primary-fixed/10">
          <div>
            <p className="text-body-md font-body-md text-on-surface-variant">
              Estimated total
            </p>
            <p className="text-headline-md font-headline-md text-primary">
              {formatCurrency(totalPricePaise)}
            </p>
          </div>
          <span className="text-body-md font-body-md text-on-surface-variant">
            {travelerCount} {travelerCount === 1 ? "traveler" : "travelers"}
          </span>
        </Card>
      )}

      {/* Sticky bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 border-t border-outline-variant/10 bg-surface/95 backdrop-blur-md p-4 pb-safe">
        <Button fullWidth size="lg" onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
