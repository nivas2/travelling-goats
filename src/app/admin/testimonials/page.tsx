"use client";

import { useEffect, useMemo, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface Review {
  id: string;
  user: { name: string | null };
  trip: { title: string };
  overallRating: number;
  comment: string | null;
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "material-symbols-outlined text-[15px]",
            i < Math.round(rating) ? "text-warning filled" : "text-on-surface-variant/30"
          )}
        >
          star
        </span>
      ))}
    </span>
  );
}

export default function AdminTestimonialsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "featured">("all");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/reviews");
        const json = await res.json();
        if (json.success) setReviews((json.data ?? []).filter((r: Review) => r.comment));
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function toggleFeatured(review: Review) {
    const next = !review.isFeatured;
    setReviews((prev) =>
      prev.map((r) => (r.id === review.id ? { ...r, isFeatured: next } : r))
    );
    await fetch(`/api/admin/reviews/${review.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: next }),
    });
  }

  const featuredCount = reviews.filter((r) => r.isFeatured).length;
  const shown = useMemo(
    () => (filter === "featured" ? reviews.filter((r) => r.isFeatured) : reviews),
    [reviews, filter]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-headline-md text-on-surface">Testimonials</h1>
        <p className="text-body-md text-on-surface-variant">
          Feature real customer reviews on the landing page. {featuredCount} featured.
        </p>
      </div>

      <div className="flex gap-2">
        {(["all", "featured"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-1.5 text-label-md font-label-md capitalize transition-colors",
              filter === f
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface-container-low" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <Card variant="elevated" className="p-12 text-center text-on-surface-variant">
          {filter === "featured"
            ? "No featured testimonials yet. Star a review to feature it."
            : "No reviews with comments yet."}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((review) => (
            <Card
              key={review.id}
              variant="elevated"
              className={cn(
                "flex flex-col p-4",
                review.isFeatured && "ring-2 ring-primary/40"
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <Stars rating={review.overallRating} />
                <button
                  onClick={() => toggleFeatured(review)}
                  className={cn(
                    "h-8 w-8 flex items-center justify-center rounded-lg transition-colors",
                    review.isFeatured
                      ? "text-primary hover:bg-primary/10"
                      : "text-on-surface-variant/50 hover:bg-surface-container"
                  )}
                  title={review.isFeatured ? "Unfeature" : "Feature on landing page"}
                >
                  <span className={cn("material-symbols-outlined text-[20px]", review.isFeatured && "filled")}>
                    push_pin
                  </span>
                </button>
              </div>
              <p className="flex-1 text-body-md text-on-surface line-clamp-4">
                &ldquo;{review.comment}&rdquo;
              </p>
              <div className="mt-3 border-t border-outline-variant/20 pt-2">
                <p className="text-label-md font-label-md text-on-surface">
                  {review.user.name ?? "Anonymous"}
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  {review.trip.title} · {formatDate(review.createdAt)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
