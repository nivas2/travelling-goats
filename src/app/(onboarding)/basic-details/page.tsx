"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { useInlineOtp } from "@/hooks/use-inline-otp";
import type { UserProfile } from "@/types";

export default function BasicDetailsPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [verified, setVerified] = useState(false);

  // Determine which channel is missing after user loads
  const needsPhone = !!user && !user.phone;
  const needsEmail = !!user && !user.email;

  const phoneOtp = useInlineOtp("phone");
  const emailOtp = useInlineOtp("email");

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to load profile");
      const json = await res.json();
      const userData: UserProfile = json.data ?? json;
      setUser(userData);
      setName(userData.name ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handlePhoneVerify = async () => {
    const ok = await phoneOtp.verify();
    if (ok) {
      toastSuccess("Phone number verified");
      setVerified(true);
      phoneOtp.reset();
    }
  };

  const handleEmailVerify = async () => {
    const ok = await emailOtp.verify();
    if (ok) {
      toastSuccess("Email verified");
      setVerified(true);
      emailOtp.reset();
    }
  };

  const handleContinue = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
      router.push("/interests");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.push("/interests");
  };

  // Loading state
  if (loading) {
    return (
      <div className="px-6 py-6 space-y-6">
        <Skeleton variant="card" height={56} />
        <Skeleton variant="card" height={56} />
        <Skeleton variant="card" height={56} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6">
        <EmptyState
          icon="error"
          title="Could not load profile"
          description={error}
          action={{ label: "Retry", onClick: fetchUser }}
        />
      </div>
    );
  }

  const canContinue = name.trim().length >= 2 && verified;

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="px-6 pt-safe">
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => router.push("/welcome")}
            className="flex items-center gap-1 text-body-md text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <Icon name="arrow_back" size={20} />
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="text-label-lg font-semibold text-on-surface-variant transition-colors hover:text-primary"
          >
            Skip
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-6 pt-6">
        <div className="mb-6">
          <h1 className="text-headline-md font-headline-md text-on-surface">
            Complete your profile
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Add your basic details so fellow travellers can reach you
          </p>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <Input
            label="Full Name"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Phone — shown for Google users (missing phone) */}
          {needsPhone && (
            <div className="flex flex-col gap-1.5">
              <label className="text-label-lg font-semibold text-on-surface">
                Phone Number
              </label>

              {verified && !phoneOtp.editMode ? (
                <div className="flex items-center gap-2 h-12 rounded-xl bg-success-container/30 border border-success/30 px-4">
                  <Icon name="check_circle" size={20} className="text-success" />
                  <span className="text-body-lg text-on-surface">Phone verified</span>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-outline-variant p-4 bg-surface-container-lowest">
                  <div className="flex gap-2">
                    <Input
                      placeholder="10-digit phone"
                      countryCode="+91"
                      value={phoneOtp.value}
                      onChange={(e) => phoneOtp.setValue(e.target.value)}
                      disabled={phoneOtp.otpSent}
                      fullWidth
                    />
                    {!phoneOtp.otpSent && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={phoneOtp.sendOtp}
                        loading={phoneOtp.sending}
                        disabled={!/^[6-9]\d{9}$/.test(phoneOtp.value)}
                      >
                        Send OTP
                      </Button>
                    )}
                  </div>

                  {phoneOtp.otpSent && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter OTP"
                        value={phoneOtp.otp}
                        onChange={(e) => phoneOtp.setOtp(e.target.value)}
                        maxLength={6}
                        fullWidth
                      />
                      <Button
                        type="button"
                        onClick={handlePhoneVerify}
                        loading={phoneOtp.verifying}
                        disabled={phoneOtp.otp.length !== 6}
                      >
                        Verify
                      </Button>
                    </div>
                  )}

                  {phoneOtp.error && (
                    <p className="text-label-sm text-error">{phoneOtp.error}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Email — shown for phone users (missing email) */}
          {needsEmail && (
            <div className="flex flex-col gap-1.5">
              <label className="text-label-lg font-semibold text-on-surface">
                Email
              </label>

              {verified && !emailOtp.editMode ? (
                <div className="flex items-center gap-2 h-12 rounded-xl bg-success-container/30 border border-success/30 px-4">
                  <Icon name="check_circle" size={20} className="text-success" />
                  <span className="text-body-lg text-on-surface">Email verified</span>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-outline-variant p-4 bg-surface-container-lowest">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={emailOtp.value}
                      onChange={(e) => emailOtp.setValue(e.target.value)}
                      disabled={emailOtp.otpSent}
                      fullWidth
                    />
                    {!emailOtp.otpSent && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={emailOtp.sendOtp}
                        loading={emailOtp.sending}
                        disabled={
                          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOtp.value)
                        }
                      >
                        Send OTP
                      </Button>
                    )}
                  </div>

                  {emailOtp.otpSent && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter OTP"
                        value={emailOtp.otp}
                        onChange={(e) => emailOtp.setOtp(e.target.value)}
                        maxLength={6}
                        fullWidth
                      />
                      <Button
                        type="button"
                        onClick={handleEmailVerify}
                        loading={emailOtp.verifying}
                        disabled={emailOtp.otp.length !== 6}
                      >
                        Verify
                      </Button>
                    </div>
                  )}

                  {emailOtp.error && (
                    <p className="text-label-sm text-error">{emailOtp.error}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom action */}
      <div className="px-6 pb-8 pb-safe pt-4">
        <Button
          type="button"
          fullWidth
          size="lg"
          loading={saving}
          disabled={!canContinue}
          onClick={handleContinue}
          className="rounded-full"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
