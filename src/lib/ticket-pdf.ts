import { formatCurrency } from "@/lib/utils";

// Brand palette (DocNow)
const INK: [number, number, number] = [24, 29, 39];
const LIME: [number, number, number] = [198, 241, 53];
const GRAY: [number, number, number] = [110, 116, 128];
const LINE: [number, number, number] = [225, 227, 232];
const SOFT: [number, number, number] = [246, 247, 249];
const WHITE: [number, number, number] = [255, 255, 255];

interface Traveler {
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
}

export interface TicketPdfData {
  bookingNumber: string;
  status: string;
  bookingType: string;
  travelerCount: number;
  travelers: Traveler[];
  pickupPoint: string | null;
  pickupTime: string | null;
  totalPricePaise: number;
  trip: {
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    duration: number;
  };
}

const TERMS = [
  "This e-ticket must be presented (digital or printed) along with a valid government photo ID at the pickup point.",
  "Please arrive at least 15 minutes before the scheduled pickup time. The vehicle will not wait for late arrivals.",
  "This booking is non-transferable and valid only for the traveller(s) named on this ticket.",
  "Seat allocation is at the operator's discretion; specific seats are not guaranteed unless pre-selected.",
  "The itinerary may change due to weather, road, or safety conditions at the trip leader's discretion.",
  "Travellers must follow the trip leader's instructions and adhere to all safety guidelines at all times.",
  "Meet My Route is not liable for loss of personal belongings, delays, or events beyond its reasonable control.",
  "Consumption of alcohol or illegal substances and any misconduct may lead to removal from the trip without a refund.",
];

const CANCELLATION = [
  "More than 7 days before departure: full refund, minus a small processing fee.",
  "Between 3 and 7 days before departure: 50% refund.",
  "Within 3 days of departure: no refund.",
  "Refunds are credited to your Meet My Route wallet within 3-7 business days.",
];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function titleCase(s?: string) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function statusColors(status: string): {
  bg: [number, number, number];
  fg: [number, number, number];
} {
  switch (status) {
    case "CONFIRMED":
      return { bg: LIME, fg: INK };
    case "COMPLETED":
      return { bg: [76, 175, 80], fg: WHITE };
    case "PENDING":
      return { bg: [245, 166, 35], fg: INK };
    default:
      return { bg: [120, 126, 138], fg: WHITE };
  }
}

/**
 * Build a professional, print-ready e-ticket PDF with jsPDF (crisp vector text),
 * including the QR, traveller details, payment, terms & conditions and the
 * cancellation policy. `qrDataUrl` is a PNG data URL of the check-in QR.
 */
