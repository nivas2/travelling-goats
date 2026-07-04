"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/*  Image URLs from the design                                        */
/* ------------------------------------------------------------------ */
const HERO_BG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAD7CRbu1MDRsH4TN6CMMoCuZem3bk7Zoa_bscO-phi_SuypUigU8_5QJZGTeNS_ktfncpFQBKZtFu3rAO0JX-qcm-O4Sj0EA08Z10p0AScu-A7iJPOGzB2CSra3zxcvfjgBXNt2iHnS6Xl0fr4JrMG-2UTby9AL3upWcLLHem5w300tDsCUG5YJJbznbq9aB80G8OMtG-44TQ98OFl_bUJPbLhMijXnLd_jebhBFcneWlESt43Uc_n";

const STEP_ICONS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBHQ7RNN3bT2rmilrHFViorROIXJ177X-nZ8jDy_dqomESNtgcNTDkiAhU0nNudPdi5mwPyk4m-FKIhU480V5ckbF3xcs0-0owrtfWR05WSt0ezMNqkPxCZEnt9mvNyB3-g0FbpCRqiByvbUtCNR30Q7vnu9a3xQV62murC2CaLqUBCubfPu07uOD0hTwEfRcoPE4D1sufUJKJJ6H7O_h0cjk9nSqUq0cC41mjkWPOZzdIPphBdgygZ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCoYpdPoFbm8Q5X4a2_RMRTQDC55d_kGKgfBAjsKaSSsuNYbaytZ2OycxZ1d5-Tb1xEcyrNkX3keAUJZNLsu6qtk2jPX-Arq-NTLnnkNnXp7ghG0vON0TYMoOrmw9YIDCisDay4MDfzC6GKkf04n-fuhn4RlUjdKqNVSqP5fFHDXOj4cBjG-FyFpwb8ZGrfUNpG56RrPJ4VSI0HN7_1foZxM6ajfvz426MHpdXudKgj3-1y3HzjGQNM",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuASgCuoM4A3ZB1SWwebc5rAm-DCmeLFIgS1_1nJB4JrtO5-8YyalYtMelJSs4bSlDCWxfFPDD2klt3mCo_6MgIg-Yja853r2IVpX1FSubPYyV9XPx682kPBLW6GwS-yOl7UptWk5urfIG-Th42LPqvwXihRPl7Xz1ho8-5ZLPiP2JBGDfLb172I0HbE356crGzyZIjpiZd9tEOubw4ri265IvnvGMyzhnIk72PHcI4q7p687SQpNw5s",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLby_3IZE_IgBbtaY5TZRxyB1dNPogJIXCJrv8h24hGMZei_DPiLFrv2_l6NdIoZutjxS-gq3Rf-GQSThWVS3VReln_AsRpAuAgB6_u1XwbQNQMpa0YlS4lMCcEeypRniwdpXgnMa7KYo9aUMTT18ch52g7IEttMCi5e8JnGo44A1UGvO-7hy5JmgPQpYm0Je9Qqt7uqF7vZGE7VYBJVU1jYOEfVg-PGl6D9hj-19V4KQ-ilauSria",
];

const TRIP_IMAGES = [
  HERO_BG,
  HERO_BG,
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAoLnM97tw2inL7Xbyf0x9GgrfaDBXRv_WxNLYbrKP7b69TCdi5K6fz5vPWMQOp2rA_QKtPqy0jhZHJ71IQ7ZFkFMZjX4xilzDinegQJKcfs0cXh2KS-o-8_IPn-Z-cf8y3-jiQzY-0w813F4OpPPKloXJ8Qk3qs1k0gvNL3Y_SFJuGHTBi8rNvQxMZPjtk7Mj63Y-WgaLlkToCGq7f0XSdurUQE8dto_YQQDSDqRtU3okVN4o8Lmxg",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAXyToigiHysv63W1K_3va7_i8fuvVGg7B2NKVROw487mKu9BiGksmwVoG4CJgKzzVVKLhRt54AsyKCGNVvJrhdChfxjLhaF49PhQM8lWQaFTmw4261u50OzECy-OKrs_0B1Cufeu89acGIaK-lj7h0QPMR-fG9dDJhddxN7nK6QHrESxKsMSthLL_uWVfLixK_X6jyfZlqIPQWL6akaWRu5MdSqdLAZQg8rBUJNM_0r4Mkt2EpeYas",
];

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */
const STEPS = [
  { title: "Choose a Trip", desc: "Browse curated itineraries designed for maximum exploration." },
  { title: "Book Your Seat", desc: "Secure your spot with easy, transparent payments." },
  { title: "Meet Your Crew", desc: "Connect with fellow travelers before the journey begins." },
  { title: "Enjoy the Journey", desc: "Leave the planning to us and focus on creating memories." },
];

