"use client";

import { create } from "zustand";

interface AuthState {
  phone: string;
  otpSent: boolean;
  isVerifying: boolean;
  setPhone: (phone: string) => void;
  setOtpSent: (sent: boolean) => void;
  setIsVerifying: (verifying: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  phone: "",
  otpSent: false,
  isVerifying: false,
  setPhone: (phone) => set({ phone }),
  setOtpSent: (otpSent) => set({ otpSent }),
  setIsVerifying: (isVerifying) => set({ isVerifying }),
  reset: () => set({ phone: "", otpSent: false, isVerifying: false }),
}));
