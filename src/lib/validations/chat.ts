import { z } from "zod";
import { cuidSchema } from "./common";

export const sendMessageSchema = z.object({
  tripId: cuidSchema,
  content: z.string().min(1, "Message cannot be empty").max(2000),
  type: z.enum(["TEXT", "IMAGE", "SYSTEM", "LOCATION"]).optional().default("TEXT"),
  imageUrl: z.string().url().optional(),
  replyToId: z.string().optional(),
});
