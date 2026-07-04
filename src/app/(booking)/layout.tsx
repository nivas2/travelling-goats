"use client";

import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Stepper, type Step } from "@/components/ui/stepper";
import { cn } from "@/lib/utils";

const BOOKING_STEPS = [
  { label: "Travelers", segment: "travelers" },
  { label: "Details", segment: "details" },
  { label: "Seats", segment: "seats" },
  { label: "Add-ons", segment: "addons" },
  { label: "Payment", segment: "payment" },
  { label: "Confirm", segment: "success" },
];

/** Segments that are post-booking and should not show the stepper. */
const NON_STEP_SEGMENTS = new Set(["ticket", "status"]);

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Extract the last segment of the path for step detection
  const segments = pathname.split("/").filter(Boolean);
  const currentSegment = segments[segments.length - 1] || "";

  const isNonStepPage = NON_STEP_SEGMENTS.has(currentSegment);

  const currentIndex = BOOKING_STEPS.findIndex((s) =>
    currentSegment.includes(s.segment),
  );

  const steps: Step[] = BOOKING_STEPS.map((s, idx) => ({
    title: s.label,
    status:
      idx < currentIndex
        ? "completed"
        : idx === currentIndex
          ? "active"
          : "pending",
  }));

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <PageHeader title="Book Trip" />

      {/* Stepper -- only shown during the 6-step flow */}
      {!isNonStepPage && currentIndex >= 0 && (
        <div className="border-b border-outline-variant/10 bg-surface px-4 py-3">
          <Stepper steps={steps} />
        </div>
      )}

      <main className="flex-1">{children}</main>
    </div>
  );
}
