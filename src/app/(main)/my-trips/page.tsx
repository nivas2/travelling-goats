"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, formatDateRange, getDaysUntil, formatDate } from "@/lib/utils";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiResponse } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookingTrip {
  id: string;
  tripId: string;
  tripTitle: string;
  tripSlug: string;
  coverImage: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: number;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
  travelerCount: number;
  bookingType: "SOLO" | "COUPLE" | "GROUP";
  totalPricePaise: number;
  tripCaptain: {
    name: string;
    avatar: string | null;
    phone: string;
  } | null;
  companions: {
    id: string;
    name: string;
    avatar: string | null;
  }[];
  photos: string[];
  hasReviewed: boolean;
}

type TabValue = "upcoming" | "ongoing" | "completed";

// ---------------------------------------------------------------------------
// Status Badge Helpers
// ---------------------------------------------------------------------------

function getStatusBadgeProps(status: BookingTrip["status"]) {
  switch (status) {
    case "UPCOMING":
      return {
        label: "Upcoming",
        className: "bg-secondary-container text-on-secondary-container",
      };
    case "ONGOING":
      return {
        label: "Live",
        className: "bg-success text-on-success",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        className: "bg-surface-container-high text-on-surface-variant",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        className: "bg-error-container text-on-error-container",
      };
    default:
      return {
        label: status,
        className: "bg-surface-container text-on-surface-variant",
      };
  }
}

// ---------------------------------------------------------------------------
// Trip Card Skeleton
// ---------------------------------------------------------------------------

function TripCardSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <Skeleton variant="rectangular" height={160} className="rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="50%" />
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width={80} height={32} />
          <Skeleton variant="rectangular" width={80} height={32} />
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Upcoming Trip Card
// ---------------------------------------------------------------------------

