// Generate a day-by-day itinerary for every published trip that lacks one.
// Idempotent (rebuilds itinerary for trips we generate for).
// Run: node --env-file=.env scripts/seed-itineraries.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const firstName = (dest) => dest.split(",")[0].trim();

function buildDays(trip) {
  const place = firstName(trip.destination);
  const n = Math.max(1, trip.duration);
  const days = [];
  for (let d = 1; d <= n; d++) {
    if (d === 1) {
      days.push({
        dayNumber: 1,
        title: `Arrival in ${place}`,
        description: `Kick off your ${place} adventure — meet your crew and settle in.`,
        activities: [
          { time: "09:00 AM", title: `Pickup from ${trip.origin}` },
          { time: "01:00 PM", title: "Check-in & freshen up" },
          { time: "05:00 PM", title: "Neighbourhood walk & orientation" },
          { time: "07:30 PM", title: "Welcome dinner and trip briefing" },
        ],
        meals: ["Lunch", "Dinner"],
        accommodation: `Handpicked stay in ${place}`,
      });
    } else if (d === n) {
      days.push({
        dayNumber: d,
        title: "Departure & farewell",
        description: "Soak in the last views, grab souvenirs and head home with a full heart.",
        activities: [
          { time: "08:00 AM", title: "Sunrise views & breakfast" },
          { time: "10:00 AM", title: "Check-out & local souvenir stop" },
          { time: "12:00 PM", title: `Drop-off / return to ${trip.origin}` },
        ],
        meals: ["Breakfast"],
        accommodation: null,
      });
    } else {
      days.push({
        dayNumber: d,
        title: `Day ${d}: Exploring ${place}`,
        description: `A full day of the very best of ${place} — sights, food and stories.`,
        activities: [
          { time: "07:30 AM", title: "Sunrise point & morning chai" },
          { time: "10:00 AM", title: "Guided sightseeing & activities" },
          { time: "02:00 PM", title: "Local cuisine tasting" },
          { time: "06:30 PM", title: "Bonfire, music & group games" },
        ],
        meals: ["Breakfast", "Lunch", "Dinner"],
        accommodation: `Handpicked stay in ${place}`,
      });
    }
  }
  return days;
}

const trips = await prisma.trip.findMany({
  where: { status: "PUBLISHED" },
  select: { id: true, destination: true, origin: true, duration: true, _count: { select: { itineraryDays: true } } },
});

let done = 0;
for (const t of trips) {
  if (t._count.itineraryDays > 0) {
    console.log(`skip  ${firstName(t.destination)} (has ${t._count.itineraryDays} days)`);
    continue;
  }
  const days = buildDays(t);
  await prisma.itineraryDay.createMany({ data: days.map((d) => ({ tripId: t.id, ...d })) });
  done++;
  console.log(`OK    ${firstName(t.destination).padEnd(16)} ${days.length} days`);
}
console.log(`\nGenerated itineraries for ${done} trips.`);
await prisma.$disconnect();
