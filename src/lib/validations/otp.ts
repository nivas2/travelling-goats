import { z } from "zod";
import { phoneSchema } from "./common";

export const sendOtpSchema = z
  .object({
    phone: phoneSchema.optional(),
    email: z.string().email("Invalid email address").optional(),
  })
  .refine((data) => Boolean(data.phone) !== Boolean(data.email), {
    message: "Provide either phone or email, not both",
  });