const TRIPS = [
  {
    title: "Majestic Manali Escape",
    desc: "Experience the raw beauty of the Himalayas, from Solang Valley to Rohtang Pass.",
    duration: "4D/3N",
    pickup: "Delhi",
    seats: "4 Left",
    price: "12,499",
    rating: "4.9",
    imgIdx: 0,
  },
  {
    title: "The Leh Ladakh Expedition",
    desc: "A high-altitude adventure through monasteries, lakes, and breathtaking passes.",
    duration: "7D/6N",
    pickup: "Leh",
    seats: "2 Left",
    price: "24,999",
    rating: "5.0",
    imgIdx: 1,
  },
  {
    title: "Amalfi Coast Explorer",
    desc: "Discover the charm of Italy's most iconic coastline, from Positano to Ravello.",
    duration: "6D/5N",
    pickup: "Naples",
    seats: "6 Left",
    price: "89,999",
    rating: "4.8",
    imgIdx: 2,
  },
  {
    title: "Kyoto Serenity",
    desc: "Immerse yourself in the timeless beauty of Japan's cultural heart during autumn.",
    duration: "8D/7N",
    pickup: "Osaka",
    seats: "3 Left",
    price: "1,45,000",
    rating: "5.0",
    imgIdx: 3,
  },
];

const TRUST_BADGES = [
  { icon: "verified_user", label: "Verified Travelers" },
  { icon: "local_police", label: "Verified Captains" },
  { icon: "shield", label: "Safe & Secure" },
  { icon: "payments", label: "Transparent Pricing" },
];

const NAV_LINKS = ["Home", "Trips", "How it Works", "About", "Community", "FAQ"];

