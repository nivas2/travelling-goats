// Additive demo data so every My Trails tab + notifications look populated.
// Idempotent (upserts / marker-based deletes). Non-destructive to other data.
// Run: node --env-file=.env scripts/seed-demo-sections.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const USER = "user-priya-002";
const now = new Date();
const day = 86400000;
const traveller = [{ name: "Priya Sharma", age: 31, gender: "Female", phone: "+919876500002" }];

// ---------------------------------------------------------------------------
// 1) ONGOING — make the Coorg getaway currently in progress
// ---------------------------------------------------------------------------
const ongoingId = "trip-ongoing-chat-001";
await prisma.trip.update({
  where: { id: ongoingId },
  data: { startDate: new Date(now.getTime() - 2 * day), endDate: new Date(now.getTime() + 3 * day) },
});
await prisma.booking.updateMany({
  where: { userId: USER, tripId: ongoingId },
  data: { status: "CONFIRMED" },
});
console.log("OK  ongoing: Coorg getaway is now live");

// ---------------------------------------------------------------------------
// 2) COMPLETED — one reviewed, one awaiting review
// ---------------------------------------------------------------------------
const completed = await prisma.trip.findMany({
  where: { id: { in: ["trip-completed-001", "trip-goa-002"] } },
  select: { id: true, title: true, basePricePaise: true },
});

for (let i = 0; i < completed.length; i++) {
  const t = completed[i];
  const bookingNumber = `TG-DEMO-CMP${i + 1}`;
  await prisma.booking.upsert({
    where: { bookingNumber },
    update: { status: "COMPLETED" },
    create: {
      bookingNumber,
      userId: USER,
      tripId: t.id,
      bookingType: "SOLO",
      status: "COMPLETED",
      totalPricePaise: t.basePricePaise,
      platformFeePaise: 0,
      travelerCount: 1,
      travelers: traveller,
      qrToken: `demo-cmp-${t.id}`,
      createdAt: new Date(now.getTime() - 40 * day),
    },
  });
  // First completed trip is reviewed; second is left for "Leave Review".
  await prisma.review.deleteMany({ where: { userId: USER, tripId: t.id } });
  if (i === 0) {
    await prisma.review.create({
      data: {
        userId: USER,
        tripId: t.id,
        overallRating: 5,
        safetyRating: 5,
        valueRating: 4,
        funRating: 5,
        comment: "Unforgettable trip — the crew was amazing and everything was perfectly planned!",
        isVerified: true,
      },
    });
  }
  console.log(`OK  completed: ${t.title}${i === 0 ? " (reviewed)" : " (awaiting review)"}`);
}

// ---------------------------------------------------------------------------
// 3) NOTIFICATIONS — realistic set (replace test rows + our demo marker rows)
// ---------------------------------------------------------------------------
const notifs = [
  { type: "BOOKING", title: "Booking confirmed 🎉", body: "Your spot on Kyoto Autumn Trails is locked in. Get ready!" },
  { type: "PAYMENT", title: "Payment successful", body: "₹8,098 paid for Misty Mountains of Coorg." },
  { type: "REWARD", title: "You earned 250 points!", body: "Points added for completing your last trip. Keep exploring!" },
  { type: "REFERRAL", title: "Sneha joined via your link", body: "₹200 has been credited to your wallet. 🎁" },
  { type: "TRIP_UPDATE", title: "Pickup point updated", body: "Coorg Misty Hills departs from Majestic Bus Station at 6:30 AM." },
  { type: "PROMOTION", title: "Monsoon Special ☔", body: "20% off all hill-station trips this week with RAIN20." },
];
await prisma.notification.deleteMany({
  where: { userId: USER, OR: [{ title: "test" }, { title: { in: notifs.map((n) => n.title) } }] },
});
await prisma.notification.createMany({
  data: notifs.map((n, i) => ({
    userId: USER,
    type: n.type,
    title: n.title,
    body: n.body,
    isRead: i > 2, // first few unread
    createdAt: new Date(now.getTime() - i * 0.4 * day),
  })),
});
console.log(`OK  notifications: ${notifs.length} added`);

console.log("\nDone.");
await prisma.$disconnect();
