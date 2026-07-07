"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { formatDateRange } from "@/lib/utils";

interface RosterBooking {
  id: string;
  bookingNumber: string;
  travelerCount: number;
  travelers: unknown;
  checkedInAt: string | null;
  leadName: string;
  phone: string;
  avatar: string | null;
}

export default function CaptainRosterPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<{ title: string; destination: string; startDate: string; endDate: string } | null>(null);
  const [bookings, setBookings] = useState<RosterBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/captain/trips/${id}/roster`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error ?? "Could not load roster");
          return;
        }
        setTrip(json.data.trip);
        setBookings(json.data.bookings);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const totalTravellers = bookings.reduce((s, b) => s + (b.travelerCount || 1), 0);
  const checkedIn = bookings.filter((b) => b.checkedInAt).length;

  return (
    <div className="mx-auto max-w-2xl px-5 py-6">
      <button
        onClick={() => router.push("/captain")}
        className="mb-3 flex items-center gap-1 text-label-md text-on-surface-variant hover:text-primary"
      >
        <Icon name="arrow_back" size={18} /> Back
      </button>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-container-low" />
          ))}
        </div>
      ) : error ? (
        <div className="py-16 text-center">
          <Icon name="error" size={40} className="mx-auto text-error" />
          <p className="mt-3 text-title-md text-on-surface">{error}</p>
        </div>
      ) : (
        <>
          <h1 className="text-headline-md font-headline-md text-on-surface">{trip?.title}</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {trip?.destination} · {trip && formatDateRange(trip.startDate, trip.endDate)}
          </p>

          <div className="mt-4 flex gap-3">
            <Card variant="outlined" className="flex-1 p-3 text-center">
              <p className="text-headline-md font-bold text-on-surface">{bookings.length}</p>
              <p className="text-label-sm text-on-surface-variant">Bookings</p>
            </Card>
            <Card variant="outlined" className="flex-1 p-3 text-center">
              <p className="text-headline-md font-bold text-on-surface">{totalTravellers}</p>
              <p className="text-label-sm text-on-surface-variant">Travellers</p>
            </Card>
            <Card variant="outlined" className="flex-1 p-3 text-center">
              <p className="text-headline-md font-bold text-success">{checkedIn}</p>
              <p className="text-label-sm text-on-surface-variant">Checked in</p>
            </Card>
          </div>

          <Button className="mt-4 w-full" onClick={() => router.push("/verify")}>
            <Icon name="qr_code_scanner" size={18} /> Verify Tickets
          </Button>

          <div className="mt-5 space-y-2">
            {bookings.map((b) => (
              <Card key={b.id} variant="outlined" className="flex items-center gap-3 p-3">
                <Avatar src={b.avatar} name={b.leadName} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-title-sm font-semibold text-on-surface">{b.leadName}</p>
                  <p className="text-label-sm text-on-surface-variant">
                    {b.bookingNumber} · {b.travelerCount} traveller{b.travelerCount !== 1 ? "s" : ""}
                  </p>
                </div>
                {b.checkedInAt ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-label-sm font-semibold text-success">
                    <Icon name="check_circle" size={14} filled /> In
                  </span>
                ) : (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-label-sm text-on-surface-variant">
                    <Icon name="schedule" size={14} /> Pending
                  </span>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