/* ------------------------------------------------------------------ */
/*  Hook: IntersectionObserver for fade-in animations                  */
/* ------------------------------------------------------------------ */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    container.querySelectorAll(".fade-in-section").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ------------------------------------------------------------------ */
/*  Landing Page Component                                             */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  const containerRef = useFadeIn();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div ref={containerRef} className="scroll-smooth">
      {/* ===== NAVIGATION ===== */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center px-4 md:px-16 py-4 max-w-[1280px] mx-auto">
          <div className="text-headline-md font-headline-md font-bold text-primary">
            MeetMyRoute
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex gap-6 items-center">
            {NAV_LINKS.map((link, i) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                className={`text-label-md font-label-md transition-colors hover:scale-105 duration-200 ${
                  i === 0
                    ? "text-primary border-b-2 border-primary pb-1"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {link}
              </a>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-label-md font-label-md text-on-surface-variant hover:text-primary"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="btn-primary-landing text-white px-6 py-3 rounded-full text-label-md font-label-md"
            >
              Join Now
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-primary p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-white transform transition-transform duration-300 md:hidden flex flex-col pt-24 px-4 gap-6 ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
            className="text-headline-md font-headline-md text-on-surface border-b border-surface-variant pb-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            {link}
          </a>
        ))}
        <div className="flex flex-col gap-4 mt-8">
          <Link
            href="/login"
            className="w-full text-label-md font-label-md px-6 py-4 rounded-full border-[1.5px] border-surface-variant text-on-surface text-center"
          >
            Login
          </Link>
          <Link
            href="/login"
            className="w-full text-label-md font-label-md px-6 py-4 rounded-full btn-primary-landing text-white text-center"
          >
            Join Now
          </Link>
        </div>
      </div>

      {/* ===== HERO SECTION ===== */}
      <header className="relative w-full min-h-[600px] h-[90vh] md:h-[920px] flex items-center justify-center pt-20">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url('${HERO_BG}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white/90" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-[1280px] px-4 md:px-16 text-center flex flex-col items-center fade-in-section">
          <h1 className="text-[32px] md:text-[48px] font-[800] text-white mb-6 drop-shadow-md max-w-4xl leading-[1.1] tracking-[-0.02em]">
            Meet New People.
            <br />
            Explore New Places.
          </h1>
          <p className="text-body-lg text-white/90 mb-10 max-w-2xl drop-shadow">
            Join curated group trips across India. Travel solo, as a couple, or
            with friends. Everything is planned for you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link
              href="/login"
              className="btn-primary-landing text-white px-8 py-4 rounded-full text-label-md font-label-md"
            >
              Explore Trips
            </Link>
            <a
              href="#how-it-works"
              className="glass-panel text-on-surface px-8 py-4 rounded-full text-label-md font-label-md hover:bg-white/90 transition-colors"
            >
              How It Works
            </a>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 mt-8 glass-panel px-8 py-4 rounded-full">
            {TRUST_BADGES.map((badge) => (
              <div key={badge.icon} className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-primary-container"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {badge.icon}
                </span>
                <span className="text-label-sm font-label-sm text-on-surface">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main>
        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-white">
          <div className="max-w-[1280px] mx-auto px-4 md:px-16">
            <div className="text-center mb-16 fade-in-section">
              <h2 className="text-headline-lg font-headline-lg text-on-surface mb-4">
                How It Works
              </h2>
              <p className="text-body-md text-on-surface-variant max-w-2xl mx-auto">
                Your journey from screen to summit, simplified.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {/* Connecting line (desktop only) */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-surface-variant -z-10 -translate-y-1/2" />

              {STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="bg-white rounded-2xl p-6 landing-card-shadow text-center relative fade-in-section"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <div className="w-16 h-16 mx-auto bg-surface-container rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-sm overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={step.title}
                      className="w-10 h-10 object-contain"
                      src={STEP_ICONS[i]}
                    />
                  </div>
                  <h3 className="text-[20px] font-headline-md mb-2">
                    {i + 1}. {step.title}
                  </h3>
                  <p className="text-on-surface-variant text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Upcoming Adventures Section */}
        <section className="py-20 bg-surface">
          <div className="max-w-[1280px] mx-auto px-4 md:px-16">
            <div className="flex justify-between items-end mb-12 fade-in-section">
              <div>
                <h2 className="text-headline-lg font-headline-lg text-on-surface mb-2">
                  Upcoming Adventures
                </h2>
                <p className="text-body-md text-on-surface-variant">
                  Hand-picked routes for the next month.
                </p>
              </div>
              <Link
                href="/login"
                className="hidden md:flex items-center gap-2 text-primary text-label-md font-label-md hover:underline"
              >
                View All{" "}
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </Link>
            </div>

            <div className="flex flex-col gap-8">
              {TRIPS.map((trip, i) => (
                <div
                  key={trip.title}
                  className="bg-white rounded-xl landing-card-shadow overflow-hidden flex flex-col md:flex-row group fade-in-section"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  {/* Trip Image */}
                  <div className="w-full md:w-2/5 h-64 md:h-auto relative overflow-hidden">
                    <div
                      className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105 min-h-[256px]"
                      style={{
                        backgroundImage: `url('${TRIP_IMAGES[trip.imgIdx]}')`,
                      }}
                    />
                    <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-label-sm font-label-sm flex items-center gap-1">
                      <span
                        className="material-symbols-outlined text-sm"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>{" "}
                      {trip.rating}
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="p-6 md:p-8 w-full md:w-3/5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-headline-md font-headline-md text-on-surface">
                          {trip.title}
                        </h3>
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-label-sm font-label-sm font-bold flex items-center gap-1 shrink-0 ml-2">
                          <span className="material-symbols-outlined text-sm">
                            person
                          </span>{" "}
                          Trip Captain
                        </span>
                      </div>
                      <p className="text-body-md text-on-surface-variant mb-6">
                        {trip.desc}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div>
                          <div className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                            Duration
                          </div>
                          <div className="text-label-md font-label-md text-on-surface flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-primary-container">
                              schedule
                            </span>{" "}
                            {trip.duration}
                          </div>
                        </div>
                        <div>
                          <div className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                            Pickup
                          </div>
                          <div className="text-label-md font-label-md text-on-surface flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-primary-container">
                              location_on
                            </span>{" "}
                            {trip.pickup}
                          </div>
                        </div>
                        <div>
                          <div className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                            Seats
                          </div>
                          <div className="text-label-md font-label-md text-on-surface flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-primary-container">
                              event_seat
                            </span>{" "}
                            {trip.seats}
                          </div>
                        </div>
                        <div>
                          <div className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                            Price
                          </div>
                          <div className="text-label-md font-label-md text-on-surface font-bold">
                            &#8377;{trip.price}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-surface-variant pt-6">
                      <Link
                        href="/login"
                        className="btn-primary-landing text-white px-8 py-3 rounded-full text-label-md font-label-md w-full md:w-auto text-center"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-surface-variant bg-white">
          <div className="max-w-[1280px] mx-auto px-4 md:px-16 py-16 flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="flex-1">
              <div className="text-headline-md font-headline-md font-extrabold text-primary mb-4">
                MeetMyRoute
              </div>
              <p className="text-body-md text-on-surface-variant max-w-sm mb-6">
                &copy; {new Date().getFullYear()} MeetMyRoute. All rights
                reserved. Premium Group Travel Redefined.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-label-md font-label-md text-on-surface font-bold mb-2">
                Company
              </h4>
              <a href="#" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                About Us
              </a>
              <a href="#" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                Contact Us
              </a>
              <a href="#" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                Partner with Us
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-label-md font-label-md text-on-surface font-bold mb-2">
                Explore
              </h4>
              <a href="#" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                Destinations
              </a>
              <a href="#" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                Travel Insurance
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-label-md font-label-md text-on-surface font-bold mb-2">
                Legal
              </h4>
              <a href="#" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
