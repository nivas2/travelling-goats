"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, formatDateRange } from "@/lib/utils";
import { useBookingStore } from "@/stores/booking-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------

type OrderStatusValue = "BOOKED" | "CONFIRMED" | "TRIP_DAY" | "COMPLETED" | "CANCELLED";

interface StatusStep {
  key: OrderStatusValue;
  label: string;
  icon: string;
  description: string;
  timestamp?: string;
}

interface OrderData {
  bookingNumber: string;
  status: OrderStatusValue;
  tripName: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
  totalPricePaise: number;
  bookedAt: string;
  confirmedAt?: string;
  cancellationPolicy: string;
}

// ---------------------------------------------------------------------------
//  Status timeline steps
// ---------------------------------------------------------------------------

const STATUS_STEPS: StatusStep[] = [
  {
    key: "BOOKED",
    label: "Booked",
    icon: "receipt",
    description: "Payment received and booking created",
  },
  {
    key: "CONFIRMED",
    label: "Confirmed",
    icon: "verified",
    description: "Trip confirmed by MeetMyRoute team",
  },
  {
    key: "TRIP_DAY",
    label: "Trip Day",
    icon: "flight_takeoff",
    description: "Your trip is happening today!",
  },
  {
    key: "COMPLETED",
    label: "Completed",
    icon: "check_circle",
    description: "Trip completed. We hope you had fun!",
  },
];

const STATUS_ORDER: OrderStatusValue[] = ["BOOKED", "CONFIRMED", "TRIP_DAY", "COMPLETED"];

// ---------------------------------------------------------------------------
//  Page Component
// ---------------------------------------------------------------------------

