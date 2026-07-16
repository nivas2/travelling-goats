"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CookieConsent, SubscribeModal, LiveActivityToast } from "@/components/landing/site-popups";
import { IndiaMap } from "@/components/landing/india-map";

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

const NAV_LINKS = ["Home", "Trips", "How it Works", "About", "Community", "FAQ"];

const STATS = [
  { value: "500+", label: "Trails Hosted" },
  { value: "12k+", label: "Happy Travelers" },
  { value: "80+", label: "Destinations" },
  { value: "4.9", label: "Avg. Rating" },
];

const CATEGORIES = ["All", "Adventure", "Trek", "Camping", "Mountain", "Beach", "Cultural", "Wildlife", "Road Trip", "Spiritual", "City"];

// "Why travel with us" — honest, earnable trust signals (no borrowed credibility).
const TRUST_PILLARS = [
  { icon: "verified_user", title: "Verified local guides", desc: "Every trail is led by a vetted local who actually knows it." },
  { icon: "receipt_long", title: "Transparent pricing", desc: "One all-in price. No hidden fees, no surprises at checkout." },
  { icon: "health_and_safety", title: "Insured trips", desc: "Every booking is covered, so you can wander worry-free." },
  { icon: "support_agent", title: "24/7 on-trip support", desc: "A real human on call, from booking to your last sunset." },
  { icon: "lock", title: "Secure payments", desc: "Bank-grade, Razorpay-secured checkout — always." },
];

// Normalise category labels/enum values so "Road Trip" matches "ROAD_TRIP".
const normCat = (s: string) => s.toLowerCase().replace(/[\s_]+/g, "");

// Does a trip's category match a filter label? Handles the "Camping" chip →
// CAMPFIRE trips alias; everything else is a normalised label match.
const tripInCategory = (tripCat: string | undefined, label: string) => {
  if (!tripCat) return false;
  const tc = normCat(tripCat);
  if (label === "Camping") return tc === "campfire";
  return tc === normCat(label);
};

