/**
 * Site Content registry.
 *
 * Single source of truth for every admin-editable content block. Each block is
 * stored in the `CmsContent` table as JSON under its `key`. This module holds:
 *   - the field schema for each block (drives the admin form-based editor)
 *   - the default value (the original hardcoded content, used as a fallback so
 *     public pages never render empty if a block hasn't been customised yet)
 *
 * IMPORTANT: keep this file free of server-only imports (prisma, next/headers…)
 * — it is imported by both server components/APIs and client components.
 */

export type FieldType = "text" | "textarea" | "image" | "toggle";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  /** For image fields: a recommended-size hint + per-field dimension limits. */
  recommend?: string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  aspect?: string;
}

interface BaseBlock {
  key: string;
  label: string;
  group: "Branding" | "Landing Page" | "Home Feed";
  description?: string;
  fields: FieldDef[];
}

export interface SingleBlockDef extends BaseBlock {
  kind: "single";
  default: Record<string, string>;
}

export interface ListBlockDef extends BaseBlock {
  kind: "list";
  itemLabel: string;
  default: Record<string, string>[];
  min?: number;
  max?: number;
}

export type BlockDef = SingleBlockDef | ListBlockDef;

export type ContentValue = Record<string, string> | Record<string, string>[];
export type ContentMap = Record<string, ContentValue>;

/** Default hero background — high-res render of the original landing image. */
export const HERO_IMAGE_DEFAULT =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAD7CRbu1MDRsH4TN6CMMoCuZem3bk7Zoa_bscO-phi_SuypUigU8_5QJZGTeNS_ktfncpFQBKZtFu3rAO0JX-qcm-O4Sj0EA08Z10p0AScu-A7iJPOGzB2CSra3zxcvfjgBXNt2iHnS6Xl0fr4JrMG-2UTby9AL3upWcLLHem5w300tDsCUG5YJJbznbq9aB80G8OMtG-44TQ98OFl_bUJPbLhMijXnLd_jebhBFcneWlESt43Uc_n=w2560";

