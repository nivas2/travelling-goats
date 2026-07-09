"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CookieConsent, SubscribeModal, LiveActivityToast } from "@/components/landing/site-popups";

/* ------------------------------------------------------------------ */
/*  Fallback hero image — self-hosted moody misty-forest photo          */
/* ------------------------------------------------------------------ */
const HERO_BG = "/uploads/hero-fog-forest.jpg";

/* ------------------------------------------------------------------ */
/*  Static defaults                                                    */
/* ------------------------------------------------------------------ */
const STEPS = [
  { title: "Choose a Trail", desc: "Browse curated itineraries designed for maximum exploration." },
  { title: "Book Your Seat", desc: "Secure your spot with easy, transparent payments." },
  { title: "Meet Your Crew", desc: "Connect with fellow travelers before the journey begins." },
  { title: "Enjoy the Journey", desc: "Leave the planning to us and focus on the memories." },
];

const TRUST_BADGES = [
  { icon: "verified_user", label: "Verified Travelers" },
  { icon: "local_police", label: "Verified Shepherds" },
  { icon: "shield", label: "Safe & Secure" },
  { icon: "payments", label: "Transparent Pricing" },
];

const NAV_LINKS = ["Home", "Trips", "How it Works", "About", "Community", "FAQ"];

const STATS = [
  { value: "500+", label: "Trails Hosted" },
  { value: "12k+", label: "Happy Travelers" },
  { value: "80+", label: "Destinations" },
  { value: "4.9", label: "Avg. Rating" },
];

const CATEGORIES = ["All", "Adventure", "Mountain", "Beach", "Cultural", "Wildlife", "Road Trip", "Spiritual", "City"];

// Normalise category labels/enum values so "Road Trip" matches "ROAD_TRIP".
const normCat = (s: string) => s.toLowerCase().replace(/[\s_]+/g, "");

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

/** Adds `.is-visible` to every `.lp-reveal` as it scrolls into view. */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    root.querySelectorAll(".lp-reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

/** True once the page is scrolled past `y`. */
function useScrolled(y = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > y);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [y]);
  return scrolled;
}

/** Animated count-up that fires when the element enters the viewport.
 *  Defaults to the final number, so it's always correct even if the
 *  observer/animation never runs (no-JS, reduced motion, prerender). */
