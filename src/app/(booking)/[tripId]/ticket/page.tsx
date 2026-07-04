"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, formatDateRange } from "@/lib/utils";
import { useBookingStore } from "@/stores/booking-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------

interface TicketData {
  bookingNumber: string;
  paymentId: string;
  tripName: string;
  startDate: string;
  endDate: string;
  meetingPoint: string;
  meetingTime: string;
  travelerCount: number;
  travelers: Array<{ name: string; age: number; gender: string }>;
  seatPreference: string | null;
  totalPricePaise: number;
}

// ---------------------------------------------------------------------------
//  QR Code Placeholder
// ---------------------------------------------------------------------------

function QRCodePlaceholder({ value }: { value: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container">
        <div className="flex flex-col items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined text-[40px]">qr_code_2</span>
          <span className="text-label-sm">Scan at venue</span>
        </div>
      </div>
      <p className="text-label-sm text-on-surface-variant">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Page Component
// ---------------------------------------------------------------------------

export default function TicketPage() {
  const params = useParams<{ tripId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = params.tripId;

  const {
    travelers: storeTravelers,
    travelerCount,
    seatPreference,
    summary,
  } = useBookingStore();

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchTicket() {
      try {
        setLoading(true);
        const bookingId = searchParams.get("bookingId");

        // Try to get from API
        if (bookingId) {
          const res = await fetch(`/api/bookings?id=${bookingId}`);
          if (res.ok) {
            const json = await res.json();
            const data = json.data ?? json;
            setTicket({
              bookingNumber: data.bookingNumber ?? bookingId,
              paymentId: data.paymentId ?? "N/A",
              tripName: data.tripName ?? data.trip?.title ?? "Trip",
              startDate: data.startDate ?? data.trip?.startDate ?? "",
              endDate: data.endDate ?? data.trip?.endDate ?? "",
              meetingPoint: data.meetingPoint ?? data.trip?.meetingPoint ?? "To be announced",
              meetingTime: data.meetingTime ?? data.trip?.meetingTime ?? "06:00 AM",
              travelerCount: data.travelerCount ?? travelerCount,
              travelers: data.travelers ?? storeTravelers.map((t) => ({
                name: t.name,
                age: t.age,
                gender: t.gender,
              })),
              seatPreference: data.seatPreference ?? seatPreference,
              totalPricePaise: data.totalPricePaise ?? summary?.totalPricePaise ?? 0,
            });
            return;
          }
        }

        // Fallback: build from trip API + store
        const tripRes = await fetch(`/api/trips/${tripId}`);
        const tripJson = tripRes.ok ? await tripRes.json() : null;
        const trip = tripJson?.data ?? tripJson;

        setTicket({
          bookingNumber: bookingId ?? `PA${Date.now().toString(36).toUpperCase()}`,
          paymentId: "N/A",
          tripName: trip?.title ?? "Your Trip",
          startDate: trip?.startDate ?? "",
          endDate: trip?.endDate ?? "",
          meetingPoint: trip?.meetingPoint ?? "To be announced",
          meetingTime: trip?.meetingTime ?? "06:00 AM",
          travelerCount,
          travelers: storeTravelers.map((t) => ({
            name: t.name,
            age: t.age,
            gender: t.gender,
          })),
          seatPreference,
          totalPricePaise: summary?.totalPricePaise ?? 0,
        });
      } catch {
        setTicket({
          bookingNumber: `PA${Date.now().toString(36).toUpperCase()}`,
          paymentId: "N/A",
          tripName: "Your Trip",
          startDate: "",
          endDate: "",
          meetingPoint: "To be announced",
          meetingTime: "06:00 AM",
          travelerCount,
          travelers: storeTravelers.map((t) => ({
            name: t.name,
            age: t.age,
            gender: t.gender,
          })),
          seatPreference,
          totalPricePaise: summary?.totalPricePaise ?? 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchTicket();
  }, [tripId, searchParams, travelerCount, storeTravelers, seatPreference, summary]);

  const handleDownload = () => {
    // In production, this would generate a PDF or image
    window.print();
  };

  const handleAddToCalendar = () => {
    if (!ticket?.startDate) return;

    const start = new Date(ticket.startDate);
    const end = ticket.endDate ? new Date(ticket.endDate) : start;

    const formatGCalDate = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action", "TEMPLATE");
    url.searchParams.set("text", `Travelling Goats: ${ticket.tripName}`);
    url.searchParams.set(
      "dates",
      `${formatGCalDate(start)}/${formatGCalDate(end)}`,
    );
    url.searchParams.set(
      "details",
      `Booking: ${ticket.bookingNumber}\nMeeting Point: ${ticket.meetingPoint}\nMeeting Time: ${ticket.meetingTime}`,
    );
    url.searchParams.set("location", ticket.meetingPoint);

    window.open(url.toString(), "_blank");
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-5">
        <Skeleton variant="card" height={400} />
        <Skeleton height={48} />
        <Skeleton height={48} />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="flex flex-col gap-5 p-5 pb-8">
      {/* Ticket card */}
      <motion.div
        ref={ticketRef}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
      >
        <Card variant="elevated" className="relative overflow-hidden p-0">
          {/* Top section */}
          <div className="primary-gradient p-5 text-on-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label-sm opacity-80">Travelling Goats</p>
                <h2 className="text-title-lg font-title-lg">{ticket.tripName}</h2>
              </div>
              <span className="material-symbols-outlined text-[32px] opacity-80">
                flight_takeoff
              </span>
            </div>

            {ticket.startDate && ticket.endDate && (
              <div className="mt-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">
                  calendar_today
                </span>
                <span className="text-body-md">
                  {formatDateRange(ticket.startDate, ticket.endDate)}
                </span>
              </div>
            )}
          </div>

          {/* Dotted line divider with circle cutouts */}
          <div className="relative h-0 px-5">
            <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-background" />
            <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-background" />
            <div className="border-t-2 border-dashed border-outline-variant/30" />
          </div>

          {/* Middle section */}
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <InfoItem
                label="Meeting Point"
                value={ticket.meetingPoint}
                icon="pin_drop"
              />
              <InfoItem
                label="Meeting Time"
                value={ticket.meetingTime}
                icon="schedule"
              />
              <InfoItem
                label="Travelers"
                value={`${ticket.travelerCount} ${ticket.travelerCount === 1 ? "person" : "people"}`}
                icon="groups"
              />
              {ticket.seatPreference && (
                <InfoItem
                  label="Seats"
                  value={ticket.seatPreference}
                  icon="airline_seat_recline_normal"
                />
              )}
            </div>

            {/* Traveler list */}
            {ticket.travelers.length > 0 && (
              <div className="mt-4 border-t border-outline-variant/20 pt-4">
                <p className="text-label-sm font-label-sm text-on-surface-variant mb-2">
                  Travelers
                </p>
                <div className="flex flex-col gap-1.5">
                  {ticket.travelers.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-body-md"
                    >
                      <span className="text-on-surface">{t.name}</span>
                      <span className="text-on-surface-variant">
                        {t.age}y, {t.gender}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Second dotted divider */}
          <div className="relative h-0 px-5">
            <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-background" />
            <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-background" />
            <div className="border-t-2 border-dashed border-outline-variant/30" />
          </div>

          {/* Bottom section - QR and IDs */}
          <div className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-label-sm text-on-surface-variant">Booking No.</p>
                <p className="text-label-lg font-label-lg text-on-surface">
                  {ticket.bookingNumber}
                </p>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant">Payment ID</p>
                <p className="text-label-lg font-label-lg text-on-surface">
                  {ticket.paymentId}
                </p>
              </div>
              {ticket.totalPricePaise > 0 && (
                <div>
                  <p className="text-label-sm text-on-surface-variant">Amount Paid</p>
                  <p className="text-label-lg font-label-lg text-primary">
                    {formatCurrency(ticket.totalPricePaise)}
                  </p>
                </div>
              )}
            </div>

            <QRCodePlaceholder value={ticket.bookingNumber} />
          </div>
        </Card>
      </motion.div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button
          fullWidth
          size="lg"
          onClick={handleDownload}
          icon={
            <span className="material-symbols-outlined text-[20px]">
              download
            </span>
          }
        >
          Download Ticket
        </Button>

        <Button
          fullWidth
          size="lg"
          variant="secondary"
          onClick={handleAddToCalendar}
          icon={
            <span className="material-symbols-outlined text-[20px]">
              calendar_add_on
            </span>
          }
        >
          Add to Calendar
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Info Item
// ---------------------------------------------------------------------------

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">
        {icon}
      </span>
      <div>
        <p className="text-label-sm text-on-surface-variant">{label}</p>
        <p className="text-body-md font-medium text-on-surface">{value}</p>
      </div>
    </div>
  );
}
