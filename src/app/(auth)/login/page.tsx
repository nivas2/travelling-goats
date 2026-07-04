"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const { phone, setPhone, setOtpSent } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidPhone = /^[6-9]\d{9}$/.test(phone);

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    if (!isValidPhone) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to send OTP");
        return;
      }

      setOtpSent(true);
      router.push("/otp");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    await signIn("google", { callbackUrl: "/welcome" });
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5">
      {/* Decorative background blobs */}
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary-container/30 blur-3xl md:h-96 md:w-96"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-secondary-container/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-primary-fixed/20 blur-3xl"
        aria-hidden="true"
      />

      {/* Logo */}
      <div className="animate-float mb-8 flex flex-col items-center gap-2">
        <h1 className="text-headline-lg font-headline-lg text-on-surface md:text-display md:font-display">
          Meet<span className="text-primary">MyRoute</span>
        </h1>
        <p className="text-body-md text-on-surface-variant text-center">
          Travel with your tribe
        </p>
      </div>

      {/* Login Card */}
      <GlassCard className="w-full max-w-md space-y-6 p-6 md:max-w-xl md:p-8">
        <div className="text-center">
          <h2 className="text-title-lg font-title-lg text-on-surface md:text-headline-md md:font-headline-md">
            Welcome back
          </h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Enter your phone number to continue
          </p>
        </div>

        <form onSubmit={handleSendOtp} className="space-y-4">
          <Input
            label="Phone Number"
            countryCode="+91"
            type="tel"
            inputMode="numeric"
            placeholder="9876543210"
            maxLength={10}
            value={phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setPhone(val);
              if (error) setError("");
            }}
            error={error}
            fullWidth
            inputSize="lg"
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            disabled={!isValidPhone}
            className="rounded-full"
          >
            Send OTP
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-outline-variant" />
          <span className="text-label-sm text-on-surface-variant">
            or continue with
          </span>
          <div className="h-px flex-1 bg-outline-variant" />
        </div>

        {/* Social Login */}
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth
            onClick={handleGoogleLogin}
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
                  fill="#EA4335"
                />
              </svg>
            }
          >
            Continue with Google
          </Button>
        </div>
      </GlassCard>

      {/* Terms Footer */}
      <p className="mt-6 max-w-md text-center text-label-sm text-on-surface-variant">
        By continuing, you agree to our{" "}
        <button
          type="button"
          className="font-semibold text-primary underline-offset-2 hover:underline"
        >
          Terms of Service
        </button>{" "}
        &{" "}
        <button
          type="button"
          className="font-semibold text-primary underline-offset-2 hover:underline"
        >
          Privacy Policy
        </button>
      </p>
    </div>
  );
}
