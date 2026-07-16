import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NIVAS = "cmr65kc000001155vxesipzwx"; // test account (phone 8008727454)

// Source trips to clone into "ongoing" copies.
const SOURCES = [
  "cmrdmajy70000zr0e2c6q944y", // Rishikesh River Rafting
  "cmrdmajyv0001zr0eydmufwkt", // Spiti Valley Himalayan Trek
  "cmrdmajyz0002zr0ewpx2dfdr", // Ladakh Bike Expedition
];

const DAY = 24 * 60 * 60 * 1000;

async function main() {
  const now = new Date();
  const stamp = now.getTime();

  for (let i = 0; i < SOURCES.length; i++) {
    const src = await prisma.trip.findUnique({ where: { id: SOURCES[i] } });
    if (!src) {
      console.warn("skip missing source", SOURCES[i]);
      continue;
    }

    // Started (i+1) days ago, ends a few days from now → spans "today".
    const startDate = new Date(stamp - (i + 1) * DAY);
    const endDate = new Date(stamp + (3 - i) * DAY);
    const duration = Math.max(
      1,
      Math.round((endDate.getTime() - startDate.getTime()) / DAY)
    );

    const {
      id: _id,
      slug: _slug,
      createdAt: _c,
      updatedAt: _u,
      ...rest
    } = src;

    const trip = await prisma.trip.create({
      data: {
        ...rest,
        title: `${src.title} (Live)`,
        slug: `${src.slug}-live-${stamp}-${i}`,
        startDate,
        endDate,
        duration,
        status: "ONGOING",
        currentBookings: (src.currentBookings ?? 0) + 1,
      },
    });

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: `LIVE${stamp}${i}`,
        userId: NIVAS,
        tripId: trip.id,
        bookingType: "SOLO",
        status: "CONFIRMED",
        totalPricePaise: trip.basePricePaise + trip.platformFeePaise,
        platformFeePaise: trip.platformFeePaise,
        travelerCount: 1,
        travelers: [
          { name: "Nivas", age: 26, gender: "male", phone: "8008727454" },
        ],
        contactPhone: "8008727454",
        pickupPoint: "Majestic",
        qrToken: `live-${stamp}-${i}`,
      },
    });

    console.log(
      `✓ ${trip.title}  [${startDate.toDateString()} → ${endDate.toDateString()}]  booking ${booking.bookingNumber}`
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
