"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { maskPhone } from "@/lib/utils";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function OtpPage() {
  const router = useRouter();
  const { phone, setIsVerifying } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect to login if no phone stored
  useEffect(() => {
    if (!phone) {
      router.replace("/login");
    }
  }, [phone, router]);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;

      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setError("");

      // Auto-focus next box
      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (pasted.length === 0) return;

    const newOtp = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    setError("");

    // Focus the next empty box or the last one
    const nextEmpty = newOtp.findIndex((v) => !v);
    const focusIdx = nextEmpty === -1 ? OTP_LENGTH - 1 : nextEmpty;
    inputRefs.current[focusIdx]?.focus();
  }, []);

  const otpValue = otp.join("");
  const isComplete = otpValue.length === OTP_LENGTH;

  async function handleVerify() {
    if (!isComplete) return;

    setLoading(true);
    setIsVerifying(true);
    setError("");

    try {
      const result = await signIn("phone-otp", {
        phone,
        otp: otpValue,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid OTP. Please try again.");
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }

      // Check if user is new or returning
      const userRes = await fetch("/api/users");
      const userData = await userRes.json();

      if (userData.success && userData.data) {
        if (userData.data.isOnboarded) {
          router.push("/home");
        } else {
          router.push("/welcome");
        }
      } else {
        router.push("/welcome");
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (!canResend) return;

    setCanResend(false);
    setResendTimer(RESEND_SECONDS);
    setOtp(Array(OTP_LENGTH).fill(""));
    setError("");

    try {
      await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      inputRefs.current[0]?.focus();
    } catch {
      setError("Failed to resend OTP.");
    }
  }

  const formattedTimer = `${String(Math.floor(resendTimer / 60)).padStart(2, "0")}:${String(resendTimer % 60).padStart(2, "0")}`;

  if (!phone) return null;

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5">
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary-container/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-secondary-container/20 blur-3xl"
        aria-hidden="true"
      />

      <GlassCard className="w-full max-w-md space-y-6 p-6 md:max-w-xl md:p-8">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-body-md text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <Icon name="arrow_back" size={20} />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed">
            <Icon name="sms" size={28} className="text-primary" />
          </div>
          <h1 className="text-headline-md font-headline-md text-on-surface">
            Verify OTP
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold text-on-surface">
              +91 {maskPhone(phone)}
            </span>
          </p>
        </div>

        {/* OTP Input Boxes */}
        <div className="flex justify-center gap-2.5">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className={cn(
                "h-13 w-11 rounded-xl border-2 bg-surface-container-low text-center text-title-lg font-semibold text-on-surface",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                digit
                  ? "border-primary bg-primary-fixed/10"
                  : "border-outline-variant",
                error && "border-error focus:ring-error"
              )}
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-center text-label-sm text-error" role="alert">
            {error}
          </p>
        )}

        {/* Resend Timer */}
        <div className="text-center">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-body-md font-semibold text-primary transition-colors hover:text-primary-container"
            >
              Resend OTP
            </button>
          ) : (
            <p className="text-body-md text-on-surface-variant">
              Resend OTP in{" "}
              <span className="font-semibold text-on-surface">
                {formattedTimer}
              </span>
            </p>
          )}
        </div>

        {/* Verify Button */}
        <Button
          type="button"
          fullWidth
          size="lg"
          loading={loading}
          disabled={!isComplete}
          onClick={handleVerify}
          className="rounded-full"
        >
          Verify
        </Button>
      </GlassCard>
    </div>
  );
}
