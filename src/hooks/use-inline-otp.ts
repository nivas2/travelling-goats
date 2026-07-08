"use client";

import { useState } from "react";

export function useInlineOtp(channel: "phone" | "email") {
  const [editMode, setEditMode] = useState(false);
  const [value, setValue] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEditMode(false);
    setValue("");
    setOtp("");
    setOtpSent(false);
    setSending(false);
    setVerifying(false);
    setError(null);
  };

  const sendOtp = async () => {
    setError(null);
    setSending(true);
    try {
      const body = channel === "phone" ? { phone: value } : { email: value };
      const res = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send OTP");
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const verify = async (): Promise<boolean> => {
    setError(null);
    setVerifying(true);
    try {
      const url =
        channel === "phone"
          ? "/api/users/change-phone"
          : "/api/users/change-email";
      const body =
        channel === "phone"
          ? { phone: value, otp }
          : { email: value, otp };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Verification failed");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      return false;
    } finally {
      setVerifying(false);
    }
  };

  return {
    editMode,
    setEditMode,
    value,
    setValue,
    otp,
    setOtp,
    otpSent,
    sending,
    verifying,
    error,
    sendOtp,
    verify,
    reset,
  };
}
