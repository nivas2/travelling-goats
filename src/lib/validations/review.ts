import { z } from "zod";
import { cuidSchema } from "./common";

export const createReviewSchema = z.object({
  tripId: cuidSchema,
  overallRating: z.number().min(1).max(5),
  safetyRating: z.number().min(1).max(5).optional(),
  valueRating: z.number().min(1).max(5).optional(),
  funRating: z.number().min(1).max(5).optional(),
  comment: z.string().max(2000).optional(),
  images: z.array(z.string().url()).max(10).optional(),
});
