"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { useBookingStore } from "@/stores/booking-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { BookingBottomBar } from "@/components/booking/booking-bottom-bar";
import { useGoatSound } from "@/hooks/use-goat-sound";
import type { BookingSummary } from "@/types";

// ---------------------------------------------------------------------------
//  Razorpay types (window augmentation)
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// ---------------------------------------------------------------------------
//  Coupon type (from admin-managed DB)
// ---------------------------------------------------------------------------

interface Coupon {
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderPaise: number;
  maxDiscountPaise: number | null;
}

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ---------------------------------------------------------------------------
//  Page Component
// ---------------------------------------------------------------------------

export default function PaymentPage() {
  const params = useParams<{ tripId: string }>();
  const router = useRouter();
  const tripId = params.tripId;
  const { success: toastSuccess, error: toastError } = useToast();
  const { play: playGoat, prime: primeGoat } = useGoatSound();

  const {
    bookingType,
    travelerCount,
    travelers,
    selectedAddOns,
    selectedSnacks,
    couponCode,
    couponDiscount,
    useWallet,
    walletAmount,
    setCoupon,
    setUseWallet,
    setWalletAmount,
    setSummary,
    setStep,
  } = useBookingStore();

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [couponInput, setCouponInput] = useState(couponCode ?? "");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);

  // Price state
  const [basePricePaise, setBasePricePaise] = useState(0);
  const [addonsPricePaise, setAddonsPricePaise] = useState(0);
  const [snacksPricePaise, setSnacksPricePaise] = useState(0);
  const [platformFeePaise, setPlatformFeePaise] = useState(0);

  useEffect(() => {
    setStep(5);

    async function fetchPricing() {
      try {
        setLoading(true);

        // Fetch trip details for pricing
        const tripRes = await fetch(`/api/trips/${tripId}`);
        if (!tripRes.ok) throw new Error("Failed to load pricing");
        const tripJson = await tripRes.json();
        const trip = tripJson.data ?? tripJson;

        // Calculate base price
        let base = trip.basePricePaise * travelerCount;
        if (bookingType === "COUPLE" && trip.couplePricePaise) {
          base = trip.couplePricePaise;
        } else if (bookingType === "GROUP" && trip.groupPricePaise) {
          base = trip.groupPricePaise * travelerCount;
        }
        setBasePricePaise(base);

        // Calculate add-on prices
        const tripAddOns: Array<{ id: string; pricePaise: number }> = trip.addOns ?? [];
        let addonsSum = 0;
        Object.entries(selectedAddOns).forEach(([id, qty]) => {
          const addon = tripAddOns.find((a) => a.id === id);
          if (addon) {
            addonsSum += addon.pricePaise * qty;
          }
        });
        setAddonsPricePaise(addonsSum);

        // Calculate snack prices
        const tripSnacks: Array<{ id: string; pricePaise: number }> = trip.snackOptions ?? [];
        let snacksSum = 0;
        Object.entries(selectedSnacks).forEach(([id, qty]) => {
          const snack = tripSnacks.find((s) => s.id === id);
          if (snack) {
            snacksSum += snack.pricePaise * qty;
          }
        });
        setSnacksPricePaise(snacksSum);

        // Platform fee
        setPlatformFeePaise(trip.platformFeePaise ?? 4900);

        // Fetch wallet balance
        try {
          const walletRes = await fetch("/api/wallet");
          if (walletRes.ok) {
            const walletJson = await walletRes.json();
            const wallet = walletJson.data ?? walletJson;
            setWalletBalance(wallet.balancePaise ?? 0);
          }
        } catch {
          setWalletBalance(0);
        }

        // Fetch available coupons from admin-managed DB
        try {
          const couponRes = await fetch("/api/coupons");
          if (couponRes.ok) {
            const couponJson = await couponRes.json();
            setAvailableCoupons(couponJson.data ?? []);
          }
        } catch {
          // Non-critical
        }
      } catch {
        // Use fallback pricing
        setBasePricePaise(499900);
        setPlatformFeePaise(4900);
      } finally {
        setLoading(false);
      }
    }

    fetchPricing();
  }, [tripId, travelerCount, bookingType, selectedAddOns, selectedSnacks, setStep]);

  // Derived calculations
  const subtotalPaise = basePricePaise + addonsPricePaise + snacksPricePaise + platformFeePaise;
  const discountPaise = couponDiscount;
  const walletDeduction = useWallet ? Math.min(walletBalance, subtotalPaise - discountPaise) : 0;
  const totalPaise = Math.max(0, subtotalPaise - discountPaise - walletDeduction);

  const summary: BookingSummary = useMemo(
    () => ({
      basePricePaise,
      addonsPricePaise,
      snacksPricePaise,
      platformFeePaise,
      discountPaise,
      walletAmountPaise: walletDeduction,
      totalPricePaise: totalPaise,
    }),
    [basePricePaise, addonsPricePaise, snacksPricePaise, platformFeePaise, discountPaise, walletDeduction, totalPaise],
  );

  // Coupon logic — validates via API (admin-managed coupons)
  const handleApplyCoupon = useCallback(async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setApplyingCoupon(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, orderAmountPaise: subtotalPaise }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toastError(json.error ?? "Invalid coupon code");
        return;
      }

      const discount = json.data.discountPaise;
      setCoupon(code, discount);
      toastSuccess(`Coupon applied! You save ${formatCurrency(discount)}`);
    } catch {
      toastError("Failed to validate coupon");
    } finally {
      setApplyingCoupon(false);
    }
  }, [couponInput, subtotalPaise, setCoupon, toastSuccess, toastError]);

  const handleRemoveCoupon = () => {
    setCoupon(null, 0);
    setCouponInput("");
  };

  const handleSelectCoupon = (code: string) => {
    setCouponInput(code);
    setShowCoupons(false);
  };

  const {
    seatPreference,
    selectedSeatIds,
    sessionId,
    contactEmail,
    contactPhone,
    specialRequests,
    pickupPoint,
  } = useBookingStore();

  // Payment flow
  const handlePay = useCallback(async () => {
    primeGoat();
    setPaying(true);

    try {
      // Persist summary to store
      setSummary(summary);

      // 1. Create the booking first
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          bookingType,
          travelerCount,
          travelers,
          seatPreference,
          seatIds: selectedSeatIds.length > 0 ? selectedSeatIds : undefined,
          sessionId: selectedSeatIds.length > 0 ? sessionId : undefined,
          contactEmail: contactEmail || undefined,
          contactPhone: contactPhone || undefined,
          specialRequests: specialRequests || undefined,
          pickupPoint: pickupPoint || undefined,
          addOns: Object.entries(selectedAddOns)
            .filter(([, qty]) => qty > 0)
            .map(([id, qty]) => ({ addOnId: id, quantity: qty })),
          snacks: Object.entries(selectedSnacks)
            .filter(([, qty]) => qty > 0)
            .map(([id, qty]) => ({ snackId: id, quantity: qty })),
          couponCode: couponCode || undefined,
        }),
      });

      if (!bookingRes.ok) {
        const errJson = await bookingRes.json().catch(() => null);
        throw new Error(errJson?.error ?? "Failed to create booking");
      }

      const bookingJson = await bookingRes.json();
      const booking = bookingJson.data ?? bookingJson;
      const bookingId = booking.id;

      // 2. Create payment order
      const orderRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          useWallet,
          walletAmountPaise: walletDeduction,
        }),
      });

      if (!orderRes.ok) {
        const errJson = await orderRes.json().catch(() => null);
        throw new Error(errJson?.error ?? "Failed to create payment order");
      }

      const orderJson = await orderRes.json();
      const order = orderJson.data ?? orderJson;

      // Test mode or full wallet payment — auto-completed
      if (order.testMode || order.fullWalletPayment) {
        playGoat();
        toastSuccess("Booking confirmed!");
        router.push(`/${tripId}/success?bookingId=${bookingId}`);
        return;
      }

      // 3. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway");
      }

      // 4. Open Razorpay checkout
      const options: RazorpayOptions = {
        key: order.key ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
        amount: order.amount ?? totalPaise,
        currency: order.currency ?? "INR",
        name: "Travelling Goats",
        description: `Trip Booking - ${travelerCount} traveler(s)`,
        order_id: order.orderId ?? order.payment?.razorpayOrderId,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch("/api/payments", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
              }),
            });

            if (!verifyRes.ok) {
              throw new Error("Payment verification failed");
            }

            playGoat();
            toastSuccess("Payment successful!");
            router.push(`/${tripId}/success?bookingId=${bookingId}`);
          } catch {
            toastError("Payment verification failed. Contact support.");
            setPaying(false);
          }
        },
        prefill: {
          name: travelers[0]?.name ?? "",
          contact: travelers[0]?.phone ?? "",
        },
        theme: { color: "#FF385C" },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
      };

      const razorpay = new window.Razorpay!(options);
      razorpay.on("payment.failed", () => {
        toastError("Payment failed. Please try again.");
        setPaying(false);
      });
      razorpay.open();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Payment failed");
      setPaying(false);
    }
  }, [
    tripId, bookingType, travelerCount, travelers,
    seatPreference, selectedSeatIds, sessionId,
    contactEmail, contactPhone, specialRequests, pickupPoint,
    selectedAddOns, selectedSnacks, couponCode, useWallet,
    walletDeduction, totalPaise, summary, setSummary, router, toastSuccess, toastError, playGoat, primeGoat,
  ]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-5">
        <Skeleton variant="text" lines={2} />
        <Skeleton height={56} />
        <Skeleton height={200} />
        <Skeleton height={56} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-5 pb-36">
      {/* Heading */}
      <div>
        <h2 className="text-headline-md font-headline-md text-on-surface">
          Review & Pay
        </h2>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Apply coupons and complete your booking
        </p>
      </div>

      {/* Coupon section */}
      <Card variant="outlined" className="flex flex-col gap-3">
        <h3 className="text-title-md font-title-md text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">
            confirmation_number
          </span>
          Apply Coupon
        </h3>

        {couponCode ? (
          <div className="flex items-center justify-between rounded-lg border-2 border-primary bg-primary-fixed/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">
                check_circle
              </span>
              <div>
                <p className="text-label-lg font-label-lg text-primary">{couponCode}</p>
                <p className="text-label-sm text-on-surface-variant">
                  You save {formatCurrency(discountPaise)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="text-label-sm text-error hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex w-full gap-2">
            <Input
              placeholder="Enter coupon code"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              className="min-w-0 flex-1"
            />
            <Button
              variant="secondary"
              size="md"
              onClick={handleApplyCoupon}
              loading={applyingCoupon}
              disabled={!couponInput.trim()}
              className="shrink-0"
            >
              Apply
            </Button>
          </div>
        )}

        {/* Available coupons toggle */}
        {!couponCode && availableCoupons.length > 0 && (
          <button
            type="button"
            onClick={() => setShowCoupons(!showCoupons)}
            className="flex items-center gap-1 text-label-lg text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-[16px]">
              {showCoupons ? "expand_less" : "expand_more"}
            </span>
            {showCoupons ? "Hide" : "View"} available coupons
          </button>
        )}

        <AnimatePresence>
          {showCoupons && !couponCode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2 overflow-hidden"
            >
              {availableCoupons.map((coupon) => (
                <button
                  key={coupon.code}
                  type="button"
                  onClick={() => handleSelectCoupon(coupon.code)}
                  className="flex items-center justify-between rounded-lg border border-outline-variant p-3 text-left transition-colors hover:bg-surface-container"
                >
                  <div>
                    <p className="text-label-lg font-label-lg text-on-surface">
                      {coupon.code}
                    </p>
                    <p className="text-label-sm text-on-surface-variant">
                      {coupon.description ?? `${coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}% off` : `Flat ₹${coupon.discountValue / 100} off`}`}
                    </p>
                  </div>
                  <span className="text-label-sm text-primary">Tap to apply</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Price breakdown */}
      <Card variant="outlined" className="flex flex-col gap-3">
        <h3 className="text-title-md font-title-md text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">
            receipt_long
          </span>
          Price Breakdown
        </h3>

        <div className="flex flex-col gap-2">
          <PriceRow label="Base Price" amount={basePricePaise} />
          {addonsPricePaise > 0 && (
            <PriceRow label="Add-ons" amount={addonsPricePaise} />
          )}
          {snacksPricePaise > 0 && (
            <PriceRow label="Snacks & Meals" amount={snacksPricePaise} />
          )}
          <PriceRow label="Platform Fee" amount={platformFeePaise} />

          {discountPaise > 0 && (
            <PriceRow
              label="Coupon Discount"
              amount={-discountPaise}
              className="text-success"
            />
          )}
          {walletDeduction > 0 && (
            <PriceRow
              label="Wallet Balance"
              amount={-walletDeduction}
              className="text-success"
            />
          )}

          {/* Divider */}
          <div className="my-1 border-t border-dashed border-outline-variant" />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-title-lg font-title-lg text-on-surface">
              Total
            </span>
            <span className="text-title-lg font-title-lg text-primary">
              {formatCurrency(totalPaise)}
            </span>
          </div>
        </div>
      </Card>

      {/* Wallet balance toggle */}
      {walletBalance > 0 && (
        <Card variant="outlined" className="flex items-center justify-between">
          <div>
            <p className="text-title-md font-title-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">
                account_balance_wallet
              </span>
              Use Wallet Balance
            </p>
            <p className="mt-0.5 text-body-md text-on-surface-variant">
              Available: {formatCurrency(walletBalance)}
            </p>
          </div>
          <Switch
            checked={useWallet}
            onChange={(checked) => {
              setUseWallet(checked);
              if (checked) {
                setWalletAmount(Math.min(walletBalance, subtotalPaise - discountPaise));
              } else {
                setWalletAmount(0);
              }
            }}
          />
        </Card>
      )}

      {/* Bottom bar */}
      <BookingBottomBar
        step={5}
        totalSteps={6}
        onNext={handlePay}
        isLoading={paying}
        nextLabel={`Pay ${formatCurrency(totalPaise)}`}
        leftContent={
          <p className="text-body-md text-on-surface-variant">
            Almost there! Pack your bags 🎒
          </p>
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
//  PriceRow component
// ---------------------------------------------------------------------------

function PriceRow({
  label,
  amount,
  className,
}: {
  label: string;
  amount: number;
  className?: string;
}) {
  const isNegative = amount < 0;
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <span className="text-body-md text-on-surface-variant">
        {label}
      </span>
      <span
        className={cn(
          "text-body-md",
          isNegative ? "text-success" : "text-on-surface",
        )}
      >
        {isNegative ? `- ${formatCurrency(Math.abs(amount))}` : formatCurrency(amount)}
      </span>
    </div>
  );
}
