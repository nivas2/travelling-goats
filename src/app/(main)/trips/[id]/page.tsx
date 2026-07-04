"use client";

import { useEffect, useRef, useState, useCallback, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, formatCurrency, formatDateRange, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import type { TripDetail, ApiResponse } from "@/types";

// ---------------------------------------------------------------------------
// Difficulty Badge Color Map
// ---------------------------------------------------------------------------

const difficultyColorMap: Record<string, "primary" | "secondary" | "tertiary"> = {
  Easy: "secondary",
  Moderate: "tertiary",
  Hard: "primary",
  Challenging: "primary",
};

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
      className="relative h-[360px] w-full overflow-hidden"
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
              className={cn(
                "rounded-full transition-all duration-200",
                i === currentIndex
                  ? "h-2 w-6 bg-white"
                  : "h-2 w-2 bg-white/50"
              )}
              aria-label={`Go to image ${i + 1}`}
            />
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

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Mock review data for the reviews tab
  const [reviews] = useState<ReviewData[]>([
    {
      id: "r1",
      userName: "Priya Sharma",
      userAvatar: null,
      rating: 5,
      comment:
        "Absolutely incredible experience! The organizers were so thoughtful, every detail was taken care of. Would definitely recommend to anyone looking for a hassle-free adventure.",
      date: "2025-03-15",
    },
    {
      id: "r2",
      userName: "Arjun Patel",
      userAvatar: null,
      rating: 4,
      comment:
        "Great trip overall. The itinerary was well-planned and the group was amazing. Only minor issue was the accommodation on day 2, but the rest made up for it.",
      date: "2025-03-01",
    },
    {
      id: "r3",
      userName: "Neha Gupta",
      userAvatar: null,
      rating: 5,
      comment:
        "Best trip I have ever been on! Met some wonderful people and the views were breathtaking. MeetMyRoute really knows how to curate experiences.",
      date: "2025-02-20",
    },
  ]);

  const fetchTrip = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(false);
      const res = await fetch(`/api/trips/${id}`);
      const json: ApiResponse<TripDetail> = await res.json();
      if (json.success && json.data) {
        setTrip(json.data);
      }
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  const handleShare = async () => {
    if (navigator.share && trip) {
      try {
        await navigator.share({
          title: trip.title,
          text: `Check out this trip to ${trip.destination} on MeetMyRoute!`,
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
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : trip.rating;

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* ===== Hero Image Carousel ===== */}
      <div className="relative">
        <ImageCarousel images={trip.images} title={trip.title} />

        {/* Top action buttons */}
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between z-10">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-md transition-colors hover:bg-black/50"
            aria-label="Go back"
          >
            <Icon name="arrow_back" size={22} className="text-white" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-md transition-colors hover:bg-black/50"
              aria-label="Share trip"
            >
              <Icon name="share" size={22} className="text-white" />
            </button>
            <button
              onClick={toggleWishlist}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-md transition-colors hover:bg-black/50"
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Icon
                name="favorite"
                size={22}
                filled={isWishlisted}
                className={isWishlisted ? "text-primary" : "text-white"}
              />
            </button>
          </div>
        </div>

        {/* Price badge removed — shown in fixed bottom bar */}
      </div>

      {/* ===== Trip Info ===== */}
      <div className="px-5 pt-5">
        {/* Title & Destination */}
        <h1 className="text-headline-md font-bold text-on-surface">
          {trip.title}
        </h1>
        <div className="mt-1.5 flex items-center gap-1.5 text-body-md text-on-surface-variant">
          <Icon name="location_on" size={18} className="text-primary" />
          <span>{trip.destination}</span>
        </div>

        {/* Duration & Difficulty */}
        <div className="mt-3 flex items-center gap-2.5">
          <Chip variant="outlined" color="secondary" className="gap-1">
            <Icon name="schedule" size={14} />
            {trip.duration} Days
          </Chip>
          <Chip
            variant="filled"
            color={difficultyColorMap[trip.difficulty] ?? "primary"}
          >
            {trip.difficulty}
          </Chip>
          {trip.isTrending && (
            <Chip variant="filled" color="tertiary">
              Trending
            </Chip>
          )}
        </div>

        {/* Spots Remaining */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-label-lg font-semibold text-on-surface">
              Spots Remaining
            </span>
            <span
              className={cn(
                "text-label-lg font-bold",
                spotsLeft <= 5 ? "text-error" : "text-success"
              )}
            >
              {spotsLeft} / {trip.maxGroupSize}
            </span>
          </div>
          <ProgressBar
            value={spotsPercentage}
            color={spotsLeft <= 5 ? "primary" : "success"}
            className="w-full"
          />
        </div>

        {/* Rating */}
        <div className="mt-4 flex items-center gap-2">
          <Rating value={trip.rating} readonly size="sm" />
          <span className="text-label-lg font-semibold text-on-surface">
            {trip.rating.toFixed(1)}
          </span>
          <span className="text-label-sm text-on-surface-variant">
            ({trip.reviewCount} reviews)
          </span>
        </div>

        {/* Quick Info Row */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Card variant="outlined" className="flex flex-col items-center p-3 text-center">
            <Icon name="calendar_today" size={22} className="text-primary mb-1" />
            <p className="text-label-sm text-on-surface-variant">Dates</p>
            <p className="text-label-sm font-semibold text-on-surface mt-0.5">
              {formatDateRange(trip.startDate, trip.endDate)}
            </p>
          </Card>
          <Card variant="outlined" className="flex flex-col items-center p-3 text-center">
            <Icon name="group" size={22} className="text-primary mb-1" />
            <p className="text-label-sm text-on-surface-variant">Group Size</p>
            <p className="text-label-sm font-semibold text-on-surface mt-0.5">
              {trip.minGroupSize} - {trip.maxGroupSize}
            </p>
          </Card>
          <Card variant="outlined" className="flex flex-col items-center p-3 text-center">
            <Icon name="pin_drop" size={22} className="text-primary mb-1" />
            <p className="text-label-sm text-on-surface-variant">Meeting</p>
            <p className="text-label-sm font-semibold text-on-surface mt-0.5 line-clamp-1">
              {trip.meetingPoint ?? "TBA"}
            </p>
          </Card>
        </div>

        {/* Vehicle Info */}
        {trip.vehicleTemplate && (
          <section className="mt-6">
            <h3 className="text-title-lg font-title-lg text-on-surface mb-3">
              Vehicle
            </h3>
            <Card variant="outlined" className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <span className="material-symbols-outlined text-[22px] text-primary">
                  {trip.vehicleTemplate.vehicleType?.icon ?? "directions_bus"}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-title-md font-title-md text-on-surface">
                  {trip.vehicleTemplate.vehicleType?.name ?? "Vehicle"}
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  {trip.vehicleTemplate.name} &middot; {trip.vehicleTemplate.totalSeats} seats
                </p>
                {trip.vehicleTemplate.amenities && trip.vehicleTemplate.amenities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {trip.vehicleTemplate.amenities.map((amenity, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-surface-container px-2.5 py-0.5 text-label-sm text-on-surface-variant"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </section>
        )}

        {/* Inclusions */}
        {trip.inclusions.length > 0 && (
          <section className="mt-6">
            <h3 className="text-title-lg font-title-lg text-on-surface mb-3">
              Inclusions
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {trip.inclusions.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Icon
                    name="check_circle"
                    size={20}
                    filled
                    className="text-success mt-0.5 shrink-0"
                  />
                  <span className="text-body-md text-on-surface">{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Exclusions */}
        {trip.exclusions.length > 0 && (
          <section className="mt-6">
            <h3 className="text-title-lg font-title-lg text-on-surface mb-3">
              Exclusions
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {trip.exclusions.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Icon
                    name="cancel"
                    size={20}
                    filled
                    className="text-error mt-0.5 shrink-0"
                  />
                  <span className="text-body-md text-on-surface-variant">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== Tabs ===== */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabList className="-mx-5 px-5">
              <Tab value="overview">Overview</Tab>
              <Tab value="itinerary">Itinerary</Tab>
              <Tab value="reviews">Reviews</Tab>
              <Tab value="faqs">FAQs</Tab>
            </TabList>

            {/* Overview Tab */}
            <TabPanel value="overview">
              {/* Highlights */}
              {trip.highlights.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-title-lg font-title-lg text-on-surface mb-3">
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

            {/* Reviews Tab */}
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

              {/* Review Cards */}
              <div className="space-y-3">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>

              {/* View all reviews link */}
              <Link
                href={`/trips/${id}/reviews`}
                className="mt-4 flex items-center justify-center gap-1 text-label-lg font-semibold text-primary"
              >
                View All Reviews
                <Icon name="arrow_forward" size={18} />
              </Link>
            </TabPanel>

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
      <div
        className={cn(
          "fixed left-0 right-0 z-40",
          "bottom-0",
          "bg-surface/95 backdrop-blur-md",
          "border-t border-outline-variant/20",
          "px-4 py-2.5 md:pb-safe",
          "shadow-nav"
        )}
      >
        <div className="flex items-center gap-3">
          {/* Wishlist */}
          <button
            onClick={toggleWishlist}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-outline-variant transition-colors hover:bg-surface-container"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Icon
              name="favorite"
              size={22}
              filled={isWishlisted}
              className={isWishlisted ? "text-primary" : "text-on-surface-variant"}
            />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-outline-variant transition-colors hover:bg-surface-container"
            aria-label="Share trip"
          >
            <Icon name="share" size={22} className="text-on-surface-variant" />
          </button>

          {/* Price */}
          <div className="ml-1 flex-1">
            <p className="text-label-sm text-on-surface-variant leading-tight">
              Starting from
            </p>
            <p className="text-title-lg font-bold text-primary leading-tight">
              {formatCurrency(trip.basePricePaise)}
            </p>
          </div>

          {/* Book Now */}
          <Button
            size="lg"
            onClick={() => router.push(`/${id}/travelers`)}
            className="shrink-0"
          >
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
}
