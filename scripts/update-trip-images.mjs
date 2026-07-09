// One-off: replace mismatched trip photos with destination-relevant, on-mood
// images (verified Unsplash). Run: node --env-file=.env scripts/update-trip-images.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const u = (id) => `https://images.unsplash.com/${id}?w=1200&q=80&auto=format&fit=crop`;

// keyword (matched in destination, lowercased) -> [cover, ...gallery]
const SETS = {
  coorg: ["photo-1529057299613-a565b7ce93aa", "photo-1560357647-62a43d9897bb", "photo-1547908771-05259d82e2df"],
  wayanad: ["photo-1533268722164-c7323ba5690c", "photo-1579765875481-1bc20e5a4a49", "photo-1617266982722-28a0deb420c4"],
  hampi: ["photo-1561981969-65ee8dfc7351", "photo-1588319648913-0ff4b76a9fed", "photo-1591536098930-d571deee309a"],
  jaipur: ["photo-1638623317527-1042d44b48ac", "photo-1660991473393-3612a4e49127", "photo-1668169064124-2e27339780d3"],
  jaisalmer: ["photo-1638623317527-1042d44b48ac", "photo-1660991473393-3612a4e49127", "photo-1668169064124-2e27339780d3"],
  rajasthan: ["photo-1638623317527-1042d44b48ac", "photo-1660991473393-3612a4e49127", "photo-1668169064124-2e27339780d3"],
  pondicherry: ["photo-1521859727374-9b8e0ef8c0c3", "photo-1565025383045-0519b8e0cb70", "photo-1565973007593-8c2d024a1e26"],
  manali: ["photo-1497267049703-01d7eb538c99", "photo-1516406742981-2b7d67ec4ae8", "photo-1565610468500-adc61f362be5"],
  goa: ["photo-1512343879784-a960bf40e7f2", "photo-1506953823976-52e1fdc0149a", "photo-1532517891316-72a08e5c03a7"],
  kyoto: ["photo-1503640538573-148065ba4904", "photo-1505069446780-4ef442b5207f", "photo-1555574010-6a2107d14bc6"],
  pangong: ["photo-1536295243470-d7cba4efab7b", "photo-1593118845043-359e5f628214", "photo-1595071211728-b6a417f1c6cf"],
  ladakh: ["photo-1536295243470-d7cba4efab7b", "photo-1593118845043-359e5f628214", "photo-1595071211728-b6a417f1c6cf"],
};

const trips = await prisma.trip.findMany({ select: { id: true, title: true, destination: true } });
let updated = 0;
for (const t of trips) {
  const d = (t.destination || "").toLowerCase();
  const key = Object.keys(SETS).find((k) => d.includes(k));
  if (!key) {
    console.log(`SKIP  ${t.destination} — no image set`);
    continue;
  }
  const ids = SETS[key];
  await prisma.trip.update({
    where: { id: t.id },
    data: { coverImage: u(ids[0]), images: ids.map(u) },
  });
  updated++;
  console.log(`OK    ${t.destination.padEnd(40)} -> ${key}`);
}
console.log(`\nUpdated ${updated}/${trips.length} trips.`);
await prisma.$disconnect();
