import { z } from "zod";

export const createTripSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().min(1),
  shortDescription: z.string().max(500).optional(),
  destination: z.string().min(1).max(200),
  origin: z.string().max(200).optional().default("Bengaluru"),
  meetingPoint: z.string().max(500).optional(),
  meetingTime: z.string().max(50).optional(),
  coverImage: z.string().min(1),
  images: z.array(z.string()).optional().default([]),
  basePricePaise: z.number().int().positive(),
  couplePricePaise: z.number().int().positive().optional(),
  groupPricePaise: z.number().int().positive().optional(),
  platformFeePaise: z.number().int().min(0).optional().default(9900),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  duration: z.number().int().positive().optional().default(1),
  maxGroupSize: z.number().int().min(1).max(100).optional().default(20),
  minGroupSize: z.number().int().min(1).optional().default(6),
  category: z.enum([
    "ADVENTURE", "CULTURAL", "BEACH", "MOUNTAIN", "WILDLIFE", "CITY",
    "ROAD_TRIP", "SPIRITUAL", "FOOD", "PHOTOGRAPHY", "WEEKEND", "INTERNATIONAL",
  ]),
  difficulty: z.enum(["EASY", "MODERATE", "CHALLENGING", "EXTREME"]).optional().default("MODERATE"),
  tags: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
  isTrending: z.boolean().optional().default(false),
  cancellationPolicy: z.enum(["FLEXIBLE", "MODERATE", "STRICT"]).optional().default("MODERATE"),
  bookingCutoffHours: z.number().int().min(0).optional().default(24),
  status: z.enum(["DRAFT", "PUBLISHED", "SOLD_OUT", "ONGOING", "COMPLETED", "CANCELLED"]).optional().default("DRAFT"),
  tripCaptainId: z.string().optional().nullable(),
  itineraryDays: z.array(z.object({
    dayNumber: z.number().int().positive(),
    title: z.string().min(1),
    description: z.string().optional(),
    activities: z.unknown().optional(),
    meals: z.array(z.string()).optional().default([]),
    accommodation: z.string().optional(),
  })).optional().default([]),
  addOnSelections: z.array(z.object({
    globalAddOnId: z.string().min(1),
    priceOverridePaise: z.number().int().min(0).nullable().optional(),
  })).optional().default([]),
  snackSelections: z.array(z.object({
    globalSnackId: z.string().min(1),
    priceOverridePaise: z.number().int().min(0).nullable().optional(),
  })).optional().default([]),
  faqs: z.array(z.object({
    question: z.string().min(1),
    answer: z.string().min(1),
    order: z.number().int().min(0).optional().default(0),
  })).optional().default([]),
  pickupPointSelections: z.array(z.object({
    pickupPointId: z.string().min(1),
  })).optional().default([]),
});

export const updateTripSchema = createTripSchema.partial();
