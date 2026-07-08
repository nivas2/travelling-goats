import { z } from "zod";
import { cuidSchema } from "./common";

export const createBookingSchema = z.object({
  tripId: cuidSchema,
  bookingType: z.enum(["SOLO", "COUPLE", "GROUP"]),
  travelerCount: z.number().int().min(1).max(20),
  travelers: z
    .array(
      z.object({
        name: z.string().min(1),
        age: z.number().int().min(1).max(120).optional(),
        gender: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  seatPreference: z.string().optional(),
  seatIds: z.array(z.string()).optional(),
  sessionId: z.string().optional(),
  contactEmail: z.preprocess((v) => (v === "" ? undefined : v), z.string().email().optional().nullable()),
  contactPhone: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional().nullable()),
  specialRequests: z.string().max(500).optional(),
  pickupPoint: z.string().optional(),
  addOns: z
    .array(
      z.object({
        addOnId: cuidSchema,
        quantity: z.number().int().min(1).max(10),
      })
    )
    .optional(),
  snacks: z
    .array(
      z.object({
        snackId: cuidSchema,
        quantity: z.number().int().min(1).max(10),
      })
    )
    .optional(),
  couponCode: z.string().optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(500),
});
