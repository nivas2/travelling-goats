"use client";

import { create } from "zustand";

interface AuthState {
  phone: string;
  otpSent: boolean;
  isVerifying: boolean;
  referralCode: string;
  setPhone: (phone: string) => void;
  setOtpSent: (sent: boolean) => void;
  setIsVerifying: (verifying: boolean) => void;
  setReferralCode: (code: string) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  phone: "",
  otpSent: false,
  isVerifying: false,
  referralCode: "",
  setPhone: (phone) => set({ phone }),
  setOtpSent: (otpSent) => set({ otpSent }),
  setIsVerifying: (isVerifying) => set({ isVerifying }),
  setReferralCode: (referralCode) => set({ referralCode }),
  reset: () => set({ phone: "", otpSent: false, isVerifying: false, referralCode: "" }),
}));
