import { z } from "zod";
import { cuidSchema } from "./common";

export const createPaymentSchema = z.object({
  bookingId: cuidSchema,
  useWallet: z.boolean().optional().default(false),
  walletAmountPaise: z.number().int().min(0).optional().default(0),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, "Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
  bookingId: cuidSchema,
});
