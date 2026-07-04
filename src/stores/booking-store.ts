"use client";

import { create } from "zustand";
import type { TravelerInfo, BookingSummary } from "@/types";

interface BookingState {
  currentStep: number;
  tripId: string | null;
  bookingType: "SOLO" | "COUPLE" | "GROUP";
  travelerCount: number;
  travelers: TravelerInfo[];
  seatPreference: string | null;
  specialRequests: string | null;
  pickupPoint: string | null;
  selectedAddOns: Record<string, number>;
  selectedSnacks: Record<string, number>;
  couponCode: string | null;
  couponDiscount: number;
  useWallet: boolean;
  walletAmount: number;
  summary: BookingSummary | null;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setTripId: (tripId: string) => void;
  setBookingType: (type: "SOLO" | "COUPLE" | "GROUP") => void;
  setTravelerCount: (count: number) => void;
  setTravelers: (travelers: TravelerInfo[]) => void;
  updateTraveler: (index: number, info: Partial<TravelerInfo>) => void;
  setSeatPreference: (pref: string | null) => void;
  setSpecialRequests: (req: string | null) => void;
  setPickupPoint: (point: string | null) => void;
  toggleAddOn: (addOnId: string, quantity: number) => void;
  toggleSnack: (snackId: string, quantity: number) => void;
  setCoupon: (code: string | null, discount: number) => void;
  setUseWallet: (use: boolean) => void;
  setWalletAmount: (amount: number) => void;
  setSummary: (summary: BookingSummary) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 1,
  tripId: null as string | null,
  bookingType: "SOLO" as const,
  travelerCount: 1,
  travelers: [] as TravelerInfo[],
  seatPreference: null as string | null,
  specialRequests: null as string | null,
  pickupPoint: null as string | null,
  selectedAddOns: {} as Record<string, number>,
  selectedSnacks: {} as Record<string, number>,
  couponCode: null as string | null,
  couponDiscount: 0,
  useWallet: false,
  walletAmount: 0,
  summary: null as BookingSummary | null,
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 6) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
  setTripId: (tripId) => set({ tripId }),
  setBookingType: (bookingType) => {
    const travelerCount = bookingType === "COUPLE" ? 2 : bookingType === "GROUP" ? 4 : 1;
    set({ bookingType, travelerCount });
  },
  setTravelerCount: (travelerCount) => set({ travelerCount }),
  setTravelers: (travelers) => set({ travelers }),
  updateTraveler: (index, info) =>
    set((s) => {
      const travelers = [...s.travelers];
      travelers[index] = { ...travelers[index], ...info };
      return { travelers };
    }),
  setSeatPreference: (seatPreference) => set({ seatPreference }),
  setSpecialRequests: (specialRequests) => set({ specialRequests }),
  setPickupPoint: (pickupPoint) => set({ pickupPoint }),
  toggleAddOn: (addOnId, quantity) =>
    set((s) => {
      const addOns = { ...s.selectedAddOns };
      if (quantity <= 0) {
        delete addOns[addOnId];
      } else {
        addOns[addOnId] = quantity;
      }
      return { selectedAddOns: addOns };
    }),
  toggleSnack: (snackId, quantity) =>
    set((s) => {
      const snacks = { ...s.selectedSnacks };
      if (quantity <= 0) {
        delete snacks[snackId];
      } else {
        snacks[snackId] = quantity;
      }
      return { selectedSnacks: snacks };
    }),
  setCoupon: (code, discount) => set({ couponCode: code, couponDiscount: discount }),
  setUseWallet: (useWallet) => set({ useWallet }),
  setWalletAmount: (walletAmount) => set({ walletAmount }),
  setSummary: (summary) => set({ summary }),
  reset: () => set(initialState),
}));
