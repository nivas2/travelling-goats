import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.chatMessage.deleteMany(),
    prisma.chatRoom.deleteMany(),
    prisma.bookingSnack.deleteMany(),
    prisma.bookingAddOn.deleteMany(),
    prisma.bookingCancellation.deleteMany(),
    prisma.couponUsage.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.walletTransaction.deleteMany(),
    prisma.wallet.deleteMany(),
    prisma.savingsGoal.deleteMany(),
    prisma.referral.deleteMany(),
    prisma.review.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.waitlistItem.deleteMany(),
    prisma.supportTicket.deleteMany(),
    prisma.ticketMessage.deleteMany(),
    prisma.memoryEntry.deleteMany(),
    prisma.tripCompanion.deleteMany(),
    prisma.tripFaq.deleteMany(),
    prisma.snackOption.deleteMany(),
    prisma.tripAddOn.deleteMany(),
    prisma.itineraryDay.deleteMany(),
    prisma.trip.deleteMany(),
    prisma.emergencyContact.deleteMany(),
    prisma.otpCode.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.faq.deleteMany(),
    prisma.cmsContent.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ===== USERS =====
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: "user-admin-001",
        phone: "9999999999",
        email: "admin@meetmyroute.in",
        name: "MeetMyRoute Admin",
        passwordHash: await bcrypt.hash("123456", 12),
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
        gender: "MALE",
        city: "Bengaluru",
        role: "ADMIN",
        isVerified: true,
        isOnboarded: true,
        idVerified: true,
        referralCode: "PAADMIN1",
        interests: ["ADVENTURE", "CULTURAL", "MOUNTAIN"],
        budgetPreference: "PREMIUM",
        pickupCity: "Bengaluru",
        rewardPoints: 5000,
        rewardTier: "LEGEND",
        totalTrips: 25,
      },
    }),
    prisma.user.create({
      data: {
        id: "user-priya-002",
        phone: "9876543210",
        email: "priya@example.com",
        name: "Priya Sharma",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
        gender: "FEMALE",
        city: "Bengaluru",
        bio: "Software engineer who loves solo travel and sunset hikes",
        role: "USER",
        isVerified: true,
        isOnboarded: true,
        idVerified: true,
        referralCode: "PAPRI001",
        interests: ["ADVENTURE", "MOUNTAIN", "PHOTOGRAPHY"],
        budgetPreference: "MID_RANGE",
        pickupCity: "Bengaluru",
        rewardPoints: 1200,
        rewardTier: "ADVENTURER",
        totalTrips: 5,
      },
    }),
    prisma.user.create({
      data: {
        id: "user-rahul-003",
        phone: "9876543211",
        email: "rahul@example.com",
        name: "Rahul Verma",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
        gender: "MALE",
        city: "Mumbai",
        bio: "Marketing manager, organizes group trips every month",
        role: "USER",
        isVerified: true,
        isOnboarded: true,
        idVerified: true,
        referralCode: "PARAH002",
        interests: ["BEACH", "CITY", "FOOD"],
        budgetPreference: "PREMIUM",
        pickupCity: "Mumbai",
        rewardPoints: 2500,
        rewardTier: "VOYAGER",
        totalTrips: 12,
      },
    }),
    prisma.user.create({
      data: {
        id: "user-meera-004",
        phone: "9876543212",
        email: "meera@example.com",
        name: "Meera Nair",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
        gender: "FEMALE",
        city: "Chennai",
        bio: "Content writer, weekend warrior, coffee addict",
        role: "USER",
        isVerified: true,
        isOnboarded: true,
        idVerified: true,
        referralCode: "PAMEE003",
        interests: ["BEACH", "CULTURAL", "FOOD", "PHOTOGRAPHY"],
        budgetPreference: "BUDGET",
        pickupCity: "Chennai",
        rewardPoints: 800,
        rewardTier: "ADVENTURER",
        totalTrips: 4,
      },
    }),
    prisma.user.create({
      data: {
        id: "user-vikram-005",
        phone: "9876543213",
        email: "vikram@example.com",
        name: "Vikram Joshi",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
        gender: "MALE",
        city: "Delhi",
        bio: "Junior analyst, first-time solo traveler",
        role: "USER",
        isVerified: true,
        isOnboarded: true,
        idVerified: false,
        referralCode: "PAVIK004",
        interests: ["CITY", "CULTURAL"],
        budgetPreference: "BUDGET",
        pickupCity: "Delhi",
        rewardPoints: 200,
        rewardTier: "EXPLORER",
        totalTrips: 1,
      },
    }),
    prisma.user.create({
      data: {
        id: "user-ananya-006",
        phone: "9876543214",
        email: "ananya@example.com",
        name: "Ananya Reddy",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200",
        gender: "FEMALE",
        city: "Hyderabad",
        bio: "Travel blogger, always camera-ready",
        role: "USER",
        isVerified: true,
        isOnboarded: true,
        idVerified: true,
        referralCode: "PAANA005",
        interests: ["PHOTOGRAPHY", "BEACH", "ADVENTURE", "MOUNTAIN"],
        budgetPreference: "MID_RANGE",
        pickupCity: "Hyderabad",
        rewardPoints: 1800,
        rewardTier: "ADVENTURER",
        totalTrips: 8,
      },
    }),
    prisma.user.create({
      data: {
        id: "user-arjun-007",
        phone: "9876543215",
        email: "arjun@example.com",
        name: "Arjun Kapoor",
        gender: "MALE",
        city: "Pune",
        role: "TRIP_CAPTAIN",
        isVerified: true,
        isOnboarded: true,
        idVerified: true,
        referralCode: "PAARJ006",
        interests: ["ADVENTURE", "MOUNTAIN", "WILDLIFE"],
        budgetPreference: "MID_RANGE",
        pickupCity: "Pune",
        rewardPoints: 3000,
        rewardTier: "VOYAGER",
        totalTrips: 20,
      },
    }),
    prisma.user.create({
      data: {
        id: "user-sneha-008",
        phone: "9876543216",
        email: "sneha@example.com",
        name: "Sneha Gupta",
        gender: "FEMALE",
        city: "Bengaluru",
        role: "USER",
        isVerified: true,
        isOnboarded: true,
        idVerified: true,
        referralCode: "PASNE007",
        interests: ["SPIRITUAL", "CULTURAL", "FOOD"],
        budgetPreference: "BUDGET",
        pickupCity: "Bengaluru",
        rewardPoints: 600,
        rewardTier: "ADVENTURER",
        totalTrips: 3,
      },
    }),
    prisma.user.create({
      data: {
        id: "user-karthik-009",
        phone: "9876543217",
        email: "karthik@example.com",
        name: "Karthik Iyer",
        gender: "MALE",
        city: "Chennai",
        role: "USER",
        isVerified: true,
        isOnboarded: false,
        referralCode: "PAKAR008",
        interests: [],
        rewardPoints: 0,
        rewardTier: "EXPLORER",
        totalTrips: 0,
      },
    }),
    prisma.user.create({
      data: {
        id: "user-divya-010",
        phone: "9876543218",
        email: "divya@example.com",
        name: "Divya Singh",
        gender: "FEMALE",
        city: "Mumbai",
        role: "USER",
        isVerified: true,
        isOnboarded: true,
        idVerified: true,
        referralCode: "PADIV009",
        interests: ["ROAD_TRIP", "BEACH", "CITY"],
        budgetPreference: "MID_RANGE",
        pickupCity: "Mumbai",
        rewardPoints: 1500,
        rewardTier: "ADVENTURER",
        totalTrips: 7,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // ===== TRIPS =====
  const trips = await Promise.all([
    prisma.trip.create({
      data: {
        id: "trip-coorg-001",
        title: "Misty Mountains of Coorg",
        slug: "misty-mountains-coorg",
        description: "Escape to the Scotland of India! Explore lush coffee plantations, misty peaks, and cascading waterfalls in Coorg. This 3-day trip includes trekking to Tadiandamol peak, visiting Abbey Falls, and a coffee plantation tour with authentic Kodava cuisine.",
        shortDescription: "Coffee, waterfalls & mountain treks in Karnataka's hill paradise",
        destination: "Coorg, Karnataka",
        origin: "Bengaluru",
        coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        images: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
          "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
          "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800",
        ],
        category: "MOUNTAIN",
        difficulty: "MODERATE",
        startDate: new Date("2026-08-15"),
        endDate: new Date("2026-08-17"),
        duration: 3,
        maxGroupSize: 20,
        minGroupSize: 6,
        currentBookings: 12,
        basePricePaise: 799900,
        couplePricePaise: 1399900,
        groupPricePaise: 699900,
        platformFeePaise: 9900,
        inclusions: ["Accommodation (2 nights)", "All meals (B+L+D)", "Transport from Bengaluru", "Trekking guide", "Coffee plantation tour", "Entry fees"],
        exclusions: ["Personal expenses", "Travel insurance", "Alcoholic beverages", "Tips"],
        highlights: ["Trek to Tadiandamol Peak (1,748m)", "Abbey Falls visit", "Coffee plantation tour & tasting", "Kodava cuisine experience", "Dubare Elephant Camp"],
        meetingPoint: "Majestic Bus Station, Bengaluru",
        meetingTime: "6:00 AM",
        status: "PUBLISHED",
        isFeatured: true,
        isTrending: true,
        rating: 4.7,
        reviewCount: 23,
        cancellationPolicy: "MODERATE",
        tags: ["trekking", "coffee", "waterfall", "nature", "weekend"],
      },
    }),
    prisma.trip.create({
      data: {
        id: "trip-goa-002",
        title: "Goa Beach Vibes & Nightlife",
        slug: "goa-beach-vibes-nightlife",
        description: "Experience the best of Goa with pristine beaches, water sports, vibrant nightlife, and delicious seafood. From the historic churches of Old Goa to the happening clubs of North Goa, this trip covers it all.",
        shortDescription: "Sun, sand & unforgettable nights in India's party capital",
        destination: "Goa",
        origin: "Mumbai",
        coverImage: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800",
        images: [
          "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800",
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
          "https://images.unsplash.com/photo-1468413253725-0d5181091126?w=800",
        ],
        category: "BEACH",
        difficulty: "EASY",
        startDate: new Date("2026-08-22"),
        endDate: new Date("2026-08-25"),
        duration: 4,
        maxGroupSize: 25,
        minGroupSize: 8,
        currentBookings: 18,
        basePricePaise: 1199900,
        couplePricePaise: 2099900,
        groupPricePaise: 1049900,
        platformFeePaise: 14900,
        inclusions: ["Accommodation (3 nights)", "Breakfast daily", "Airport transfers", "Sightseeing tour", "Water sports (1 session)", "Party night entry"],
        exclusions: ["Flights", "Lunch & Dinner", "Alcoholic drinks", "Personal shopping"],
        highlights: ["Sunset at Chapora Fort", "Water sports at Baga Beach", "Old Goa heritage walk", "Saturday Night Market", "Dudhsagar Falls excursion"],
        meetingPoint: "Goa Dabolim Airport",
        meetingTime: "10:00 AM",
        status: "PUBLISHED",
        isFeatured: true,
        isTrending: true,
        rating: 4.5,
        reviewCount: 45,
        cancellationPolicy: "MODERATE",
        tags: ["beach", "nightlife", "water-sports", "party", "seafood"],
      },
    }),
    prisma.trip.create({
      data: {
        id: "trip-manali-003",
        title: "Manali Adventure Expedition",
        slug: "manali-adventure-expedition",
        description: "An adrenaline-packed 5-day expedition through the Kullu-Manali valley. River rafting on Beas, paragliding in Solang Valley, and a jeep safari to Rohtang Pass. Perfect for thrill-seekers!",
        shortDescription: "Rafting, paragliding & high passes in the Himalayas",
        destination: "Manali, Himachal Pradesh",
        origin: "Delhi",
        coverImage: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800",
        images: [
          "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800",
          "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=800",
        ],
        category: "ADVENTURE",
        difficulty: "CHALLENGING",
        startDate: new Date("2026-09-05"),
        endDate: new Date("2026-09-09"),
        duration: 5,
        maxGroupSize: 15,
        minGroupSize: 5,
        currentBookings: 8,
        basePricePaise: 1499900,
        couplePricePaise: 2699900,
        groupPricePaise: 1349900,
        platformFeePaise: 19900,
        inclusions: ["Accommodation (4 nights)", "All meals", "Volvo bus from Delhi", "River rafting", "Paragliding", "Rohtang Pass jeep safari", "Guide & safety gear"],
        exclusions: ["Personal insurance", "Snacks", "Tips", "Personal expenses"],
        highlights: ["Grade III River Rafting on Beas", "Paragliding in Solang Valley", "Rohtang Pass (13,054 ft)", "Hadimba Temple visit", "Kullu shawl shopping"],
        meetingPoint: "ISBT Kashmere Gate, Delhi",
        meetingTime: "7:00 PM",
        status: "PUBLISHED",
        isFeatured: false,
        isTrending: true,
        rating: 4.8,
        reviewCount: 31,
        cancellationPolicy: "STRICT",
        tags: ["adventure", "rafting", "paragliding", "mountains", "himalayas"],
      },
    }),
    prisma.trip.create({
      data: {
        id: "trip-hampi-004",
        title: "Hampi Heritage & Bouldering",
        slug: "hampi-heritage-bouldering",
        description: "Step back in time at the UNESCO World Heritage Site of Hampi. Explore ancient Vijayanagara ruins, go bouldering on surreal rock formations, and enjoy coracle rides on the Tungabhadra River.",
        shortDescription: "Ancient ruins, bouldering & sunset views in Karnataka",
        destination: "Hampi, Karnataka",
        origin: "Bengaluru",
        coverImage: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800",
        images: [
          "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800",
        ],
        category: "CULTURAL",
        difficulty: "EASY",
        startDate: new Date("2026-08-29"),
        endDate: new Date("2026-08-31"),
        duration: 3,
        maxGroupSize: 18,
        minGroupSize: 6,
        currentBookings: 5,
        basePricePaise: 649900,
        platformFeePaise: 9900,
        inclusions: ["Accommodation (2 nights)", "Breakfast & Dinner", "Bus from Bengaluru", "Local guide", "Coracle ride", "Entry fees"],
        exclusions: ["Lunch", "Personal expenses", "Camera fees"],
        highlights: ["Virupaksha Temple sunrise", "Bouldering at Hippie Island", "Coracle ride on Tungabhadra", "Vittala Temple & Stone Chariot", "Sunset at Matanga Hill"],
        meetingPoint: "Kempegowda Bus Station, Bengaluru",
        meetingTime: "9:00 PM",
        status: "PUBLISHED",
        isFeatured: false,
        isTrending: false,
        rating: 4.6,
        reviewCount: 15,
        cancellationPolicy: "FLEXIBLE",
        tags: ["heritage", "bouldering", "UNESCO", "weekend", "culture"],
      },
    }),
    prisma.trip.create({
      data: {
        id: "trip-pondicherry-005",
        title: "Pondicherry French Quarter Escape",
        slug: "pondicherry-french-quarter-escape",
        description: "A charming weekend in the French Riviera of the East. Walk through colorful colonial streets, cycle along the promenade, visit Auroville, and enjoy world-class French-Tamil fusion cuisine.",
        shortDescription: "Colonial charm, beaches & Franco-Tamil cuisine",
        destination: "Pondicherry",
        origin: "Chennai",
        coverImage: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800",
        images: [
          "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800",
        ],
        category: "BEACH",
        difficulty: "EASY",
        startDate: new Date("2026-09-12"),
        endDate: new Date("2026-09-14"),
        duration: 3,
        maxGroupSize: 16,
        minGroupSize: 4,
        currentBookings: 10,
        basePricePaise: 599900,
        couplePricePaise: 1049900,
        platformFeePaise: 9900,
        inclusions: ["Accommodation (2 nights)", "Breakfast", "Bus from Chennai", "Cycling tour", "Auroville visit"],
        exclusions: ["Lunch & Dinner", "Shopping", "Personal expenses"],
        highlights: ["French Quarter walking tour", "Promenade Beach sunrise", "Auroville Matrimandir", "Paradise Beach boat ride", "Café hopping"],
        meetingPoint: "Chennai Central Railway Station",
        meetingTime: "6:00 AM",
        status: "PUBLISHED",
        isFeatured: true,
        isTrending: false,
        rating: 4.4,
        reviewCount: 19,
        cancellationPolicy: "FLEXIBLE",
        tags: ["weekend", "beach", "heritage", "food", "cycling"],
      },
    }),
    prisma.trip.create({
      data: {
        id: "trip-rajasthan-006",
        title: "Royal Rajasthan Grand Tour",
        slug: "royal-rajasthan-grand-tour",
        description: "Live like royalty on this grand 7-day tour through Rajasthan's majestic forts, vibrant bazaars, and golden deserts. From the Pink City to the Blue City, experience India's most colorful state.",
        shortDescription: "Forts, deserts & royal heritage across Rajasthan",
        destination: "Jaipur - Jodhpur - Jaisalmer, Rajasthan",
        origin: "Delhi",
        coverImage: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800",
        images: [
          "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800",
        ],
        category: "CULTURAL",
        difficulty: "EASY",
        startDate: new Date("2026-10-01"),
        endDate: new Date("2026-10-07"),
        duration: 7,
        maxGroupSize: 20,
        minGroupSize: 8,
        currentBookings: 3,
        basePricePaise: 2499900,
        couplePricePaise: 4499900,
        groupPricePaise: 2199900,
        platformFeePaise: 19900,
        inclusions: ["Accommodation (6 nights)", "All meals", "AC bus transport", "All entry fees", "Desert camp stay", "Camel safari", "Guide"],
        exclusions: ["Flights to Delhi", "Shopping", "Tips", "Personal insurance"],
        highlights: ["Amber Fort elephant ride", "Mehrangarh Fort tour", "Jaisalmer desert camping", "Camel safari at sunset", "Jodhpur blue city walk"],
        meetingPoint: "New Delhi Railway Station",
        meetingTime: "8:00 AM",
        status: "PUBLISHED",
        isFeatured: true,
        isTrending: false,
        rating: 4.9,
        reviewCount: 8,
        cancellationPolicy: "STRICT",
        tags: ["heritage", "desert", "forts", "culture", "royal"],
      },
    }),
    prisma.trip.create({
      data: {
        id: "trip-wayanad-007",
        title: "Wayanad Wildlife & Waterfalls",
        slug: "wayanad-wildlife-waterfalls",
        description: "Immerse yourself in Kerala's wild side! Trek through dense forests, spot wildlife at Wayanad Wildlife Sanctuary, and chase stunning waterfalls. Stay in a treehouse resort surrounded by nature.",
        shortDescription: "Jungle treks, treehouses & wildlife in Kerala",
        destination: "Wayanad, Kerala",
        origin: "Bengaluru",
        coverImage: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800",
        images: [],
        category: "WILDLIFE",
        difficulty: "MODERATE",
        startDate: new Date("2026-09-19"),
        endDate: new Date("2026-09-21"),
        duration: 3,
        maxGroupSize: 12,
        minGroupSize: 4,
        currentBookings: 12,
        basePricePaise: 849900,
        platformFeePaise: 9900,
        inclusions: ["Treehouse accommodation (2 nights)", "All meals", "Transport", "Safari jeep", "Trekking guide", "Entry fees"],
        exclusions: ["Personal expenses", "Camera charges at sanctuary"],
        highlights: ["Wayanad Wildlife Sanctuary safari", "Edakkal Caves trek", "Meenmutty Waterfalls", "Treehouse stay", "Bamboo rafting"],
        meetingPoint: "Silk Board Junction, Bengaluru",
        meetingTime: "5:30 AM",
        status: "PUBLISHED",
        isFeatured: false,
        isTrending: false,
        rating: 4.3,
        reviewCount: 11,
        cancellationPolicy: "MODERATE",
        tags: ["wildlife", "treehouse", "waterfall", "trek", "nature"],
      },
    }),
  ]);

  console.log(`✅ Created ${trips.length} trips`);

  // ===== ITINERARY DAYS =====
  // Coorg Trip Itinerary
  await prisma.itineraryDay.createMany({
    data: [
      {
        tripId: "trip-coorg-001",
        dayNumber: 1,
        title: "Journey & Coffee Trail",
        description: "Depart from Bengaluru early morning. Arrive at Coorg by afternoon.",
        activities: [
          { time: "6:00 AM", title: "Depart from Bengaluru", description: "Board the bus at Majestic", icon: "directions_bus" },
          { time: "12:00 PM", title: "Arrive at Coorg", description: "Check-in to resort", icon: "hotel" },
          { time: "2:00 PM", title: "Lunch", description: "Authentic Kodava cuisine", icon: "restaurant" },
          { time: "4:00 PM", title: "Coffee Plantation Tour", description: "Walk through coffee estates, learn about processing", icon: "local_cafe" },
          { time: "7:00 PM", title: "Bonfire & Dinner", description: "Evening bonfire with music", icon: "local_fire_department" },
        ],
        meals: ["lunch", "dinner"],
        accommodation: "Coorg Wilderness Resort",
      },
      {
        tripId: "trip-coorg-001",
        dayNumber: 2,
        title: "Trek to Tadiandamol",
        description: "Full day trek to the highest peak in Coorg.",
        activities: [
          { time: "5:30 AM", title: "Early Breakfast", description: "Energy-packed breakfast", icon: "restaurant" },
          { time: "6:30 AM", title: "Trek Begins", description: "Start the 8km trek to Tadiandamol", icon: "hiking" },
          { time: "10:00 AM", title: "Summit!", description: "Reach 1,748m peak, panoramic views", icon: "landscape" },
          { time: "12:00 PM", title: "Packed Lunch at Summit", description: "Enjoy lunch with a view", icon: "lunch_dining" },
          { time: "3:00 PM", title: "Return to Base", description: "Trek down, rest at resort", icon: "arrow_downward" },
          { time: "5:00 PM", title: "Abbey Falls Visit", description: "Evening visit to the iconic waterfall", icon: "water" },
          { time: "8:00 PM", title: "Group Dinner", description: "Special Kodava feast", icon: "dinner_dining" },
        ],
        meals: ["breakfast", "lunch", "dinner"],
        accommodation: "Coorg Wilderness Resort",
      },
      {
        tripId: "trip-coorg-001",
        dayNumber: 3,
        title: "Dubare & Return",
        description: "Morning at Dubare Elephant Camp and return journey.",
        activities: [
          { time: "7:00 AM", title: "Breakfast", icon: "restaurant" },
          { time: "8:30 AM", title: "Dubare Elephant Camp", description: "Interact with elephants, river bath", icon: "pets" },
          { time: "11:00 AM", title: "Check-out", icon: "logout" },
          { time: "12:00 PM", title: "Lunch & Shopping", description: "Local market visit, buy coffee & spices", icon: "shopping_bag" },
          { time: "2:00 PM", title: "Depart for Bengaluru", icon: "directions_bus" },
          { time: "7:00 PM", title: "Arrive Bengaluru", description: "Drop at Majestic Bus Station", icon: "location_on" },
        ],
        meals: ["breakfast", "lunch"],
      },
    ],
  });

  // Goa Trip Itinerary
  await prisma.itineraryDay.createMany({
    data: [
      {
        tripId: "trip-goa-002",
        dayNumber: 1,
        title: "Welcome to Goa",
        activities: [
          { time: "10:00 AM", title: "Airport Pickup", icon: "flight_land" },
          { time: "12:00 PM", title: "Check-in & Lunch", icon: "hotel" },
          { time: "3:00 PM", title: "Calangute Beach", icon: "beach_access" },
          { time: "7:00 PM", title: "Welcome Dinner", icon: "dinner_dining" },
        ],
        meals: ["lunch", "dinner"],
        accommodation: "Beach Resort, North Goa",
      },
      {
        tripId: "trip-goa-002",
        dayNumber: 2,
        title: "Adventure Day",
        activities: [
          { time: "8:00 AM", title: "Breakfast", icon: "restaurant" },
          { time: "10:00 AM", title: "Water Sports at Baga", description: "Jet ski, parasailing, banana boat", icon: "surfing" },
          { time: "1:00 PM", title: "Seafood Lunch", icon: "set_meal" },
          { time: "4:00 PM", title: "Chapora Fort Sunset", icon: "castle" },
          { time: "9:00 PM", title: "Club Night", icon: "nightlife" },
        ],
        meals: ["breakfast"],
        accommodation: "Beach Resort, North Goa",
      },
      {
        tripId: "trip-goa-002",
        dayNumber: 3,
        title: "Heritage & Culture",
        activities: [
          { time: "8:00 AM", title: "Old Goa Churches", icon: "church" },
          { time: "12:00 PM", title: "Fontainhas Latin Quarter", icon: "palette" },
          { time: "3:00 PM", title: "Spice Plantation", icon: "eco" },
          { time: "6:00 PM", title: "Saturday Night Market", icon: "storefront" },
        ],
        meals: ["breakfast"],
        accommodation: "Beach Resort, North Goa",
      },
      {
        tripId: "trip-goa-002",
        dayNumber: 4,
        title: "Farewell",
        activities: [
          { time: "7:00 AM", title: "Sunrise Beach Yoga", icon: "self_improvement" },
          { time: "9:00 AM", title: "Breakfast & Check-out", icon: "restaurant" },
          { time: "11:00 AM", title: "Airport Drop", icon: "flight_takeoff" },
        ],
        meals: ["breakfast"],
      },
    ],
  });

  console.log("✅ Created itinerary days");

  // ===== ADD-ONS =====
  await prisma.tripAddOn.createMany({
    data: [
      { tripId: "trip-coorg-001", name: "Photography Package", description: "Professional photographer for the trek", pricePaise: 149900, icon: "photo_camera", isPopular: true },
      { tripId: "trip-coorg-001", name: "Private Room Upgrade", description: "Upgrade from shared to private room", pricePaise: 249900, icon: "king_bed" },
      { tripId: "trip-coorg-001", name: "Travel Insurance", description: "Comprehensive trip insurance coverage", pricePaise: 49900, icon: "health_and_safety" },
      { tripId: "trip-goa-002", name: "Scuba Diving", description: "1-hour guided scuba session", pricePaise: 349900, icon: "scuba_diving", isPopular: true },
      { tripId: "trip-goa-002", name: "Private Room Upgrade", description: "Beach-facing private room", pricePaise: 349900, icon: "king_bed" },
      { tripId: "trip-goa-002", name: "Dudhsagar Falls Trip", description: "Full day excursion to Dudhsagar", pricePaise: 199900, icon: "water" },
      { tripId: "trip-manali-003", name: "GoPro Rental", description: "Action camera for the trip", pricePaise: 99900, icon: "videocam" },
      { tripId: "trip-manali-003", name: "Bungee Jumping", description: "At Solang Valley", pricePaise: 299900, icon: "paragliding", isPopular: true },
    ],
  });

  // ===== SNACK OPTIONS =====
  await prisma.snackOption.createMany({
    data: [
      { tripId: "trip-coorg-001", name: "Trail Mix Pack", pricePaise: 14900, category: "veg", isVeg: true, icon: "nutrition" },
      { tripId: "trip-coorg-001", name: "Energy Bars (Pack of 3)", pricePaise: 19900, category: "veg", isVeg: true, icon: "cookie" },
      { tripId: "trip-coorg-001", name: "Chicken Sandwich", pricePaise: 14900, category: "non-veg", isVeg: false, icon: "lunch_dining" },
      { tripId: "trip-goa-002", name: "Goan Bebinca", pricePaise: 9900, category: "veg", isVeg: true, icon: "cake" },
      { tripId: "trip-goa-002", name: "Cashew Feni (Miniature)", pricePaise: 24900, category: "non-veg", isVeg: false, icon: "liquor" },
      { tripId: "trip-manali-003", name: "Maggi & Chai Combo", pricePaise: 9900, category: "veg", isVeg: true, icon: "ramen_dining" },
    ],
  });

  console.log("✅ Created add-ons and snack options");

  // ===== FAQs =====
  await prisma.tripFaq.createMany({
    data: [
      { tripId: "trip-coorg-001", question: "How difficult is the Tadiandamol trek?", answer: "It's a moderate difficulty trek suitable for beginners with reasonable fitness. The 8km trail has gradual elevation gain. Our guide will pace the group accordingly.", order: 1 },
      { tripId: "trip-coorg-001", question: "What should I pack?", answer: "Trekking shoes, rain jacket, warm layer, sunscreen, water bottle, camera. We'll send a detailed packing list after booking.", order: 2 },
      { tripId: "trip-coorg-001", question: "Is the trip suitable for solo travelers?", answer: "Absolutely! Most of our travelers are solo. Our trips are designed to help you connect with like-minded people.", order: 3 },
      { tripId: "trip-goa-002", question: "Is alcohol included in the trip?", answer: "No, alcoholic beverages are not included. However, there are plenty of options available at your own expense.", order: 1 },
      { tripId: "trip-goa-002", question: "Do I need to know swimming for water sports?", answer: "No, life jackets are provided for all water sports. Trained instructors will be with you at all times.", order: 2 },
    ],
  });

  // ===== REVIEWS =====
  await prisma.review.createMany({
    data: [
      { userId: "user-priya-002", tripId: "trip-coorg-001", overallRating: 5, safetyRating: 5, valueRating: 4, funRating: 5, comment: "Best trip ever! The trek was challenging but so worth it. The coffee plantation tour was my favorite part. Made amazing friends!", isVerified: true, helpfulCount: 12 },
      { userId: "user-rahul-003", tripId: "trip-goa-002", overallRating: 4.5, safetyRating: 5, valueRating: 4, funRating: 5, comment: "Great organization, amazing group of people. The water sports were thrilling. Only wish dinner was included more days.", isVerified: true, helpfulCount: 8 },
      { userId: "user-meera-004", tripId: "trip-coorg-001", overallRating: 4, safetyRating: 5, valueRating: 5, funRating: 4, comment: "Beautiful destination, well-organized trip. The resort was lovely and food was authentic Kodava. Would recommend!", isVerified: true, helpfulCount: 5 },
      { userId: "user-ananya-006", tripId: "trip-goa-002", overallRating: 5, safetyRating: 4, valueRating: 4, funRating: 5, comment: "Perfect beach getaway! The photography opportunities were endless. Sunset at Chapora Fort was magical.", isVerified: true, helpfulCount: 15 },
      { userId: "user-divya-010", tripId: "trip-manali-003", overallRating: 4.5, safetyRating: 5, valueRating: 5, funRating: 5, comment: "Paragliding was a life-changing experience. The trip captain was so helpful and the whole group bonded beautifully.", isVerified: true, helpfulCount: 20 },
    ],
  });

  console.log("✅ Created reviews");

  // ===== COUPONS =====
  await prisma.coupon.createMany({
    data: [
      { code: "WELCOME500", description: "₹500 off on your first booking", discountType: "FIXED", discountValue: 50000, minOrderPaise: 300000, isActive: true, validUntil: new Date("2027-03-31") },
      { code: "PACK20", description: "20% off (max ₹1000)", discountType: "PERCENTAGE", discountValue: 20, maxDiscountPaise: 100000, minOrderPaise: 500000, isActive: true, validUntil: new Date("2026-12-31") },
      { code: "SUMMER10", description: "10% off summer trips", discountType: "PERCENTAGE", discountValue: 10, maxDiscountPaise: 200000, minOrderPaise: 0, maxUses: 100, isActive: true, validUntil: new Date("2026-09-30") },
      { code: "GROUP15", description: "15% off group bookings", discountType: "PERCENTAGE", discountValue: 15, maxDiscountPaise: 300000, minOrderPaise: 1000000, isActive: true },
      { code: "WEEKEND300", description: "₹300 off weekend trips", discountType: "FIXED", discountValue: 30000, minOrderPaise: 400000, isActive: true, validUntil: new Date("2026-12-31") },
    ],
  });

  console.log("✅ Created coupons");

  // ===== WALLETS =====
  const wallets = await Promise.all(
    users.slice(0, 5).map((user) =>
      prisma.wallet.create({
        data: {
          userId: user.id,
          balancePaise: Math.floor(Math.random() * 500000) + 10000,
        },
      })
    )
  );

  console.log(`✅ Created ${wallets.length} wallets`);

  // ===== SAMPLE BOOKINGS =====
  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        bookingNumber: "PA20260801A",
        userId: "user-priya-002",
        tripId: "trip-coorg-001",
        bookingType: "SOLO",
        status: "CONFIRMED",
        totalPricePaise: 809800,
        platformFeePaise: 9900,
        travelerCount: 1,
        travelers: [{ name: "Priya Sharma", age: 27, gender: "FEMALE", phone: "9876543210" }],
        pickupPoint: "Majestic Bus Station",
        payment: {
          create: {
            amountPaise: 809800,
            status: "CAPTURED",
            method: "UPI",
            razorpayOrderId: "order_test_001",
            razorpayPaymentId: "pay_test_001",
          },
        },
      },
    }),
    prisma.booking.create({
      data: {
        bookingNumber: "PA20260801B",
        userId: "user-rahul-003",
        tripId: "trip-goa-002",
        bookingType: "GROUP",
        status: "CONFIRMED",
        totalPricePaise: 4214600,
        platformFeePaise: 14900,
        travelerCount: 4,
        travelers: [
          { name: "Rahul Verma", age: 29, gender: "MALE", phone: "9876543211" },
          { name: "Amit Patel", age: 28, gender: "MALE", phone: "9876000001" },
          { name: "Neha Kumar", age: 26, gender: "FEMALE", phone: "9876000002" },
          { name: "Rohan Shah", age: 30, gender: "MALE", phone: "9876000003" },
        ],
        pickupPoint: "Goa Airport",
        payment: {
          create: {
            amountPaise: 4214600,
            status: "CAPTURED",
            method: "card",
            razorpayOrderId: "order_test_002",
            razorpayPaymentId: "pay_test_002",
          },
        },
      },
    }),
    prisma.booking.create({
      data: {
        bookingNumber: "PA20260801C",
        userId: "user-meera-004",
        tripId: "trip-pondicherry-005",
        bookingType: "SOLO",
        status: "PENDING",
        totalPricePaise: 609800,
        platformFeePaise: 9900,
        travelerCount: 1,
        travelers: [{ name: "Meera Nair", age: 25, gender: "FEMALE", phone: "9876543212" }],
      },
    }),
  ]);

  console.log(`✅ Created ${bookings.length} bookings`);

  // ===== CHAT ROOMS =====
  await prisma.chatRoom.createMany({
    data: [
      { tripId: "trip-coorg-001", name: "Coorg Trek Group 🏔️" },
      { tripId: "trip-goa-002", name: "Goa Beach Crew 🏖️" },
    ],
  });

  console.log("✅ Created chat rooms");

  // ===== NOTIFICATIONS =====
  await prisma.notification.createMany({
    data: [
      { userId: "user-priya-002", title: "Booking Confirmed!", body: "Your Coorg trip is confirmed. Get ready for an adventure!", type: "BOOKING" },
      { userId: "user-priya-002", title: "Trip Starts in 5 Days", body: "Pack your bags! Your Coorg trip starts on Aug 15.", type: "TRIP_UPDATE" },
      { userId: "user-rahul-003", title: "Booking Confirmed!", body: "Your Goa trip is booked for 4 travelers.", type: "BOOKING" },
      { userId: "user-meera-004", title: "Complete Your Booking", body: "Your Pondicherry booking is pending payment.", type: "PAYMENT" },
      { userId: "user-priya-002", title: "New Reward!", body: "You earned 100 points for your last trip review.", type: "REWARD" },
    ],
  });

  console.log("✅ Created notifications");

  // ===== FAQs (Global) =====
  await prisma.faq.createMany({
    data: [
      { category: "Booking", question: "How do I book a trip?", answer: "Simply browse trips, select one, choose your booking type, add traveler details, and complete payment. It takes less than 5 minutes!", order: 1 },
      { category: "Booking", question: "Can I book for a group?", answer: "Yes! You can book as Solo, Couple, or Group (up to the available spots). Group bookings get special pricing.", order: 2 },
      { category: "Payment", question: "What payment methods are accepted?", answer: "We accept UPI, credit/debit cards, net banking, and wallet payments through Razorpay. You can also use your MeetMyRoute wallet balance.", order: 1 },
      { category: "Payment", question: "Is my payment secure?", answer: "Absolutely! All payments are processed through Razorpay with bank-grade encryption. We never store your card details.", order: 2 },
      { category: "Trip", question: "What if a trip gets cancelled?", answer: "If we cancel a trip, you'll receive a full refund to your wallet within 5-7 business days. You'll also get a 10% bonus for the inconvenience.", order: 1 },
      { category: "Trip", question: "Who are Trip Captains?", answer: "Trip Captains are experienced travelers vetted by MeetMyRoute. They lead the group, handle logistics, and ensure everyone has a great time.", order: 2 },
      { category: "Account", question: "How do I verify my identity?", answer: "Go to Profile → Verify Identity. Upload your Aadhaar number and a selfie. Verification usually takes 24-48 hours.", order: 1 },
      { category: "Account", question: "How do referrals work?", answer: "Share your unique referral code. When someone signs up and completes their first trip, you both earn rewards! Earn ₹200-₹500 per referral based on your tier.", order: 2 },
      { category: "Technical", question: "The app is not loading. What should I do?", answer: "Try clearing your browser cache, disabling extensions, or switching to a different browser. If the issue persists, contact our support team.", order: 1 },
    ],
  });

  console.log("✅ Created global FAQs");

  // ===== EMERGENCY CONTACTS =====
  await prisma.emergencyContact.createMany({
    data: [
      { userId: "user-priya-002", name: "Rajesh Sharma", phone: "9876000100", relationship: "Father", isPrimary: true },
      { userId: "user-priya-002", name: "Anita Sharma", phone: "9876000101", relationship: "Mother" },
      { userId: "user-rahul-003", name: "Sunita Verma", phone: "9876000102", relationship: "Mother", isPrimary: true },
    ],
  });

  console.log("✅ Created emergency contacts");

  // ===== REFERRALS =====
  await prisma.referral.createMany({
    data: [
      { referrerId: "user-priya-002", referredId: "user-sneha-008", code: "PAPRI001", status: "COMPLETED", rewardPaise: 20000, tier: 1, convertedAt: new Date() },
      { referrerId: "user-rahul-003", referredId: "user-vikram-005", code: "PARAH002", status: "COMPLETED", rewardPaise: 20000, tier: 1, convertedAt: new Date() },
      { referrerId: "user-rahul-003", referredId: "user-divya-010", code: "PARAH002", status: "PENDING", rewardPaise: 20000, tier: 1 },
    ],
  });

  console.log("✅ Created referrals");

  console.log("\n🎉 Seed completed successfully!");
  console.log(`  Users: ${users.length}`);
  console.log(`  Trips: ${trips.length}`);
  console.log(`  Bookings: ${bookings.length}`);
  console.log(`  Wallets: ${wallets.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
