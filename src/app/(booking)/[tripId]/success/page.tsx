"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateRange } from "@/lib/utils";
import { useBookingStore } from "@/stores/booking-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoatSound } from "@/hooks/use-goat-sound";

// ---------------------------------------------------------------------------
//  Confetti particle system
// ---------------------------------------------------------------------------

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

const CONFETTI_COLORS = [
  "#FF385C",
  "#FF6B7D",
  "#FF8FA0",
  "#FFB3C1",
  "#2e7d32",
  "#f57c00",
  "#222222",
  "#717171",
];

function generateConfetti(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    rotation: Math.random() * 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 8,
    delay: Math.random() * 0.8,
  }));
}

function Confetti() {
  const particles = useMemo(() => generateConfetti(50), []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: 2,
          }}
          initial={{ y: p.y, rotate: p.rotation, opacity: 1 }}
          animate={{
            y: "110vh",
            rotate: p.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2.5 + Math.random(),
            delay: p.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------

interface BookingDetails {
  bookingNumber: string;
  tripName: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
  totalPricePaise: number;
}

// ---------------------------------------------------------------------------
//  Page Component
// ---------------------------------------------------------------------------

export default function SuccessPage() {
  const params = useParams<{ tripId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tripId = params.tripId;
  const bookingId = searchParams.get("bookingId");

  const { travelers, travelerCount, selectedSeatIds, seatPreference, summary, setStep, reset } = useBookingStore();
  const { play: playGoat } = useGoatSound();

  const [showConfetti, setShowConfetti] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const hasInitialized = useRef(false);

  useEffect(() => {
    setStep(6);

    if (hasInitialized.current) return;
    hasInitialized.current = true;

    playGoat();

    // Auto-hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 4000);

    async function fetchBooking() {
      try {
        setLoading(true);
        if (bookingId) {
          const res = await fetch(`/api/bookings?id=${bookingId}`);
          if (res.ok) {
            const json = await res.json();
            const data = json.data ?? json;
            setBooking({
              bookingNumber: data.bookingNumber ?? bookingId,
              tripName: data.tripName ?? data.trip?.title ?? "Your Trip",
              startDate: data.startDate ?? data.trip?.startDate ?? "",
              endDate: data.endDate ?? data.trip?.endDate ?? "",
              travelerCount: data.travelerCount ?? travelerCount,
              totalPricePaise: data.totalPricePaise ?? summary?.totalPricePaise ?? 0,
            });
            return;
          }
        }

        // Fallback from store
        const tripRes = await fetch(`/api/trips/${tripId}`);
        const tripJson = tripRes.ok ? await tripRes.json() : null;
        const trip = tripJson?.data ?? tripJson;
        setBooking({
          bookingNumber: bookingId ?? `PA${Date.now().toString(36).toUpperCase()}`,
          tripName: trip?.title ?? "Your Trip",
          startDate: trip?.startDate ?? "",
          endDate: trip?.endDate ?? "",
          travelerCount,
          totalPricePaise: summary?.totalPricePaise ?? 0,
        });
      } catch {
        setBooking({
          bookingNumber: bookingId ?? `PA${Date.now().toString(36).toUpperCase()}`,
          tripName: "Your Trip",
          startDate: "",
          endDate: "",
          travelerCount,
          totalPricePaise: summary?.totalPricePaise ?? 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();

    return () => clearTimeout(timer);
  }, [tripId, bookingId, travelerCount, summary, setStep, playGoat]);

  const handleShare = async () => {
    const shareData = {
      title: "I just booked a trail on Travelling Goats!",
      text: booking
        ? `I am going on ${booking.tripName}. Join me on Travelling Goats!`
        : "Join me on Travelling Goats for amazing group trails!",
      url: `https://meetmyroute.feastigo.com/trips/${tripId}`, // TODO: Update domain to travellinggoats
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback: copy link
      await navigator.clipboard.writeText(shareData.url);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-6 p-8">
        <Skeleton variant="circular" diameter={96} />
        <Skeleton variant="text" lines={3} width="80%" />
        <Skeleton height={120} />
      </div>
    );
  }

  return (
    <>
      {showConfetti && <Confetti />}

      <div className="flex flex-col items-center gap-6 px-5 py-8 pb-32">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2,
          }}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-success"
        >
          <motion.span
            className="material-symbols-outlined filled text-on-success text-[48px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            check
          </motion.span>
        </motion.div>

        {/* Title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-headline-lg font-headline-lg text-on-surface">
            Booking Confirmed!
          </h1>
          <p className="mt-2 text-body-lg text-on-surface-variant">
            Your adventure awaits. Get ready to pack your bags!
          </p>
        </motion.div>

        {/* Booking number */}
        {booking && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-xl bg-primary-fixed/20 px-6 py-3 text-center"
          >
            <p className="text-label-sm text-on-surface-variant">Booking Number</p>
            <p className="text-title-lg font-title-lg text-primary tracking-wider">
              {booking.bookingNumber}
            </p>
          </motion.div>
        )}

        {/* Trip summary card */}
        {booking && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="w-full"
          >
            <Card variant="outlined" className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px] text-primary">
                  flight_takeoff
                </span>
                <h3 className="text-title-md font-title-md text-on-surface">
                  {booking.tripName}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {booking.startDate && booking.endDate && (
                  <div>
                    <p className="text-label-sm text-on-surface-variant">Dates</p>
                    <p className="text-body-md font-medium text-on-surface">
                      {formatDateRange(booking.startDate, booking.endDate)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-label-sm text-on-surface-variant">Travelers</p>
                  <p className="text-body-md font-medium text-on-surface">
                    {booking.travelerCount}{" "}
                    {booking.travelerCount === 1 ? "person" : "people"}
                  </p>
                </div>
                {booking.totalPricePaise > 0 && (
                  <div>
                    <p className="text-label-sm text-on-surface-variant">Amount Paid</p>
                    <p className="text-body-md font-medium text-primary">
                      {formatCurrency(booking.totalPricePaise)}
                    </p>
                  </div>
                )}
              </div>

              {/* Seat numbers */}
              {seatPreference && (
                <div className="border-t border-outline-variant/20 pt-3">
                  <p className="text-label-sm text-on-surface-variant mb-1">
                    Seats
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {seatPreference.split(",").filter(Boolean).map((seat, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-primary/10 px-3 py-1 text-label-sm font-label-sm text-primary"
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Traveler names */}
              {travelers.length > 0 && (
                <div className="border-t border-outline-variant/20 pt-3">
                  <p className="text-label-sm text-on-surface-variant mb-1">
                    Travelers
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {travelers.map((t, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-surface-container px-3 py-1 text-label-sm text-on-surface"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex w-full flex-col gap-3"
        >
          <Button
            fullWidth
            size="lg"
            onClick={() => router.push(`/${tripId}/ticket`)}
            icon={
              <span className="material-symbols-outlined text-[20px]">
                confirmation_number
              </span>
            }
          >
            View Ticket
          </Button>

          <Button
            fullWidth
            size="lg"
            variant="secondary"
            onClick={() => {
              reset();
              router.push("/home");
            }}
            icon={
              <span className="material-symbols-outlined text-[20px]">home</span>
            }
          >
            Back to Home
          </Button>

          <Button
            fullWidth
            size="lg"
            variant="ghost"
            onClick={handleShare}
            icon={
              <span className="material-symbols-outlined text-[20px]">share</span>
            }
          >
            Share with Friends
          </Button>
        </motion.div>
      </div>
    </>
  );
}