export async function downloadTicketPdf(ticket: TicketPdfData, qrDataUrl: string | null) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const W = 210;
  const H = 297;
  const M = 16;
  const CW = W - M * 2;
  const nights = Math.max(ticket.trip.duration - 1, 0);

  const fill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);
  const text = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);

  const footer = () => {
    stroke(LINE);
    doc.setLineWidth(0.2);
    doc.line(M, H - 15, W - M, H - 15);
    text(GRAY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(
      "Meet My Route  |  support@travellinggoats.app  |  Computer-generated ticket, no signature required.",
      M,
      H - 10
    );
    doc.text(String(doc.getNumberOfPages()), W - M, H - 10, { align: "right" });
  };

  let y = 0;

  // ---- Header ---------------------------------------------------------------
  fill(INK);
  doc.rect(0, 0, W, 40, "F");
  fill(LIME);
  doc.rect(0, 40, W, 2, "F");

  text(LIME);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("MEET MY ROUTE", M, 13);
  text([170, 176, 186]);
  doc.setFontSize(8);
  doc.text("E-TICKET / BOARDING PASS", W - M, 13, { align: "right" });

  text(WHITE);
  doc.setFontSize(17);
  const titleLines = doc.splitTextToSize(ticket.trip.title, CW - 40) as string[];
  doc.text(titleLines, M, 23);
  text([206, 210, 216]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(
    `${ticket.trip.destination}   |   Booking #${ticket.bookingNumber}`,
    M,
    23 + titleLines.length * 6 + 1
  );

  // Status pill (top-right)
  const sc = statusColors(ticket.status);
  const label = titleCase(ticket.status).toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const pillW = doc.getTextWidth(label) + 8;
  fill(sc.bg);
  doc.roundedRect(W - M - pillW, 27, pillW, 7, 3.5, 3.5, "F");
  text(sc.fg);
  doc.text(label, W - M - pillW / 2, 31.6, { align: "center" });

  y = 52;

  // ---- Journey strip --------------------------------------------------------
  fill(SOFT);
  doc.roundedRect(M, y, CW, 22, 3, 3, "F");
  const colW = CW / 3;
  const midX = M + colW * 1.5;
  // Depart
  text(GRAY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("DEPART", M + 6, y + 7);
  text(INK);
  doc.setFontSize(12);
  doc.text(fmtDate(ticket.trip.startDate), M + 6, y + 14);
  // Duration (center)
  fill(INK);
  const durLabel = `${ticket.trip.duration}D / ${nights}N`;
  doc.setFontSize(8.5);
  const dw = doc.getTextWidth(durLabel) + 8;
  doc.roundedRect(midX - dw / 2, y + 8, dw, 6.5, 3, 3, "F");
  text(LIME);
  doc.setFont("helvetica", "bold");
  doc.text(durLabel, midX, y + 12.4, { align: "center" });
  // Return
  text(GRAY);
  doc.setFontSize(8);
  doc.text("RETURN", W - M - 6, y + 7, { align: "right" });
  text(INK);
  doc.setFontSize(12);
  doc.text(fmtDate(ticket.trip.endDate), W - M - 6, y + 14, { align: "right" });

  y += 30;

  // ---- Detail grid ----------------------------------------------------------
  const details: [string, string][] = [
    ["Booking ID", ticket.bookingNumber],
    ["Trip Type", titleCase(ticket.bookingType)],
    ["Pickup Point", ticket.pickupPoint || "To be announced"],
    ["Pickup Time", ticket.pickupTime || "To be announced"],
    ["Travellers", String(ticket.travelerCount)],
    ["Total Paid", formatCurrency(ticket.totalPricePaise)],
  ];
  const cellW = CW / 2;
  details.forEach(([k, v], i) => {
    const cx = M + (i % 2) * cellW;
    const cy = y + Math.floor(i / 2) * 14;
    text(GRAY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(k.toUpperCase(), cx, cy);
    text(INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(doc.splitTextToSize(v, cellW - 4)[0] as string, cx, cy + 6);
  });
  y += Math.ceil(details.length / 2) * 14 + 4;

  // ---- Travellers -----------------------------------------------------------
  text(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Travellers", M, y);
  y += 5;
  stroke(LINE);
  doc.setLineWidth(0.2);
  ticket.travelers.forEach((t, i) => {
    doc.line(M, y, W - M, y);
    y += 6;
    text(INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(`${i + 1}.  ${t.name || "Traveller"}`, M, y);
    const meta = [titleCase(t.gender), t.age ? `${t.age} yrs` : null].filter(Boolean).join("  |  ");
    if (meta) {
      text(GRAY);
      doc.setFont("helvetica", "normal");
      doc.text(meta, W - M, y, { align: "right" });
    }
    y += 3;
  });
  doc.line(M, y, W - M, y);
  y += 8;

  // ---- QR block -------------------------------------------------------------
  const qrSize = 34;
  fill(SOFT);
  doc.roundedRect(M, y, CW, qrSize + 12, 3, 3, "F");
  if (qrDataUrl) {
    fill(WHITE);
    doc.roundedRect(M + 6, y + 6, qrSize, qrSize, 2, 2, "F");
    doc.addImage(qrDataUrl, "PNG", M + 8, y + 8, qrSize - 4, qrSize - 4);
  }
  text(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Scan at check-in", M + qrSize + 16, y + 14);
  text(GRAY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    doc.splitTextToSize(
      "Show this QR to your trip leader (Trip Captain) at the pickup point to board.",
      CW - qrSize - 24
    ) as string[],
    M + qrSize + 16,
    y + 20
  );
  text(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Booking #${ticket.bookingNumber}`, M + qrSize + 16, y + qrSize + 2);
  y += qrSize + 20;

  // ---- Terms & Conditions ---------------------------------------------------
  const renderList = (heading: string, items: string[]) => {
    if (y > H - 40) {
      footer();
      doc.addPage();
      y = 22;
    }
    text(INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(heading, M, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.6);
    items.forEach((item, i) => {
      const lines = doc.splitTextToSize(`${i + 1}.  ${item}`, CW - 2) as string[];
      const need = lines.length * 4.2 + 1.5;
      if (y + need > H - 20) {
        footer();
        doc.addPage();
        y = 22;
      }
      text(GRAY);
      doc.text(lines, M, y);
      y += need;
    });
    y += 4;
  };

  renderList("Terms & Conditions", TERMS);
  renderList("Cancellation Policy", CANCELLATION);

  footer();
  doc.save(`ticket-${ticket.bookingNumber}.pdf`);
}