export default function StatusPage() {
  const params = useParams<{ tripId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = params.tripId;
  const bookingId = searchParams.get("bookingId");
  const { success: toastSuccess, error: toastError } = useToast();

  const { travelerCount, summary } = useBookingStore();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);

        if (bookingId) {
          const res = await fetch(`/api/bookings?id=${bookingId}`);
          if (res.ok) {
            const json = await res.json();
            const data = json.data ?? json;
            setOrder({
              bookingNumber: data.bookingNumber ?? bookingId,
              status: data.status ?? "BOOKED",
              tripName: data.tripName ?? data.trip?.title ?? "Your Trip",
              startDate: data.startDate ?? data.trip?.startDate ?? "",
              endDate: data.endDate ?? data.trip?.endDate ?? "",
              travelerCount: data.travelerCount ?? travelerCount,
              totalPricePaise: data.totalPricePaise ?? summary?.totalPricePaise ?? 0,
              bookedAt: data.createdAt ?? new Date().toISOString(),
              confirmedAt: data.confirmedAt,
              cancellationPolicy:
                data.cancellationPolicy ??
                data.trip?.cancellationPolicy ??
                "Full refund if cancelled 7 days before the trip. 50% refund if cancelled 3-7 days before. No refund within 3 days of the trip.",
            });
            return;
          }
        }

        // Fallback
        const tripRes = await fetch(`/api/trips/${tripId}`);
        const tripJson = tripRes.ok ? await tripRes.json() : null;
        const trip = tripJson?.data ?? tripJson;

        setOrder({
          bookingNumber: bookingId ?? `PA${Date.now().toString(36).toUpperCase()}`,
          status: "BOOKED",
          tripName: trip?.title ?? "Your Trip",
          startDate: trip?.startDate ?? "",
          endDate: trip?.endDate ?? "",
          travelerCount,
          totalPricePaise: summary?.totalPricePaise ?? 0,
          bookedAt: new Date().toISOString(),
          cancellationPolicy:
            trip?.cancellationPolicy ??
            "Full refund if cancelled 7 days before the trip. 50% refund if cancelled 3-7 days before. No refund within 3 days of the trip.",
        });
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [tripId, bookingId, travelerCount, summary]);

  const handleCancelBooking = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings?id=${bookingId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to cancel booking");
      }

      toastSuccess("Booking cancelled successfully. Refund will be processed.");
      setOrder((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
      setShowCancelModal(false);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  const currentStatusIndex = order
    ? STATUS_ORDER.indexOf(order.status)
    : -1;

  const isCancelled = order?.status === "CANCELLED";
  const canCancel =
    order &&
    !isCancelled &&
    (order.status === "BOOKED" || order.status === "CONFIRMED");

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-5">
        <Skeleton variant="text" lines={2} />
        <Skeleton height={300} />
        <Skeleton height={120} />
        <Skeleton height={48} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="material-symbols-outlined text-[48px] text-error">
          error
        </span>
        <p className="text-title-md font-title-md text-on-surface">
          Booking not found
        </p>
        <Button variant="secondary" onClick={() => router.push("/my-trips")}>
          View My Trips
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-5 pb-8">
      {/* Heading */}
      <div>
        <h2 className="text-headline-md font-headline-md text-on-surface">
          Order Status
        </h2>
        <p className="mt-1 text-body-md font-body-md text-on-surface-variant">
          Booking #{order.bookingNumber}
        </p>
      </div>

      {/* Cancelled banner */}
      {isCancelled && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl bg-error-container p-4"
        >
          <span className="material-symbols-outlined text-[24px] text-error">
            cancel
          </span>
          <div>
            <p className="text-title-md font-title-md text-on-error-container">
              Booking Cancelled
            </p>
            <p className="text-body-md text-on-error-container/80">
              Your refund will be processed within 5-7 business days.
            </p>
          </div>
        </motion.div>
      )}

      {/* Status Timeline */}
      {!isCancelled && (
        <Card variant="outlined" className="py-5">
          <div className="flex flex-col gap-0">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index < currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const isPending = index > currentStatusIndex;

              return (
                <div key={step.key} className="flex gap-4">
                  {/* Timeline line and circle */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.15 }}
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        isCompleted && "bg-success text-on-success",
                        isCurrent && "bg-primary text-on-primary ring-4 ring-primary-container",
                        isPending && "bg-surface-container text-on-surface-variant",
                      )}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isCompleted ? "check" : step.icon}
                      </span>
                    </motion.div>

                    {/* Connecting line */}
                    {index < STATUS_STEPS.length - 1 && (
                      <div
                        className={cn(
                          "w-0.5 flex-1 min-h-[32px]",
                          index < currentStatusIndex
                            ? "bg-success"
                            : "bg-surface-container-high",
                        )}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn("pb-6", index === STATUS_STEPS.length - 1 && "pb-0")}>
                    <p
                      className={cn(
                        "text-title-md font-title-md",
                        isCurrent
                          ? "text-primary"
                          : isCompleted
                            ? "text-on-surface"
                            : "text-on-surface-variant/50",
                      )}
                    >
                      {step.label}
                    </p>
                    <p
                      className={cn(
                        "text-body-md",
                        isPending
                          ? "text-on-surface-variant/40"
                          : "text-on-surface-variant",
                      )}
                    >
                      {step.description}
                    </p>
                    {step.key === "BOOKED" && order.bookedAt && (
                      <p className="mt-0.5 text-label-sm text-on-surface-variant/60">
                        {formatDate(order.bookedAt, "long")}
                      </p>
                    )}
                    {step.key === "CONFIRMED" && order.confirmedAt && (
                      <p className="mt-0.5 text-label-sm text-on-surface-variant/60">
                        {formatDate(order.confirmedAt, "long")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Booking details card */}
      <Card variant="outlined" className="flex flex-col gap-3">
        <h3 className="text-title-md font-title-md text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">
            info
          </span>
          Booking Details
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="Trip" value={order.tripName} />
          {order.startDate && order.endDate && (
            <DetailItem
              label="Dates"
              value={formatDateRange(order.startDate, order.endDate)}
            />
          )}
          <DetailItem
            label="Travelers"
            value={`${order.travelerCount} ${order.travelerCount === 1 ? "person" : "people"}`}
          />
          {order.totalPricePaise > 0 && (
            <DetailItem
              label="Amount"
              value={formatCurrency(order.totalPricePaise)}
              highlight
            />
          )}
        </div>
      </Card>

      {/* Cancellation policy */}
      {canCancel && (
        <Card variant="outlined" className="flex flex-col gap-3">
          <h3 className="text-title-md font-title-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-warning">
              policy
            </span>
            Cancellation Policy
          </h3>
          <p className="text-body-md text-on-surface-variant">
            {order.cancellationPolicy}
          </p>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {canCancel && (
          <Button
            fullWidth
            size="lg"
            variant="destructive"
            onClick={() => setShowCancelModal(true)}
            icon={
              <span className="material-symbols-outlined text-[20px]">
                cancel
              </span>
            }
          >
            Cancel Booking
          </Button>
        )}

        <Button
          fullWidth
          size="lg"
          variant="secondary"
          onClick={() => {
            // Open email or support page
            window.open("mailto:support@meetmyroute.in?subject=Booking%20Support%20-%20" + order.bookingNumber, "_blank");
          }}
          icon={
            <span className="material-symbols-outlined text-[20px]">
              support_agent
            </span>
          }
        >
          Contact Support
        </Button>
      </div>

      {/* Cancel confirmation modal */}
      <Modal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Booking?"
        description="This action cannot be undone. Refund will be processed as per our cancellation policy."
        size="sm"
      >
        <div className="flex flex-col gap-4 pt-2">
          {/* Policy reminder */}
          <div className="rounded-lg bg-warning-container/30 p-3">
            <p className="text-body-md text-on-surface-variant">
              {order.cancellationPolicy}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setShowCancelModal(false)}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              fullWidth
              loading={cancelling}
              onClick={handleCancelBooking}
            >
              Yes, Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Detail Item
// ---------------------------------------------------------------------------

function DetailItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <p
        className={cn(
          "text-body-md font-medium",
          highlight ? "text-primary" : "text-on-surface",
        )}
      >
        {value}
      </p>
    </div>
  );
}
