// Seed snacks/meals + add-ons (with images & prices) and attach them to every
// published trip so the booking Add-ons step is populated.
// Idempotent (upsert by unique name / [trip, item]).
// Run: node --env-file=.env scripts/seed-snacks-addons.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const u = (id) => `https://images.unsplash.com/${id}?w=400&q=80&auto=format&fit=crop`;

const SNACKS = [
  { name: "Masala Chai", pricePaise: 4000, isVeg: true, category: "Beverage", image: "photo-1555251415-4716d9d0b8af", description: "Hot cutting chai to fuel the climb" },
  { name: "Veg Samosa (2 pcs)", pricePaise: 3000, isVeg: true, category: "Snack", image: "photo-1566222499048-9538f86d4675", description: "Crispy, spicy and freshly fried" },
  { name: "Grilled Veg Sandwich", pricePaise: 8000, isVeg: true, category: "Meal", image: "photo-1475090169767-40ed8d18f67d", description: "Loaded veggies with mint chutney" },
  { name: "Cup Maggi", pricePaise: 6000, isVeg: true, category: "Meal", image: "photo-1585410304004-56ae05651552", description: "The mountains' favourite comfort food" },
  { name: "Fresh Fruit Bowl", pricePaise: 12000, isVeg: true, category: "Healthy", image: "photo-1467453678174-768ec283a940", description: "Seasonal cut fruits, chaat masala optional" },
  { name: "Chicken Roll", pricePaise: 15000, isVeg: false, category: "Meal", image: "photo-1621427017787-e726cad02a1e", description: "Juicy chicken wrapped in a soft paratha" },
  { name: "Boiled Eggs (2 pcs)", pricePaise: 5000, isVeg: false, category: "Snack", image: "photo-1482049016688-2d3e1b311543", description: "Protein-packed trail snack" },
];

const ADDONS = [
  { name: "Extra Blanket", pricePaise: 20000, maxQuantity: 3, isPopular: false, image: "photo-1515852216175-927860d2be80", description: "Stay cosy on cold mountain nights" },
  { name: "Bonfire Kit", pricePaise: 50000, maxQuantity: 1, isPopular: true, image: "photo-1532090509841-f2bcc97a2875", description: "Firewood, music & marshmallows for the group" },
  { name: "Personal Tent", pricePaise: 80000, maxQuantity: 2, isPopular: false, image: "photo-1470246973918-29a93221c455", description: "Your own 2-person weatherproof tent" },
  { name: "Sleeping Bag", pricePaise: 30000, maxQuantity: 4, isPopular: false, image: "photo-1486999619268-6aa409dbecd1", description: "Rated for sub-zero temperatures" },
  { name: "Photography Package", pricePaise: 150000, maxQuantity: 1, isPopular: true, image: "photo-1486916856992-e4db22c8df33", description: "Pro photographer captures your whole trip" },
];

const snackIds = [];
for (const s of SNACKS) {
  const row = await prisma.globalSnack.upsert({
    where: { name: s.name },
    update: { ...s, image: u(s.image), isActive: true },
    create: { ...s, image: u(s.image) },
  });
  snackIds.push(row.id);
}
console.log(`OK  ${snackIds.length} snacks`);

const addonIds = [];
for (const a of ADDONS) {
  const row = await prisma.globalAddOn.upsert({
    where: { name: a.name },
    update: { ...a, image: u(a.image), isActive: true },
    create: { ...a, image: u(a.image) },
  });
  addonIds.push(row.id);
}
console.log(`OK  ${addonIds.length} add-ons`);

// Attach every snack + add-on to every published trip.
const trips = await prisma.trip.findMany({ where: { status: "PUBLISHED" }, select: { id: true } });
let links = 0;
for (const t of trips) {
  for (const sid of snackIds) {
    await prisma.tripSnackSelection.upsert({
      where: { tripId_globalSnackId: { tripId: t.id, globalSnackId: sid } },
      update: {},
      create: { tripId: t.id, globalSnackId: sid },
    });
    links++;
  }
  for (const aid of addonIds) {
    await prisma.tripAddOnSelection.upsert({
      where: { tripId_globalAddOnId: { tripId: t.id, globalAddOnId: aid } },
      update: {},
      create: { tripId: t.id, globalAddOnId: aid },
    });
    links++;
  }
}
console.log(`OK  attached to ${trips.length} trips (${links} links)`);
await prisma.$disconnect();
