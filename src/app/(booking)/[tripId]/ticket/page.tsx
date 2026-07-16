"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import QRCode from "react-qr-code";
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
  qrToken: string | null;
  paymentId: string;
  tripName: string;
  startDate: string;
  endDate: string;
  pickupPoint: string;
  pickupTime: string;
  travelerCount: number;
  travelers: Array<{ name: string; age?: number; gender?: string }>;
  contactName: string | null;
  seatPreference: string | null;
  totalPricePaise: number;
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

        // Fetch from ticket API (correct endpoint)
        if (bookingId) {
          const res = await fetch(`/api/bookings/${bookingId}/ticket`);
          if (res.ok) {
            const json = await res.json();
            const data = json.data ?? json;
            const travelers = Array.isArray(data.travelers) ? data.travelers : [];
            setTicket({
              bookingNumber: data.bookingNumber ?? bookingId,
              qrToken: data.qrToken ?? null,
              paymentId: data.paymentId ?? "Pending",
              tripName: data.trip?.title ?? "Trip",
              startDate: data.trip?.startDate ?? "",
              endDate: data.trip?.endDate ?? "",
              pickupPoint: data.pickupPoint ?? "To be announced",
              pickupTime: data.pickupTime ?? "TBA",
              travelerCount: data.travelerCount ?? travelerCount,
              travelers,
              contactName: travelers[0]?.name ?? null,
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

        const fallbackTravelers = storeTravelers.map((t) => ({
          name: t.name,
          age: t.age,
          gender: t.gender,
        }));

        setTicket({
          bookingNumber: bookingId ?? `PA${Date.now().toString(36).toUpperCase()}`,
          qrToken: null,
          paymentId: "Pending",
          tripName: trip?.title ?? "Your Trip",
          startDate: trip?.startDate ?? "",
          endDate: trip?.endDate ?? "",
          pickupPoint: "To be announced",
          pickupTime: "TBA",
          travelerCount,
          travelers: fallbackTravelers,
          contactName: fallbackTravelers[0]?.name ?? null,
          seatPreference,
          totalPricePaise: summary?.totalPricePaise ?? 0,
        });
      } catch {
        const fallbackTravelers = storeTravelers.map((t) => ({
          name: t.name,
          age: t.age,
          gender: t.gender,
        }));

        setTicket({
          bookingNumber: `PA${Date.now().toString(36).toUpperCase()}`,
          qrToken: null,
          paymentId: "Pending",
          tripName: "Your Trip",
          startDate: "",
          endDate: "",
          pickupPoint: "To be announced",
          pickupTime: "TBA",
          travelerCount,
          travelers: fallbackTravelers,
          contactName: fallbackTravelers[0]?.name ?? null,
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
    url.searchParams.set("text", `Meet My Route: ${ticket.tripName}`);
    url.searchParams.set(
      "dates",
      `${formatGCalDate(start)}/${formatGCalDate(end)}`,
    );
    url.searchParams.set(
      "details",
      `Booking: ${ticket.bookingNumber}\nPickup: ${ticket.pickupPoint}\nTime: ${ticket.pickupTime}`,
    );
    url.searchParams.set("location", ticket.pickupPoint);

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

  // QR value: use qrToken if available, else booking number
  const qrValue = ticket.qrToken ?? ticket.bookingNumber;

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
                <p className="text-label-sm opacity-80">Meet My Route</p>
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
                label="Pickup Point"
                value={ticket.pickupPoint}
                icon="pin_drop"
              />
              <InfoItem
                label="Pickup Time"
                value={ticket.pickupTime}
                icon="schedule"
              />
              <InfoItem
                label="Travelers"
                value={`${ticket.travelerCount} ${ticket.travelerCount === 1 ? "person" : "people"}`}
                icon="groups"
              />
              {ticket.contactName && (
                <InfoItem
                  label="Contact"
                  value={ticket.contactName}
                  icon="person"
                />
              )}
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
                        {t.age ? `${t.age}y` : ""}{t.age && t.gender ? ", " : ""}{t.gender ?? ""}
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

            {/* Real QR Code */}
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-xl border border-outline-variant/30 bg-white p-2">
                <QRCode value={qrValue} size={112} level="M" />
              </div>
              <p className="text-label-sm text-on-surface-variant">Scan at venue</p>
            </div>
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