function UpcomingTripCard({ booking }: { booking: BookingTrip }) {
  const router = useRouter();
  const daysLeft = getDaysUntil(booking.startDate);
  const statusBadge = getStatusBadgeProps(booking.status);

  return (
    <Card className="overflow-hidden p-0">
      {/* Cover Image */}
      <div className="relative h-[160px] w-full overflow-hidden">
        <Image
          src={booking.coverImage || "/placeholder-trip.jpg"}
          alt={booking.tripTitle}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {/* Status Badge */}
        <div className="absolute left-3 top-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label-sm font-semibold",
              statusBadge.className
            )}
          >
            {statusBadge.label}
          </span>
        </div>
        {/* Countdown */}
        {daysLeft > 0 && (
          <div className="absolute right-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-on-surface/70 px-2.5 py-1 text-label-sm font-semibold text-surface">
              <Icon name="schedule" size={14} />
              {daysLeft} day{daysLeft !== 1 ? "s" : ""} to go
            </span>
          </div>
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Card Body */}
      <div className="p-4">
        <h3 className="text-title-md font-semibold text-on-surface line-clamp-1">
          {booking.tripTitle}
        </h3>

        <div className="mt-1.5 flex items-center gap-4 text-body-md text-on-surface-variant">
          <span className="inline-flex items-center gap-1">
            <Icon name="location_on" size={16} className="text-primary" />
            {booking.destination}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="calendar_today" size={14} />
            {formatDateRange(booking.startDate, booking.endDate)}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-body-md text-on-surface-variant">
          <Icon name="group" size={16} />
          <span>
            {booking.travelerCount} traveler{booking.travelerCount !== 1 ? "s" : ""}
          </span>
          {booking.companions.length > 0 && (
            <div className="flex -space-x-2 ml-1">
              {booking.companions.slice(0, 3).map((companion) => (
                <Avatar
                  key={companion.id}
                  src={companion.avatar}
                  name={companion.name}
                  size="xs"
                  className="ring-2 ring-surface-container-lowest"
                />
              ))}
              {booking.companions.length > 3 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-high text-[10px] font-semibold text-on-surface-variant ring-2 ring-surface-container-lowest">
                  +{booking.companions.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <CardFooter className="mt-3 pt-3 border-t border-outline-variant">
          <Button
            size="sm"
            variant="secondary"
            icon={<Icon name="confirmation_number" size={16} />}
            onClick={() => router.push(`/trips/${booking.tripId}`)}
          >
            View Ticket
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Icon name="chat" size={16} />}
            onClick={() => router.push(`/trips/${booking.tripId}/chat`)}
          >
            Chat
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Ongoing Trip Card
// ---------------------------------------------------------------------------

function OngoingTripCard({ booking }: { booking: BookingTrip }) {
  const router = useRouter();
  const startDate = new Date(booking.startDate);
  const now = new Date();
  const dayNumber = Math.max(
    1,
    Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <Card variant="elevated" className="overflow-hidden p-0 border-2 border-primary/20">
      {/* Cover Image */}
      <div className="relative h-[180px] w-full overflow-hidden">
        <Image
          src={booking.coverImage || "/placeholder-trip.jpg"}
          alt={booking.tripTitle}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {/* Live Badge */}
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success px-3 py-1 text-label-sm font-semibold text-on-success">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-on-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-on-success" />
            </span>
            Day {dayNumber} of {booking.duration}
          </span>
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-title-lg font-semibold text-white text-shadow-premium line-clamp-1">
            {booking.tripTitle}
          </h3>
          <p className="mt-0.5 text-body-md text-white/80">
            {booking.destination}
          </p>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <div className="flex items-center gap-4 text-body-md text-on-surface-variant">
          <span className="inline-flex items-center gap-1">
            <Icon name="calendar_today" size={14} />
            {formatDateRange(booking.startDate, booking.endDate)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="group" size={16} />
            {booking.travelerCount} traveler{booking.travelerCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Shepherd */}
        {booking.tripCaptain && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface-container-low p-2.5">
            <Avatar
              src={booking.tripCaptain.avatar}
              name={booking.tripCaptain.name}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-label-sm text-on-surface-variant">Shepherd</p>
              <p className="text-label-lg font-semibold text-on-surface truncate">
                {booking.tripCaptain.name}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              icon={<Icon name="call" size={18} />}
              onClick={() => window.open(`tel:${booking.tripCaptain!.phone}`)}
              aria-label="Call Shepherd"
            />
          </div>
        )}

        {/* CTA */}
        <Button
          fullWidth
          className="mt-4"
          icon={<Icon name="explore" size={20} />}
          onClick={() => router.push(`/trips/${booking.tripId}/hub`)}
        >
          Open Trip Hub
        </Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Completed Trip Card
// ---------------------------------------------------------------------------

function CompletedTripCard({ booking }: { booking: BookingTrip }) {
  const router = useRouter();

  return (
    <Card className="overflow-hidden p-0">
      {/* Cover Image */}
      <div className="relative h-[140px] w-full overflow-hidden">
        <Image
          src={booking.coverImage || "/placeholder-trip.jpg"}
          alt={booking.tripTitle}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high/90 px-2.5 py-1 text-label-sm font-semibold text-on-surface-variant">
            <Icon name="check_circle" size={14} filled className="text-success" />
            Completed
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <h3 className="text-title-md font-semibold text-on-surface line-clamp-1">
          {booking.tripTitle}
        </h3>

        <div className="mt-1.5 flex items-center gap-4 text-body-md text-on-surface-variant">
          <span className="inline-flex items-center gap-1">
            <Icon name="location_on" size={16} className="text-primary" />
            {booking.destination}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="calendar_today" size={14} />
            {formatDateRange(booking.startDate, booking.endDate)}
          </span>
        </div>

        {/* Trip Photos */}
        {booking.photos.length > 0 && (
          <div className="mt-3 flex gap-1.5 overflow-x-auto hide-scrollbar">
            {booking.photos.slice(0, 4).map((photo, idx) => (
              <div
                key={idx}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg"
              >
                <Image
                  src={photo}
                  alt={`Trip memory ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
                {idx === 3 && booking.photos.length > 4 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-label-sm font-semibold text-white">
                    +{booking.photos.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <CardFooter className="mt-3 pt-3 border-t border-outline-variant">
          {!booking.hasReviewed ? (
            <Button
              size="sm"
              icon={<Icon name="rate_review" size={16} />}
              onClick={() => router.push(`/trips/${booking.tripId}/reviews`)}
            >
              Leave Review
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 text-label-sm text-success font-semibold">
              <Icon name="check_circle" size={16} filled />
              Reviewed
            </span>
          )}
          <Button
            size="sm"
            variant="ghost"
            icon={<Icon name="photo_library" size={16} />}
            onClick={() => router.push(`/trips/${booking.tripId}/hub`)}
          >
            Memories
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main My Trips Page
// ---------------------------------------------------------------------------

export default function MyTripsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>("upcoming");
  const [bookings, setBookings] = useState<BookingTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async (status: TabValue) => {
    setLoading(true);
    setError(null);
    try {
      const statusMap: Record<TabValue, string> = {
        upcoming: "UPCOMING",
        ongoing: "ONGOING",
        completed: "COMPLETED",
      };
      const res = await fetch(`/api/bookings?status=${statusMap[status]}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      const data: ApiResponse<BookingTrip[]> = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to load trips");
      setBookings(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(activeTab);
  }, [activeTab, fetchBookings]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-headline-md font-headline-md text-on-surface">
          My Trails
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Your upcoming adventures and past memories
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabList className="mb-0">
          <Tab value="upcoming">Upcoming</Tab>
          <Tab value="ongoing">Ongoing</Tab>
          <Tab value="completed">Completed</Tab>
        </TabList>

        {/* Upcoming Tab */}
        <TabPanel value="upcoming">
          {loading ? (
            <div className="space-y-4">
              <TripCardSkeleton />
              <TripCardSkeleton />
            </div>
          ) : error ? (
            <EmptyState
              icon="error_outline"
              title="Something went wrong"
              description={error}
              action={{
                label: "Retry",
                onClick: () => fetchBookings("upcoming"),
              }}
            />
          ) : bookings.length === 0 ? (
            <EmptyState
              icon="flight_takeoff"
              title="No upcoming trails"
              description="Explore amazing trails and start your next adventure!"
              action={{
                label: "Explore Trails",
                onClick: () => router.push("/home"),
              }}
            />
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <UpcomingTripCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabPanel>

        {/* Ongoing Tab */}
        <TabPanel value="ongoing">
          {loading ? (
            <div className="space-y-4">
              <TripCardSkeleton />
            </div>
          ) : error ? (
            <EmptyState
              icon="error_outline"
              title="Something went wrong"
              description={error}
              action={{
                label: "Retry",
                onClick: () => fetchBookings("ongoing"),
              }}
            />
          ) : bookings.length === 0 ? (
            <EmptyState
              icon="hiking"
              title="No active trips"
              description="You don't have any ongoing trips right now. Your active trips will appear here."
            />
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <OngoingTripCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabPanel>

        {/* Completed Tab */}
        <TabPanel value="completed">
          {loading ? (
            <div className="space-y-4">
              <TripCardSkeleton />
              <TripCardSkeleton />
              <TripCardSkeleton />
            </div>
          ) : error ? (
            <EmptyState
              icon="error_outline"
              title="Something went wrong"
              description={error}
              action={{
                label: "Retry",
                onClick: () => fetchBookings("completed"),
              }}
            />
          ) : bookings.length === 0 ? (
            <EmptyState
              icon="luggage"
              title="No past trips yet"
              description="Once you complete a trip, it will show up here with all your memories."
            />
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <CompletedTripCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabPanel>
      </Tabs>
    </div>
  );
}