export const CONTENT_BLOCKS: BlockDef[] = [
  // --------------------------------------------------------------- Branding --
  {
    key: "branding.logo",
    label: "Logo",
    group: "Branding",
    description:
      "Your logo — shown in the site header, footer and login screen. Leave empty to use the built-in Travelling Goats logo.",
    kind: "single",
    fields: [
      {
        name: "imageUrl",
        label: "Logo image",
        type: "image",
        recommend: "Wide logo ~400×120px (≈3:1), transparent PNG",
        minWidth: 120,
        minHeight: 40,
        maxWidth: 3000,
        maxHeight: 1200,
        aspect: "3/1",
      },
      { name: "height", label: "Display height in px (20–64)", type: "text", placeholder: "32" },
    ],
    default: { imageUrl: "", height: "32" },
  },
  // ---------------------------------------------------------------- Landing --
  {
    key: "landing.hero",
    label: "Hero Section",
    group: "Landing Page",
    description: "The large banner at the top of the landing page.",
    kind: "single",
    fields: [
      { name: "titleLine1", label: "Headline line 1", type: "text" },
      { name: "titleLine2", label: "Headline line 2", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      { name: "imageUrl", label: "Background image URL", type: "image", recommend: "Wide hero photo ~2000×1200px (landscape), JPG", minWidth: 1200, minHeight: 700, aspect: "16/9" },
      { name: "primaryCta", label: "Primary button text", type: "text" },
      { name: "secondaryCta", label: "Secondary button text", type: "text" },
    ],
    default: {
      titleLine1: "Meet New People.",
      titleLine2: "Explore New Places.",
      subtitle:
        "Join curated group trips across India. Travel solo, as a couple, or with friends. Everything is planned for you.",
      imageUrl: HERO_IMAGE_DEFAULT,
      primaryCta: "Explore Trails",
      secondaryCta: "How It Works",
    },
  },
  {
    key: "landing.steps",
    label: "How It Works — Steps",
    group: "Landing Page",
    description: "The 4-step 'how it works' explainer.",
    kind: "list",
    itemLabel: "Step",
    min: 1,
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "desc", label: "Description", type: "textarea" },
    ],
    default: [
      { title: "Choose a Trip", desc: "Browse curated itineraries designed for maximum exploration." },
      { title: "Book Your Seat", desc: "Secure your spot with easy, transparent payments." },
      { title: "Meet Your Crew", desc: "Connect with fellow travelers before the journey begins." },
      { title: "Enjoy the Journey", desc: "Leave the planning to us and focus on creating memories." },
    ],
  },
  {
    key: "landing.trustBadges",
    label: "Trust Badges",
    group: "Landing Page",
    description: "Small badges shown under the hero. Icon = Material Symbols name.",
    kind: "list",
    itemLabel: "Badge",
    fields: [
      { name: "icon", label: "Icon (Material Symbol)", type: "text", placeholder: "verified_user" },
      { name: "label", label: "Label", type: "text" },
    ],
    default: [
      { icon: "verified_user", label: "Verified Travelers" },
      { icon: "local_police", label: "Verified Shepherds" },
      { icon: "shield", label: "Safe & Secure" },
      { icon: "payments", label: "Transparent Pricing" },
    ],
  },
  {
    key: "landing.stats",
    label: "Stats (About section)",
    group: "Landing Page",
    kind: "list",
    itemLabel: "Stat",
    fields: [
      { name: "value", label: "Value", type: "text", placeholder: "500+" },
      { name: "label", label: "Label", type: "text", placeholder: "Trips Hosted" },
    ],
    default: [
      { value: "500+", label: "Trips Hosted" },
      { value: "12k+", label: "Happy Travelers" },
      { value: "80+", label: "Destinations" },
      { value: "4.9", label: "Avg. Rating" },
    ],
  },
  {
    key: "landing.nav",
    label: "Navigation Menu",
    group: "Landing Page",
    description: "Top nav links. 'Login' and 'Join Now' buttons are set below.",
    kind: "list",
    itemLabel: "Link",
    fields: [{ name: "label", label: "Label", type: "text" }],
    default: [
      { label: "Home" },
      { label: "Trips" },
      { label: "How it Works" },
      { label: "About" },
      { label: "Community" },
      { label: "FAQ" },
    ],
  },
  {
    key: "landing.buttons",
    label: "Nav Buttons",
    group: "Landing Page",
    kind: "single",
    fields: [
      { name: "login", label: "Login button text", type: "text" },
      { name: "join", label: "Join button text", type: "text" },
    ],
    default: { login: "Login", join: "Join Now" },
  },
  {
    key: "landing.sections",
    label: "Section Headings",
    group: "Landing Page",
    description: "Titles & subtitles for each landing-page section.",
    kind: "single",
    fields: [
      { name: "howTitle", label: "How It Works — title", type: "text" },
      { name: "howSubtitle", label: "How It Works — subtitle", type: "text" },
      { name: "upcomingTitle", label: "Upcoming Adventures — title", type: "text" },
      { name: "upcomingSubtitle", label: "Upcoming Adventures — subtitle", type: "text" },
      { name: "aboutTitle", label: "About — title", type: "text" },
      { name: "aboutBody", label: "About — body", type: "textarea" },
      { name: "communityTitle", label: "Community — title", type: "text" },
      { name: "communitySubtitle", label: "Community — subtitle", type: "textarea" },
      { name: "faqTitle", label: "FAQ — title", type: "text" },
      { name: "faqSubtitle", label: "FAQ — subtitle", type: "text" },
    ],
    default: {
      howTitle: "How It Works",
      howSubtitle: "Your journey from screen to summit, simplified.",
      upcomingTitle: "Upcoming Adventures",
      upcomingSubtitle: "Hand-picked routes for the next month.",
      aboutTitle: "About Travelling Goats",
      aboutBody:
        "We started Travelling Goats to make group travel effortless, safe, and unforgettable. Every itinerary is handpicked, every captain is verified, and every price is transparent — so you can focus on the adventure and the friends you'll make along the way.",
      communityTitle: "Loved by the Herd",
      communitySubtitle: "Real stories from travelers who found new places — and new friends — with us.",
      faqTitle: "Frequently Asked Questions",
      faqSubtitle: "Everything you need to know before you join the herd.",
    },
  },
  {
    key: "landing.footer",
    label: "Footer",
    group: "Landing Page",
    kind: "single",
    fields: [
      { name: "copyright", label: "Copyright text (© year auto-added)", type: "text" },
    ],
    default: { copyright: "Travelling Goats. All rights reserved." },
  },
  // ------------------------------------------------------------------- Home --
  {
    key: "home.perks",
    label: "Value Props / Perks",
    group: "Home Feed",
    description: "The four benefit cards shown under the greeting.",
    kind: "list",
    itemLabel: "Perk",
    fields: [
      { name: "icon", label: "Icon (Material Symbol)", type: "text", placeholder: "health_and_safety" },
      { name: "title", label: "Title", type: "text" },
      { name: "desc", label: "Description", type: "textarea" },
    ],
    default: [
      { icon: "health_and_safety", title: "Women-Safe Travel", desc: "Verified captains & women-friendly groups for worry-free trips." },
      { icon: "diversity_3", title: "Meet New Friends", desc: "Bond with like-minded travelers on every group journey." },
      { icon: "map", title: "Fully Planned Trips", desc: "Handpicked itineraries — just pack your bags and show up." },
      { icon: "verified_user", title: "Transparent Pricing", desc: "No hidden charges. Secure payments with clear inclusions." },
    ],
  },
  {
    key: "home.provocations",
    label: "Greeting Prompts",
    group: "Home Feed",
    description: "Rotating one-liners shown under the greeting (one is picked at random).",
    kind: "list",
    itemLabel: "Prompt",
    min: 1,
    fields: [{ name: "text", label: "Prompt", type: "textarea" }],
    default: [
      { text: "The mountains are calling — answer with a group trip this weekend." },
      { text: "New places, new friends, unforgettable memories. Your next adventure is one tap away." },
      { text: "Life's short and India's big. Where will you wander next?" },
      { text: "Pack light, travel far — your crew is already waiting." },
    ],
  },
  {
    key: "home.categories",
    label: "Explore Categories",
    group: "Home Feed",
    description: "Category chips in the 'Explore by Category' row.",
    kind: "list",
    itemLabel: "Category",
    fields: [
      { name: "label", label: "Label", type: "text" },
      { name: "icon", label: "Icon (Material Symbol)", type: "text", placeholder: "hiking" },
    ],
    default: [
      { label: "Adventure", icon: "hiking" },
      { label: "Beach", icon: "beach_access" },
      { label: "Mountain", icon: "landscape" },
      { label: "Cultural", icon: "temple_hindu" },
      { label: "Wildlife", icon: "pets" },
      { label: "Road Trip", icon: "directions_car" },
      { label: "Camping", icon: "camping" },
      { label: "Spiritual", icon: "self_improvement" },
    ],
  },
  {
    key: "home.inspirationSlides",
    label: "Inspiration Carousel",
    group: "Home Feed",
    description: "The rotating hero carousel of photos + quotes at the top of the home feed.",
    kind: "list",
    itemLabel: "Slide",
    min: 1,
    fields: [
      { name: "img", label: "Image", type: "image", recommend: "Landscape ~1200×800px, JPG", minWidth: 600, minHeight: 400, aspect: "3/2" },
      { name: "tag", label: "Tag / label", type: "text", placeholder: "Curated Road Trips" },
      { name: "icon", label: "Icon (Material Symbol)", type: "text", placeholder: "directions_car" },
      { name: "quote", label: "Quote", type: "text", placeholder: "Chase the horizon." },
      { name: "author", label: "Author / caption", type: "text" },
    ],
    default: [
      { img: "/inspiration/van.jpg", tag: "Curated Road Trips", icon: "directions_car", quote: "Chase the horizon.", author: "Travelling Goats" },
      { img: "/inspiration/tent.jpg", tag: "Handpicked Campsites", icon: "camping", quote: "Wake up somewhere wild.", author: "Travelling Goats" },
      { img: "/inspiration/mountains.jpg", tag: "Guided Mountain Treks", icon: "landscape", quote: "The peaks are waiting.", author: "Travelling Goats" },
      { img: "/inspiration/campfire.jpg", tag: "Meet Your Crew", icon: "diversity_3", quote: "Better with your herd.", author: "Travelling Goats" },
    ],
  },
  {
    key: "home.visibility",
    label: "Section Visibility",
    group: "Home Feed",
    description: "Show or hide whole sections on the home page.",
    kind: "single",
    fields: [
      { name: "offers", label: "Offer Banners", type: "toggle" },
      { name: "inspiration", label: "Inspiration Carousel", type: "toggle" },
      { name: "perks", label: "Value Props / Perks", type: "toggle" },
      { name: "categories", label: "Explore Categories", type: "toggle" },
    ],
    default: { offers: "true", inspiration: "true", perks: "true", categories: "true" },
  },
  {
    key: "home.offers",
    label: "Offer Banners",
    group: "Home Feed",
    description:
      "Promotional offer cards shown in a scrollable row on the home page. Leave the list empty to hide the section.",
    kind: "list",
    itemLabel: "Offer",
    fields: [
      { name: "title", label: "Headline", type: "text", placeholder: "Flat ₹1000 OFF" },
      { name: "subtitle", label: "Subtext", type: "text", placeholder: "On your first group trip" },
      { name: "badge", label: "Code / tag", type: "text", placeholder: "FIRST1000" },
      { name: "color", label: "Card color (hex)", type: "text", placeholder: "#FF385C" },
      { name: "ctaText", label: "Button text", type: "text", placeholder: "Grab now" },
      { name: "link", label: "Link (where it goes)", type: "text", placeholder: "/trips" },
      {
        name: "image",
        label: "Side image (optional)",
        type: "image",
        recommend: "Square ~400×400px, transparent PNG",
        minWidth: 200,
        minHeight: 200,
        aspect: "1/1",
      },
    ],
    default: [
      { title: "Flat ₹1000 OFF", subtitle: "On your first group trip", badge: "FIRST1000", color: "#FF385C", ctaText: "Grab now", link: "/trips", image: "" },
      { title: "Weekend Getaways", subtitle: "Starting ₹2,999 per person", badge: "WEEKEND", color: "#0E7C7B", ctaText: "Explore", link: "/trips", image: "" },
      { title: "Refer & Earn", subtitle: "Get 50 points per friend", badge: "REFER50", color: "#7C3AED", ctaText: "Invite", link: "/referral", image: "" },
      { title: "Monsoon Special", subtitle: "20% off all hill stations", badge: "RAIN20", color: "#1E6FB0", ctaText: "Book now", link: "/trips", image: "" },
    ],
  },
  {
    key: "home.sections",
    label: "Section Titles & Search",
    group: "Home Feed",
    description: "Search box placeholder and the titles of each home-feed row.",
    kind: "single",
    fields: [
      { name: "searchPlaceholder", label: "Search box placeholder", type: "text" },
      { name: "trendingTitle", label: "Trending row title", type: "text" },
      { name: "weekendTitle", label: "Weekend row title", type: "text" },
      { name: "categoriesTitle", label: "Categories row title", type: "text" },
      { name: "popularTitle", label: "Popular row title", type: "text" },
    ],
    default: {
      searchPlaceholder: "Search trips, destinations...",
      trendingTitle: "Trending Now",
      weekendTitle: "Weekend Getaways",
      categoriesTitle: "Explore by Category",
      popularTitle: "Popular Destinations",
    },
  },
];

