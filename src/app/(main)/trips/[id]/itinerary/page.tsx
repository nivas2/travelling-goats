"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { downloadItineraryPdf } from "@/lib/itinerary-pdf";
import type { TripDetail, ItineraryDayData, ApiResponse } from "@/types";

// ---------------------------------------------------------------------------
// Itinerary Day Card
// ---------------------------------------------------------------------------

function ItineraryDayCard({
  day,
  isLast,
}: {
  day: ItineraryDayData;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="relative flex gap-4">
      {/* Timeline column */}
      <div className="flex flex-col items-center">
        {/* Day number circle */}
        <div
          className={cn(
            "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center",
            "rounded-full primary-gradient text-on-primary",
            "text-label-lg font-bold shadow-elevated"
          )}
        >
          {day.dayNumber}
        </div>
        {/* Connecting line */}
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gradient-to-b from-primary/40 to-outline-variant/20 mt-1" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between text-left"
        >
          <div>
            <p className="text-label-sm font-semibold text-primary uppercase tracking-wider">
              Day {day.dayNumber}
            </p>
            <h3 className="text-title-lg font-semibold text-on-surface mt-0.5">
              {day.title}
            </h3>
          </div>
          <Icon
            name={expanded ? "expand_less" : "expand_more"}
            size={24}
            className="text-on-surface-variant shrink-0"
          />
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {/* Description */}
            {day.description && (
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                {day.description}
              </p>
            )}

            {/* Activities */}
            {day.activities.length > 0 && (
              <Card variant="outlined" className="p-5">
                <h4 className="text-label-lg font-semibold text-on-surface mb-3 flex items-center gap-1.5">
                  <Icon name="directions_run" size={18} className="text-primary" />
                  Activities
                </h4>
                <div className="space-y-3">
                  {day.activities.map((activity, ai) => (
                    <div key={ai} className="flex items-start gap-3">
                      {/* Time badge */}
                      <span
                        className={cn(
                          "inline-flex items-center justify-center",
                          "min-w-[56px] rounded-lg px-2 py-1",
                          "bg-primary-fixed text-on-primary-fixed",
                          "text-label-sm font-semibold"
                        )}
                      >
                        {activity.time}
                      </span>
                      <div className="flex-1">
                        <p className="text-body-md font-medium text-on-surface">
                          {activity.title}
                        </p>
                        {activity.description && (
                          <p className="mt-0.5 text-label-sm text-on-surface-variant">
                            {activity.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Meals */}
            {day.meals.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-label-lg font-semibold text-on-surface">
                  <Icon name="restaurant" size={18} className="text-tertiary" />
                  Meals:
                </div>
                {day.meals.map((meal, mi) => (
                  <Chip
                    key={mi}
                    variant="filled"
                    color="tertiary"
                    className="text-[11px]"
                  >
                    {meal}
                  </Chip>
                ))}
              </div>
            )}

            {/* Accommodation */}
            {day.accommodation && (
              <div className="flex items-center gap-2 text-body-md text-on-surface-variant">
                <Icon name="hotel" size={18} className="text-secondary" />
                <span className="font-medium text-on-surface">Stay:</span>
                <span>{day.accommodation}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function ItinerarySkeleton() {
  return (
    <div className="px-5 py-4 space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton variant="circular" diameter={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="card" height={120} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Full Itinerary Page
// ---------------------------------------------------------------------------

export default function ItineraryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!trip || pdfLoading) return;
    setPdfLoading(true);
    try {
      await downloadItineraryPdf(trip);
    } finally {
      setPdfLoading(false);
    }
  };

  const fetchTrip = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await fetch(`/api/trips/${id}`);
      const json: ApiResponse<TripDetail> = await res.json();
      if (json.success && json.data) {
        setTrip(json.data);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={trip ? `${trip.title} - Itinerary` : "Itinerary"}
      />

      {loading ? (
        <ItinerarySkeleton />
      ) : error ? (
        <div className="px-5 py-6">
          <EmptyState
            icon="error"
            title="Failed to load itinerary"
            description="Something went wrong. Please try again."
            action={{ label: "Retry", onClick: fetchTrip }}
          />
        </div>
      ) : trip && trip.itineraryDays.length > 0 ? (
        <div className="px-5 py-5">
          {/* Trip summary header */}
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-headline-md font-bold text-on-surface">
                Day-by-Day Itinerary
              </h2>
              <p className="mt-1 text-body-md text-on-surface-variant">
                {trip.duration} days in {trip.destination}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-lime px-4 py-2 text-label-md font-semibold text-on-surface shadow-sm transition active:scale-95 disabled:opacity-60"
            >
              <Icon
                name={pdfLoading ? "progress_activity" : "download"}
                size={18}
                className={pdfLoading ? "animate-spin" : ""}
              />
              {pdfLoading ? "Preparing…" : "PDF"}
            </button>
          </div>

          {/* Timeline */}
          <div>
            {trip.itineraryDays
              .sort((a, b) => a.dayNumber - b.dayNumber)
              .map((day, i) => (
                <ItineraryDayCard
                  key={day.id}
                  day={day}
                  isLast={i === trip.itineraryDays.length - 1}
                />
              ))}
          </div>

          {/* Bottom note */}
          <Card
            variant="outlined"
            className="mt-6 flex items-start gap-3 p-5"
          >
            <Icon name="info" size={22} className="text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="text-label-lg font-semibold text-on-surface">
                Note
              </p>
              <p className="mt-0.5 text-body-md text-on-surface-variant">
                The itinerary is subject to change based on weather conditions
                and group consensus. Your trip leader will keep you informed
                of any adjustments.
              </p>
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <Icon
            name="route"
            size={64}
            className="text-on-surface-variant/30"
          />
          <h3 className="mt-4 text-title-lg font-semibold text-on-surface">
            Itinerary Coming Soon
          </h3>
          <p className="mt-2 text-body-md text-on-surface-variant max-w-xs">
            The detailed day-by-day itinerary for this trip is being prepared.
            Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
