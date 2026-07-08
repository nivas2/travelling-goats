import { z } from "zod";
import { paiseSchema } from "./common";

export const walletTransactionSchema = z
  .object({
    amountPaise: paiseSchema,
    type: z.enum([
      "CREDIT",
      "DEBIT",
      "REFUND",
      "REWARD",
      "REFERRAL",
      "GIFT",
      "TRANSFER_IN",
      "TRANSFER_OUT",
      "AUTO_SAVE",
      "TOPUP",
      "ADMIN_CREDIT",
      "ADMIN_DEBIT",
    ]),
    description: z.string().max(200).optional(),
    recipientId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "TRANSFER_OUT" && !data.recipientId) return false;
      return true;
    },
    { message: "recipientId is required for transfers", path: ["recipientId"] }
  );

// ---------------------------------------------------------------------------
// Wallet top-up schemas
// ---------------------------------------------------------------------------

export const walletTopupCreateSchema = z.object({
  amountPaise: paiseSchema,
});

export const walletTopupVerifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Admin wallet action schema
// ---------------------------------------------------------------------------

export const adminWalletActionSchema = z
  .object({
    action: z.enum(["credit", "debit", "freeze", "unfreeze", "refund"]),
    amountPaise: paiseSchema.optional(),
    reason: z.string().min(1, "Reason is required").max(500),
  })
  .refine(
    (data) => {
      if (["credit", "debit", "refund"].includes(data.action) && !data.amountPaise) {
        return false;
      }
      return true;
    },
    {
      message: "Amount is required for credit, debit, and refund actions",
      path: ["amountPaise"],
    }
  );
