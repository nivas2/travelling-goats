import { z } from "zod";
import { cuidSchema } from "./common";

export const joinWaitlistSchema = z.object({
  tripId: cuidSchema,
});

export const respondWaitlistSchema = z.object({
  action: z.enum(["accept", "decline"]),
});
