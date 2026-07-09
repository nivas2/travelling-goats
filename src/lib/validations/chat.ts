import { z } from "zod";
import { cuidSchema } from "./common";

export const sendMessageSchema = z.object({
  tripId: cuidSchema,
  content: z.string().min(1, "Message cannot be empty").max(2000),
  type: z.enum(["TEXT", "IMAGE", "SYSTEM", "LOCATION"]).optional().default("TEXT"),
  // The client sends `null` (not `undefined`) when there is no image / no reply,
  // so these must accept null as well as being optional.
  imageUrl: z.string().url().optional().nullable(),
  replyToId: z.string().optional().nullable(),
});

export const editMessageSchema = z.object({
  messageId: cuidSchema,
  content: z.string().min(1, "Message cannot be empty").max(2000),
});

export const moderateMessageSchema = z.object({
  messageId: cuidSchema,
  action: z.enum(["delete", "pin", "unpin"]),
});

export const sendAnnouncementSchema = z.object({
  tripId: cuidSchema,
  content: z.string().min(1, "Announcement cannot be empty").max(2000),
});
