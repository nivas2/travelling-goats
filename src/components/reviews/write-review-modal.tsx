"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { useToast } from "@/components/ui/toast";

/**
 * Shared "write a review" modal — used on the trip detail page's Reviews tab
 * and the full reviews page. Posts to /api/reviews and calls onSubmitted().
 */
export function WriteReviewModal({
  tripId,
  open,
  onClose,
  onSubmitted,
}: {
  tripId: string;
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [overall, setOverall] = useState(0);
  const [safety, setSafety] = useState(0);
  const [value, setValue] = useState(0);
  const [fun, setFun] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setOverall(0);
    setSafety(0);
    setValue(0);
    setFun(0);
    setComment("");
  }

  async function submit() {
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
          tripId,
          overallRating: overall,
          safetyRating: safety || undefined,
          valueRating: value || undefined,
          funRating: fun || undefined,
          comment: comment.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to submit review");
      toastSuccess("Thanks for your review! +100 points");
      reset();
      onClose();
      onSubmitted();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
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
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" loading={submitting} onClick={submit} disabled={overall < 1}>
            Submit Review
          </Button>
        </div>
      </div>
    </Modal>
  );
}
