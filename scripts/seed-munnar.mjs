// Seed the Munnar Tea Hills trip so the landing hero's Munnar card has real
// booking data. Idempotent (upsert by id).
// Run: node --env-file=.env scripts/seed-munnar.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const day = 86400000;
const start = new Date(Date.now() + 14 * day);
const end = new Date(Date.now() + 16 * day);

const data = {
  title: "Munnar Tea Hills Getaway",
  slug: "munnar-tea-hills-getaway",
  description:
    "Rolling emerald tea gardens, cool mist and golden mornings in Kerala's highlands. Organised end-to-end by Meet My Route — transport from Bengaluru, stay, meals and guides included.",
  shortDescription: "Emerald tea hills, cool mist & golden Kerala mornings",
  destination: "Munnar, Kerala",
  origin: "Bengaluru",
  coverImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800",
  images: ["https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800"],
  category: "MOUNTAIN",
  difficulty: "EASY",
  startDate: start,
  endDate: end,
  duration: 3,
  maxGroupSize: 24,
  minGroupSize: 6,
  currentBookings: 16,
  basePricePaise: 799900,
  platformFeePaise: 9900,
  inclusions: ["Transport from Bengaluru", "Stay (2 nights)", "Meals", "Tea estate tour", "Guides"],
  exclusions: ["Personal expenses", "Travel insurance"],
  highlights: ["Tea plantation walk", "Eravikulam National Park", "Mattupetty Dam & lake", "Misty viewpoints"],
  meetingPoint: "Majestic Bus Station, Bengaluru",
  meetingTime: "6:00 AM",
  status: "PUBLISHED",
  isFeatured: true,
  isTrending: true,
  rating: 4.7,
  reviewCount: 21,
  cancellationPolicy: "MODERATE",
  tags: ["munnar", "tea", "hills", "kerala", "weekend"],
};

const trip = await prisma.trip.upsert({
  where: { id: "trip-munnar-tea" },
  update: data,
  create: { id: "trip-munnar-tea", ...data },
});
console.log(`OK  Munnar trip: ${trip.title} | currentBookings = ${trip.currentBookings}`);
await prisma.$disconnect();
