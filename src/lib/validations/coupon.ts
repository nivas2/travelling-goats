import { z } from "zod";
import { paiseSchema } from "./common";

export const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").max(50),
  orderAmountPaise: paiseSchema,
});
