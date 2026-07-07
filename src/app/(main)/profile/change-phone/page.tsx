"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const inputCls =
  "w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-body-md text-on-surface outline-none transition-colors focus:border-primary tracking-wide";

export default function ChangePhonePage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    if (!/^\d{10}$/.test(phone)) {
      toastError("Enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error ?? "Failed to send OTP");
      }
      setDevOtp(typeof json.otp === "string" ? json.otp : null);
      setStep("otp");
      toastSuccess("OTP sent");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    if (!otp.trim()) {
      toastError("Enter the OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/users/change-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error ?? "Failed to change phone number");
      }
      toastSuccess("Phone number updated");
      router.push("/profile/settings");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to change phone number");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <Icon name="arrow_back" size={24} />
        </button>
        <h1 className="text-title-lg font-title-lg text-on-surface">Change Phone Number</h1>
      </div>

      {step === "phone" ? (
        <div className="space-y-5">
          <p className="text-body-md text-on-surface-variant">
            Enter your new phone number. We&apos;ll send a verification code to confirm it&apos;s yours.
          </p>
          <label className="block">
            <span className="mb-1.5 block text-label-md font-semibold text-on-surface">
              New phone number
            </span>
            <div className="flex items-center gap-2">
              <span className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-3 text-body-md text-on-surface-variant">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit number"
                className={inputCls}
              />
            </div>
          </label>
          <Button fullWidth loading={loading} onClick={sendOtp} disabled={phone.length !== 10}>
            Send OTP
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-body-md text-on-surface-variant">
            Enter the 6-digit code sent to <span className="font-semibold text-on-surface">+91 {phone}</span>.
          </p>
          {devOtp && (
            <div className="rounded-xl bg-primary/10 px-4 py-3 text-body-md text-primary">
              Dev mode: your OTP is <span className="font-bold tracking-widest">{devOtp}</span>
            </div>
          )}
          <label className="block">
            <span className="mb-1.5 block text-label-md font-semibold text-on-surface">
              Verification code
            </span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className={inputCls + " text-center text-title-lg tracking-[0.5em]"}
            />
          </label>
          <Button fullWidth loading={loading} onClick={verify} disabled={otp.length < 4}>
            Verify & Update
          </Button>
          <button
            type="button"
            onClick={() => { setStep("phone"); setOtp(""); setDevOtp(null); }}
            className="w-full text-center text-label-md text-on-surface-variant hover:text-primary"
          >
            Change number
          </button>
        </div>
      )}
    </div>
  );
}
