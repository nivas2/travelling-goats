// Seed Treks & Campfire experiences — Meet My Route also organises guided
// treks and overnight campfire camps. Idempotent (upsert by id).
// Run: node --env-file=.env scripts/seed-treks-campfires.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const day = 86400000;
const now = Date.now();
// A future departure `n` days out (keeps them "upcoming" on Home).
const at = (n) => new Date(now + n * day);

const TREKS = [
  {
    id: "trip-trek-kumara-parvatha",
    title: "Kumara Parvatha Night Trek",
    slug: "kumara-parvatha-night-trek",
    destination: "Kukke Subramanya, Karnataka",
    cover: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
    price: 349900,
    dur: 2,
    startIn: 12,
    difficulty: "CHALLENGING",
    maxGroup: 18,
    booked: 9,
    rating: 4.8,
    reviews: 41,
    trending: true,
    short: "One of Karnataka's toughest and most rewarding summit treks",
    highlights: ["Summit at 1,712m", "Sunrise from the peak", "Forest & grassland trail", "Night camping under stars"],
    tags: ["trek", "trekking", "summit", "camping", "weekend"],
  },
  {
    id: "trip-trek-kudremukh",
    title: "Kudremukh Peak Trek",
    slug: "kudremukh-peak-trek",
    destination: "Kudremukh, Karnataka",
    cover: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800",
    price: 299900,
    dur: 2,
    startIn: 20,
    difficulty: "MODERATE",
    maxGroup: 20,
    booked: 7,
    rating: 4.7,
    reviews: 33,
    trending: false,
    short: "Rolling shola grasslands and misty ridgelines in the Western Ghats",
    highlights: ["3rd highest peak in Karnataka", "Shola grassland trails", "Stream crossings", "Guided forest walk"],
    tags: ["trek", "trekking", "grassland", "nature", "weekend"],
  },
  {
    id: "trip-trek-skandagiri",
    title: "Skandagiri Sunrise Trek",
    slug: "skandagiri-sunrise-trek",
    destination: "Skandagiri, Karnataka",
    cover: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
    price: 149900,
    dur: 1,
    startIn: 8,
    difficulty: "EASY",
    maxGroup: 25,
    booked: 14,
    rating: 4.6,
    reviews: 58,
    trending: true,
    short: "A beginner-friendly pre-dawn climb to a sea of clouds",
    highlights: ["Above-the-clouds sunrise", "Beginner friendly", "Night ascent with guides", "Ruined hilltop fort"],
    tags: ["trek", "trekking", "sunrise", "beginner", "weekend"],
  },
];

const CAMPFIRES = [
  {
    id: "trip-campfire-bheemeshwari",
    title: "Riverside Campfire & Stargazing",
    slug: "riverside-campfire-stargazing",
    destination: "Bheemeshwari, Karnataka",
    cover: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800",
    price: 249900,
    dur: 2,
    startIn: 10,
    difficulty: "EASY",
    maxGroup: 30,
    booked: 18,
    rating: 4.9,
    reviews: 62,
    trending: true,
    short: "Riverside tents, a crackling bonfire, music and a canopy of stars",
    highlights: ["Riverside bonfire & music", "Stargazing session", "BBQ dinner", "Kayaking & coracle ride"],
    tags: ["campfire", "camping", "bonfire", "stargazing", "weekend"],
  },
  {
    id: "trip-campfire-coorg",
    title: "Coorg Coffee Estate Campfire",
    slug: "coorg-coffee-estate-campfire",
    destination: "Coorg, Karnataka",
    cover: "https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b?w=800",
    price: 329900,
    dur: 2,
    startIn: 16,
    difficulty: "EASY",
    maxGroup: 24,
    booked: 11,
    rating: 4.8,
    reviews: 37,
    trending: false,
    short: "Overnight camp inside a coffee estate with a bonfire and live music",
    highlights: ["Bonfire with live acoustic music", "Coffee estate walk", "Tent stay under the stars", "Kodava feast dinner"],
    tags: ["campfire", "camping", "bonfire", "coffee", "weekend"],
  },
  {
    id: "trip-campfire-sakleshpur",
    title: "Sakleshpur Lakeside Camp",
    slug: "sakleshpur-lakeside-camp",
    destination: "Sakleshpur, Karnataka",
    cover: "https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=800",
    price: 279900,
    dur: 2,
    startIn: 24,
    difficulty: "EASY",
    maxGroup: 28,
    booked: 6,
    rating: 4.7,
    reviews: 29,
    trending: false,
    short: "Lakeside tents, campfire games and a misty Malnad morning",
    highlights: ["Lakeside campfire & games", "Barbecue dinner", "Sunrise by the lake", "Short nature walk"],
    tags: ["campfire", "camping", "bonfire", "lake", "weekend"],
  },
];

function toData(t, category) {
  const start = at(t.startIn);
  const end = at(t.startIn + t.dur - 1);
  return {
    title: t.title,
    slug: t.slug,
    description: `${t.short}. Organised end-to-end by Meet My Route — transport from Bengaluru, camping gear, meals and certified guides included. Just pack your bag and show up.`,
    shortDescription: t.short,
    destination: t.destination,
    origin: "Bengaluru",
    coverImage: t.cover,
    images: [t.cover],
    category,
    difficulty: t.difficulty,
    startDate: start,
    endDate: end,
    duration: t.dur,
    maxGroupSize: t.maxGroup,
    minGroupSize: 6,
    currentBookings: t.booked,
    basePricePaise: t.price,
    platformFeePaise: 9900,
    inclusions: ["Transport from Bengaluru", "Camping gear / stay", "Meals", "Certified guides", "First-aid support"],
    exclusions: ["Personal expenses", "Travel insurance"],
    highlights: t.highlights,
    meetingPoint: "Majestic Bus Station, Bengaluru",
    meetingTime: "6:00 AM",
    status: "PUBLISHED",
    isFeatured: t.trending,
    isTrending: t.trending,
    rating: t.rating,
    reviewCount: t.reviews,
    cancellationPolicy: "MODERATE",
    tags: t.tags,
  };
}

async function upsert(list, category) {
  for (const t of list) {
    const data = toData(t, category);
    await prisma.trip.upsert({
      where: { id: t.id },
      update: data,
      create: { id: t.id, ...data },
    });
    console.log(`OK  ${category.padEnd(8)} ${t.title}`);
  }
}

await upsert(TREKS, "TREK");
await upsert(CAMPFIRES, "CAMPFIRE");
console.log(`\nDone — ${TREKS.length} treks + ${CAMPFIRES.length} campfires seeded.`);
await prisma.$disconnect();
