"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import { cn, formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Traveler {
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
}

interface TicketData {
  bookingNumber: string;
  qrToken: string;
  status: string;
  bookingType: string;
  travelerCount: number;
  travelers: Traveler[];
  pickupPoint: string | null;
  totalPricePaise: number;
  trip: {
    id: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    duration: number;
    meetingPoint: string | null;
    meetingTime: string | null;
    coverImage: string | null;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function fmt(iso: string) {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    day: d.toLocaleDateString("en-US", { day: "2-digit" }),
    month: d.toLocaleDateString("en-US", { month: "short" }),
  };
}

function titleCase(s?: string) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function statusStyle(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "bg-success/90 text-white";
    case "COMPLETED":
      return "bg-white/90 text-on-surface";
    case "CANCELLED":
    case "REFUNDED":
      return "bg-error/90 text-white";
    default:
      return "bg-secondary/90 text-white";
  }
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon name={icon} size={18} filled />
      </span>
      <div className="min-w-0">
        <p className="text-label-sm text-on-surface-variant">{label}</p>
        <p className="truncate text-label-lg font-semibold text-on-surface">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TicketPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/bookings/${id}/ticket`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to load ticket");
        if (active) setTicket(json.data as TicketData);
      } catch (err) {
        if (active)
          setError(err instanceof Error ? err.message : "Failed to load ticket");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const travelers: Traveler[] = Array.isArray(ticket?.travelers)
    ? (ticket!.travelers as Traveler[])
    : [];

  function buildMessage() {
    if (!ticket) return "";
    const fmtDate = (iso: string) =>
      new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    const url = `${window.location.origin}/trips/${ticket.trip.id}`;
    // WhatsApp renders *text* as bold.
    return (
      `🐐 I'm going on *${ticket.trip.title}* to ${ticket.trip.destination}!\n` +
      `📅 ${fmtDate(ticket.trip.startDate)} – ${fmtDate(ticket.trip.endDate)} (${ticket.trip.duration}D)\n` +
      `🎟️ Booking: ${ticket.bookingNumber}\n\n` +
      `Come along with Travelling Goats 👉 ${url}`
    );
  }

  function shareText() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(buildMessage())}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // Render the ticket to a PNG and share it as an image file. On mobile the
  // native share sheet lets you pick WhatsApp with the image attached; where
  // file-sharing isn't supported we download the PNG (and fall back to text).
  async function shareTicket() {
    if (!ticket || !ticketRef.current || sharing) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(ticketRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `ticket-${ticket.bookingNumber}.png`, {
        type: "image/png",
      });
      const message = buildMessage();

      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };

      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], text: message, title: "My Trip Ticket" });
      } else {
        // Desktop / unsupported: download the image, then open WhatsApp text.
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = file.name;
        a.click();
        shareText();
      }
    } catch (err) {
      // User cancelling the share sheet throws AbortError — ignore it.
      if ((err as Error)?.name !== "AbortError") {
        shareText();
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="min-h-dvh bg-surface-container-low px-4 pb-28 pt-5 md:pb-10">
      {/* Top bar */}
      <div className="mx-auto mb-5 flex max-w-md items-center justify-between">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-on-surface shadow-sm transition active:scale-95"
        >
          <Icon name="chevron_left" size={24} />
        </button>
        <h1 className="text-title-lg font-semibold text-on-surface">Your Ticket</h1>
        <div className="w-10" />
      </div>

      {loading ? (
        <div className="mx-auto max-w-md">
          <Skeleton variant="rectangular" height={520} className="rounded-3xl" />
        </div>
      ) : error || !ticket ? (
        <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl bg-surface px-6 py-16 text-center shadow-sm">
          <Icon
            name="confirmation_number"
            size={56}
            className="text-on-surface-variant/40"
          />
          <h2 className="mt-4 text-title-lg font-semibold text-on-surface">
            Ticket unavailable
          </h2>
          <p className="mt-2 text-body-md text-on-surface-variant">
            {error ?? "We couldn't load this ticket."}
          </p>
          <button
            onClick={() => router.back()}
            className="primary-gradient mt-6 rounded-full px-6 py-2.5 text-label-lg font-semibold text-on-primary"
          >
            Go Back
          </button>
        </div>
      ) : (
        <div className="mx-auto max-w-md">
          <div
            ref={ticketRef}
            className="overflow-hidden rounded-3xl bg-surface shadow-elevated"
          >
            {/* ===== Header with cover ===== */}
            <div className="relative h-44">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ticket.trip.coverImage || "/inspiration/mountains.jpg"}
                alt={ticket.trip.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
              <div className="absolute inset-0 flex flex-col justify-between p-5">
                <div className="flex justify-end">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-label-sm font-bold uppercase tracking-wide backdrop-blur-sm",
                      statusStyle(ticket.status)
                    )}
                  >
                    {titleCase(ticket.status)}
                  </span>
                </div>
                <div>
                  <h2 className="text-headline-sm font-bold text-white text-shadow-premium">
                    {ticket.trip.title}
                  </h2>
                  <p className="mt-1 inline-flex items-center gap-1 text-body-md text-white/90">
                    <Icon name="location_on" size={16} />
                    {ticket.trip.destination}
                  </p>
                </div>
              </div>
            </div>

            {/* ===== Journey (dates) ===== */}
            <div className="flex items-stretch justify-between gap-2 px-6 py-6">
              {(() => {
                const s = fmt(ticket.trip.startDate);
                const e = fmt(ticket.trip.endDate);
                return (
                  <>
                    <div className="text-center">
                      <p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                        Depart
                      </p>
                      <p className="mt-1 text-headline-sm font-bold text-on-surface">
                        {s.day}
                      </p>
                      <p className="text-label-md text-on-surface-variant">
                        {s.month} · {s.weekday}
                      </p>
                    </div>

                    <div className="flex flex-1 flex-col items-center justify-center px-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-label-sm font-bold text-primary">
                        {ticket.trip.duration}D
                      </span>
                      <div className="relative mt-2 flex w-full items-center">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        <span className="h-px flex-1 border-t-2 border-dashed border-primary/40" />
                        <Icon
                          name="hiking"
                          size={18}
                          className="mx-1 text-primary"
                        />
                        <span className="h-px flex-1 border-t-2 border-dashed border-primary/40" />
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                        Return
                      </p>
                      <p className="mt-1 text-headline-sm font-bold text-on-surface">
                        {e.day}
                      </p>
                      <p className="text-label-md text-on-surface-variant">
                        {e.month} · {e.weekday}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* ===== Details ===== */}
            <div className="space-y-5 px-6 pb-6">
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                <Detail
                  icon="confirmation_number"
                  label="Booking ID"
                  value={ticket.bookingNumber}
                />
                <Detail
                  icon="group"
                  label="Trip Type"
                  value={titleCase(ticket.bookingType)}
                />
                <Detail
                  icon="location_on"
                  label="Meeting Point"
                  value={
                    ticket.pickupPoint || ticket.trip.meetingPoint || "TBA"
                  }
                />
                <Detail
                  icon="schedule"
                  label="Meeting Time"
                  value={ticket.trip.meetingTime || "TBA"}
                />
              </div>

              {/* Travellers / members */}
              <div>
                <p className="mb-2.5 text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">
                  Travellers · {ticket.travelerCount}
                </p>
                <div className="space-y-2">
                  {travelers.length > 0 ? (
                    travelers.map((t, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl bg-surface-container-low p-2.5"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-label-lg font-bold text-on-primary-container">
                          {initials(t.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-label-lg font-semibold text-on-surface">
                            {t.name}
                          </p>
                          {(t.gender || t.age) && (
                            <p className="text-label-sm text-on-surface-variant">
                              {[titleCase(t.gender), t.age ? `${t.age} yrs` : null]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-2.5">
                      <Icon
                        name="group"
                        size={20}
                        className="text-on-surface-variant"
                      />
                      <p className="text-label-lg text-on-surface-variant">
                        {ticket.travelerCount} traveller
                        {ticket.travelerCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ===== Perforated tear line ===== */}
            <div className="relative">
              <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-surface-container-low" />
              <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-surface-container-low" />
              <div className="mx-5 border-t-2 border-dashed border-outline-variant/60" />
            </div>

            {/* ===== QR stub ===== */}
            <div className="flex flex-col items-center px-6 py-7">
              <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-outline-variant/40">
                <QRCodeCanvas
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/verify?t=${encodeURIComponent(ticket.qrToken)}`
                      : ticket.qrToken
                  }
                  size={148}
                  level="M"
                  marginSize={0}
                  fgColor="#1c1b1f"
                  bgColor="#ffffff"
                />
              </div>
              <p className="mt-4 inline-flex items-center gap-1.5 text-label-lg font-semibold text-on-surface">
                <Icon name="qr_code_scanner" size={18} className="text-primary" />
                Show this at check-in
              </p>
              <p className="mt-1 font-mono text-label-md tracking-widest text-on-surface-variant">
                {ticket.bookingNumber}
              </p>
              <div className="mt-4 flex w-full items-center justify-between border-t border-outline-variant/40 pt-4">
                <span className="text-label-md text-on-surface-variant">
                  Total Paid
                </span>
                <span className="text-title-md font-bold text-primary">
                  {formatCurrency(ticket.totalPricePaise)}
                </span>
              </div>
            </div>
          </div>

          {/* Share ticket as an image (WhatsApp etc. via the native share sheet) */}
          <button
            onClick={shareTicket}
            disabled={sharing}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-label-lg font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
          >
            {sharing ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Preparing ticket…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Share Ticket on WhatsApp
              </>
            )}
          </button>

          <p className="mt-4 text-center text-label-sm text-on-surface-variant">
            Keep this ticket handy — your Shepherd will scan it at the meeting point.
          </p>
        </div>
      )}
    </div>
  );
}
