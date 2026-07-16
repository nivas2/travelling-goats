# Plan: Rebrand "MeetMyRoute" to "Meet My Route"

## Context

The user wants to rebrand the entire app from "MeetMyRoute" to "Meet My Route" — a premium travel community with a sophisticated goat/mountain theme. This is a **text-only rebrand**: NO changes to colors (#FF385C/#FFFFFF/#222222), functionality, layouts, navigation routes, or component architecture.

The user provided a goat-in-map-pin logo (PNG). It appears as icon + "TRAVELLING" (dark) + "GOATS" (coral #FF385C) text in the navbar.

**Safety:** Create a local backup branch before any changes.

**Total scope:** ~42 files modified, 1 new file created.

---

## Phase 0: Safety Backup

1. Commit any pending changes on `master`
2. `git checkout -b backup/pre-rebrand-meetmyroute` from current HEAD
3. Return to `master` for all work

---

## Phase 1: Create Logo Component

**New file:** `src/components/ui/travelling-goats-logo.tsx`

- Inline SVG component recreating the goat-in-map-pin logo from the user's PNG
- Props: `size` ("sm"|"md"|"lg"), `className`, `showText` (default true)
- Text: "TRAVELLING" in `text-on-surface`, "GOATS" in `text-primary`
- Used in: top-nav-bar, admin-sidebar, login page, landing page

---

## Phase 2: Core Metadata & Config (5 files)

| File | Changes |
|------|---------|
| `src/app/layout.tsx` | 9 "MeetMyRoute" → "Meet My Route" (title, template, keywords, authors, creator, siteName, OG, twitter). Domain URL → add TODO comment |
| `public/manifest.json` | name + short_name → "Meet My Route" |
| `public/sw.js` | Cache name → `travellinggoats-v2` |
| `package.json` | name → `travellinggoats-app` |

---

## Phase 3: Navigation (3 files)

| File | Changes |
|------|---------|
| `src/components/layout/top-nav-bar.tsx` | Lines 60-62: Replace `Meet<span>MyRoute</span>` with `<TravellingGoatsLogo size="sm" />`. NAV_LINKS "My Trips" → "My Trails" |
| `src/components/layout/bottom-nav-bar.tsx` | "My Trips" → "My Trails" |
| `src/components/layout/admin-sidebar.tsx` | Lines 91-93: Replace logo with `<TravellingGoatsLogo />` + "Admin" badge. navItems: "Trips" → "Trails", "Analytics" → "Community Analytics" |

---

## Phase 4: Auth Pages (3 files)

| File | Changes |
|------|---------|
| `src/app/(auth)/login/page.tsx` | Replace logo text with `<TravellingGoatsLogo size="lg" />`. Tagline → "Roam with the community" |
| `src/app/admin/login/page.tsx` | "manage MeetMyRoute" → "manage Meet My Route". Email placeholder → travellinggoats.in |
| `src/app/(auth)/verification-complete/page.tsx` | "MeetMyRoute experience" → "Meet My Route experience" |

---

## Phase 5: Landing Page (1 file)

`src/components/landing/landing-page.tsx`:
- Replace logo with `<TravellingGoatsLogo />`
- "Explore Trips" → "Explore Trails"
- "Trip Captain" → "Trip Captain"
- "Book Now" → "Join the Community"
- Footer "MeetMyRoute" → "Meet My Route"

---

## Phase 6: Booking Flow (7 files)

| File | Changes |
|------|---------|
| `src/components/booking/booking-bottom-bar.tsx` | Default `nextLabel` "Continue" → "Keep Trekking" (line 30) — cascades everywhere |
| `src/app/(booking)/[tripId]/seats/page.tsx` | "trip captain" → "Trip Captain" |
| `src/app/(booking)/[tripId]/travelers/page.tsx` | "Solo" → "Lone Goat", "Couple" → "Goat Pair", "Group" → "Mountain Community". Descriptions updated |
| `src/app/(booking)/[tripId]/payment/page.tsx` | Razorpay name → "Meet My Route" |
| `src/app/(booking)/[tripId]/success/page.tsx` | Share text "MeetMyRoute" → "Meet My Route", "trip" → "trail". Domain URL → TODO |
| `src/app/(booking)/[tripId]/ticket/page.tsx` | "MeetMyRoute" branding → "Meet My Route" |
| `src/app/(booking)/[tripId]/status/page.tsx` | "MeetMyRoute team" → "Meet My Route team". Email → TODO |

---

## Phase 7: Main App Pages (7 files)

| File | Changes |
|------|---------|
| `src/app/(main)/trips/[id]/page.tsx` | "MeetMyRoute" in reviews/share → "Meet My Route". "Book Now" → "Join the Community" |
| `src/app/(main)/trips/[id]/reviews/page.tsx` | 3 hardcoded review comments: "MeetMyRoute" → "Meet My Route" |
| `src/app/(main)/trips/[id]/hub/page.tsx` | "Trip Captain" rendered text → "Trip Captain" (3 instances) |
| `src/app/(main)/my-trips/page.tsx` | Header "My Trips" → "My Trails". "Trip Captain" → "Trip Captain". "Explore Trips" → "Explore Trails". Empty states: "trips" → "trails" |
| `src/app/(main)/saved/page.tsx` | "Saved Trips" → "Dream Trails". Empty state → goat-themed. "Explore Trips" → "Explore Trails" |
| `src/app/(main)/search/page.tsx` | localStorage key → travellinggoats. "Explore Trips" → "Explore Trails". "trips found" → "trails found" |
| `src/app/(main)/notifications/page.tsx` | "No notifications yet" → "Your bell is quiet for now." |

---

## Phase 8: Profile & Settings (2 files)

| File | Changes |
|------|---------|
| `src/app/(main)/profile/page.tsx` | "About MeetMyRoute" → "About Meet My Route". Fallback name → "Meet My Route Explorer" |
| `src/app/(main)/profile/settings/page.tsx` | "MeetMyRoute v1.0.0" → "Meet My Route v1.0.0" |

---

## Phase 9: Support Pages (4 files)

| File | Changes |
|------|---------|
| `src/app/(main)/help/page.tsx` | Emails → travellinggoats.in with TODO. FAQ "MeetMyRoute wallet" → "Meet My Route wallet". "Trip Captains" → "Trip Captains" |
| `src/app/(main)/emergency/page.tsx` | "Trip Captain" → "Trip Captain" (6 instances). "MeetMyRoute Helpline" → "Meet My Route Helpline" |
| `src/app/(main)/referral/page.tsx` | "Join MeetMyRoute" → "Join Meet My Route". "Invite friends" → "Grow Your Community" |
| `src/app/(main)/wallet/page.tsx` | "MeetMyRoute wallet" → "Meet My Route wallet" |

---

## Phase 10: Onboarding (5 files)

| File | Changes |
|------|---------|
| `src/app/(onboarding)/welcome/page.tsx` | Slide 1: "Travel with a tribe" → "Roam with the community", "travelers" → "trekkers". Slide 2: "Curated experiences" → "Handpicked trails". Slide 3: "travelers" → "trekkers". "Get Started" → "Let's Trek" |
| `src/app/(onboarding)/interests/page.tsx` | "Continue" → "Keep Trekking" |
| `src/app/(onboarding)/budget/page.tsx` | "Continue" → "Keep Trekking" |
| `src/app/(onboarding)/pickup-city/page.tsx` | "Continue" → "Keep Trekking" |
| `src/app/(onboarding)/permissions/page.tsx` | "Complete Setup" → "Start Your Adventure". "Skip & Continue" → "Skip for Now" |

---

## Phase 11: Admin Pages (5 files)

| File | Changes |
|------|---------|
| `src/app/admin/users/page.tsx` | "Trip Captain" dropdown label → "Trip Captain" (keep value TRIP_CAPTAIN) |
| `src/app/admin/trips/page.tsx` | "Trip Management" → "Trail Management" |
| `src/app/admin/bookings/page.tsx` | "Booking Management" → "Trail Booking Management" |
| `src/app/admin/analytics/page.tsx` | "Analytics Dashboard" → "Community Analytics" |
| `src/app/admin/dashboard/page.tsx` | "Dashboard" heading → "Community Dashboard" |

---

## Phase 12: Seed Data (1 file)

`prisma/seed.ts`:
- Admin email → travellinggoats.in with TODO
- Admin name → "Meet My Route Admin"
- FAQ answers: "MeetMyRoute" → "Meet My Route", "Trip Captains" → "Trip Captains"

---

## Phase 13: CSS Animation Stubs

`src/app/globals.css` — add at end:
```css
@keyframes goat-hop { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes trail-draw { from{stroke-dashoffset:1000} to{stroke-dashoffset:0} }
@keyframes hoof-print { 0%{opacity:0;transform:scale(0.8)} 100%{opacity:1;transform:scale(1)} }
.animate-goat-hop { animation: goat-hop 0.3s ease-in-out; }
.animate-trail-draw { animation: trail-draw 1.5s ease-in-out forwards; }
.animate-hoof-print { animation: hoof-print 0.4s ease-out; }
```

---

## Phase 14: Verification

1. `grep -ri "MeetMyRoute" src/ public/` → zero (except TODO comments)
2. `grep -ri "meetmyroute" src/ public/` → zero (except TODOs)
3. `grep -r "Trip Captain" src/` → zero in rendered text
4. `grep -r '"Book Now"' src/` → zero
5. `grep -r '"Explore Trips"' src/` → zero
6. `npm run build` → compiles successfully
7. Deploy to server and visual-check logo in navbar/login/admin

---

## Key Constraints

- **NO color changes** — palette stays as-is
- **NO functionality/layout/routing changes**
- **NO variable/function/file renames** — only rendered text
- **"Continue with Google"** stays (OAuth standard label)
- **Domain URLs** get `// TODO` comments, not changed
- **`tripCaptain` as variable** stays — only displayed text "Trip Captain" changes
