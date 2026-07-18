"use client";

/* ------------------------------------------------------------------ */
/*  Landing motion primitives — a thin framer-motion layer for the      */
/*  redesign. Every animation is gated on prefers-reduced-motion, and    */
/*  reveals fire once (viewport once) so scrolling stays cheap.          */
/*  Brand stays ink (#181818) × lime (#D8FF07) — motion only, no repaint.*/
/* ------------------------------------------------------------------ */

import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useSpring,
  type Variants,
} from "framer-motion";
import type { ReactNode } from "react";

// Signature easing — a soft "out-expo"-ish curve used across the page.
const EASE = [0.22, 1, 0.36, 1] as const;

/** Thin scroll-linked progress bar pinned to the very top of the page. */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  if (reduce) return null;
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-[#D8FF07]"
      style={{ scaleX }}
    />
  );
}

/** Fade + rise into view once. Drop-in replacement for the CSS `.lp-reveal`. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Container that staggers its <StaggerItem> children as they scroll in. */
export function Stagger({
  children,
  className,
  stagger = 0.08,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      variants={{ show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

const itemVariants = (y: number): Variants => ({
  hidden: { opacity: 0, y },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
});
const reducedItemVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4 } },
};

/**
 * One staggered child. Optional spring lift on hover — used for the trip
 * cards to get the "magnetic" feel without any layout thrash.
 */
export function StaggerItem({
  children,
  className,
  y = 28,
  lift = false,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  lift?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduce ? reducedItemVariants : itemVariants(y)}
      whileHover={reduce || !lift ? undefined : { y: -8, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Slow-drifting lime "aurora" blobs. Sits inside a `relative overflow-hidden`
 * dark band and glows in the brand colour. Static (no drift) under reduced motion.
 */
export function AuroraBackdrop({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const common = "pointer-events-none absolute rounded-full blur-3xl";
  if (reduce) {
    return (
      <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
        <div className={`${common} -left-16 top-0 h-72 w-72 bg-[#D8FF07]/20`} />
        <div className={`${common} -right-10 bottom-0 h-80 w-80 bg-[#526200]/25`} />
      </div>
    );
  }
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <motion.div
        className={`${common} h-72 w-72 bg-[#D8FF07]/20`}
        initial={{ x: -60, y: -10 }}
        animate={{ x: [-60, 40, -60], y: [-10, 40, -10] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={`${common} right-0 bottom-0 h-80 w-80 bg-[#526200]/30`}
        initial={{ x: 40, y: 20 }}
        animate={{ x: [40, -30, 40], y: [20, -30, 20] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/**
 * Hero headline that blur-rises on each showcase change. `activeKey` is the
 * cued-card index; changing it swaps the two lines with a soft transition.
 */
export function HeroHeadline({
  activeKey,
  place,
  experience,
  className,
}: {
  activeKey: number;
  place: string;
  experience: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={className} style={{ textShadow: "0 2px 34px rgba(0,0,0,0.4)" }}>
      <AnimatePresence mode="wait">
        <motion.h1
          key={activeKey}
          className="mx-auto max-w-[22ch]"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22, filter: "blur(10px)" }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14, filter: "blur(6px)" }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <span className="block">Unforgettable {place}</span>
          <span className="block text-white/65">{experience} Experience</span>
        </motion.h1>
      </AnimatePresence>
    </div>
  );
}
