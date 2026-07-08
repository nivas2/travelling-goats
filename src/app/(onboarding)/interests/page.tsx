"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import { asList, type ContentMap } from "@/lib/content/registry";

interface Interest {
  id: string;
  label: string;
  emoji: string;
  icon: string;
}

const DEFAULT_INTERESTS: Interest[] = [
  { id: "adventure", label: "Adventure", emoji: "\u{1F3D4}", icon: "terrain" },
  { id: "beach", label: "Beach", emoji: "\u{1F3D6}", icon: "beach_access" },
  { id: "mountain", label: "Mountain", emoji: "\u26F0\uFE0F", icon: "landscape" },
  { id: "cultural", label: "Cultural", emoji: "\u{1F3DB}", icon: "museum" },
  { id: "wildlife", label: "Wildlife", emoji: "\u{1F981}", icon: "pets" },
  { id: "city", label: "City", emoji: "\u{1F3D9}", icon: "location_city" },
  { id: "road-trip", label: "Road Trip", emoji: "\u{1F697}", icon: "directions_car" },
  { id: "spiritual", label: "Spiritual", emoji: "\u{1F54C}", icon: "temple_buddhist" },
  { id: "food", label: "Food", emoji: "\u{1F37D}", icon: "restaurant" },
  { id: "photography", label: "Photography", emoji: "\u{1F4F7}", icon: "photo_camera" },
  { id: "weekend", label: "Weekend", emoji: "\u{1F305}", icon: "wb_sunny" },
  { id: "international", label: "International", emoji: "\u2708\uFE0F", icon: "flight" },
];

const MIN_SELECTIONS = 3;

export default function InterestsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [interests, setInterests] = useState<Interest[]>(DEFAULT_INTERESTS);

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then((j) => {
        if (j?.success) {
          const items = asList((j.data as ContentMap)["onboarding.interests"]);
          if (items.length > 0) {
            setInterests(items.map((i) => ({ id: i.id, label: i.label, emoji: i.emoji, icon: i.icon })));
          }
        }
      })
      .catch(() => {});
  }, []);

  const isValid = selected.size >= MIN_SELECTIONS;

  function toggleInterest(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    if (error) setError("");
  }

  async function handleContinue() {
    if (!isValid) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: Array.from(selected) }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to save interests.");
        return;
      }

      router.push("/budget");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="px-6 pt-safe">
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 text-body-md text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <Icon name="arrow_back" size={20} />
          </button>

          {/* Step indicator */}
          <span className="text-label-sm text-on-surface-variant">
            Step 1 of 4
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-6 pt-6">
        <div className="mb-2">
          <h1 className="text-headline-md font-headline-md text-on-surface">
            What excites you?
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Select at least {MIN_SELECTIONS} interests to personalize your feed
          </p>
        </div>

        {/* Selection count badge */}
        <div className="mb-4 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-label-sm font-medium transition-colors",
              isValid
                ? "bg-success-container text-success"
                : "bg-surface-container text-on-surface-variant"
            )}
          >
            {selected.size} / {MIN_SELECTIONS} minimum selected
          </span>
        </div>

        {/* Interest chips grid */}
        <div className="flex flex-wrap gap-2.5">
          {interests.map((interest) => {
            const isSelected = selected.has(interest.id);
            return (
              <Chip
                key={interest.id}
                variant={isSelected ? "selected" : "outlined"}
                color="primary"
                onClick={() => toggleInterest(interest.id)}
                icon={
                  <span className="text-base leading-none">{interest.emoji}</span>
                }
                className={cn(
                  "px-4 py-2.5 text-body-md transition-all duration-200",
                  isSelected && "shadow-md"
                )}
              >
                {interest.label}
              </Chip>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <p
            className="mt-4 text-center text-label-sm text-error"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>

      {/* Bottom action */}
      <div className="px-6 pb-8 pb-safe pt-4">
        <Button
          type="button"
          fullWidth
          size="lg"
          loading={loading}
          disabled={!isValid}
          onClick={handleContinue}
          className="rounded-full"
        >
          Keep Trekking
        </Button>
      </div>
    </div>
  );
}
