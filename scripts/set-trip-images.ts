import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Verification helper: put a few distinct photos on one trip so the card
// hover-gallery has something to cycle through. Mirrors what the admin
// "Additional Images" textarea does (writes trip.images[]).
async function main() {
  const id = "cmrdmajy70000zr0e2c6q944y"; // Rishikesh River Rafting
  const images = [
    "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1516901121982-4ba39a3fa4a1?w=1200&q=80&auto=format&fit=crop",
  ];
  const t = await prisma.trip.update({
    where: { id },
    data: { images },
    select: { id: true, title: true, images: true },
  });
  console.log("Updated:", t.title, "→", t.images.length, "images");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
