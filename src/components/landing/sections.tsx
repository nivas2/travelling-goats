"use client";

/* ------------------------------------------------------------------ */
/*  Modern landing sections — glass cards with hover-reveal + spring.    */
/*  Same content as before, redesigned into reusable components.         */
/*  Brand: ink #181818 × lime #D8FF07. All motion is reduced-motion-safe */
/*  and NO important action is hover-only (touch-friendly).              */
/* ------------------------------------------------------------------ */

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { LandingTrip } from "./landing-page";

const EASE = [0.22, 1, 0.36, 1] as const;
const SPRING = { type: "spring" as const, stiffness: 320, damping: 26 };

/* ---------- How It Works: numbered glass step card ---------- */
const STEP_ICONS = ["explore", "confirmation_number", "groups", "photo_camera"];

export function StepCard({ n, title, desc }: { n: number; title: string; desc: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileFocus="hover"
      variants={{ rest: { y: 0 }, hover: reduce ? {} : { y: -8 } }}
      transition={SPRING}
      className="glass group relative flex h-full flex-col rounded-[24px] p-6"
    >
      <div className="mb-6 flex items-center justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F2F2F5] text-[16px] font-bold text-[#181818] transition-colors duration-300 group-hover:bg-[#D8FF07]">
          {String(n).padStart(2, "0")}
        </span>
        <span className="material-symbols-outlined text-[22px] text-[#181818]/25 transition-colors duration-300 group-hover:text-[#181818]/70">
          {STEP_ICONS[(n - 1) % STEP_ICONS.length]}
        </span>
      </div>
      <h3 className="text-[19px] font-bold text-[#181818]">{title}</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-[#526200]">{desc}</p>
      {/* hover reveal — decorative step marker */}
      <motion.div
        variants={{
          rest: reduce ? { opacity: 0 } : { opacity: 0, y: 6 },
          hover: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.25, ease: EASE }}
        className="mt-4 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#181818]"
        aria-hidden
      >
        <span className="h-px w-6 bg-[#D8FF07]" /> Step {n} of 4
      </motion.div>
    </motion.div>
  );
}

/* ---------- Why Us: trust pillar glass card ---------- */
export function PillarCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileFocus="hover"
      variants={{ rest: { y: 0 }, hover: reduce ? {} : { y: -8 } }}
      transition={SPRING}
      className="glass group relative flex h-full flex-col overflow-hidden rounded-[24px] p-6"
    >
      {/* hover reveal — lime corner glow */}
      <motion.span
        aria-hidden
        variants={{ rest: { opacity: 0, scale: 0.6 }, hover: { opacity: 1, scale: 1 } }}
        transition={{ duration: 0.3, ease: EASE }}
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#D8FF07]/30 blur-2xl"
      />
      <motion.div
        variants={{ rest: { rotate: 0, scale: 1 }, hover: reduce ? {} : { rotate: -8, scale: 1.08 } }}
        transition={{ type: "spring", stiffness: 300, damping: 16 }}
        className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#D8FF07]"
      >
        <span className="material-symbols-outlined text-[22px] text-[#181818]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </motion.div>
      <h3 className="relative text-[16px] font-bold leading-snug text-[#181818]">{title}</h3>
      <p className="relative mt-2 text-[13.5px] leading-relaxed text-[#526200]">{desc}</p>
    </motion.div>
  );
}

/* ---------- Trips: immersive card with hover-reveal description ---------- */
export function TripCard({ trip }: { trip: LandingTrip }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      initial="rest"
      animate="rest"
      whileHover="hover"
      variants={{ rest: {}, hover: {} }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="group relative flex h-[420px] flex-col justify-end overflow-hidden rounded-[26px] bg-[#181818] [transform:translateZ(0)]"
    >
      <motion.div
        variants={{ rest: { scale: 1 }, hover: reduce ? {} : { scale: 1.06 } }}
        transition={{ duration: 0.9, ease: EASE }}
        className="absolute inset-0"
      >
        <Image
          src={trip.image}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#181818]/90 via-[#181818]/25 to-transparent" />

      {/* top: rating + save */}
      <div className="absolute inset-x-4 top-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur-md">
          <span className="material-symbols-outlined text-[14px] text-[#D8FF07]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          {trip.rating}
        </span>
        <button aria-label="Save trip" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[#181818] transition-transform hover:scale-105">
          <span className="material-symbols-outlined text-[18px]">bookmark</span>
        </button>
      </div>

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

        {/* hover reveal — supplementary description (title/price/CTA stay visible) */}
        {trip.description && (
          <motion.p
            variants={{
              rest: reduce ? { opacity: 0 } : { opacity: 0, height: 0, marginTop: 0 },
              hover: reduce ? { opacity: 1 } : { opacity: 1, height: "auto", marginTop: 8 },
            }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden text-[13px] leading-snug text-white/75"
          >
            {trip.description}
          </motion.p>
        )}

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
          <Link href="/login" className="lp-lime-btn inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[14px] font-semibold">
            Join <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

/* ---------- Community: testimonial glass card (used inside the marquee) ---------- */
export function TestimonialCard({ quote, name, trip }: { quote: string; name: string; trip: string }) {
  return (
    <figure className="glass group w-[340px] shrink-0 rounded-[24px] p-7 transition-transform duration-300 hover:-translate-y-1">
      <span className="material-symbols-outlined text-[28px] text-[#D8FF07]" style={{ fontVariationSettings: "'FILL' 1" }}>
        format_quote
      </span>
      <blockquote className="mt-3 text-[15px] leading-relaxed text-[#181818]">&ldquo;{quote}&rdquo;</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#181818] text-[14px] font-bold text-[#D8FF07] ring-2 ring-transparent transition-all duration-300 group-hover:ring-[#D8FF07]/40">
          {name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
        </div>
        <div>
          <div className="text-[14px] font-semibold">{name}</div>
          <div className="text-[13px] text-[#526200]">{trip}</div>
        </div>
      </figcaption>
    </figure>
  );
}

/* ---------- FAQ: controlled glass accordion with smooth height ---------- */
export function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial="rest"
      animate="rest"
      whileHover="hover"
      variants={{ rest: { y: 0 }, hover: reduce ? {} : { y: -3 } }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="glass overflow-hidden rounded-[20px]"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left text-[16px] font-semibold text-[#181818]"
      >
        {q}
        <span className={`material-symbols-outlined shrink-0 text-[#181818] transition-transform duration-300 ${open ? "rotate-45" : ""}`}>
          add
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-[15px] leading-relaxed text-[#526200]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
