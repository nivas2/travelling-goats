"use client";

import { useEffect, useState, useCallback, useMemo, use } from "react";
import { cn, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Rating } from "@/components/ui/rating";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import type { TripDetail, ApiResponse } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReviewData {
  id: string;
  userName: string;
  userAvatar: string | null;
  rating: number;
  comment: string;
  date: string;
  isVerified: boolean;
  helpfulCount: number;
}

type SortOption = "newest" | "highest" | "lowest";
type FilterRating = 0 | 1 | 2 | 3 | 4 | 5;

// ---------------------------------------------------------------------------
// Rating Summary Bar
// ---------------------------------------------------------------------------

function RatingSummaryBar({
  star,
  count,
  total,
}: {
  star: number;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-label-lg font-semibold text-on-surface w-3 text-right">
        {star}
      </span>
      <Icon name="star" size={16} filled className="text-tertiary shrink-0" />
      <div className="flex-1 h-2.5 rounded-full bg-surface-container-high overflow-hidden">
        <div
          className="h-full rounded-full bg-tertiary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-label-sm text-on-surface-variant w-8 text-right">
        {count}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review Card
// ---------------------------------------------------------------------------

function ReviewCard({ review }: { review: ReviewData }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.comment.length > 200;

  return (
    <Card variant="outlined" className="p-5">
      <div className="flex items-center gap-3">
        <Avatar src={review.userAvatar} name={review.userName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-label-lg font-semibold text-on-surface truncate">
              {review.userName}
            </p>
            {review.isVerified && (
              <Icon
                name="verified"
                size={16}
                filled
                className="text-success shrink-0"
              />
            )}
          </div>
          <p className="text-label-sm text-on-surface-variant">
            {formatDate(review.date)}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Rating value={review.rating} readonly size="sm" max={5} />
        </div>
      </div>

      <div className="mt-3">
        <p
          className={cn(
            "text-body-md text-on-surface-variant leading-relaxed",
            !expanded && isLong && "line-clamp-4"
          )}
        >
          {review.comment}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-label-lg font-semibold text-primary"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      {/* Helpful button */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-outline-variant/30">
        <button className="flex items-center gap-1 text-label-sm text-on-surface-variant hover:text-primary transition-colors">
          <Icon name="thumb_up" size={16} />
          Helpful ({review.helpfulCount})
        </button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function ReviewsSkeleton() {
  return (
    <div className="px-5 py-4 space-y-4">
      {/* Summary skeleton */}
      <div className="flex gap-6">
        <div className="flex flex-col items-center gap-2">
          <Skeleton variant="rectangular" width={80} height={48} />
          <Skeleton variant="rectangular" width={100} height={20} />
        </div>
        <div className="flex-1 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={10} />
          ))}
        </div>
      </div>
      {/* Review skeletons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="card" height={130} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// All Reviews Page
// ---------------------------------------------------------------------------

export default function ReviewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterRating, setFilterRating] = useState<FilterRating>(0);

  // Mock reviews data (in production these would come from an API)
  const [reviews] = useState<ReviewData[]>([
    {
      id: "r1",
      userName: "Priya Sharma",
      userAvatar: null,
      rating: 5,
      comment:
        "Absolutely incredible experience! The organizers were so thoughtful, every detail was taken care of. From the breathtaking views to the cozy accommodations, everything was perfect. The group was full of amazing people and we made memories that will last a lifetime. Would definitely recommend to anyone looking for a hassle-free adventure.",
      date: "2025-03-15",
      isVerified: true,
      helpfulCount: 12,
    },
    {
      id: "r2",
      userName: "Arjun Patel",
      userAvatar: null,
      rating: 4,
      comment:
        "Great trip overall. The itinerary was well-planned and the group was amazing. Only minor issue was the accommodation on day 2, but the rest made up for it. The food was excellent and the activities were well-organized.",
      date: "2025-03-01",
      isVerified: true,
      helpfulCount: 8,
    },
    {
      id: "r3",
      userName: "Neha Gupta",
      userAvatar: null,
      rating: 5,
      comment:
        "Best trail I have ever been on! Met some wonderful people and the views were breathtaking. Travelling Goats really knows how to curate experiences. Every moment was special and the Shepherd was fantastic.",
      date: "2025-02-20",
      isVerified: false,
      helpfulCount: 15,
    },
    {
      id: "r4",
      userName: "Rahul Verma",
      userAvatar: null,
      rating: 4,
      comment:
        "Had an amazing time! The trek was challenging but rewarding. The campsite was beautiful and the stargazing session was unforgettable. Slight improvement needed in the transport arrangements but otherwise a solid trip.",
      date: "2025-02-10",
      isVerified: true,
      helpfulCount: 6,
    },
    {
      id: "r5",
      userName: "Ananya Reddy",
      userAvatar: null,
      rating: 5,
      comment:
        "Travelling Goats exceeded all my expectations. As a solo trekker, I was nervous at first, but the herd vibe was incredible. Made friends for life! The trail was perfectly paced with a great mix of adventure and relaxation.",
      date: "2025-01-28",
      isVerified: true,
      helpfulCount: 20,
    },
    {
      id: "r6",
      userName: "Vikram Singh",
      userAvatar: null,
      rating: 3,
      comment:
        "Decent experience. The destination was beautiful but some of the logistics could have been better. The group dynamics were great though, and the trip leader was very accommodating.",
      date: "2025-01-15",
      isVerified: false,
      helpfulCount: 3,
    },
    {
      id: "r7",
      userName: "Kavya Nair",
      userAvatar: null,
      rating: 5,
      comment:
        "Wonderful trail from start to finish! The sunrise hike was the highlight for me. Such a well-curated experience. I have already recommended Travelling Goats to all my friends.",
      date: "2025-01-05",
      isVerified: true,
      helpfulCount: 11,
    },
  ]);

  const fetchTrip = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/trips/${id}`);
      const json: ApiResponse<TripDetail> = await res.json();
      if (json.success && json.data) {
        setTrip(json.data);
      }
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  // Computed values
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  const ratingCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      const rounded = Math.round(r.rating);
      if (rounded >= 1 && rounded <= 5) counts[rounded]++;
    });
    return counts;
  }, [reviews]);

  const filteredAndSorted = useMemo(() => {
    let result = [...reviews];

    // Filter by rating
    if (filterRating > 0) {
      result = result.filter((r) => Math.round(r.rating) === filterRating);
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        break;
      case "highest":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "lowest":
        result.sort((a, b) => a.rating - b.rating);
        break;
    }

    return result;
  }, [reviews, sortBy, filterRating]);

  const SORT_OPTIONS: { label: string; value: SortOption }[] = [
    { label: "Newest", value: "newest" },
    { label: "Highest", value: "highest" },
    { label: "Lowest", value: "lowest" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Reviews" />

      {loading ? (
        <ReviewsSkeleton />
      ) : (
        <div className="px-5 py-5">
          {/* ===== Rating Summary ===== */}
          <div className="flex gap-6 mb-6">
            {/* Overall Score */}
            <div className="flex flex-col items-center justify-center">
              <p className="text-display font-bold text-on-surface leading-none">
                {averageRating.toFixed(1)}
              </p>
              <Rating value={averageRating} readonly size="sm" className="mt-1" />
              <p className="mt-1.5 text-label-sm text-on-surface-variant">
                {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Rating Bars */}
            <div className="flex-1 space-y-1.5 justify-center flex flex-col">
              {[5, 4, 3, 2, 1].map((star) => (
                <RatingSummaryBar
                  key={star}
                  star={star}
                  count={ratingCounts[star]}
                  total={reviews.length}
                />
              ))}
            </div>
          </div>

          {/* ===== Filter by Rating ===== */}
          <div className="mb-6">
            <p className="text-label-lg font-semibold text-on-surface mb-2">
              Filter by Rating
            </p>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar">
              <Chip
                variant={filterRating === 0 ? "selected" : "outlined"}
                color="primary"
                onClick={() => setFilterRating(0)}
                className="shrink-0"
              >
                All
              </Chip>
              {[5, 4, 3, 2, 1].map((star) => (
                <Chip
                  key={star}
                  variant={
                    filterRating === star ? "selected" : "outlined"
                  }
                  color="primary"
                  icon={
                    <Icon name="star" size={14} filled className="text-tertiary" />
                  }
                  onClick={() =>
                    setFilterRating(
                      filterRating === star ? 0 : (star as FilterRating)
                    )
                  }
                  className="shrink-0"
                >
                  {star}
                </Chip>
              ))}
            </div>
          </div>

          {/* ===== Sort Options ===== */}
          <div className="mb-6 flex items-center gap-3">
            <p className="text-label-lg font-semibold text-on-surface mr-1">
              Sort:
            </p>
            {SORT_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                variant={sortBy === option.value ? "selected" : "outlined"}
                color="secondary"
                onClick={() => setSortBy(option.value)}
                className="shrink-0"
              >
                {option.label}
              </Chip>
            ))}
          </div>

          {/* ===== Reviews List ===== */}
          {filteredAndSorted.length > 0 ? (
            <div className="space-y-3">
              <p className="text-label-sm text-on-surface-variant">
                Showing {filteredAndSorted.length} of {reviews.length} reviews
              </p>
              {filteredAndSorted.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <Icon
                name="rate_review"
                size={48}
                className="text-on-surface-variant/30 mx-auto mb-3"
              />
              <p className="text-title-md font-semibold text-on-surface-variant">
                No reviews yet
              </p>
              <p className="text-body-md text-on-surface-variant/70 mt-1">
                Be the first to review this trip
              </p>
              <Button variant="secondary" className="mt-4">
                Write a Review
              </Button>
            </div>
          ) : (
            <EmptyState
              icon="rate_review"
              title="No Reviews Found"
              description={`No ${filterRating}-star reviews yet. Try a different filter.`}
              action={{
                label: "Show All",
                onClick: () => setFilterRating(0),
              }}
              className="mt-8"
            />
          )}
        </div>
      )}
    </div>
  );
}
