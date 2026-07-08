"use client";

import { useEffect, useState } from "react";
import { cn, formatDate, truncate } from "@/lib/utils";
import { handleAuthError } from "@/lib/auth-fetch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

/* ---------- Types ---------- */

interface Review {
  id: string;
  user: { name: string | null };
  trip: { title: string };
  overallRating: number;
  comment: string | null;
  isVerified: boolean;
  createdAt: string;
}

/* ---------- Star Rating ---------- */

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "material-symbols-outlined text-[16px]",
            i < Math.round(rating) ? "text-warning filled" : "text-on-surface-variant/30"
          )}
        >
          star
        </span>
      ))}
      <span className="ml-1 text-label-sm font-label-sm text-on-surface-variant">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

/* ---------- Rating Distribution ---------- */

function RatingDistribution({ reviews }: { reviews: Review[] }) {
  const counts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    const idx = Math.min(Math.max(Math.round(r.overallRating) - 1, 0), 4);
    counts[idx]++;
  });
  const max = Math.max(...counts, 1);

  return (
    <Card variant="elevated" className="p-5">
      <h3 className="text-title-md font-title-md text-on-surface mb-4">Rating Distribution</h3>
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[star - 1];
          const pct = (count / max) * 100;
          return (
            <div key={star} className="flex items-center gap-3">
              <span className="text-body-md font-label-lg text-on-surface-variant w-4">
                {star}
              </span>
              <span className="material-symbols-outlined text-[14px] text-warning filled">
                star
              </span>
              <div className="flex-1 h-2.5 rounded-full bg-surface-container overflow-hidden">
                <div
                  className="h-full rounded-full bg-warning transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-body-md text-on-surface-variant w-8 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------- Page ---------- */

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/admin/reviews");
        if (await handleAuthError(res, "/admin/login")) return;
        const json = await res.json();
        if (json.success) setReviews(json.data ?? []);
      } catch (err) {
        console.error("Failed to load reviews", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  async function verifyReview(reviewId: string) {
    try {
      await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: true }),
      });
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, isVerified: true } : r))
      );
    } catch (err) {
      console.error("Failed to verify review", err);
    }
  }

  async function deleteReview() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/reviews/${deleteTarget.id}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete review", err);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-headline-md text-on-surface">Review Management</h1>
        <p className="text-body-md text-on-surface-variant">
          Manage and moderate user reviews
        </p>
      </div>

      {/* Rating Distribution */}
      {!loading && reviews.length > 0 && (
        <div className="max-w-md">
          <RatingDistribution reviews={reviews} />
        </div>
      )}

      {/* Table */}
      <Card variant="elevated" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container">
                <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">User</th>
                <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">Trip</th>
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Rating</th>
                <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">Comment</th>
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Verified</th>
                <th className="px-4 py-3 text-right font-label-lg text-on-surface-variant">Date</th>
                <th className="px-4 py-3 text-right font-label-lg text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/10">
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-5 animate-pulse rounded bg-surface-container-low" />
                    </td>
                  </tr>
                ))
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-on-surface-variant">No reviews yet</td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-on-surface">{review.user.name ?? "N/A"}</td>
                    <td className="px-5 py-3 text-on-surface-variant max-w-[160px] truncate">{review.trip.title}</td>
                    <td className="px-5 py-3 text-center">
                      <StarRating rating={review.overallRating} />
                    </td>
                    <td className="px-5 py-3 text-on-surface-variant max-w-[250px]">
                      {review.comment ? truncate(review.comment, 80) : "-"}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {review.isVerified ? (
                        <span className="material-symbols-outlined text-[18px] text-success">verified</span>
                      ) : (
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant/40">cancel</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-on-surface-variant text-label-sm">{formatDate(review.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!review.isVerified && (
                          <button
                            onClick={() => verifyReview(review.id)}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-success/10 transition-colors"
                            title="Verify"
                          >
                            <span className="material-symbols-outlined text-[18px] text-success">check_circle</span>
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(review)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-error/10 transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[18px] text-error">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Review"
        description="Are you sure you want to delete this review? This action cannot be undone."
        size="sm"
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="destructive" size="sm" loading={deleting} onClick={deleteReview}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
