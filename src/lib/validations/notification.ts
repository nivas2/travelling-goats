import { z } from "zod";

export const markNotificationSchema = z.object({
  id: z.string().optional(),
  markAll: z.boolean().optional(),
}).refine(
  (data) => data.id || data.markAll,
  { message: "Either id or markAll must be provided" }
);
