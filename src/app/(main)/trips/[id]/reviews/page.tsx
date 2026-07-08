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
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout/page-header";
import type { TripDetail, ApiResponse } from "@/types";
import { handleAuthError } from "@/lib/auth-fetch";

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
  const { success: toastSuccess, error: toastError } = useToast();
  const [, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterRating, setFilterRating] = useState<FilterRating>(0);

  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Write-review form state
  const [formOpen, setFormOpen] = useState(false);
  const [overall, setOverall] = useState(0);
  const [safety, setSafety] = useState(0);
  const [value, setValue] = useState(0);
  const [fun, setFun] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?tripId=${id}`);
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setReviews(
          (d.reviews ?? []).map(
            (r: {
              id: string;
              userName: string;
              userAvatar: string | null;
              overallRating: number;
              comment: string | null;
              createdAt: string;
              isVerified: boolean;
              helpfulCount: number;
            }) => ({
              id: r.id,
              userName: r.userName,
              userAvatar: r.userAvatar,
              rating: r.overallRating,
              comment: r.comment ?? "",
              date: r.createdAt,
              isVerified: r.isVerified,
              helpfulCount: r.helpfulCount,
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

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const tripRes = await fetch(`/api/trips/${id}`);
        const json: ApiResponse<TripDetail> = await tripRes.json();
        if (active && json.success && json.data) setTrip(json.data);
        await loadReviews();
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, loadReviews]);

  async function submitReview() {
    if (overall < 1) {
      toastError("Please give an overall star rating");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: id,
          overallRating: overall,
          safetyRating: safety || undefined,
          valueRating: value || undefined,
          funRating: fun || undefined,
          comment: comment.trim() || undefined,
        }),
      });
      if (await handleAuthError(res)) return;
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to submit review");
      toastSuccess("Thanks for your review! +100 points");
      setFormOpen(false);
      setOverall(0);
      setSafety(0);
      setValue(0);
      setFun(0);
      setComment("");
      await loadReviews();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

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

          {/* ===== Write a Review CTA ===== */}
          {hasReviewed ? (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-body-md text-success">
              <Icon name="check_circle" size={20} filled />
              You&apos;ve reviewed this trip. Thanks for sharing!
            </div>
          ) : canReview ? (
            <Button
              fullWidth
              className="mb-6"
              icon={<Icon name="rate_review" size={18} />}
              onClick={() => setFormOpen(true)}
            >
              Write a Review
            </Button>
          ) : null}

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
              {canReview && (
                <Button variant="secondary" className="mt-4" onClick={() => setFormOpen(true)}>
                  Write a Review
                </Button>
              )}
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

      {/* ===== Write Review Modal ===== */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Write a Review"
        description="Share your experience to help other travellers."
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-label-lg font-semibold text-on-surface">
              Overall rating <span className="text-error">*</span>
            </p>
            <Rating value={overall} onChange={setOverall} size="lg" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: "Safety", val: safety, set: setSafety },
              { label: "Value", val: value, set: setValue },
              { label: "Fun", val: fun, set: setFun },
            ].map((row) => (
              <div key={row.label}>
                <p className="mb-1 text-label-md text-on-surface-variant">{row.label}</p>
                <Rating value={row.val} onChange={row.set} size="sm" />
              </div>
            ))}
          </div>

          <div>
            <p className="mb-1 text-label-lg font-semibold text-on-surface">Your review</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="What did you love? What could be better?"
              className="w-full resize-y rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" loading={submitting} onClick={submitReview} disabled={overall < 1}>
              Submit Review
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
