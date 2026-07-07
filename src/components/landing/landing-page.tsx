"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";

/* ------------------------------------------------------------------ */
/*  Image URLs from the design                                        */
/* ------------------------------------------------------------------ */
// `=w2560` requests the source's full-resolution render (1376×768) of the same
// image instead of the low-res 512×286 default — sharper on the full-bleed hero.
const HERO_BG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAD7CRbu1MDRsH4TN6CMMoCuZem3bk7Zoa_bscO-phi_SuypUigU8_5QJZGTeNS_ktfncpFQBKZtFu3rAO0JX-qcm-O4Sj0EA08Z10p0AScu-A7iJPOGzB2CSra3zxcvfjgBXNt2iHnS6Xl0fr4JrMG-2UTby9AL3upWcLLHem5w300tDsCUG5YJJbznbq9aB80G8OMtG-44TQ98OFl_bUJPbLhMijXnLd_jebhBFcneWlESt43Uc_n=w2560";

const STEP_ICONS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBHQ7RNN3bT2rmilrHFViorROIXJ177X-nZ8jDy_dqomESNtgcNTDkiAhU0nNudPdi5mwPyk4m-FKIhU480V5ckbF3xcs0-0owrtfWR05WSt0ezMNqkPxCZEnt9mvNyB3-g0FbpCRqiByvbUtCNR30Q7vnu9a3xQV62murC2CaLqUBCubfPu07uOD0hTwEfRcoPE4D1sufUJKJJ6H7O_h0cjk9nSqUq0cC41mjkWPOZzdIPphBdgygZ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCoYpdPoFbm8Q5X4a2_RMRTQDC55d_kGKgfBAjsKaSSsuNYbaytZ2OycxZ1d5-Tb1xEcyrNkX3keAUJZNLsu6qtk2jPX-Arq-NTLnnkNnXp7ghG0vON0TYMoOrmw9YIDCisDay4MDfzC6GKkf04n-fuhn4RlUjdKqNVSqP5fFHDXOj4cBjG-FyFpwb8ZGrfUNpG56RrPJ4VSI0HN7_1foZxM6ajfvz426MHpdXudKgj3-1y3HzjGQNM",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuASgCuoM4A3ZB1SWwebc5rAm-DCmeLFIgS1_1nJB4JrtO5-8YyalYtMelJSs4bSlDCWxfFPDD2klt3mCo_6MgIg-Yja853r2IVpX1FSubPYyV9XPx682kPBLW6GwS-yOl7UptWk5urfIG-Th42LPqvwXihRPl7Xz1ho8-5ZLPiP2JBGDfLb172I0HbE356crGzyZIjpiZd9tEOubw4ri265IvnvGMyzhnIk72PHcI4q7p687SQpNw5s",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLby_3IZE_IgBbtaY5TZRxyB1dNPogJIXCJrv8h24hGMZei_DPiLFrv2_l6NdIoZutjxS-gq3Rf-GQSThWVS3VReln_AsRpAuAgB6_u1XwbQNQMpa0YlS4lMCcEeypRniwdpXgnMa7KYo9aUMTT18ch52g7IEttMCi5e8JnGo44A1UGvO-7hy5JmgPQpYm0Je9Qqt7uqF7vZGE7VYBJVU1jYOEfVg-PGl6D9hj-19V4KQ-ilauSria",
];

// One distinct image per upcoming trip, matched to its destination.
const TRIP_IMAGES = [
  // Majestic Manali Escape — Himalayas
  "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=80",
  // The Leh Ladakh Expedition — Pangong Lake
  "https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?w=1200&q=80",
  // Amalfi Coast Explorer — Italian coastline
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&q=80",
  // Kyoto Serenity — Japan
  "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&q=80",
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
  { icon: "local_police", label: "Verified Shepherds" },
  { icon: "shield", label: "Safe & Secure" },
  { icon: "payments", label: "Transparent Pricing" },
];

const NAV_LINKS = ["Home", "Trips", "How it Works", "About", "Community", "FAQ"];

const STATS = [
  { value: "500+", label: "Trips Hosted" },
  { value: "12k+", label: "Happy Travelers" },
  { value: "80+", label: "Destinations" },
  { value: "4.9", label: "Avg. Rating" },
];

