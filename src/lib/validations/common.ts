import { z } from "zod";

export const cuidSchema = z.string().min(1, "ID is required");

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number");

export const paiseSchema = z
  .number()
  .int("Amount must be a whole number")
  .positive("Amount must be positive");

export const positiveIntSchema = z
  .number()
  .int()
  .positive();