// Order the admin shows blocks in — matching each page top-to-bottom.
export const BLOCK_ORDER: string[] = [
  // Branding
  "branding.logo",
  // Landing Page (top → bottom)
  "landing.nav",
  "landing.buttons",
  "landing.hero",
  "landing.trustBadges",
  "landing.sections",
  "landing.steps",
  "landing.stats",
  "landing.footer",
  // Home Feed (top → bottom)
  "home.visibility",
  "home.sections",
  "home.provocations",
  "home.offers",
  "home.inspirationSlides",
  "home.perks",
  "home.categories",
];

/** Blocks sorted to match on-page order (unlisted keys go to the end). */
export function orderedBlocks(blocks: BlockDef[]): BlockDef[] {
  const idx = (k: string) => {
    const i = BLOCK_ORDER.indexOf(k);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...blocks].sort((a, b) => idx(a.key) - idx(b.key));
}

const BLOCK_BY_KEY: Record<string, BlockDef> = Object.fromEntries(
  CONTENT_BLOCKS.map((b) => [b.key, b])
);

export function getBlockDef(key: string): BlockDef | undefined {
  return BLOCK_BY_KEY[key];
}

/** Default value for a single block key. */
export function blockDefault(key: string): ContentValue {
  const def = BLOCK_BY_KEY[key];
  return def ? structuredCloneSafe(def.default) : {};
}

/** A full map of every block key → its default value. */
export function defaultContentMap(): ContentMap {
  const map: ContentMap = {};
  for (const block of CONTENT_BLOCKS) map[block.key] = structuredCloneSafe(block.default);
  return map;
}

// structuredClone isn't guaranteed in every runtime target; JSON round-trip is
// safe here because block values are always plain JSON.
function structuredCloneSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

/** Helpers for typed reads in the public pages. */
export function asList(v: ContentValue | undefined): Record<string, string>[] {
  return Array.isArray(v) ? v : [];
}

export function asObject(v: ContentValue | undefined): Record<string, string> {
  return v && !Array.isArray(v) ? v : {};
}
