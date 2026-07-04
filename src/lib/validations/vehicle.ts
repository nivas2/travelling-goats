import { z } from "zod";
import { cuidSchema } from "./common";

// ===== Vehicle Type Schemas =====

export const createVehicleTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  icon: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
});

export const updateVehicleTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(50).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

// ===== Seat Schema =====

const seatSchema = z.object({
  seatNumber: z.string().min(1, "Seat number is required").max(10),
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  deck: z.enum(["SINGLE", "LOWER", "UPPER"]).default("SINGLE"),
  seatType: z.enum(["PUSH_BACK", "SEMI_SLEEPER", "SLEEPER", "BERTH", "REGULAR"]).default("REGULAR"),
  category: z.enum(["WINDOW", "AISLE", "MIDDLE"]).default("WINDOW"),
  priceDeltaPaise: z.number().int().default(0),
  genderRestriction: z.enum(["NONE", "MALE_ONLY", "FEMALE_ONLY"]).default("NONE"),
  status: z.enum(["AVAILABLE", "BLOCKED", "MAINTENANCE"]).default("AVAILABLE"),
  isAccessible: z.boolean().default(false),
  isPremium: z.boolean().default(false),
  order: z.number().int().default(0),
});

// ===== Grid Cell Type =====

const gridCellTypeEnum = z.enum(["SEAT", "AISLE", "EMPTY", "DRIVER", "DOOR", "STAIRS"]);

// ===== Vehicle Template Schemas =====

export const createVehicleTemplateSchema = z.object({
  vehicleTypeId: cuidSchema,
  name: z.string().min(1, "Name is required").max(200),
  registrationNumber: z.string().max(20).optional(),
  totalRows: z.number().int().min(1).max(50),
  totalColumns: z.number().int().min(1).max(10),
  hasUpperDeck: z.boolean().default(false),
  upperDeckRows: z.number().int().min(1).max(50).optional(),
  upperDeckColumns: z.number().int().min(1).max(10).optional(),
  amenities: z.array(z.string()).default([]),
  gridLayout: z.array(z.array(gridCellTypeEnum)),
  upperGridLayout: z.array(z.array(gridCellTypeEnum)).optional(),
  seats: z.array(seatSchema).min(1, "At least one seat is required"),
});

export const updateVehicleTemplateSchema = z.object({
  vehicleTypeId: cuidSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  registrationNumber: z.string().max(20).optional().nullable(),
  totalRows: z.number().int().min(1).max(50).optional(),
  totalColumns: z.number().int().min(1).max(10).optional(),
  hasUpperDeck: z.boolean().optional(),
  upperDeckRows: z.number().int().min(1).max(50).optional().nullable(),
  upperDeckColumns: z.number().int().min(1).max(10).optional().nullable(),
  amenities: z.array(z.string()).optional(),
  gridLayout: z.array(z.array(gridCellTypeEnum)).optional(),
  upperGridLayout: z.array(z.array(gridCellTypeEnum)).optional().nullable(),
  seats: z.array(seatSchema).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).optional(),
});