function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  // Split "12k+" → prefix "", num 12, suffix "k+"; "4.9" → 4.9, ""
  const parsed = useMemo(() => {
    const m = value.match(/^([^\d]*)([\d.]+)(.*)$/);
    if (!m) return { prefix: "", numStr: value, target: 0, decimals: 0, suffix: "" };
    const numStr = m[2];
    return {
      prefix: m[1] ?? "",
      numStr,
      target: parseFloat(numStr),
      decimals: numStr.includes(".") ? (numStr.split(".")[1]?.length ?? 0) : 0,
      suffix: m[3] ?? "",
    };
  }, [value]);

  const [display, setDisplay] = useState(parsed.numStr);

  useEffect(() => {
    const el = ref.current;
    setDisplay(parsed.numStr);
    if (!el || typeof IntersectionObserver === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let started = false;
    const dur = 1400;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started) return;
        started = true;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay((parsed.target * eased).toFixed(parsed.decimals));
          if (p < 1) raf = requestAnimationFrame(tick);
          else setDisplay(parsed.numStr);
        };
        raf = requestAnimationFrame(tick);
        // Safety: guarantee the final value lands even if rAF is throttled.
        timer = setTimeout(() => setDisplay(parsed.numStr), dur + 250);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [parsed]);

  return (
    <span ref={ref} className={className}>
      {parsed.prefix}
      {display}
      {parsed.suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Landing brand lockup — theme-matched (forest badge + lime mark).    */
/*  Scoped to the landing so the app/admin logo is untouched.           */
/* ------------------------------------------------------------------ */
function LandingBrand({ size = "sm", onDark = false }: { size?: "sm" | "md"; onDark?: boolean }) {
  const badge = size === "md" ? "h-11 w-11 rounded-2xl" : "h-9 w-9 rounded-xl";
  const icon = size === "md" ? "text-[24px]" : "text-[20px]";
  const text = size === "md" ? "text-[21px]" : "text-[18px]";
  return (
    <Link href="/" aria-label="Travelling Goats" className="group inline-flex items-center gap-2.5">
      <span className={`flex items-center justify-center bg-[#181D27] transition-transform duration-300 group-hover:-rotate-6 ${badge}`}>
        <span className={`material-symbols-outlined text-[#C6F135] ${icon}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          landscape
        </span>
      </span>
      <span className={`font-bold leading-none tracking-[-0.01em] ${text} ${onDark ? "text-white" : "text-[#181D27]"}`}>
        Travelling <span className={onDark ? "text-[#C6F135]" : "text-[#181D27]"}>Goats</span>
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
export interface LandingTrip {
  id?: string;
  title: string;
  description: string;
  category?: string;
  destination?: string;
  duration: string;
  pickup: string;
  seats: string;
  price: string;
  rating: string;
  image: string;
}

export interface LandingContentProps {
  hero?: { titleLine1: string; titleLine2: string; subtitle: string; imageUrl: string; primaryCta?: string; secondaryCta?: string };
  steps?: { title: string; desc: string }[];
  trustBadges?: { icon: string; label: string }[];
  stats?: { value: string; label: string }[];
  trips?: LandingTrip[];
  testimonials?: { quote: string; name: string; trip: string }[];
  faqs?: { question: string; answer: string }[];
  navLinks?: string[];
  buttons?: Record<string, string>;
  sections?: Record<string, string>;
  footer?: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function LandingPage(props: LandingContentProps = {}) {
  const rootRef = useReveal();
  const scrolled = useScrolled(20);
  const [menuOpen, setMenuOpen] = useState(false);
  // "N exploring now" — randomised client-side (< 200) so it feels live.
  const [liveCount, setLiveCount] = useState(128);
  useEffect(() => {
    setLiveCount(Math.floor(Math.random() * 160) + 40); // 40–199
  }, []);
  const [cat, setCat] = useState("All");

  const hero = props.hero ?? {
    titleLine1: "Meet new people.",
    titleLine2: "Explore without fear.",
    subtitle:
      "Join curated group trails across India. Travel solo, as a couple, or with friends — everything is planned, so you just show up and wander.",
    imageUrl: HERO_BG,
  };
  const heroPrimaryCta = hero.primaryCta || "Explore Trails";
  const heroSecondaryCta = hero.secondaryCta || "How It Works";
  const steps = props.steps?.length ? props.steps : STEPS;
  const trustBadges = props.trustBadges?.length ? props.trustBadges : TRUST_BADGES;
  const stats = props.stats?.length ? props.stats : STATS;
  const trips = props.trips ?? [];
  const testimonials = props.testimonials ?? [];
  const faqs = props.faqs ?? [];
  const navLinks = props.navLinks?.length ? props.navLinks : NAV_LINKS;
  const btn = props.buttons ?? {};
  const loginLabel = btn.login || "Login";
  const joinLabel = btn.join || "Join Now";
  const sx = props.sections ?? {};
  const footerCopyright = props.footer?.copyright || "Travelling Goats. All rights reserved.";

  const visibleTrips = useMemo(() => {
    if (cat === "All") return trips;
    return trips.filter((t) => t.category && normCat(t.category) === normCat(cat));
  }, [cat, trips]);

  // Categories that actually have trips (hide empty chips).
  const activeCategories = useMemo(
    () =>
      CATEGORIES.filter(
        (c) => c === "All" || trips.some((t) => t.category && normCat(t.category) === normCat(c))
      ),
    [trips]
  );

  return (
    <div ref={rootRef} className="scroll-smooth text-[#181D27] antialiased">
      {/* ===== NAV ===== */}
      <nav className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-4">
        <div
          className={`mx-auto flex max-w-[1180px] items-center justify-between rounded-full py-2 pl-4 pr-2 ring-1 transition-all duration-300 md:pl-5 ${
            scrolled
              ? "lp-glass shadow-[0_10px_30px_rgba(20,40,30,0.10)] ring-black/[0.06]"
              : "bg-white/10 backdrop-blur-md ring-white/15"
          }`}
        >
          <LandingBrand size="sm" onDark={!scrolled} />

          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link, i) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                className={`rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${
                  i === 0
                    ? scrolled
                      ? "bg-[#181D27] text-white"
                      : "bg-white/15 text-white ring-1 ring-white/25"
                    : scrolled
                      ? "text-on-surface-variant hover:bg-black/[0.05] hover:text-on-surface"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className={`rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${
                scrolled ? "text-on-surface-variant hover:text-on-surface" : "text-white/80 hover:text-white"
              }`}
            >
              {loginLabel}
            </Link>
            <Link
              href="/login"
              className="lp-lime-btn inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[14px] font-semibold"
            >
              {joinLabel}
              <span className="material-symbols-outlined text-[18px]">arrow_outward</span>
            </Link>
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#181D27] text-white md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">{menuOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-40 flex flex-col gap-2 bg-[#F2F2F5] px-5 pt-24 transition-transform duration-300 md:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {navLinks.map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
            className="border-b border-black/10 py-4 text-[22px] font-semibold"
            onClick={() => setMenuOpen(false)}
          >
            {link}
          </a>
        ))}
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/login" className="rounded-full border border-black/15 py-4 text-center font-semibold">
            {loginLabel}
          </Link>
          <Link href="/login" className="lp-lime-btn rounded-full py-4 text-center font-semibold">
            {joinLabel}
          </Link>
        </div>
      </div>

      {/* ===== HERO — full-width image, copy overlaid ===== */}
      <header id="home" className="relative min-h-[100svh] w-full overflow-hidden">
        {/* full-bleed image with a slow zoom */}
        <div
          className="lp-hero-img absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${hero.imageUrl}')` }}
        />
        {/* legibility + mood gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F16]/65 via-[#0B0F16]/25 to-[#0B0F16]/85" />
        {/* cinematic vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(115% 85% at 50% 8%, transparent 42%, rgba(8,11,17,0.6) 100%)" }}
          aria-hidden
        />
        {/* film grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-soft-light"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
          aria-hidden
        />

        {/* copy */}
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1020px] flex-col items-center justify-center px-5 pb-28 pt-32 text-center">
          {/* live social proof pill */}
          <div className="lp-reveal flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.08] py-1.5 pl-1.5 pr-4 backdrop-blur-md">
            <div className="flex -space-x-2.5">
              {["/uploads/avatar1.jpg", "/uploads/avatar2.jpg", "/uploads/avatar3.jpg", "/uploads/avatar4.jpg"].map((src) => (
                <img key={src} src={src} alt="" className="h-7 w-7 rounded-full border-2 border-[#0B0F16] object-cover" />
              ))}
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-[#0B0F16] bg-[#C6F135] px-1 text-[10px] font-bold text-[#181D27]">
                +{liveCount}
              </span>
            </div>
            <span className="flex items-center gap-2 text-[13px] font-medium text-white">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C6F135] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C6F135]" />
              </span>
              {liveCount} exploring now
            </span>
          </div>

          {/* eyebrow */}
          <span className="lp-reveal mt-8 text-[12px] font-semibold uppercase tracking-[0.28em] text-[#C6F135]">
            Curated group adventures
          </span>

          {/* editorial mixed-weight headline */}
          <h1
            className="lp-reveal mt-4 text-[clamp(40px,7.2vw,80px)] leading-[1.0] tracking-[-0.035em] text-white"
            style={{ textShadow: "0 2px 30px rgba(0,0,0,0.35)" }}
          >
            <span className="block font-light text-white/90">{hero.titleLine1}</span>
            <span className="block font-semibold text-[#C6F135]">{hero.titleLine2}</span>
          </h1>

          {/* rating row */}
          <div className="lp-reveal mt-6 flex items-center gap-2.5">
            <div className="flex">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="material-symbols-outlined text-[18px] text-[#C6F135]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
              ))}
            </div>
            <span className="text-[13px] text-white/80">
              <span className="font-semibold text-white">4.9</span> from 2,300+ traveller reviews
            </span>
          </div>

          <p className="lp-reveal mt-5 max-w-xl text-[16px] leading-relaxed text-white/80 md:text-[18px]">{hero.subtitle}</p>

          <div className="lp-reveal mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#C6F135] px-8 py-4 text-[15px] font-semibold text-[#181D27] shadow-[0_14px_40px_rgba(198,241,53,0.42)] transition-transform hover:-translate-y-0.5"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#181D27] text-[#C6F135] transition-transform group-hover:rotate-12">
                <span className="material-symbols-outlined text-[18px]">explore</span>
              </span>
              {heroPrimaryCta}
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/[0.08] px-8 py-4 text-[15px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/[0.16]"
            >
              {heroSecondaryCta}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </a>
          </div>

          {/* trust badges */}
          <div className="lp-reveal mt-11 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
            {trustBadges.map((b) => (
              <div key={b.icon} className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[19px] text-[#C6F135]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {b.icon}
                </span>
                <span className="text-[13px] font-medium text-white/75">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* scroll cue */}
        <a
          href="#trips"
          className="lp-reveal absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5 text-white/60 transition-colors hover:text-white"
          aria-label="Scroll to explore"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em]">Scroll</span>
          <span className="flex h-9 w-6 items-start justify-center rounded-full border border-white/30 pt-1.5">
            <span className="lp-scroll-dot h-1.5 w-1.5 rounded-full bg-[#C6F135]" />
          </span>
        </a>
      </header>

      {/* ===== CATEGORY STRIP ===== */}
      <section id="trips" className="px-3 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-[1240px]">
          <div className="lp-reveal mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[clamp(26px,3.4vw,40px)] font-semibold tracking-[-0.02em]">
                {sx.upcomingTitle || "Popular trails, hand-picked"}
              </h2>
              <p className="mt-1 text-[15px] text-[#59614F]">{sx.upcomingSubtitle || "Fresh routes for the next month — filter by what you love."}</p>
            </div>
            <Link href="/login" className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#181D27] hover:underline">
              View all <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>

          {/* chips */}
          <div className="lp-reveal lp-hide-scrollbar mb-8 flex gap-2.5 overflow-x-auto pb-1">
            {activeCategories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 rounded-full px-5 py-2.5 text-[14px] font-medium transition-all ${
                  cat === c ? "bg-[#181D27] text-white shadow-[0_8px_20px_rgba(21,39,29,0.25)]" : "glass text-[#181D27]/70 hover:text-[#181D27]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* trips grid */}
          {visibleTrips.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleTrips.map((trip, i) => (
                <article
                  key={trip.id ?? trip.title}
                  className="lp-reveal lp-lift group relative flex h-[420px] flex-col justify-end overflow-hidden rounded-[26px] bg-[#181D27] [transform:translateZ(0)]"
                  style={{ transitionDelay: `${(i % 3) * 0.08}s` }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] group-hover:scale-105"
                    style={{ backgroundImage: `url('${trip.image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181D27]/85 via-[#181D27]/20 to-transparent" />

                  {/* top row: rating + save */}
                  <div className="absolute inset-x-4 top-4 flex items-center justify-between">
                    <span className="lp-glass-dark inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-semibold text-white">
                      <span className="material-symbols-outlined text-[15px] text-[#C6F135]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                      {trip.rating}
                    </span>
                    <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[#181D27] transition-transform hover:scale-105">
                      <span className="material-symbols-outlined text-[18px]">bookmark</span>
                    </button>
                  </div>

                  {/* content */}
                  <div className="relative p-5 text-white">
                    {trip.category && (
                      <span className="mb-2 inline-flex rounded-full bg-[#C6F135] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#181D27]">
                        {trip.category.replace(/_/g, " ")}
                      </span>
                    )}
                    <div className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-white/80">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      {trip.destination || trip.pickup}
                    </div>
                    <h3 className="text-[21px] font-bold leading-tight">{trip.title}</h3>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="lp-glass-dark inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] text-white">
                        <span className="material-symbols-outlined text-[14px]">schedule</span> {trip.duration}
                      </span>
                      <span className="lp-glass-dark inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] text-white">
                        <span className="material-symbols-outlined text-[14px]">event_seat</span> {trip.seats}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-white/60">From</div>
                        <div className="text-[20px] font-bold">{trip.price}</div>
                      </div>
                      <Link
                        href="/login"
                        className="lp-lime-btn inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[14px] font-semibold"
                      >
                        Join <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="lp-reveal rounded-[26px] bg-white/60 py-16 text-center">
              <span className="material-symbols-outlined mb-3 block text-[44px] text-[#181D27]/40">explore</span>
              <p className="text-[15px] text-[#59614F]">New adventures are being charted. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* ===== STATS BAND (forest) ===== */}
      <section id="about" className="px-3 py-6 md:px-6">
        <div className="mx-auto max-w-[1240px]">
          <div className="lp-reveal relative overflow-hidden rounded-[32px] bg-[#181D27] px-6 py-12 md:px-14 md:py-16">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#C6F135]/10 blur-3xl" aria-hidden />
            <div className="relative mx-auto mb-10 max-w-2xl text-center">
              <h2 className="text-[clamp(26px,3.4vw,40px)] font-semibold tracking-[-0.02em] text-white">
                {sx.aboutTitle || "Built for people who'd rather wander"}
              </h2>
              <p className="mt-3 text-[15px] text-white/70">
                {sx.aboutBody ||
                  "Every itinerary is handpicked, every shepherd is verified, and every price is transparent — so you focus on the adventure and the friends you make along the way."}
              </p>
            </div>
            <div className="relative grid grid-cols-2 gap-4 md:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-[22px] bg-white/[0.06] p-6 text-center ring-1 ring-white/10">
                  <CountUp value={s.value} className="block text-[clamp(30px,4vw,48px)] font-bold leading-none text-[#C6F135]" />
                  <div className="mt-2 text-[13px] font-medium text-white/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="px-3 py-14 md:px-6 md:py-20">
        <div className="mx-auto max-w-[1240px]">
          <div className="lp-reveal mb-12 max-w-2xl">
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#181D27]">How it works</span>
            <h2 className="mt-2 text-[clamp(26px,3.4vw,40px)] font-semibold tracking-[-0.02em]">
              {sx.howTitle || "From screen to summit in four steps"}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className={`lp-reveal lp-lift rounded-[24px] p-6 ${
                  i === 0 ? "bg-[#181D27] text-white" : "glass"
                }`}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div
                  className={`mb-8 flex h-12 w-12 items-center justify-center rounded-full text-[18px] font-bold ${
                    i === 0 ? "bg-[#C6F135] text-[#181D27]" : "bg-[#F2F2F5] text-[#181D27]"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className={`text-[19px] font-bold ${i === 0 ? "text-white" : "text-[#181D27]"}`}>{step.title}</h3>
                <p className={`mt-2 text-[14px] ${i === 0 ? "text-white/70" : "text-[#59614F]"}`}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMMUNITY (marquee) ===== */}
      {testimonials.length > 0 && (
        <section id="community" className="overflow-hidden py-14 md:py-20">
          <div className="lp-reveal mx-auto mb-10 max-w-[1240px] px-3 text-center md:px-6">
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#181D27]">Community</span>
            <h2 className="mt-2 text-[clamp(26px,3.4vw,40px)] font-semibold tracking-[-0.02em]">{sx.communityTitle || "Loved by the herd"}</h2>
          </div>

          <div className="relative">
            {/* edge fades */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#F2F2F5] to-transparent md:w-32" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#F2F2F5] to-transparent md:w-32" />
            <div className="lp-marquee-track flex w-max flex-nowrap gap-4 px-2">
              {(() => {
                // Fill at least one screen-width before duplicating for a seamless loop.
                const base = Array.from({ length: Math.max(6, testimonials.length) }, (_, i) => testimonials[i % testimonials.length]);
                return [...base, ...base];
              })().map((t, i) => (
                <figure key={i} className="glass w-[340px] shrink-0 rounded-[24px] p-7">
                  <span className="material-symbols-outlined text-[28px] text-[#C6F135]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    format_quote
                  </span>
                  <blockquote className="mt-3 text-[15px] leading-relaxed text-[#181D27]">&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#181D27] text-[14px] font-bold text-[#C6F135]">
                      {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold">{t.name}</div>
                      <div className="text-[13px] text-[#59614F]">{t.trip}</div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== FAQ ===== */}
      {faqs.length > 0 && (
        <section id="faq" className="px-3 py-14 md:px-6 md:py-20">
          <div className="mx-auto max-w-[820px]">
            <div className="lp-reveal mb-10 text-center">
              <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#181D27]">FAQ</span>
              <h2 className="mt-2 text-[clamp(26px,3.4vw,40px)] font-semibold tracking-[-0.02em]">{sx.faqTitle || "Good to know"}</h2>
            </div>
            <div className="flex flex-col gap-3">
              {faqs.map((faq, i) => (
                <details key={`${faq.question}-${i}`} className="lp-reveal group glass rounded-[20px] px-6 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-[16px] font-semibold [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <span className="material-symbols-outlined text-[#181D27] transition-transform duration-300 group-open:rotate-45">add</span>
                  </summary>
                  <p className="mt-3 text-[15px] leading-relaxed text-[#59614F]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA BAND ===== */}
      <section className="px-3 pb-6 md:px-6">
        <div className="lp-reveal mx-auto max-w-[1240px] overflow-hidden rounded-[32px] bg-[#0E121A] px-6 py-14 md:px-14 md:py-20">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="text-[clamp(30px,4.6vw,58px)] font-semibold leading-[1.05] tracking-[-0.02em] text-white">
                Ready to <span className="text-[#C6F135]">wander?</span>
              </h2>
              <p className="mt-4 max-w-md text-[16px] text-white/70">
                Your next trail is one tap away. Join the herd and travel with people who get it.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <Link
                href="/login"
                className="lp-lime-btn inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-[16px] font-semibold md:w-auto"
              >
                {joinLabel}
                <span className="material-symbols-outlined text-[20px]">arrow_outward</span>
              </Link>
              <a
                href="#trips"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-4 text-[16px] font-semibold text-white transition-colors hover:bg-white/10 md:w-auto"
              >
                Browse trails
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer id="site-footer" className="px-3 pb-8 md:px-6 scroll-mt-24">
        <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[32px] glass">
          {/* top: brand + newsletter */}
          <div className="grid gap-8 border-b border-black/8 px-6 py-10 md:grid-cols-[1.3fr_1fr] md:items-center md:px-12">
            <div className="max-w-sm">
              <LandingBrand size="md" />
              <p className="mt-4 text-[14px] leading-relaxed text-[#59614F]">
                Curated group trails across India. Travel with verified explorers, transparent pricing, and unforgettable routes.
              </p>
            </div>
            <div className="md:justify-self-end">
              <label className="mb-2 block text-[13px] font-semibold text-[#181D27]">Get trail drops in your inbox</label>
              <form
                className="flex items-center gap-2 rounded-full bg-[#F2F2F5] p-1.5"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="email"
                  placeholder="you@email.com"
                  className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-[14px] text-[#181D27] placeholder:text-[#59614F]/70 focus:outline-none"
                />
                <button className="lp-lime-btn inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[14px] font-semibold">
                  Subscribe <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
                </button>
              </form>
            </div>
          </div>

          {/* middle: link columns */}
          <div className="grid grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4 md:px-12">
            {[
              { h: "Company", items: [
                { label: "About Us", href: "/about" },
                { label: "Contact Us", href: "/contact" },
                { label: "Partner with Us", href: "/contact?type=partner" },
              ] },
              { h: "Explore", items: [
                { label: "Destinations", href: "#trips" },
                { label: "Upcoming Trails", href: "#trips" },
                { label: "How It Works", href: "#how-it-works" },
                { label: "FAQ", href: "#faq" },
              ] },
              { h: "Support", items: [
                { label: "Help Center", href: "/help" },
                { label: "Safety", href: "/safety" },
                { label: "Cancellation", href: "/refund-policy" },
                { label: "Travel Insurance", href: "/help" },
              ] },
              { h: "Legal", items: [
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Cookie Policy", href: "/privacy" },
              ] },
            ].map((col) => (
              <div key={col.h} className="flex flex-col gap-3">
                <h4 className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#181D27]">{col.h}</h4>
                {col.items.map((it) => (
                  <Link key={it.label} href={it.href} className="w-fit text-[14px] text-[#59614F] transition-colors hover:text-[#181D27]">
                    {it.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* bottom bar */}
          <div className="flex flex-col items-center gap-4 border-t border-black/8 px-6 py-6 sm:flex-row sm:justify-between md:px-12">
            <p className="text-[13px] text-[#59614F]">&copy; {new Date().getFullYear()} {footerCopyright}</p>
            <div className="flex items-center gap-2.5">
              {[
                { label: "Instagram", href: "https://instagram.com/travellinggoats", d: "M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2zm0 1.8c-3.15 0-3.5 0-4.74.07-.9.04-1.38.19-1.7.32-.43.16-.73.36-1.05.68-.32.32-.52.62-.68 1.05-.13.32-.28.8-.32 1.7C3.5 8.86 3.5 9.2 3.5 12s0 3.14.07 4.38c.04.9.19 1.38.32 1.7.16.43.36.73.68 1.05.32.32.62.52 1.05.68.32.13.8.28 1.7.32 1.24.07 1.59.07 4.74.07s3.5 0 4.74-.07c.9-.04 1.38-.19 1.7-.32.43-.16.73-.36 1.05-.68.32-.32.52-.62.68-1.05.13-.32.28-.8.32-1.7.07-1.24.07-1.58.07-4.38s0-3.14-.07-4.38c-.04-.9-.19-1.38-.32-1.7a2.8 2.8 0 0 0-.68-1.05 2.8 2.8 0 0 0-1.05-.68c-.32-.13-.8-.28-1.7-.32C15.5 4 15.15 4 12 4zm0 3.06A4.94 4.94 0 1 1 12 17a4.94 4.94 0 0 1 0-9.88zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28zm5.15-.62a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0z" },
                { label: "X", href: "https://x.com/travellinggoats", d: "M17.53 3H20.5l-6.5 7.43L21.75 21h-6l-4.7-6.14L5.66 21H2.68l6.96-7.95L2.5 3h6.15l4.25 5.62L17.53 3zm-1.05 16.2h1.65L7.6 4.72H5.82L16.48 19.2z" },
                { label: "Facebook", href: "https://facebook.com/travellinggoats", d: "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" },
                { label: "YouTube", href: "https://youtube.com/@travellinggoats", d: "M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.6 15.6V8.4l6.25 3.6-6.25 3.6z" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#181D27] text-white transition-colors hover:bg-[#C6F135] hover:text-[#181D27]"
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Site pop-ups */}
      <CookieConsent />
      <SubscribeModal />
      <LiveActivityToast />
    </div>
  );
}
