"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { handleAuthError } from "@/lib/auth-fetch";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import { cn, formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { downloadTicketPdf } from "@/lib/ticket-pdf";

// Route cross-origin images through the same-origin proxy so html-to-image can
// inline them (CSP connect-src is 'self'), otherwise the canvas is tainted and
// the PNG/PDF capture fails.
const proxied = (u: string) =>
  /^https?:\/\//i.test(u) ? `/api/imgproxy?url=${encodeURIComponent(u)}` : u;

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
  pickupTime: string | null;
  totalPricePaise: number;
  trip: {
    id: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    duration: number;
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
      return "bg-lime text-on-surface";
    case "COMPLETED":
      return "bg-white text-on-surface";
    case "CANCELLED":
    case "REFUNDED":
      return "bg-error text-white";
    default:
      return "bg-white/20 text-white backdrop-blur-md";
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
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime text-on-surface">
        <Icon name={icon} size={18} filled />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">{label}</p>
        <p className="truncate text-[14px] font-semibold text-on-surface">
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
  const { error: toastError } = useToast();
  const id = params.id as string;

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  const pdfQrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/bookings/${id}/ticket`);
        if (await handleAuthError(res)) return;
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
      `Come along with Meet My Route 👉 ${url}`
    );
  }

  function shareText() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(buildMessage())}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // Build a professional, print-ready PDF ticket (vector text + QR + T&C +
  // cancellation policy). jsPDF is lazy-loaded inside the generator.
  async function downloadTicket() {
    if (!ticket || downloading) return;
    setDownloading(true);
    try {
      const canvas = pdfQrRef.current?.querySelector("canvas");
      const qrDataUrl = canvas ? canvas.toDataURL("image/png") : null;
      await downloadTicketPdf(ticket, qrDataUrl);
    } catch {
      toastError("Couldn't generate the ticket PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
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
        backgroundColor: "#F2F2F5",
        // Don't try to inline the cross-origin Google Fonts stylesheet — reading
        // its cssRules throws a SecurityError (surfaces as a dev-tools "issue").
        skipFonts: true,
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
    <div className="min-h-dvh bg-background px-4 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))] md:pb-10">
      {/* Top bar */}
      <div className="mx-auto mb-5 flex max-w-md items-center justify-between">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-on-surface ring-1 ring-black/5 transition active:scale-95"
        >
          <Icon name="arrow_back" size={22} />
        </button>
        <h1 className="text-[17px] font-semibold tracking-[-0.01em] text-on-surface">Your Ticket</h1>
        <div className="w-10" />
      </div>

      {loading ? (
        <div className="mx-auto max-w-md">
          <Skeleton variant="rectangular" height={520} className="rounded-[28px]" />
        </div>
      ) : error || !ticket ? (
        <div className="mx-auto flex max-w-md flex-col items-center rounded-[28px] bg-white px-6 py-16 text-center ring-1 ring-black/5">
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
            className="overflow-hidden rounded-[28px] bg-surface-container-low shadow-[0_20px_50px_rgba(20,30,40,0.12)] ring-1 ring-black/5"
          >
            {/* ===== Header with cover ===== */}
            <div className="relative h-44">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proxied(ticket.trip.coverImage || "/inspiration/mountains.jpg")}
                alt={ticket.trip.title}
                crossOrigin="anonymous"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
              <div className="absolute inset-0 flex flex-col justify-between p-5">
                <div className="flex items-start justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                    <Icon name="confirmation_number" size={15} filled />
                    Boarding Pass
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur-sm",
                      statusStyle(ticket.status)
                    )}
                  >
                    {titleCase(ticket.status)}
                  </span>
                </div>
                <div>
                  <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-white">
                    {ticket.trip.title}
                  </h2>
                  <p className="mt-1 inline-flex items-center gap-1 text-[13px] text-white/85">
                    <Icon name="location_on" size={16} filled />
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
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                        Depart
                      </p>
                      <p className="mt-1 text-[28px] font-bold leading-none text-on-surface">
                        {s.day}
                      </p>
                      <p className="mt-1 text-[12px] text-on-surface-variant">
                        {s.month} · {s.weekday}
                      </p>
                    </div>

                    <div className="flex flex-1 flex-col items-center justify-center px-2">
                      <span className="rounded-full bg-lime px-2.5 py-0.5 text-[11px] font-bold text-on-surface">
                        {ticket.trip.duration}D
                      </span>
                      <div className="relative mt-2 flex w-full items-center">
                        <span className="h-2 w-2 rounded-full bg-lime" />
                        <span className="h-px flex-1 border-t-2 border-dashed border-black/15" />
                        <Icon
                          name="directions_bus"
                          size={18}
                          className="mx-1 text-on-surface"
                        />
                        <span className="h-px flex-1 border-t-2 border-dashed border-black/15" />
                        <span className="h-2 w-2 rounded-full bg-lime" />
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                        Return
                      </p>
                      <p className="mt-1 text-[28px] font-bold leading-none text-on-surface">
                        {e.day}
                      </p>
                      <p className="mt-1 text-[12px] text-on-surface-variant">
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
                  label="Pickup Point"
                  value={ticket.pickupPoint || "TBA"}
                />
                <Detail
                  icon="schedule"
                  label="Pickup Time"
                  value={ticket.pickupTime || "TBA"}
                />
              </div>

              {/* Travellers / members */}
              <div>
                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                  Travellers · {ticket.travelerCount}
                </p>
                <div className="space-y-2">
                  {travelers.length > 0 ? (
                    travelers.map((t, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl bg-black/[0.04] p-2.5"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime text-[13px] font-bold text-on-surface">
                          {initials(t.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-on-surface">
                            {t.name}
                          </p>
                          {(t.gender || t.age) && (
                            <p className="text-[12px] text-on-surface-variant">
                              {[titleCase(t.gender), t.age ? `${t.age} yrs` : null]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl bg-black/[0.04] p-2.5">
                      <Icon
                        name="group"
                        size={20}
                        className="text-on-surface-variant"
                      />
                      <p className="text-[14px] text-on-surface-variant">
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
              <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
              <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
              <div className="mx-5 border-t-2 border-dashed border-black/15" />
            </div>

            {/* ===== QR stub ===== */}
            <div className="flex flex-col items-center px-6 py-7">
              <div className="rounded-2xl bg-white p-3 ring-1 ring-black/5">
                <QRCodeCanvas
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/verify?t=${encodeURIComponent(ticket.qrToken)}`
                      : ticket.qrToken
                  }
                  size={148}
                  level="M"
                  marginSize={0}
                  fgColor="#181818"
                  bgColor="#ffffff"
                />
              </div>
              <p className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-on-surface">
                <Icon name="qr_code_scanner" size={18} className="text-on-surface" />
                Show this at check-in
              </p>
              <p className="mt-1 font-mono text-[13px] tracking-widest text-on-surface-variant">
                {ticket.bookingNumber}
              </p>
              <div className="mt-4 flex w-full items-center justify-between border-t border-black/10 pt-4">
                <span className="text-[13px] text-on-surface-variant">
                  Total Paid
                </span>
                <span className="text-[18px] font-bold text-on-surface">
                  {formatCurrency(ticket.totalPricePaise)}
                </span>
              </div>
            </div>
          </div>

          {/* Hidden high-res QR — sampled into the downloadable PDF ticket */}
          <div ref={pdfQrRef} className="pointer-events-none absolute -left-[9999px] top-0" aria-hidden>
            <QRCodeCanvas
              value={
                typeof window !== "undefined"
                  ? `${window.location.origin}/verify?t=${encodeURIComponent(ticket.qrToken)}`
                  : ticket.qrToken
              }
              size={512}
              level="M"
              marginSize={2}
              fgColor="#181818"
              bgColor="#ffffff"
            />
          </div>

          {/* Actions — share (native sheet / WhatsApp fallback) + download PDF */}
          <div className="mt-5 flex gap-3">
            <button
              onClick={shareTicket}
              disabled={sharing}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-surface px-6 py-3 text-label-lg font-semibold text-on-surface ring-1 ring-black/10 transition active:scale-[0.98] disabled:opacity-60"
            >
              <Icon
                name={sharing ? "progress_activity" : "share"}
                size={20}
                className={sharing ? "animate-spin" : ""}
              />
              {sharing ? "Sharing…" : "Share"}
            </button>
            <button
              onClick={downloadTicket}
              disabled={downloading}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-lime px-6 py-3 text-label-lg font-semibold text-on-surface shadow-sm transition active:scale-[0.98] disabled:opacity-60"
            >
              <Icon
                name={downloading ? "progress_activity" : "download"}
                size={20}
                className={downloading ? "animate-spin" : ""}
              />
              {downloading ? "Preparing…" : "Download Ticket"}
            </button>
          </div>

          <p className="mt-4 text-center text-label-sm text-on-surface-variant">
            Keep this ticket handy — your Trip Captain will scan it at the meeting point.
          </p>
        </div>
      )}
    </div>
  );
}