const TESTIMONIALS = [
  {
    quote:
      "I booked solo and came back with a whole crew of friends. The captains made me feel safe the entire trip.",
    name: "Ananya Rao",
    trip: "Leh Ladakh Expedition",
  },
  {
    quote:
      "Everything was planned to the last detail — I just showed up and enjoyed. Best group trip I've ever taken.",
    name: "Rohan Mehta",
    trip: "Majestic Manali Escape",
  },
  {
    quote:
      "Transparent pricing, no hidden charges, and an amazing herd of people. Already booking my next one!",
    name: "Priya Nair",
    trip: "Kyoto Serenity",
  },
];

const FAQS = [
  {
    q: "How do I book a trip?",
    a: "Browse our curated trips, pick your seat, and pay securely online. You'll get instant confirmation and joining details.",
  },
  {
    q: "Are the trips safe for solo travelers?",
    a: "Absolutely. Every trip is led by verified captains, and we keep women-friendly groups so you can travel worry-free.",
  },
  {
    q: "What's included in the price?",
    a: "Stays, transport, planned activities, and a dedicated trip captain. Inclusions are listed clearly on each trip page — no hidden charges.",
  },
  {
    q: "Can I get a refund if I cancel?",
    a: "Yes. Cancellations follow a transparent, tiered refund policy shown at checkout, so you always know where you stand.",
  },
  {
    q: "Who will I be traveling with?",
    a: "Like-minded travelers from across India — solo adventurers, couples, and friends. You'll meet your crew in a group chat before departure.",
  },
];

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
/*  Decorative: smooth curve that flows the hero into the page          */
/* ------------------------------------------------------------------ */
function HeroCurve() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[6]"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 170"
        preserveAspectRatio="none"
        className="h-[80px] w-full md:h-[150px]"
      >
        {/* soft coral swell */}
        <path
          d="M0,96 C320,26 560,150 800,96 C1040,46 1240,146 1440,90 L1440,170 L0,170 Z"
          fill="var(--color-primary)"
          opacity="0.10"
        />
        {/* white crest that blends into the section below */}
        <path
          d="M0,122 C320,58 560,172 800,122 C1040,76 1240,164 1440,116 L1440,170 L0,170 Z"
          fill="#ffffff"
        />
      </svg>
    </div>
  );
}

/* Soft coral glow orb — modern ambient accent, tints with the theme */
function Orb({ className, size = 260 }: { className?: string; size?: number }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-3xl ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 22%, transparent) 0%, transparent 70%)",
      }}
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Landing Page Component                                             */
/* ------------------------------------------------------------------ */
export interface LandingContentProps {
  hero?: { titleLine1: string; titleLine2: string; subtitle: string; imageUrl: string; primaryCta?: string; secondaryCta?: string };
  steps?: { title: string; desc: string }[];
  trustBadges?: { icon: string; label: string }[];
  stats?: { value: string; label: string }[];
  testimonials?: { quote: string; name: string; trip: string }[];
  faqs?: { question: string; answer: string }[];
  navLinks?: string[];
  buttons?: Record<string, string>;
  sections?: Record<string, string>;
  footer?: Record<string, string>;
}

