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
