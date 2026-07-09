// Dummy trips so every home category chip returns results (+ Treks section).
// Idempotent (upsert by slug). Run: node --env-file=.env scripts/seed-category-trips.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const u = (id) => `https://images.unsplash.com/${id}?w=1200&q=80&auto=format&fit=crop`;
const now = new Date();
const day = 86400000;

const TRIPS = [
  { slug: "rishikesh-river-rafting", title: "Rishikesh River Rafting", destination: "Rishikesh, Uttarakhand", category: "ADVENTURE", img: "photo-1598610882061-bb806386c5fb", price: 649900, dur: 2, trend: true,
    desc: "Ride the roaring Ganga rapids, cliff-jump, and camp riverside on this adrenaline-packed weekend." },
  { slug: "spiti-valley-trek", title: "Spiti Valley Himalayan Trek", destination: "Spiti, Himachal Pradesh", category: "ADVENTURE", img: "photo-1497267049703-01d7eb538c99", price: 1899900, dur: 7,
    desc: "High-altitude trekking through moonscapes, ancient monasteries and starlit cold-desert nights." },
  { slug: "ladakh-bike-expedition", title: "Ladakh Bike Expedition", destination: "Pangong, Ladakh", category: "ROAD_TRIP", img: "photo-1536295243470-d7cba4efab7b", price: 2499900, dur: 8, trend: true,
    desc: "The ultimate Royal Enfield ride over the world's highest passes to the blue of Pangong Tso." },
  { slug: "konkan-coastal-drive", title: "Konkan Coastal Road Trip", destination: "Konkan Coast, Maharashtra", category: "ROAD_TRIP", img: "photo-1582574533496-eebcb12d8500", price: 1099900, dur: 4,
    desc: "Hug the Arabian Sea past hidden beaches, forts and the freshest coastal thalis you'll ever eat." },
  { slug: "varanasi-ganga-aarti", title: "Varanasi Ganga Aarti", destination: "Varanasi, Uttar Pradesh", category: "SPIRITUAL", img: "photo-1557841595-f8d620ddf0e0", price: 899900, dur: 3, trend: true,
    desc: "Sunrise boat rides, ancient ghats and the mesmerising evening Ganga Aarti in the world's oldest city." },
  { slug: "rishikesh-yoga-retreat", title: "Rishikesh Yoga Retreat", destination: "Rishikesh, Uttarakhand", category: "SPIRITUAL", img: "photo-1598610882061-bb806386c5fb", price: 799900, dur: 4,
    desc: "Reset by the Ganga with daily yoga, meditation, sound-healing and sattvic mountain food." },
  { slug: "mumbai-city-lights", title: "Mumbai City Lights", destination: "Mumbai, Maharashtra", category: "CITY", img: "photo-1552133457-ce1d2d33cdfb", price: 749900, dur: 2,
    desc: "Street food crawls, heritage walks, Marine Drive sunsets and the buzz of the city that never sleeps." },
  { slug: "kabini-wildlife-safari", title: "Kabini Wildlife Safari", destination: "Kabini, Karnataka", category: "WILDLIFE", img: "photo-1506108928571-9f4b11ba3f10", price: 1299900, dur: 3,
    desc: "Track leopards, elephants and the elusive black panther on guided jeep and boat safaris." },
  { slug: "gokarna-beach-trails", title: "Gokarna Beach Trails", destination: "Gokarna, Karnataka", category: "BEACH", img: "photo-1554787990-fd7a431e3b0a", price: 699900, dur: 3,
    desc: "Beach-hop the untouched shores of Gokarna on a laid-back coastal trek with bonfire nights." },
];

let n = 0;
for (let i = 0; i < TRIPS.length; i++) {
  const t = TRIPS[i];
  const start = new Date(now.getTime() + (18 + i * 5) * day);
  const end = new Date(start.getTime() + t.dur * day);
  const data = {
    title: t.title,
    description: t.desc,
    shortDescription: t.desc.slice(0, 90),
    destination: t.destination,
    coverImage: u(t.img),
    images: [u(t.img)],
    category: t.category,
    startDate: start,
    endDate: end,
    duration: t.dur,
    maxGroupSize: 16,
    minGroupSize: 4,
    currentBookings: 3 + (i % 8),
    basePricePaise: t.price,
    status: "PUBLISHED",
    isTrending: !!t.trend,
    isFeatured: i % 3 === 0,
    rating: 4.4 + ((i % 5) * 0.1),
    reviewCount: 40 + i * 17,
  };
  await prisma.trip.upsert({ where: { slug: t.slug }, update: data, create: { slug: t.slug, ...data } });
  n++;
  console.log(`OK  ${t.category.padEnd(10)} ${t.title}`);
}
console.log(`\nUpserted ${n} category trips.`);
await prisma.$disconnect();
