import { z } from "zod";
import { phoneSchema } from "./common";

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});