// High-quality Unsplash image (verified reachable, CSP-allowed host).
const uns = (id: string, w: number) =>
  `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;

// Curated hero showcase — eye-pleasing destinations that drive the cue.
// Each has a quotation-style headline (place + experience), a location,
// a tagline for the badge, a quote for the content card, and a photo.
const HERO_SHOWCASE = [
  {
    photo: "1464822759023-fed622ff2c3b",
    video: "/uploads/hero/spiti.mp4",
    place: "Spiti Valley",
    experience: "Himalayan",
    tagline: "The Middle Land of the Himalayas",
    location: "Spiti, Himachal Pradesh",
    description: "Green valleys, snow peaks and clear mountain air, all in one frame.",
    quote: "Where the valley opens up, so does something in you.",
  },
  {
    photo: "1454496522488-7a8e488e8606",
    video: "/uploads/hero/ladakh.mp4",
    place: "Ladakh",
    experience: "High-Altitude",
    tagline: "Land of High Passes",
    location: "Leh, Ladakh",
    description: "Cross soaring passes and still, turquoise lakes on the roof of India.",
    quote: "Where the air is thin and the silence runs deep.",
  },
  {
    photo: "1507525428034-b723cf961d3e",
    video: "/uploads/hero/goa.mp4",
    place: "Goa",
    experience: "Coastal",
    tagline: "Where the Sun Meets the Sea",
    location: "Palolem, Goa",
    description: "Slow sunsets, warm tides, and long barefoot evenings by the shore.",
    quote: "Let the tide wash the city off your shoulders.",
  },
  {
    photo: "1470071459604-3b5ec3a7fe05",
    video: "/uploads/hero/munnar.mp4",
    place: "Munnar",
    experience: "Highland",
    tagline: "Kerala's Emerald Highlands",
    location: "Munnar, Kerala",
    description: "Rolling tea hills wrapped in cool mist and golden light.",
    quote: "Green hills, cool mist, and mornings that linger.",
  },
  {
    photo: "1509316785289-025f5b846b35",
    video: "/uploads/hero/jaisalmer.mp4",
    place: "Jaisalmer",
    experience: "Desert",
    tagline: "The Golden City of Sands",
    location: "Thar, Rajasthan",
    description: "Ride the dunes and sleep under a wide-open desert sky.",
    quote: "The desert keeps its time in golden light.",
  },
  {
    photo: "1441974231531-c6227db76b6e",
    video: "/uploads/hero/coorg.mp4",
    place: "Coorg",
    experience: "Rainforest",
    tagline: "The Scotland of India",
    location: "Coorg, Karnataka",
    description: "Misty coffee forests, birdsong, and slow green mornings.",
    quote: "Breathe deep — the forest still remembers you.",
  },
];

// Approx. pin positions on the India map (viewBox 0..1024), by place.
const MAP_COORDS: Record<string, { x: number; y: number }> = {
  "Spiti Valley": { x: 415, y: 235 },
  Ladakh: { x: 405, y: 165 },
  Jaisalmer: { x: 250, y: 400 },
  Goa: { x: 320, y: 760 },
  Coorg: { x: 360, y: 850 },
  Munnar: { x: 395, y: 920 },
};

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

/** Adds `.is-visible` to every `.lp-reveal` as it scrolls into view. Also picks
 *  up `.lp-reveal` nodes added/reordered after mount (e.g. filtered trip cards),
 *  so dynamically-shown content never stays stuck at opacity 0. */
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
    const observeAll = () =>
      root.querySelectorAll(".lp-reveal:not(.is-visible)").forEach((el) => io.observe(el));
    observeAll();
    // Re-observe whenever the subtree changes (filtering re-renders the grid).
    const mo = new MutationObserver(observeAll);
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
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
    <Link href="/" aria-label="Meet My Route" className="group inline-flex items-center gap-2.5">
      <span className={`flex items-center justify-center bg-[#181818] transition-transform duration-300 group-hover:-rotate-6 ${badge}`}>
        <span className={`material-symbols-outlined text-[#D8FF07] ${icon}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          landscape
        </span>
      </span>
      <span className={`font-bold leading-none tracking-[-0.01em] ${text} ${onDark ? "text-white" : "text-[#181818]"}`}>
        Meet My <span className={onDark ? "text-[#D8FF07]" : "text-[#181818]"}>Route</span>
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
  currentBookings?: number;
  price: string;
  rating: string;
  image: string;
}

export interface LandingContentProps {
  hero?: { titleLine1: string; titleLine2: string; subtitle: string; imageUrl: string; videoUrl?: string; primaryCta?: string; secondaryCta?: string };
  heroExperiences?: { label: string; icon: string }[];
  steps?: { title: string; desc: string }[];
  trustBadges?: { icon: string; label: string }[];
  stats?: { value: string; label: string }[];
  trips?: LandingTrip[];
  testimonials?: { quote: string; name: string; trip: string }[];
  faqs?: { question: string; answer: string }[];
  navLinks?: string[];
  buttons?: Record<string, string>;
  sections?: Record<string, string>;
  story?: Record<string, string>;
  footer?: Record<string, string>;
  showcase?: { place: string; experience: string; tagline: string; location: string; quote: string; image: string; video: string; mapX: number; mapY: number }[];
  trustPillars?: { icon: string; title: string; desc: string }[];
  filterCategories?: string[];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function LandingPage(props: LandingContentProps = {}) {
  const rootRef = useReveal();
  const scrolled = useScrolled(20);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cat, setCat] = useState("All");

  const hero = props.hero ?? {
    titleLine1: "Meet new people.",
    titleLine2: "Explore without fear.",
    subtitle:
      "Join curated group trails across India. Travel solo, as a couple, or with friends — everything is planned, so you just show up and wander.",
    imageUrl: HERO_BG,
  };
  const heroPrimaryCta = hero.primaryCta || "Explore Trails";
  const heroVideoUrl = hero.videoUrl?.trim() || "";
  const heroExperiences =
    props.heroExperiences && props.heroExperiences.length
      ? props.heroExperiences
      : [
          { icon: "hiking", label: "Guided Treks" },
          { icon: "local_fire_department", label: "Campfire Camps" },
          { icon: "landscape", label: "Weekend Getaways" },
        ];
  const steps = props.steps?.length ? props.steps : STEPS;
  const stats = props.stats?.length ? props.stats : STATS;
  const trips = props.trips ?? [];
  const testimonials = props.testimonials ?? [];
  const faqs = props.faqs ?? [];
  const navLinks = props.navLinks?.length ? props.navLinks : NAV_LINKS;
  const trustPillars = props.trustPillars?.length ? props.trustPillars : TRUST_PILLARS;
  const filterCategories = props.filterCategories?.length ? props.filterCategories : CATEGORIES;
  const btn = props.buttons ?? {};
  const loginLabel = btn.login || "Login";
  const joinLabel = btn.join || "Join Now";
  const sx = props.sections ?? {};
  const st = props.story ?? {};
  const footerCopyright = props.footer?.copyright || "Meet My Route. All rights reserved.";

  const visibleTrips = useMemo(() => {
    if (cat === "All") return trips;
    return trips.filter((t) => tripInCategory(t.category, cat));
  }, [cat, trips]);

  // Categories that actually have trips (hide empty chips).
  const activeCategories = useMemo(
    () =>
      filterCategories.filter(
        (c) => c === "All" || trips.some((t) => tripInCategory(t.category, c))
      ),
    [trips]
  );

  // Hero showcase — admin-editable (landing.showcase); falls back to the built-in
  // curated set. Each card carries its own poster image, video and map pin.
  const showcase =
    props.showcase && props.showcase.length
      ? props.showcase
      : HERO_SHOWCASE.map((c) => ({
          place: c.place,
          experience: c.experience,
          tagline: c.tagline,
          location: c.location,
          quote: c.quote,
          image: uns(c.photo, 1280),
          video: c.video,
          mapX: MAP_COORDS[c.place]?.x ?? 512,
          mapY: MAP_COORDS[c.place]?.y ?? 512,
        }));

  // Hero cue cards — everything data-driven is REAL: each place is matched to its
  // trips (by the place's first word, e.g. "Spiti" → "Spiti, Himachal Pradesh")
  // and "joined" is the real total bookings there.
  const allHeroCards = showcase.map((c) => {
    const key = c.place.split(" ")[0].toLowerCase();
    const matched = trips.filter((t) => (t.destination ?? "").toLowerCase().includes(key));
    return {
      ...c,
      joined: matched.reduce((sum, t) => sum + (t.currentBookings ?? 0), 0),
      tripId: matched[0]?.id,
    };
  });
  // Show every curated destination (each has its own video). The "joined" count
  // is real-only — the pill is hidden for any card with no real bookings, so we
  // never display a placeholder number while still keeping the video showcase.
  const heroCards = allHeroCards;

  // Which rail card is "cued" — drives the hero background, title & feature card.
  // Defaults to the first trip; hover/tap a thumbnail to switch.
  const [activeCard, setActiveCard] = useState(0);
  const active = heroCards[activeCard] ?? heroCards[0];

  // Background clip for the cued card — its own video if set, else the global
  // CMS hero video, else none (falls back to the still image).
  const heroBgVideo = active.video || heroVideoUrl;

  // Auto-advance the hero through the cards: move to the next card when the
  // current clip finishes (or after a fallback time if it can't play). Runs for
  // both auto-play and manual selection — any change to `activeCard` re-arms it.
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const next = () => setActiveCard((i) => (i + 1) % heroCards.length);
    // No video for this card → advance after a fixed slide time.
    if (!heroBgVideo) {
      const t = setTimeout(next, 6000);
      return () => clearTimeout(t);
    }
    const v = heroVideoRef.current;
    let timer: ReturnType<typeof setTimeout> = setTimeout(next, 12000); // safety fallback
    const arm = () => {
      clearTimeout(timer);
      const secs = v && Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 8;
      timer = setTimeout(next, secs * 1000 + 300);
    };
    if (v) {
      v.addEventListener("loadedmetadata", arm);
      v.addEventListener("ended", next);
      if (v.readyState >= 1) arm(); // metadata already available
    }
    return () => {
      clearTimeout(timer);
      if (v) {
        v.removeEventListener("loadedmetadata", arm);
        v.removeEventListener("ended", next);
      }
    };
  }, [activeCard, heroBgVideo]);

  // Keep the selected (expanded) card centered in the cue rail. Scrolls only
  // the rail horizontally — never the page. Debounced: rapid hover pass-overs
  // cancel the pending scroll, so the rail only glides to centre once you
  // actually settle on a card (no jittery "chasing" while sweeping the mouse).
  const railRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const rail = railRef.current;
    const el = cardRefs.current[activeCard];
    if (!rail || !el) return;
    const center = () => {
      const railRect = rail.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const delta = elRect.left + elRect.width / 2 - (railRect.left + railRect.width / 2);
      rail.scrollTo({ left: rail.scrollLeft + delta, behavior: "smooth" });
    };
    // wait for the hover to settle, then correct once the size transition ends
    const t1 = setTimeout(center, 220);
    const t2 = setTimeout(center, 580);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [activeCard]);

  return (
    <div ref={rootRef} className="scroll-smooth text-[#181818] antialiased">
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
                      ? "bg-[#181818] text-white"
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
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#181818] text-white md:hidden"
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
      <header id="home" className="relative min-h-[100svh] w-full overflow-hidden bg-[#181818]">
        {/* full-bleed background — an ambient looping video when set (admin CMS),
            otherwise the cued image that crossfades whenever the trip changes */}
        {heroBgVideo ? (
          <video
            key={heroBgVideo}
            ref={(el) => {
              heroVideoRef.current = el;
              if (!el) return;
              // Force muted (React doesn't reliably set the DOM property) so
              // the browser allows autoplay, then kick it off.
              el.muted = true;
              el.play().catch(() => {});
            }}
            className="lp-hero-fade absolute inset-0 h-full w-full object-cover"
            src={heroBgVideo}
            poster={active.image}
            autoPlay
            muted
            playsInline
            preload="auto"
            aria-hidden
          />
        ) : (
          <div
            key={`bg-${activeCard}`}
            className="lp-hero-fade absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${active.image}')` }}
            aria-hidden
          />
        )}
        {/* legibility + mood gradients — lighter in the middle so the photo shines */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#181818]/55 via-[#181818]/15 to-[#181818]/88" />
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

        {/* glass frame — its top edge meets the nav's vertical centre
            (40px mobile / 46px desktop), so the outline connects into the bar */}
        <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 top-10 z-10 rounded-[28px] border border-white/15 md:inset-x-5 md:bottom-5 md:top-[46px] md:rounded-[36px]" aria-hidden />

        {/* content */}
        <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1280px] flex-col px-4 pb-6 pt-24 md:px-12 md:pb-12 md:pt-32">
          {/* ---- upper: badge + headline ---- */}
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            {/* tagline badge — reflects the cued trip */}
            <span
              key={`badge-${activeCard}`}
              className="lp-hero-fade inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.12] px-5 py-2 text-[12px] font-medium tracking-wide text-white backdrop-blur-md md:text-[13px]"
            >
              <span className="material-symbols-outlined text-[16px] text-[#D8FF07]" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              {active.tagline}
            </span>

            {/* quotation-style headline — "Unforgettable {place} / {experience} Experience" */}
            <h1
              key={`title-${activeCard}`}
              className="lp-hero-title mx-auto mt-4 max-w-[22ch] text-[clamp(29px,5.4vw,66px)] font-light leading-[1.04] tracking-[-0.03em] text-white"
              style={{ textShadow: "0 2px 34px rgba(0,0,0,0.4)" }}
            >
              <span className="block">Unforgettable {active.place}</span>
              <span className="block text-white/65">{active.experience} Experience</span>
            </h1>

            {/* location line, below the heading */}
            <span
              key={`loc-${activeCard}`}
              className="lp-hero-fade mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-white/85 md:text-[15px]"
            >
              <span className="material-symbols-outlined text-[18px] text-[#D8FF07]" style={{ fontVariationSettings: "'FILL' 1" }}>
                location_on
              </span>
              {active.location}
            </span>

            {/* what we organise — experience types (treks, campfires & more) */}
            {heroExperiences.length > 0 && (
            <div className="lp-reveal mt-6 flex flex-wrap items-center justify-center gap-2">
              {heroExperiences.map((e) => (
                <span
                  key={e.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.10] px-3.5 py-1.5 text-[12px] font-medium text-white backdrop-blur-md md:text-[13px]"
                >
                  <span
                    className="material-symbols-outlined text-[15px] text-[#D8FF07]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {e.icon}
                  </span>
                  {e.label}
                </span>
              ))}
            </div>
            )}
          </div>

          {/* ---- lower: info card (left) + feature + thumbnails (right) ---- */}
          <div className="mt-6 flex flex-col items-stretch gap-4 md:gap-6 md:flex-row md:items-end">
            {/* info card — trip-aware: people joined + a bespoke quote */}
            <div className="lp-reveal w-full shrink-0 rounded-[24px] border border-white/15 bg-[#181818]/40 p-5 backdrop-blur-xl md:w-[380px] md:rounded-[28px] md:p-6">
              {active.joined > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2.5">
                    {["/uploads/avatar1.jpg", "/uploads/avatar2.jpg", "/uploads/avatar3.jpg", "/uploads/avatar4.jpg"].map((src) => (
                      <img key={src} src={src} alt="" className="h-9 w-9 rounded-full border-2 border-[#181818] object-cover" />
                    ))}
                    <span
                      key={`joined-${activeCard}`}
                      className="lp-hero-fade flex h-9 min-w-9 items-center justify-center rounded-full border-2 border-[#181818] bg-[#D8FF07] px-1.5 text-[12px] font-bold text-[#181818]"
                    >
                      {active.joined}+
                    </span>
                  </div>
                  <span className="text-[14px] leading-tight text-white">
                    <span key={`joinedn-${activeCard}`} className="lp-hero-fade font-bold">{active.joined}+ joined</span>
                    <span className="block text-[12px] text-white/55">this trail</span>
                  </span>
                </div>
              )}

              {/* bespoke quote for the cued trip */}
              <figure key={`quote-${activeCard}`} className="lp-hero-fade mt-5 border-l-2 border-[#D8FF07]/70 pl-4">
                <blockquote className="text-[16px] font-light italic leading-relaxed text-white/90">
                  &ldquo;{active.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-2 text-[12px] font-medium uppercase tracking-[0.16em] text-[#D8FF07]/90">
                  {active.location}
                </figcaption>
              </figure>

              <Link
                href="/login"
                className="group mt-6 inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/[0.06] py-2 pl-6 pr-2 text-[14px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/[0.14]"
              >
                {heroPrimaryCta}
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D8FF07] text-[#181818] transition-transform group-hover:rotate-12">
                  <span className="material-symbols-outlined text-[18px]">arrow_outward</span>
                </span>
              </Link>
            </div>

            {/* cue rail — slim cards; click/tap a card to select it. The
                selected one expands into a square and reveals its details.
                Extra side padding so the centred card can sit dead-centre. */}
            <div
              ref={railRef}
              className="lp-reveal lp-hide-scrollbar flex min-w-0 flex-1 items-end gap-3 overflow-x-auto px-[35%] pb-1 md:gap-4 md:px-[28%]"
            >
              {heroCards.map((card, i) => {
                const isActive = activeCard === i;
                return (
                  <button
                    type="button"
                    key={card.place + i}
                    ref={(el) => { cardRefs.current[i] = el; }}
                    onClick={() => setActiveCard(i)}
                    onFocus={() => setActiveCard(i)}
                    aria-pressed={isActive}
                    aria-label={`Show ${card.place}`}
                    className={`relative shrink-0 overflow-hidden rounded-[20px] border bg-cover bg-center text-left outline-none transition-all duration-500 ease-out md:rounded-[22px] ${
                      isActive
                        ? "h-[210px] w-[210px] border-[#D8FF07] shadow-[0_22px_54px_rgba(198,241,53,0.3)] md:h-[300px] md:w-[300px]"
                        : "h-[160px] w-[92px] border-white/15 opacity-80 hover:opacity-100 md:h-[220px] md:w-[116px]"
                    }`}
                    style={{ backgroundImage: `url('${card.image}')` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181818]/90 via-[#181818]/10 to-transparent" />

                    {/* collapsed label — just the place */}
                    <span
                      className={`absolute inset-x-0 bottom-0 px-3 pb-3 text-[12px] font-semibold leading-tight text-white transition-opacity duration-200 ${
                        isActive ? "opacity-0" : "opacity-100"
                      }`}
                    >
                      {card.place}
                    </span>

                    {/* expanded details — revealed when the card is the square */}
                    <div
                      className={`absolute inset-x-0 bottom-0 p-4 transition-opacity duration-300 md:p-5 ${
                        isActive ? "opacity-100 delay-150" : "pointer-events-none opacity-0"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                        <span className="material-symbols-outlined text-[13px] text-[#D8FF07]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                        {card.location}
                      </span>
                      <h3 className="mt-2 text-[17px] font-semibold leading-tight text-white md:mt-2.5 md:text-[21px]">{card.place}</h3>
                      <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-white/80 md:mt-1.5 md:text-[13px]">{card.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* ===== CATEGORY STRIP ===== */}
      <section id="trips" className="px-3 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-[1240px]">
          <div className="lp-reveal mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[clamp(26px,3.4vw,40px)] font-semibold tracking-[-0.02em]">
                {sx.upcomingTitle || "Popular trails, hand-picked"}
              </h2>
              <p className="mt-1 text-[15px] text-[#526200]">{sx.upcomingSubtitle || "Fresh routes for the next month — filter by what you love."}</p>
            </div>
            <Link href="/login" className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#181818] hover:underline">
              View all <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>

          {/* chips — vertical padding + negative margin so the soft shadow isn't
              clipped into a hard edge by the horizontal scroll's overflow */}
          <div className="lp-reveal lp-hide-scrollbar -my-3 mb-5 flex gap-2.5 overflow-x-auto px-1 py-4">
            {activeCategories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 rounded-full px-5 py-2.5 text-[14px] font-medium transition-all duration-300 ease-out hover:-translate-y-0.5 ${
                  cat === c
                    ? "bg-[#181818] text-white shadow-[0_4px_14px_-6px_rgba(21,39,29,0.35)] hover:shadow-[0_7px_16px_-6px_rgba(21,39,29,0.4)]"
                    : "bg-white/80 backdrop-blur-xl border border-[#181818]/[0.06] text-[#181818]/70 shadow-[0_4px_14px_-8px_rgba(16,24,40,0.2)] hover:text-[#181818] hover:border-[#181818]/[0.10] hover:shadow-[0_7px_16px_-8px_rgba(16,24,40,0.22)]"
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
                  className="lp-reveal lp-lift group relative flex h-[420px] flex-col justify-end overflow-hidden rounded-[26px] bg-[#181818] [transform:translateZ(0)]"
                  style={{ transitionDelay: `${(i % 3) * 0.08}s` }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] group-hover:scale-105"
                    style={{ backgroundImage: `url('${trip.image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181818]/85 via-[#181818]/20 to-transparent" />

                  {/* top row: save */}
                  <div className="absolute inset-x-4 top-4 flex items-center justify-end">
                    <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[#181818] transition-transform hover:scale-105">
                      <span className="material-symbols-outlined text-[18px]">bookmark</span>
                    </button>
                  </div>

                  {/* content */}
                  <div className="relative p-5 text-white">
                    {trip.category && (
                      <span className="mb-2 inline-flex rounded-full bg-[#D8FF07] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#181818]">
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
              <span className="material-symbols-outlined mb-3 block text-[44px] text-[#181818]/40">explore</span>
              <p className="text-[15px] text-[#526200]">New adventures are being charted. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* ===== STATS BAND (forest) ===== */}
      <section id="about" className="px-3 py-6 md:px-6">
        <div className="mx-auto max-w-[1240px]">
          <div className="lp-reveal relative overflow-hidden rounded-[32px] bg-[#181818] px-6 py-12 md:px-14 md:py-16">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#D8FF07]/10 blur-3xl" aria-hidden />
            <div className="relative mx-auto mb-10 max-w-2xl text-center">
              <h2 className="text-[clamp(26px,3.4vw,40px)] font-semibold tracking-[-0.02em] text-white">
                {sx.aboutTitle || "Built for people who'd rather wander"}
              </h2>
              <p className="mt-3 text-[15px] text-white/70">
                {sx.aboutBody ||
                  "Every itinerary is handpicked, every trip captain is verified, and every price is transparent — so you focus on the adventure and the friends you make along the way."}
              </p>
            </div>
            <div className="relative grid grid-cols-2 gap-4 md:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-[22px] bg-white/[0.06] p-6 text-center ring-1 ring-white/10">
                  <CountUp value={s.value} className="block text-[clamp(30px,4vw,48px)] font-bold leading-none text-[#D8FF07]" />
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
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#181818]">How it works</span>
            <h2 className="mt-2 text-[clamp(26px,3.4vw,40px)] font-semibold tracking-[-0.02em]">
              {sx.howTitle || "From screen to summit in four steps"}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className={`lp-reveal lp-lift rounded-[24px] p-6 ${
                  i === 0 ? "bg-[#181818] text-white" : "glass"
                }`}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div
                  className={`mb-8 flex h-12 w-12 items-center justify-center rounded-full text-[18px] font-bold ${
                    i === 0 ? "bg-[#D8FF07] text-[#181818]" : "bg-[#F2F2F5] text-[#181818]"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className={`text-[19px] font-bold ${i === 0 ? "text-white" : "text-[#181818]"}`}>{step.title}</h3>
                <p className={`mt-2 text-[14px] ${i === 0 ? "text-white/70" : "text-[#526200]"}`}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY TRAVEL WITH US (trust pillars) ===== */}
      <section id="why-us" className="px-3 py-14 md:px-6 md:py-20">
        <div className="mx-auto max-w-[1240px]">
          <div className="lp-reveal mb-12 max-w-2xl">
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#526200]">{sx.trustOverline || "Why travel with us"}</span>
            <h2 className="mt-2 text-[clamp(26px,3.4vw,40px)] font-semibold tracking-[-0.02em]">
              {sx.trustTitle || "Small crews, big care — every trail covered"}
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-[#526200]">
              {sx.trustSubtitle || "We’re a young team obsessed with getting the details right, so you only have to think about the view."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {trustPillars.map((p, i) => (
              <div
                key={p.title}
                className="lp-reveal lp-lift glass rounded-[24px] p-6"
                style={{ transitionDelay: `${i * 0.06}s` }}
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#D8FF07]">
                  <span className="material-symbols-outlined text-[22px] text-[#181818]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {p.icon}
                  </span>
                </div>
                <h3 className="text-[16px] font-bold leading-snug text-[#181818]">{p.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#526200]">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== OUR STORY (founder) ===== */}
      <section id="our-story" className="px-3 pb-14 md:px-6 md:pb-20">
        <div className="mx-auto max-w-[1240px]">
          <div className="lp-reveal overflow-hidden rounded-[32px] bg-[#181818] text-white">
            <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr]">
              {/* portrait */}
              <div
                className="relative min-h-[320px] bg-cover bg-center md:min-h-full"
                style={{ backgroundImage: `url('${st.image || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop"}')` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#181818]/70 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#181818]/60" />
              </div>

              {/* story */}
              <div className="p-8 md:p-12 lg:p-14">
                <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#D8FF07]">{st.overline || "Our story"}</span>
                <h2 className="mt-3 text-[clamp(24px,3vw,38px)] font-semibold leading-[1.1] tracking-[-0.02em]">
                  {st.title || "We started Meet My Route to make good trips feel easy"}
                </h2>
                <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-white/75">
                  {(st.body
                    ? st.body.split(/\n\s*\n/)
                    : [
                        "A few years ago we were the friends who always ended up planning everyone’s trip — the routes, the stays, the little details that turn a holiday into a story. We loved it. So we made it our job.",
                        "Today we run small-group trails across India with local guides we trust, honest pricing, and the kind of care we’d want for our own families. No crowds, no fine print — just the community, the road, and the view.",
                      ]
                  ).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-6">
                  <div>
                    <div className="text-[15px] font-semibold text-white">{st.founderName || "Priya & the community"}</div>
                    <div className="text-[13px] text-white/55">{st.founderRole || "Founders, Meet My Route"}</div>
                  </div>
                  <a
                    href="#trips"
                    className="inline-flex items-center gap-2 rounded-full bg-[#D8FF07] px-6 py-3 text-[14px] font-semibold text-[#181818] transition-transform hover:-translate-y-0.5"
                  >
                    {st.ctaText || "Explore our trails"}
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INTERACTIVE INDIA MAP ===== */}
      <IndiaMap
        destinations={heroCards.map((c) => ({
          place: c.place,
          location: c.location,
          image: c.image,
          x: c.mapX ?? 512,
          y: c.mapY ?? 512,
        }))}
      />

      {/* ===== COMMUNITY (marquee) ===== */}
      {testimonials.length > 0 && (
        <section id="community" className="overflow-hidden py-14 md:py-20">
          <div className="lp-reveal mx-auto mb-10 max-w-[1240px] px-3 text-center md:px-6">
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#181818]">{sx.communityOverline || "Community"}</span>
            <h2 className="mt-2 text-[clamp(26px,3.4vw,40px)] font-semibold tracking-[-0.02em]">{sx.communityTitle || "Loved by the community"}</h2>
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
                  <span className="material-symbols-outlined text-[28px] text-[#D8FF07]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    format_quote
                  </span>
                  <blockquote className="mt-3 text-[15px] leading-relaxed text-[#181818]">&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#181818] text-[14px] font-bold text-[#D8FF07]">
                      {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold">{t.name}</div>
                      <div className="text-[13px] text-[#526200]">{t.trip}</div>
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
              <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#181818]">{sx.faqOverline || "FAQ"}</span>
              <h2 className="mt-2 text-[clamp(26px,3.4vw,40px)] font-semibold tracking-[-0.02em]">{sx.faqTitle || "Good to know"}</h2>
            </div>
            <div className="flex flex-col gap-3">
              {faqs.map((faq, i) => (
                <details key={`${faq.question}-${i}`} className="lp-reveal group glass rounded-[20px] px-6 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-[16px] font-semibold [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <span className="material-symbols-outlined text-[#181818] transition-transform duration-300 group-open:rotate-45">add</span>
                  </summary>
                  <p className="mt-3 text-[15px] leading-relaxed text-[#526200]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA BAND ===== */}
      <section className="px-3 pb-6 md:px-6">
        <div className="lp-reveal mx-auto max-w-[1240px] overflow-hidden rounded-[32px] bg-[#101010] px-6 py-14 md:px-14 md:py-20">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="text-[clamp(30px,4.6vw,58px)] font-semibold leading-[1.05] tracking-[-0.02em] text-white">
                {sx.ctaTitle || "Ready to wander?"}
              </h2>
              <p className="mt-4 max-w-md text-[16px] text-white/70">
                {sx.ctaSubtitle || "Your next trail is one tap away. Join the community and travel with people who get it."}
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
                {sx.ctaBrowse || "Browse trails"}
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
              <p className="mt-4 text-[14px] leading-relaxed text-[#526200]">
                {props.footer?.tagline || "Curated group trails across India. Travel with verified explorers, transparent pricing, and unforgettable routes."}
              </p>
            </div>
            <div className="md:justify-self-end">
              <label className="mb-2 block text-[13px] font-semibold text-[#181818]">{props.footer?.newsletterLabel || "Get trail drops in your inbox"}</label>
              <form
                className="flex items-center gap-2 rounded-full bg-[#F2F2F5] p-1.5"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="email"
                  placeholder={props.footer?.emailPlaceholder || "you@email.com"}
                  className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-[14px] text-[#181818] placeholder:text-[#526200]/70 focus:outline-none"
                />
                <button className="lp-lime-btn inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[14px] font-semibold">
                  {props.footer?.subscribeText || "Subscribe"} <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
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
                <h4 className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#181818]">{col.h}</h4>
                {col.items.map((it) => (
                  <Link key={it.label} href={it.href} className="w-fit text-[14px] text-[#526200] transition-colors hover:text-[#181818]">
                    {it.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* bottom bar */}
          <div className="flex flex-col items-center gap-4 border-t border-black/8 px-6 py-6 sm:flex-row sm:justify-between md:px-12">
            <p className="text-[13px] text-[#526200]">&copy; {new Date().getFullYear()} {footerCopyright}</p>
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
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#181818] text-white transition-colors hover:bg-[#D8FF07] hover:text-[#181818]"
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
