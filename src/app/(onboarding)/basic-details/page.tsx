"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { useInlineOtp } from "@/hooks/use-inline-otp";
import type { UserProfile } from "@/types";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

// Field-level validation rules — all must pass before the profile can be saved.
function validateFields(v: {
  name: string;
  age: string;
  gender: string;
  whatsapp: string;
}) {
  const errors: { name?: string; age?: string; gender?: string; whatsapp?: string } = {};
  if (v.name.trim().length < 2) errors.name = "Please enter your full name";
  const ageNum = Number(v.age);
  if (!v.age.trim()) errors.age = "Age is required";
  else if (!Number.isInteger(ageNum) || ageNum < 5 || ageNum > 100)
    errors.age = "Enter a valid age (5–100)";
  if (!v.gender) errors.gender = "Please select your gender";
  if (!v.whatsapp.trim()) errors.whatsapp = "WhatsApp number is required";
  else if (!/^[6-9]\d{9}$/.test(v.whatsapp.trim()))
    errors.whatsapp = "Enter a valid 10-digit number";
  return errors;
}

export default function BasicDetailsPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    age?: string;
    gender?: string;
    whatsapp?: string;
    email?: string;
  }>({});
  const [email, setEmail] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");

  // Determine which channel is missing after user loads
  const needsPhone = !!user && !user.phone;
  const needsEmail = !!user && !user.email;

  const phoneOtp = useInlineOtp("phone");

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
      if (userData.dateOfBirth) {
        const yrs = new Date().getFullYear() - new Date(userData.dateOfBirth).getFullYear();
        if (yrs > 0 && yrs < 120) setAge(String(yrs));
      }
      setGender(userData.gender ?? "");
      setWhatsapp(userData.whatsappNumber ?? "");
      setEmail(userData.email ?? "");
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
      setVerifiedPhone(phoneOtp.value);
      setPhoneVerified(true);
      phoneOtp.reset();
    }
  };


  const ageNum = Number(age);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleContinue = async () => {
    const errs: typeof fieldErrors = validateFields({ name, age, gender, whatsapp });
    if (needsEmail && !emailValid) errs.email = "Enter a valid email";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      // No dedicated age column — store an approximate DOB (year of birth).
      const dateOfBirth = new Date(new Date().getFullYear() - ageNum, 0, 1).toISOString();
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          dateOfBirth,
          gender,
          whatsappNumber: whatsapp.trim(),
          ...(phoneVerified && verifiedPhone ? { phone: verifiedPhone } : {}),
          ...(needsEmail && emailValid ? { email: email.trim() } : {}),
        }),
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

  const canContinue =
    Object.keys(validateFields({ name, age, gender, whatsapp })).length === 0 &&
    (!needsPhone || phoneVerified) &&
    (!needsEmail || emailValid);

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
            error={fieldErrors.name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
            }}
          />

          {/* Age */}
          <Input
            label="Age"
            type="number"
            inputMode="numeric"
            placeholder="Your age"
            value={age}
            error={fieldErrors.age}
            onChange={(e) => {
              setAge(e.target.value);
              if (fieldErrors.age) setFieldErrors((p) => ({ ...p, age: undefined }));
            }}
          />

          {/* Gender */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-lg font-semibold text-on-surface">
              Gender
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setGender(opt.value);
                    if (fieldErrors.gender) setFieldErrors((p) => ({ ...p, gender: undefined }));
                  }}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-xl border px-2 text-center text-label-lg font-medium transition-all",
                    opt.value === "PREFER_NOT_TO_SAY" && "col-span-2",
                    gender === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-outline-variant bg-surface-container-lowest text-on-surface-variant"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {fieldErrors.gender && (
              <p className="text-label-sm text-error">{fieldErrors.gender}</p>
            )}
          </div>

          {/* WhatsApp — required */}
          <Input
            label="WhatsApp Number"
            type="tel"
            countryCode="+91"
            inputMode="numeric"
            maxLength={10}
            placeholder="WhatsApp number"
            value={whatsapp}
            error={fieldErrors.whatsapp}
            onChange={(e) => {
              setWhatsapp(e.target.value);
              if (fieldErrors.whatsapp) setFieldErrors((p) => ({ ...p, whatsapp: undefined }));
            }}
          />

          {/* Phone — shown for Google users (missing phone) */}
          {needsPhone && (
            <div className="flex flex-col gap-1.5">
              <label className="text-label-lg font-semibold text-on-surface">
                Phone Number
              </label>

              {phoneVerified && !phoneOtp.editMode ? (
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

          {/* Email — plain field (no OTP needed) for users missing an email */}
          {needsEmail && (
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              error={fieldErrors.email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
              }}
            />
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
