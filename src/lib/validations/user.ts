import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  avatar: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"]).optional(),
  bio: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  interests: z.array(z.string()).max(20).optional(),
  budgetPreference: z.enum(["BUDGET", "MID_RANGE", "PREMIUM", "LUXURY"]).optional(),
  pickupCity: z.string().max(100).optional(),
  isOnboarded: z.boolean().optional(),
  aadhaarNumber: z.string().optional(),
  selfieUrl: z.string().optional(),
  idVerified: z.boolean().optional(),
});
