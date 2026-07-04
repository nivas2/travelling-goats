"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Rating } from "@/components/ui/rating";

export default function TripFeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [overallRating, setOverallRating] = useState(0);
  const [safetyRating, setSafetyRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [funRating, setFunRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: id,
          overallRating,
          safetyRating,
          valueRating,
          funRating,
          comment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      }
    } catch {
      console.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-5 text-center">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
          <Icon name="check_circle" size={48} filled className="text-success" />
        </div>
        <h1 className="text-headline-md font-headline-md text-on-surface mb-2">
          Thank You!
        </h1>
        <p className="text-body-lg text-on-surface-variant mb-2">
          Your review helps other travelers make better decisions.
        </p>
        <p className="text-label-lg text-primary mb-8">
          +100 reward points earned!
        </p>
        <div className="flex gap-3 w-full max-w-xs">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => router.push("/my-trips")}
          >
            My Trips
          </Button>
          <Button fullWidth onClick={() => router.push("/home")}>
            Explore More
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh px-5 py-6">
      <h1 className="text-headline-md font-headline-md text-on-surface mb-2">
        How was your trip?
      </h1>
      <p className="text-body-md text-on-surface-variant mb-8">
        Your honest feedback helps us improve
      </p>

      {step === 1 && (
        <div className="space-y-8">
          <div className="text-center">
            <p className="text-title-md font-title-md text-on-surface mb-4">
              Overall Experience
            </p>
            <Rating
              value={overallRating}
              onChange={setOverallRating}
              size="lg"
            />
            <p className="text-body-md text-on-surface-variant mt-2">
              {overallRating === 0
                ? "Tap to rate"
                : overallRating <= 2
                ? "We're sorry to hear that"
                : overallRating <= 3
                ? "It was okay"
                : overallRating <= 4
                ? "Great experience!"
                : "Amazing trip!"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="shield" size={20} className="text-secondary" />
                <span className="text-title-md font-title-md">Safety</span>
              </div>
              <Rating value={safetyRating} onChange={setSafetyRating} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="payments" size={20} className="text-tertiary" />
                <span className="text-title-md font-title-md">Value for Money</span>
              </div>
              <Rating value={valueRating} onChange={setValueRating} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="celebration" size={20} className="text-primary" />
                <span className="text-title-md font-title-md">Fun Factor</span>
              </div>
              <Rating value={funRating} onChange={setFunRating} size="sm" />
            </div>
          </div>

          <Button
            fullWidth
            disabled={overallRating === 0}
            onClick={() => setStep(2)}
          >
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <p className="text-title-md font-title-md text-on-surface mb-3">
              Tell us more (optional)
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you love? What could be better?"
              className="w-full h-40 p-4 bg-surface-container-low rounded-xl text-body-lg text-on-surface placeholder:text-on-surface-variant/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={500}
            />
            <p className="text-label-sm text-on-surface-variant text-right mt-1">
              {comment.length}/500
            </p>
          </div>

          <div>
            <p className="text-title-md font-title-md text-on-surface mb-3">
              Share a photo (optional)
            </p>
            <div className="border-2 border-dashed border-outline-variant rounded-xl p-8 text-center">
              <Icon name="add_photo_alternate" size={40} className="text-on-surface-variant/40 mx-auto mb-2" />
              <p className="text-body-md text-on-surface-variant">Tap to upload photos</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              fullWidth
              loading={submitting}
              onClick={handleSubmit}
            >
              Submit Review
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
