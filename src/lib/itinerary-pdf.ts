import type { TripDetail } from "@/types";

// Brand palette (DocNow): navy ink, lime accent, muted gray, hairline.
const INK: [number, number, number] = [24, 29, 39];
const LIME: [number, number, number] = [198, 241, 53];
const GRAY: [number, number, number] = [110, 116, 128];
const LINE: [number, number, number] = [225, 227, 232];
const WHITE: [number, number, number] = [255, 255, 255];

/**
 * Generate a cleanly-designed, multi-page PDF of a trip's day-by-day itinerary
 * and trigger a download. Uses jsPDF vector text (crisp, small file) — lazy
 * imported so it only ships when a user actually downloads.
 */
export async function downloadItineraryPdf(trip: TripDetail) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const W = 210;
  const H = 297;
  const M = 16;
  const CW = W - M * 2;

  const fill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);
  const text = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const nights = Math.max(trip.duration - 1, 0);

  // ---- Header band ----------------------------------------------------------
  fill(INK);
  doc.rect(0, 0, W, 48, "F");
  fill(LIME);
  doc.rect(0, 48, W, 2.2, "F");

  text(LIME);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("MEET MY ROUTE", M, 15);

  text(WHITE);
  doc.setFontSize(21);
  const titleLines = doc.splitTextToSize(trip.title, CW) as string[];
  doc.text(titleLines, M, 26);

  text([206, 210, 216]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const metaY = 26 + titleLines.length * 7.5 + 1;
  doc.text(
    `${trip.destination}   |   ${trip.duration} Days / ${nights} Nights`,
    M,
    metaY
  );

  let y = 62;

  const footer = () => {
    stroke(LINE);
    doc.setLineWidth(0.2);
    doc.line(M, H - 15, W - M, H - 15);
    text(GRAY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Meet My Route — curated group adventures across India", M, H - 10);
    doc.text(String(doc.getNumberOfPages()), W - M, H - 10, { align: "right" });
  };

  const ensure = (need: number) => {
    if (y + need > H - 22) {
      footer();
      doc.addPage();
      y = 22;
    }
  };

  const days = [...trip.itineraryDays].sort((a, b) => a.dayNumber - b.dayNumber);

  days.forEach((day) => {
    ensure(20);

    // Day pill + title
    fill(INK);
    doc.roundedRect(M, y, 24, 8, 4, 4, "F");
    text(LIME);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`DAY ${day.dayNumber}`, M + 12, y + 5.4, { align: "center" });

    text(INK);
    doc.setFontSize(13.5);
    const dayTitle = doc.splitTextToSize(day.title, CW - 30) as string[];
    doc.text(dayTitle, M + 29, y + 5.8);
    y += Math.max(11, dayTitle.length * 6.2);

    // Description
    if (day.description) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      const dl = doc.splitTextToSize(day.description, CW) as string[];
      ensure(dl.length * 5 + 2);
      text(GRAY);
      doc.text(dl, M, y + 2);
      y += dl.length * 5 + 3;
    }

    // Activities
    day.activities.forEach((a) => {
      const tl = doc.splitTextToSize(a.title, CW - 24) as string[];
      const dl = a.description
        ? (doc.splitTextToSize(a.description, CW - 24) as string[])
        : [];
      ensure(Math.max(7, tl.length * 4.8 + dl.length * 4.2) + 3);

      fill(LIME);
      doc.roundedRect(M, y, 19, 5.6, 1.6, 1.6, "F");
      text(INK);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(a.time || "--", M + 9.5, y + 3.8, { align: "center" });

      doc.setFontSize(9.8);
      doc.text(tl, M + 24, y + 4);
      let yy = y + tl.length * 4.8;
      if (dl.length) {
        text(GRAY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.6);
        doc.text(dl, M + 24, yy + 3);
        yy += dl.length * 4.2;
      }
      y = yy + 3.5;
    });

    // Meals
    if (day.meals && day.meals.length) {
      ensure(7);
      text(INK);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Meals", M, y + 3);
      text(GRAY);
      doc.setFont("helvetica", "normal");
      doc.text(day.meals.join(", "), M + 16, y + 3);
      y += 6.5;
    }

    // Accommodation
    if (day.accommodation) {
      ensure(7);
      text(INK);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Stay", M, y + 3);
      text(GRAY);
      doc.setFont("helvetica", "normal");
      const sl = doc.splitTextToSize(day.accommodation, CW - 16) as string[];
      doc.text(sl, M + 16, y + 3);
      y += sl.length * 4.6 + 2;
    }

    // Divider
    y += 3.5;
    stroke(LINE);
    doc.setLineWidth(0.2);
    doc.line(M, y, W - M, y);
    y += 8;
  });

  // Closing note
  ensure(20);
  fill([246, 247, 249]);
  const note =
    "The itinerary is subject to change based on weather and group consensus. Your trip leader will keep you informed of any adjustments.";
  const nl = doc.splitTextToSize(note, CW - 12) as string[];
  const noteH = nl.length * 4.6 + 10;
  doc.roundedRect(M, y, CW, noteH, 3, 3, "F");
  text(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Good to know", M + 6, y + 7);
  text(GRAY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.6);
  doc.text(nl, M + 6, y + 12);

  footer();
  const safe = trip.title.replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "");
  doc.save(`${safe || "trip"}-itinerary.pdf`);
}
