import { z } from "zod";

export const applyReferralSchema = z.object({
  code: z.string().min(1, "Referral code is required").max(20),
});