export default function LandingPage(props: LandingContentProps = {}) {
  const containerRef = useFadeIn();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin-editable content, falling back to the built-in defaults when a block
  // hasn't been customised (or the DB is unavailable).
  const hero = props.hero ?? {
    titleLine1: "Meet New People.",
    titleLine2: "Explore New Places.",
    subtitle:
      "Join curated group trips across India. Travel solo, as a couple, or with friends. Everything is planned for you.",
    imageUrl: HERO_BG,
  };
  const heroPrimaryCta = hero.primaryCta || "Explore Trails";
  const heroSecondaryCta = hero.secondaryCta || "How It Works";
  const steps = props.steps?.length ? props.steps : STEPS;
  const trustBadges = props.trustBadges?.length ? props.trustBadges : TRUST_BADGES;
  const stats = props.stats?.length ? props.stats : STATS;
  const testimonials = props.testimonials?.length ? props.testimonials : TESTIMONIALS;
  const faqs = props.faqs?.length
    ? props.faqs
    : FAQS.map((f) => ({ question: f.q, answer: f.a }));
  const navLinks = props.navLinks?.length ? props.navLinks : NAV_LINKS;
  const btn = props.buttons ?? {};
  const loginLabel = btn.login || "Login";
  const joinLabel = btn.join || "Join Now";
  const sx = props.sections ?? {};
  const footerCopyright = props.footer?.copyright || "Travelling Goats. All rights reserved.";

  return (
    <div ref={containerRef} className="scroll-smooth">
      {/* ===== NAVIGATION ===== */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center px-4 md:px-16 py-4 max-w-[1280px] mx-auto">
          <BrandLogo size="sm" />

          {/* Desktop Nav Links */}
          <div className="hidden md:flex gap-6 items-center">
            {navLinks.map((link, i) => (
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
              {loginLabel}
            </Link>
            <Link
              href="/login"
              className="btn-primary-landing text-white px-6 py-3 rounded-full text-label-md font-label-md"
            >
              {joinLabel}
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
        {navLinks.map((link) => (
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
      <header id="home" className="relative w-full min-h-[680px] h-[92vh] md:h-[920px] flex items-start md:items-center justify-center pt-44 md:pt-20 pb-16 md:pb-0 scroll-mt-24">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-[position:52%_30%] md:bg-center"
            style={{ backgroundImage: `url('${hero.imageUrl}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white/90" />
          {/* Golden-hour sun glow */}
          <div
            className="animate-float-slow pointer-events-none absolute right-[12%] top-[16%] h-40 w-40 rounded-full opacity-60 blur-2xl md:h-56 md:w-56"
            style={{ background: "radial-gradient(circle, rgba(255,214,153,0.9) 0%, rgba(255,183,94,0.35) 45%, transparent 70%)" }}
            aria-hidden="true"
          />
          {/* Drifting clouds */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="animate-drift absolute left-[8%] top-[14%] h-10 w-40 rounded-full bg-white/40 blur-xl md:h-16 md:w-72" />
            <div className="animate-drift-rev absolute left-[52%] top-[9%] h-8 w-32 rounded-full bg-white/30 blur-xl md:h-12 md:w-56" />
            <div className="animate-drift absolute left-[28%] top-[26%] h-7 w-28 rounded-full bg-white/25 blur-lg md:h-10 md:w-48" />
          </div>
        </div>

        {/* Layered mountains + goat rising from the hero base */}
        <HeroCurve />

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-[1280px] px-4 md:px-16 text-center flex flex-col items-center fade-in-section">
          <h1 className="text-[30px] md:text-[48px] font-[800] text-white mb-4 md:mb-6 drop-shadow-md max-w-4xl leading-[1.12] tracking-[-0.02em]">
            {hero.titleLine1}
            <br />
            {hero.titleLine2}
          </h1>
          <p className="text-body-md md:text-body-lg text-white/90 mb-5 md:mb-10 max-w-2xl drop-shadow">
            {hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-16 w-full sm:w-auto">
            <Link
              href="/login"
              className="btn-primary-landing text-white px-8 py-4 rounded-full text-label-md font-label-md"
            >
              {heroPrimaryCta}
            </Link>
            <a
              href="#how-it-works"
              className="glass-panel text-on-surface px-8 py-4 rounded-full text-label-md font-label-md hover:bg-white/90 transition-colors"
            >
              {heroSecondaryCta}
            </a>
          </div>

          {/* Trust Badges */}
          <div className="grid w-full max-w-[340px] grid-cols-2 gap-x-3 gap-y-2 mt-2 glass-panel px-4 py-3 rounded-2xl md:flex md:w-auto md:max-w-none md:flex-wrap md:justify-center md:gap-12 md:mt-8 md:px-8 md:py-4 md:rounded-full">
            {trustBadges.map((badge) => (
              <div key={badge.icon} className="flex items-center gap-1.5 md:gap-2">
                <span
                  className="material-symbols-outlined text-[18px] text-primary-container shrink-0 md:text-[24px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {badge.icon}
                </span>
                <span className="text-[11px] font-label-sm leading-tight text-on-surface md:text-label-sm">
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
        <section id="how-it-works" className="py-20 bg-white topo-texture scroll-mt-24">
          <div className="max-w-[1280px] mx-auto px-4 md:px-16">
            <div className="text-center mb-16 fade-in-section">
              <h2 className="text-headline-lg font-headline-lg text-on-surface mb-4">
                {sx.howTitle || "How It Works"}
              </h2>
              <p className="text-body-md text-on-surface-variant max-w-2xl mx-auto">
                {sx.howSubtitle || "Your journey from screen to summit, simplified."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {/* Winding hikers' trail connecting the steps (desktop only) */}
              <svg
                className="hidden md:block absolute top-1/2 left-0 w-full h-16 -z-10 -translate-y-1/2"
                viewBox="0 0 1200 60"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M40,30 C180,-8 300,66 460,30 C620,-8 740,66 900,30 C1020,4 1120,50 1160,30"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2.5"
                  strokeDasharray="1 11"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              </svg>

              {steps.map((step, i) => (
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
                      src={STEP_ICONS[i % STEP_ICONS.length]}
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
        <section id="trips" className="relative overflow-hidden py-20 bg-surface scroll-mt-24">
          <Orb className="left-[-90px] top-6" size={320} />
          <Orb className="right-[-70px] bottom-8" size={260} />
          <div className="max-w-[1280px] mx-auto px-4 md:px-16">
            <div className="flex justify-between items-end mb-12 fade-in-section">
              <div>
                <h2 className="text-headline-lg font-headline-lg text-on-surface mb-2">
                  {sx.upcomingTitle || "Upcoming Adventures"}
                </h2>
                <p className="text-body-md text-on-surface-variant">
                  {sx.upcomingSubtitle || "Hand-picked routes for the next month."}
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
                          Shepherd
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
                        Join the Herd
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 bg-white topo-texture scroll-mt-24">
          <div className="max-w-[1280px] mx-auto px-4 md:px-16">
            <div className="max-w-3xl mx-auto text-center mb-14 fade-in-section">
              <h2 className="text-headline-lg font-headline-lg text-on-surface mb-4">
                {sx.aboutTitle || "About Travelling Goats"}
              </h2>
              <p className="text-body-md text-on-surface-variant">
                {sx.aboutBody || "We started Travelling Goats to make group travel effortless, safe, and unforgettable. Every itinerary is handpicked, every captain is verified, and every price is transparent — so you can focus on the adventure and the friends you'll make along the way."}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 fade-in-section">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-surface rounded-xl p-6 text-center landing-card-shadow"
                >
                  <div className="text-headline-lg font-headline-lg text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-label-md font-label-md text-on-surface-variant">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Community Section */}
        <section id="community" className="relative overflow-hidden py-20 bg-surface scroll-mt-24">
          <Orb className="right-[-90px] top-2" size={300} />
          <div className="max-w-[1280px] mx-auto px-4 md:px-16">
            <div className="text-center mb-14 fade-in-section">
              <h2 className="text-headline-lg font-headline-lg text-on-surface mb-4">
                {sx.communityTitle || "Loved by the Herd"}
              </h2>
              <p className="text-body-md text-on-surface-variant max-w-2xl mx-auto">
                {sx.communitySubtitle || "Real stories from travelers who found new places — and new friends — with us."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                <div
                  key={t.name}
                  className="bg-white rounded-xl p-8 landing-card-shadow flex flex-col fade-in-section"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <span
                    className="material-symbols-outlined text-primary mb-4"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    format_quote
                  </span>
                  <p className="text-body-md text-on-surface mb-6 flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center text-label-md font-label-md font-bold shrink-0">
                      {t.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="text-label-md font-label-md text-on-surface font-bold">
                        {t.name}
                      </div>
                      <div className="text-label-sm font-label-sm text-on-surface-variant">
                        {t.trip}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 bg-white topo-texture scroll-mt-24">
          <div className="max-w-3xl mx-auto px-4 md:px-16">
            <div className="text-center mb-14 fade-in-section">
              <h2 className="text-headline-lg font-headline-lg text-on-surface mb-4">
                {sx.faqTitle || "Frequently Asked Questions"}
              </h2>
              <p className="text-body-md text-on-surface-variant">
                {sx.faqSubtitle || "Everything you need to know before you join the herd."}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {faqs.map((faq, i) => (
                <details
                  key={`${faq.question}-${i}`}
                  className="group bg-surface rounded-xl px-6 py-5 fade-in-section"
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden text-title-md font-title-md text-on-surface">
                    {faq.question}
                    <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-300 group-open:rotate-180">
                      expand_more
                    </span>
                  </summary>
                  <p className="text-body-md text-on-surface-variant mt-4">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-surface-variant bg-white">
          <div className="max-w-[1280px] mx-auto px-4 md:px-16 pt-16 pb-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-10 md:gap-8 text-center md:text-left">
            <div className="flex-1 flex justify-center md:justify-start">
              <BrandLogo size="md" variant="stacked" />
            </div>

            <div className="flex flex-col items-center md:items-start gap-3">
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

            <div className="flex flex-col items-center md:items-start gap-3">
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

            <div className="flex flex-col items-center md:items-start gap-3">
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

          <div className="max-w-[1280px] mx-auto px-4 md:px-16 border-t border-surface-variant py-6">
            <p className="text-body-md text-on-surface-variant text-center">
              &copy; {new Date().getFullYear()} {footerCopyright}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
