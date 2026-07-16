"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { recordTripView } from "@/lib/recently-viewed";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { cn, formatCurrency, formatDateRange, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Rating } from "@/components/ui/rating";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { WriteReviewModal } from "@/components/reviews/write-review-modal";
import { TripLocationWeather } from "@/components/trips/trip-location-weather";
import { StartingCityGate } from "@/components/ui/starting-city-notice";
import { useStartingCity } from "@/lib/use-starting-city";
import type { TripDetail, ApiResponse } from "@/types";

// Representative traveller avatars for the "who's going" stack on the hero.
const TRAVELER_AVATARS = [
  "/uploads/avatar1.jpg",
  "/uploads/avatar2.jpg",
  "/uploads/avatar3.jpg",
];

// ---------------------------------------------------------------------------
// Image Carousel
// ---------------------------------------------------------------------------

function ImageCarousel({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const pausedRef = useRef(false);

  const allImages = images.length > 0 ? images : ["/placeholder-trip.jpg"];

  // Auto-rotate every 3 seconds
  useEffect(() => {
    if (allImages.length <= 1) return;
    const timer = setInterval(() => {
      if (!pausedRef.current) {
        setCurrentIndex((prev) => (prev + 1) % allImages.length);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [allImages.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    pausedRef.current = true;
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (Math.abs(distance) >= minSwipeDistance) {
      if (distance > 0 && currentIndex < allImages.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (distance < 0 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    }
    setTouchStart(0);
    setTouchEnd(0);
    // Resume auto-rotate after 5s
    setTimeout(() => { pausedRef.current = false; }, 5000);
  };

  return (
    <div
      className="relative h-[440px] w-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {allImages.map((img, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 transition-transform duration-300 ease-out",
          )}
          style={{ transform: `translateX(${(i - currentIndex) * 100}%)` }}
        >
          <Image
            src={img}
            alt={`${title} - Image ${i + 1}`}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

      {/* Dot indicators */}
      {allImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {allImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className="flex items-center justify-center p-2 -m-1"
              aria-label={`Go to image ${i + 1}`}
            >
              <span
                className={cn(
                  "block h-2 rounded-full transition-all duration-200",
                  i === currentIndex ? "w-6 bg-white" : "w-2 bg-white/50"
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FAQ Accordion
// ---------------------------------------------------------------------------

function FaqAccordion({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-outline-variant/30 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="text-body-lg font-semibold text-on-surface pr-4">
          {question}
        </span>
        <Icon
          name={isOpen ? "expand_less" : "expand_more"}
          size={24}
          className="shrink-0 text-on-surface-variant"
        />
      </button>
      {isOpen && (
        <div className="pb-4 pr-8">
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review Card (inline for Overview tab)
// ---------------------------------------------------------------------------

interface ReviewData {
  id: string;
  userName: string;
  userAvatar: string | null;
  rating: number;
  comment: string;
  date: string;
}

function ReviewCard({ review }: { review: ReviewData }) {
  return (
    <Card variant="outlined" className="p-5">
      <div className="flex items-center gap-3">
        <Avatar
          src={review.userAvatar}
          name={review.userName}
          size="sm"
        />
        <div className="flex-1">
          <p className="text-label-lg font-semibold text-on-surface">
            {review.userName}
          </p>
          <p className="text-label-sm text-on-surface-variant">
            {formatDate(review.date)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Icon name="star" size={14} filled className="text-tertiary" />
          <span className="text-label-lg font-semibold">{review.rating}</span>
        </div>
      </div>
      <p className="mt-3 text-body-md text-on-surface-variant line-clamp-3">
        {review.comment}
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function TripDetailSkeleton() {
  return (
    <div>
      <Skeleton variant="rectangular" height={360} className="rounded-none" />
      <div className="px-5 py-4 space-y-4">
        <Skeleton variant="text" lines={1} width="80%" />
        <Skeleton variant="text" lines={1} width="60%" />
        <div className="flex gap-3">
          <Skeleton variant="rectangular" width={100} height={36} />
          <Skeleton variant="rectangular" width={100} height={36} />
          <Skeleton variant="rectangular" width={100} height={36} />
        </div>
        <Skeleton variant="rectangular" height={80} />
        <Skeleton variant="text" lines={3} />
        <Skeleton variant="rectangular" height={200} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trip Detail Page
// ---------------------------------------------------------------------------

export default function TripDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  // Remember this trip for the Home "Recently viewed" rail.
  useEffect(() => {
    if (id) recordTripView(id);
  }, [id]);
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [weather, setWeather] = useState<{
    tempC: number;
    icon: string;
    condition: string;
  } | null>(null);

  // Real reviews for the reviews tab
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  // Whether the trip has ended — reviews only apply to completed trips.
  const [isCompleted, setIsCompleted] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  // Only riders departing from a served starting city can book.
  const startingCity = useStartingCity();

  // Gate booking: users from unserved locations must pick a starting city first.
  const startBooking = useCallback(() => {
    if (startingCity.ready && !startingCity.isServed) {
      setGateOpen(true);
      return;
    }
    router.push(`/${id}/travelers`);
  }, [startingCity.ready, startingCity.isServed, router, id]);

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?tripId=${id}`);
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setReviews(
          (d.reviews ?? []).slice(0, 3).map(
            (r: {
              id: string;
              userName: string;
              userAvatar: string | null;
              overallRating: number;
              comment: string | null;
              createdAt: string;
            }) => ({
              id: r.id,
              userName: r.userName,
              userAvatar: r.userAvatar,
              rating: r.overallRating,
              comment: r.comment ?? "",
              date: r.createdAt,
            })
          )
        );
        setCanReview(!!d.canReview);
        setHasReviewed(!!d.hasReviewed);
      }
    } catch {
      /* ignore */
    }
  }, [id]);

  const fetchTrip = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(false);
      const [res] = await Promise.all([fetch(`/api/trips/${id}`), loadReviews()]);
      const json: ApiResponse<TripDetail> = await res.json();
      if (json.success && json.data) {
        setTrip(json.data);
        // Reviews only apply once a trip has ended (or is marked completed).
        const t = json.data as TripDetail & { status?: string };
        setIsCompleted(
          new Date(t.endDate).getTime() < Date.now() || t.status === "COMPLETED"
        );
      }
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [id, loadReviews]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  // Live weather for the hero pill (Open-Meteo via /api/weather).
  useEffect(() => {
    if (!trip?.destination) return;
    let active = true;
    fetch(`/api/weather?place=${encodeURIComponent(trip.destination)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.available) setWeather(d);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [trip?.destination]);

  const handleShare = async () => {
    if (navigator.share && trip) {
      try {
        await navigator.share({
          title: trip.title,
          text: `Check out this trail to ${trip.destination} on Meet My Route!`,
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  if (loading) return <TripDetailSkeleton />;

  if (!trip) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <Icon
          name="error_outline"
          size={64}
          className="text-on-surface-variant/40"
        />
        <h2 className="mt-4 text-title-lg font-semibold text-on-surface">
          {fetchError ? "Failed to Load Trip" : "Trip Not Found"}
        </h2>
        <p className="mt-2 text-body-md text-on-surface-variant">
          {fetchError
            ? "Something went wrong. Please try again."
            : "This trip may no longer be available."}
        </p>
        <div className="mt-6 flex gap-3">
          {fetchError && (
            <Button variant="secondary" onClick={fetchTrip}>
              Retry
            </Button>
          )}
          <Button onClick={() => router.push("/home")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const spotsLeft = trip.maxGroupSize - trip.currentBookings;
  const spotsPercentage = (trip.currentBookings / trip.maxGroupSize) * 100;
  // Trip.rating is kept accurate across all reviews by the review API.
  const averageRating = trip.rating;

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* ===== Hero ===== */}
      <div className="relative">
        <ImageCarousel images={trip.images} title={trip.title} />

        {/* overall black tint for depth + contrast */}
        <div className="pointer-events-none absolute inset-0 bg-black/30" />
        {/* bottom scrim for overlaid title legibility */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* top bar: back + (share, weather) */}
        <div className="absolute inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex items-start justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 ring-1 ring-white/15 backdrop-blur-md transition active:scale-95 hover:bg-black/45"
            aria-label="Go back"
          >
            <Icon name="arrow_back" size={22} className="text-white" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 ring-1 ring-white/15 backdrop-blur-md transition active:scale-95 hover:bg-black/45"
              aria-label="Share trip"
            >
              <Icon name="share" size={20} className="text-white" />
            </button>
            {weather && (
              <div className="flex items-center gap-2 rounded-full bg-white/90 py-1.5 pl-2 pr-3.5 backdrop-blur-md">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime/25 text-on-surface">
                  <Icon name={weather.icon} size={18} filled />
                </span>
                <div className="leading-tight">
                  <p className="text-[10px] font-medium text-on-surface-variant">Weather</p>
                  <p className="text-[13px] font-bold text-on-surface">{weather.tempC}°C</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* overlaid destination title + stat + travellers */}
        <div className="absolute inset-x-5 bottom-14 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-[12px] font-semibold text-white ring-1 ring-white/15 backdrop-blur-md">
            <Icon name="hiking" size={15} className="text-lime" filled />
            {trip.duration}-day trip
          </span>
          <h2 className="mt-3 text-[34px] font-semibold leading-[1.04] tracking-[-0.03em] text-white text-shadow-premium">
            {trip.destination}
          </h2>
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex -space-x-3">
              {TRAVELER_AVATARS.map((src) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={src} src={src} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} className="h-10 w-10 rounded-full border-2 border-white/80 object-cover" />
              ))}
              {trip.currentBookings > 0 && (
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/80 bg-black/40 text-[11px] font-bold text-white backdrop-blur">
                  +{trip.currentBookings}
                </span>
              )}
            </div>
            <span className="text-[13px] font-medium text-white/85">going</span>
          </div>
        </div>
      </div>

      {/* ===== Sheet ===== */}
      <div className="relative z-20 -mt-8 rounded-t-[32px] bg-background px-5 pt-7">
        {/* floating wishlist */}
        <button
          onClick={toggleWishlist}
          className={cn(
            "absolute -top-7 right-5 flex h-14 w-14 items-center justify-center rounded-full ring-4 ring-background transition active:scale-95",
            isWishlisted ? "bg-white shadow-[0_10px_28px_rgba(0,0,0,0.18)]" : "bg-lime shadow-[0_10px_28px_rgba(198,241,53,0.45)]"
          )}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Icon name="favorite" size={24} filled={isWishlisted} className={isWishlisted ? "text-on-surface" : "text-on-surface"} />
        </button>

        {/* location + trending */}
        <div className="flex items-center gap-2 pr-16">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-on-surface-variant">
            <Icon name="location_on" size={16} filled className="text-on-surface" />
            {trip.destination}
          </span>
          {trip.isTrending && (
            <span className="inline-flex items-center gap-1 rounded-full bg-lime px-2.5 py-1 text-[11px] font-semibold text-on-surface">
              <Icon name="trending_up" size={13} />
              Trending
            </span>
          )}
        </div>

        {/* title */}
        <h1 className="mt-2 text-[26px] font-semibold leading-[1.14] tracking-[-0.03em] text-on-surface">
          {trip.title}
        </h1>

        {/* chip row */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { icon: "calendar_today", text: formatDateRange(trip.startDate, trip.endDate) },
            { icon: "schedule", text: `${trip.duration} days` },
            { icon: "group", text: `${trip.currentBookings}/${trip.maxGroupSize}` },
            { icon: "star", text: `${trip.rating.toFixed(1)} (${trip.reviewCount})`, lime: true },
          ].map((c) => (
            <span
              key={c.icon}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-on-surface ring-1 ring-black/[0.06]"
            >
              <Icon name={c.icon} size={15} filled={c.lime} className={c.lime ? "text-lime" : "text-on-surface-variant"} />
              {c.text}
            </span>
          ))}
        </div>

        {/* Departure countdown — live ticking timer */}
        <div className="mt-5">
          <CountdownTimer date={trip.startDate} />
        </div>

        {/* Spots Remaining */}
        <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-on-surface">
              <Icon name="groups" size={16} className="text-on-surface-variant" />
              Spots remaining
            </span>
            <span
              className={cn(
                "text-[13px] font-bold",
                spotsLeft <= 5 ? "text-error" : "text-on-surface"
              )}
            >
              {spotsLeft} / {trip.maxGroupSize} left
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-on-surface/15">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                spotsLeft <= 5 ? "bg-error" : "bg-lime"
              )}
              style={{ width: `${Math.max(spotsPercentage, 6)}%` }}
            />
          </div>
        </div>

        {/* Quick Info Row */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {[
            { icon: "calendar_today", label: "Dates", value: formatDateRange(trip.startDate, trip.endDate) },
            { icon: "group", label: "Group Size", value: `${trip.minGroupSize} - ${trip.maxGroupSize}` },
            { icon: "pin_drop", label: "From", value: trip.origin ?? "TBA" },
          ].map((q) => (
            <div key={q.label} className="rounded-2xl bg-white p-3 text-center ring-1 ring-black/[0.06]">
              <span className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-lime">
                <span className="material-symbols-outlined filled text-[19px] text-on-surface" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {q.icon}
                </span>
              </span>
              <p className="text-[11px] text-on-surface-variant">{q.label}</p>
              <p className="mt-0.5 line-clamp-1 text-[12px] font-semibold text-on-surface">
                {q.value}
              </p>
            </div>
          ))}
        </div>

        {/* Vehicle Info */}
        {trip.vehicleTemplate && (
          <section className="mt-6">
            <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-on-surface mb-3">
              Vehicle
            </h3>
            <div className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime/15">
                <span className="material-symbols-outlined text-[22px] text-on-surface">
                  {trip.vehicleTemplate.vehicleType?.icon ?? "directions_bus"}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-on-surface">
                  {trip.vehicleTemplate.vehicleType?.name ?? "Vehicle"}
                </p>
                <p className="text-[13px] text-on-surface-variant">
                  {trip.vehicleTemplate.name} &middot; {trip.vehicleTemplate.totalSeats} seats
                </p>
                {trip.vehicleTemplate.amenities && trip.vehicleTemplate.amenities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {trip.vehicleTemplate.amenities.map((amenity, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-surface-container px-2.5 py-0.5 text-[12px] text-on-surface-variant"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Inclusions & Exclusions — side by side */}
        {(trip.inclusions.length > 0 || trip.exclusions.length > 0) && (
          <div className="mt-6 grid grid-cols-2 gap-4 md:gap-6">
            {trip.inclusions.length > 0 && (
              <section>
                <h3 className="mb-3 text-[18px] font-semibold tracking-[-0.02em] text-on-surface">
                  Inclusions
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {trip.inclusions.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime">
                        <Icon name="check" size={13} className="text-on-surface" />
                      </span>
                      <span className="text-[14px] leading-snug text-on-surface">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {trip.exclusions.length > 0 && (
              <section>
                <h3 className="mb-3 text-[18px] font-semibold tracking-[-0.02em] text-on-surface">
                  Exclusions
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {trip.exclusions.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-error/10">
                        <Icon name="close" size={13} className="text-error" />
                      </span>
                      <span className="text-[14px] leading-snug text-on-surface-variant">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ===== Tabs ===== */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabList className="-mx-5 px-5">
              <Tab value="overview">Overview</Tab>
              <Tab value="itinerary">Itinerary</Tab>
              {isCompleted && <Tab value="reviews">Reviews</Tab>}
              <Tab value="faqs">FAQs</Tab>
            </TabList>

            {/* Overview Tab */}
            <TabPanel value="overview">
              {/* Highlights */}
              {trip.highlights.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-on-surface mb-3">
                    Highlights
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {trip.highlights.map((highlight, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <Icon
                          name="auto_awesome"
                          size={18}
                          className="text-tertiary mt-0.5 shrink-0"
                        />
                        <span className="text-body-md text-on-surface">
                          {highlight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {trip.description && (
                <div>
                  <h3 className="text-title-lg font-title-lg text-on-surface mb-2">
                    About This Trip
                  </h3>
                  <p className="text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">
                    {trip.description}
                  </p>
                </div>
              )}

              {/* Live weather + location map */}
              <TripLocationWeather destination={trip.destination} />
            </TabPanel>

            {/* Itinerary Tab */}
            <TabPanel value="itinerary">
              {trip.itineraryDays.length > 0 ? (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-outline-variant/40" />

                  <div className="space-y-6">
                    {trip.itineraryDays.map((day) => (
                      <div key={day.id} className="relative flex gap-4">
                        {/* Timeline dot */}
                        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary text-label-sm font-bold">
                          {day.dayNumber}
                        </div>

                        <div className="flex-1 pb-2">
                          <h4 className="text-title-md font-semibold text-on-surface">
                            {day.title}
                          </h4>
                          {day.description && (
                            <p className="mt-1 text-body-md text-on-surface-variant">
                              {day.description}
                            </p>
                          )}

                          {/* Activities */}
                          {Array.isArray(day.activities) && day.activities.length > 0 && (
                            <div className="mt-2.5 space-y-2">
                              {(day.activities as { time: string; title: string }[]).map((activity, ai) => (
                                <div
                                  key={ai}
                                  className="flex items-start gap-2"
                                >
                                  <span className="text-label-sm font-semibold text-primary min-w-[52px] shrink-0">
                                    {activity.time}
                                  </span>
                                  <span className="text-body-md text-on-surface">
                                    {activity.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Meals */}
                          {Array.isArray(day.meals) && day.meals.length > 0 && (
                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                              <Icon
                                name="restaurant"
                                size={16}
                                className="text-on-surface-variant"
                              />
                              {day.meals.map((meal, mi) => (
                                <Chip
                                  key={mi}
                                  variant="outlined"
                                  color="secondary"
                                  className="text-[10px] px-2 py-0.5"
                                >
                                  {meal}
                                </Chip>
                              ))}
                            </div>
                          )}

                          {/* Accommodation */}
                          {day.accommodation && (
                            <div className="mt-2 flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                              <Icon name="hotel" size={16} />
                              <span>{day.accommodation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* View full itinerary link */}
                  <Link
                    href={`/trips/${id}/itinerary`}
                    className="mt-4 flex items-center justify-center gap-1 text-label-lg font-semibold text-primary"
                  >
                    View Full Itinerary
                    <Icon name="arrow_forward" size={18} />
                  </Link>
                </div>
              ) : (
                <p className="text-body-md text-on-surface-variant text-center py-8">
                  Itinerary details coming soon
                </p>
              )}
            </TabPanel>

            {/* Reviews Tab — only for completed trips */}
            {isCompleted && (
            <TabPanel value="reviews">
              {/* Rating Summary */}
              <div className="flex items-center gap-4 mb-6">
                <div className="text-center">
                  <p className="text-display font-bold text-on-surface">
                    {averageRating.toFixed(1)}
                  </p>
                  <Rating value={averageRating} readonly size="sm" />
                  <p className="mt-1 text-label-sm text-on-surface-variant">
                    {trip.reviewCount} reviews
                  </p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews.filter(
                      (r) => Math.round(r.rating) === star
                    ).length;
                    const pct =
                      reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-label-sm text-on-surface-variant w-3">
                          {star}
                        </span>
                        <Icon
                          name="star"
                          size={12}
                          filled
                          className="text-tertiary"
                        />
                        <div className="flex-1 h-2 rounded-full bg-surface-container-high overflow-hidden">
                          <div
                            className="h-full rounded-full bg-tertiary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-label-sm text-on-surface-variant w-6 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Write a review CTA */}
              {hasReviewed ? (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-body-md text-success">
                  <Icon name="check_circle" size={20} filled />
                  You&apos;ve reviewed this trip. Thanks!
                </div>
              ) : canReview ? (
                <Button
                  fullWidth
                  className="mb-4"
                  icon={<Icon name="rate_review" size={18} />}
                  onClick={() => setWriteOpen(true)}
                >
                  Write a Review
                </Button>
              ) : null}

              {/* Review Cards */}
              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-body-md text-on-surface-variant">
                  No reviews yet.{" "}
                  {canReview ? "Be the first to review this trip!" : "Reviews will appear here."}
                </div>
              )}

              {/* View all reviews link */}
              {reviews.length > 0 && (
                <Link
                  href={`/trips/${id}/reviews`}
                  className="mt-4 flex items-center justify-center gap-1 text-label-lg font-semibold text-primary"
                >
                  View All Reviews
                  <Icon name="arrow_forward" size={18} />
                </Link>
              )}
            </TabPanel>
            )}

            {/* FAQs Tab */}
            <TabPanel value="faqs">
              {trip.faqs.length > 0 ? (
                <div>
                  {trip.faqs.map((faq) => (
                    <FaqAccordion
                      key={faq.id}
                      question={faq.question}
                      answer={faq.answer}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-body-md text-on-surface-variant text-center py-8">
                  No FAQs available yet
                </p>
              )}
            </TabPanel>
          </Tabs>
        </div>
      </div>

      {/* ===== Fixed Bottom Bar ===== */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/90 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl shadow-[0_-10px_30px_rgba(20,30,40,0.07)]">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-5">
          {/* Wishlist */}
          <button
            onClick={toggleWishlist}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition active:scale-95",
              isWishlisted ? "bg-white ring-1 ring-black/10" : "bg-surface-container hover:bg-surface-container-high"
            )}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Icon
              name="favorite"
              size={22}
              filled={isWishlisted}
              className={isWishlisted ? "text-on-surface" : "text-on-surface-variant"}
            />
          </button>

          {/* Price */}
          <div className="ml-0.5 flex-1">
            <p className="text-[11px] text-on-surface-variant leading-tight">
              Starting from
            </p>
            <p className="text-[20px] font-bold tracking-[-0.02em] text-on-surface leading-tight">
              {formatCurrency(trip.basePricePaise)}
            </p>
          </div>

          {/* Join the Community */}
          <button
            onClick={startBooking}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-lime px-6 py-3.5 text-[15px] font-semibold text-on-surface shadow-[0_10px_26px_rgba(198,241,53,0.4)] transition active:scale-[0.98]"
          >
            Join the Community
            <Icon name="arrow_forward" size={18} />
          </button>
        </div>
      </div>

      <WriteReviewModal
        tripId={id}
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        onSubmitted={loadReviews}
      />

      <StartingCityGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        cities={startingCity.bookableCities}
        selectedCity={startingCity.selectedCity}
        detectedCity={startingCity.detectedCity}
        onChoose={(name) => {
          startingCity.chooseCity(name);
          setGateOpen(false);
          router.push(`/${id}/travelers`);
        }}
      />
    </div>
  );
}
