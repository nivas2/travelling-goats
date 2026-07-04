---
id: REQ-009
original_prompt: "Rebrand MeetMyRoute to Travelling Goats with goat/mountain theme..."
rephrased_at: 2026-07-05T03:00:00Z
---

# Rephrased Prompt: Complete Brand Rebrand from "MeetMyRoute" to "Travelling Goats"

## Pre-Work: Safety Backup (Do This First, Before Any Other Changes)

Before touching a single file, perform these safety steps in order:

1. **Commit all pending changes** on the current `master` branch (there are uncommitted modifications to `pp/original-prompts.md` and an untracked `pp/rephrased/REQ-008-rephrased.md`).
2. **Create a backup branch** named `backup/pre-rebrand-<timestamp>` from the current `master` HEAD.
3. **Verify** the backup branch exists and contains the full codebase by running `git log --oneline -1 backup/pre-rebrand-*`.
4. **Return to `master`** (or a new working branch like `feat/rebrand-travelling-goats`) before proceeding.

Do NOT proceed to any branding changes until the backup is confirmed.

---

## Objective

Perform a complete, application-wide rebrand of this Next.js travel application from **"MeetMyRoute"** to **"Travelling Goats"** -- a premium travel community with a subtle, sophisticated goat/mountain theme. The rebrand covers every user-facing string, metadata reference, asset path, and copy throughout the codebase.

**Brand identity:** Adventurous, community-driven, premium, friendly, modern, mountain explorer. Fun but never childish. Think premium outdoor brand, not cartoon.

---

## Hard Constraints (Do NOT Violate)

- **DO NOT** change any functionality, business logic, API behavior, or data models.
- **DO NOT** change navigation structure, layouts, page routing, or user flows.
- **DO NOT** change the existing color palette (`#FF385C`, `#FFFFFF`, `#222222` and their variants).
- **DO NOT** change component architecture, responsive behavior, or design system structure.
- **DO NOT** rename database tables, API routes, URL slugs, or query parameters (these are backend concerns, not brand-facing).
- **DO NOT** change any variable names, function names, or file names unless they directly produce user-visible branded text (e.g., a component rendering "MeetMyRoute" as text is fine to update the string, but don't rename the component file itself unless strictly necessary).
- Only change: brand name strings, user-facing copy/terminology, metadata, manifest, SEO tags, favicons/icon references, empty/loading/error/success state text, button labels, notification templates, onboarding copy, admin panel labels, and illustration/animation placeholder references.

---

## Requirements

### 1. Brand Name & Identity Replacement

Find and replace **every instance** of "MeetMyRoute" (and variations like "Meet MyRoute", "meetmyroute") across the entire codebase.

**Known locations** (at minimum -- search exhaustively for others):
- `src/app/layout.tsx` -- metadata title, description, keywords, authors, creator, openGraph, twitter cards
- `public/manifest.json` -- PWA name, short_name, description
- `src/components/landing/landing-page.tsx`
- `src/app/(main)/profile/settings/page.tsx`
- `src/app/(main)/trips/[id]/page.tsx`
- `src/app/(main)/search/page.tsx`
- `src/app/(main)/help/page.tsx`
- `src/app/(main)/referral/page.tsx`
- `src/app/(main)/wallet/page.tsx`
- `src/app/(main)/profile/page.tsx`
- `src/app/(main)/emergency/page.tsx`
- `src/app/(main)/trips/[id]/reviews/page.tsx`
- `src/app/(booking)/[tripId]/success/page.tsx`
- `src/app/(booking)/[tripId]/payment/page.tsx`
- `src/app/(booking)/[tripId]/status/page.tsx`
- `src/app/(booking)/[tripId]/ticket/page.tsx`
- `src/app/admin/login/page.tsx`
- `src/app/(auth)/verification-complete/page.tsx`

**Replacements:**
| Old | New |
|-----|-----|
| MeetMyRoute | Travelling Goats |
| Meet MyRoute | Travelling Goats |
| meetmyroute (in URLs/domains) | travellinggoats (or leave domain URLs unchanged if they are live production URLs -- add a TODO comment instead) |

**SEO Metadata updates** (`src/app/layout.tsx`):
- Title: `"Travelling Goats -- Adventure Travel with the Herd"`
- Template: `"%s | Travelling Goats"`
- Description: `"Join the herd. Discover curated group trails across India. Travel with fellow goats -- verified explorers, transparent pricing, unforgettable adventures."`
- Keywords: add `"Travelling Goats"`, `"herd travel"`, `"trail adventures"` alongside existing travel keywords
- Authors/creator: `"Travelling Goats"`
- OpenGraph/Twitter: update siteName, titles, descriptions accordingly

**PWA Manifest** (`public/manifest.json`):
- name: `"Travelling Goats -- Adventure Travel with the Herd"`
- short_name: `"Travelling Goats"`
- description: `"Join the herd. Discover curated group trails across India."`

### 2. Terminology Mapping (User-Facing Strings Only)

Apply these terminology replacements across **all user-facing text** in the application. Search for each term and replace in context (do not blindly find-replace -- ensure grammatical correctness and that you're only replacing user-facing labels, not code identifiers).

**Core terminology:**
| Old Term | New Term | Context |
|----------|----------|---------|
| Trip(s) | Trail(s) | Page titles, card labels, section headers, descriptions, empty states |
| Trip Captain | Shepherd | Profile badges, trip detail pages, booking flow |
| Co-host | Assistant Shepherd | Where applicable |
| Trip Members | Herd | Member lists, counts |
| User(s) (as community term) | Goat(s) | User-facing labels, not code/DB references |
| Community | The Herd | Community sections |
| Booking(s) | Trail Booking(s) | Booking confirmations, my-bookings page, admin |
| Trip Requests | Trail Requests | Request pages |
| Wishlist / Saved | Dream Trails | Saved trips page (`src/app/(main)/saved/page.tsx`) |
| Group Chat | Campfire Chat | Chat features if present |
| Followers | Herd Members | Social features |
| Invite Friends | Grow Your Herd | Referral page (`src/app/(main)/referral/page.tsx`) |
| Premium | Explorer Pass | Premium tier references |
| Points | Trail Points | Rewards (`src/app/(main)/rewards/page.tsx`) |
| Achievements | Goat Milestones | Rewards/achievements |
| Solo Registration | Lone Goat | Seat selection (`src/app/(booking)/[tripId]/seats/page.tsx`) |
| Couple Registration | Goat Pair | Seat selection |
| Group Registration | Mountain Herd | Seat selection |

### 3. Button Label Updates

Replace these button labels wherever they appear:

| Old Label | New Label | Known Locations |
|-----------|-----------|-----------------|
| Book Now | Join the Herd | `src/app/(main)/trips/[id]/page.tsx`, `src/components/landing/landing-page.tsx` |
| Reserve Seat | Claim Your Spot | Booking flow seat selection |
| Continue (in booking/onboarding flows) | Keep Trekking | `src/app/(booking)/*/page.tsx`, `src/app/(onboarding)/*/page.tsx`, `src/components/booking/booking-bottom-bar.tsx` |
| Explore Trips | Explore Trails | `src/app/(main)/my-trips/page.tsx`, `src/app/(main)/search/page.tsx`, `src/app/(main)/saved/page.tsx`, `src/components/landing/landing-page.tsx` |
| Contact Trip Captain | Contact Shepherd | Trip detail pages |
| Complete Setup | Start Your Adventure | Onboarding permissions page |
| Skip & Continue | Skip for Now | Onboarding |

**Note:** Do NOT rename `handleContinue` or other function/variable names -- only change the rendered text label.

### 4. Empty State Copy

Replace all empty state messages with goat-themed equivalents. Known empty state locations include:

- **No trips/trails:** `"Looks like this trail hasn't been explored yet."` -- `src/app/(main)/my-trips/page.tsx`, `src/app/(main)/search/page.tsx`, `src/app/admin/trips/page.tsx`
- **No bookings:** `"No hoofprints here yet. Time to hit the trail!"` -- `src/app/admin/bookings/page.tsx`, `src/app/(main)/my-trips/page.tsx`
- **No notifications:** `"Your bell is quiet for now. Adventure updates will appear here."` -- `src/app/(main)/notifications/page.tsx`, `src/app/admin/notifications/page.tsx`
- **No saved/wishlist:** `"No dream trails saved yet. Start exploring!"` -- `src/app/(main)/saved/page.tsx`
- **No reviews:** `"No trail stories yet. Be the first to share!"` -- `src/app/(main)/trips/[id]/reviews/page.tsx`
- **No search results:** `"No trails match your search. Try a different path."` -- `src/app/(main)/search/page.tsx`
- **No friends/referrals:** `"Every herd starts with one goat. Invite your friends!"` -- `src/app/(main)/referral/page.tsx`
- **No rewards:** `"Your trail points journey begins here."` -- `src/app/(main)/rewards/page.tsx`
- **No wallet transactions:** `"Your wallet is resting. Trail points will appear after your first adventure."` -- `src/app/(main)/wallet/page.tsx`
- **Profile empty sections:** Use contextually appropriate goat-themed copy.

### 5. Loading State Copy

Replace or add loading state text (skeleton screens, spinners, loading overlays) with rotating goat-themed messages:

- `"Finding the perfect trail..."`
- `"Gathering your herd..."`
- `"Checking mountain paths..."`
- `"Packing backpacks..."`
- `"Sharpening hooves..."`
- `"Adventure is almost ready..."`

If the app currently uses simple spinners without text, add subtle loading text where appropriate without changing the layout.

### 6. Success State Copy

Update success/confirmation messages:
- Booking success: `"Welcome to the Herd! Your trail booking is confirmed."`
- Payment success: `"Trail Joined Successfully! Adventure awaits."`
- Profile update: `"Profile updated. Looking good, fellow goat!"`
- Registration/verification complete: `"You're officially part of the herd."`
- Review submitted: `"Thanks for sharing your trail story!"`

### 7. Error State Copy

Update error messages with brand-appropriate copy (keep them helpful, not just cute):
- Generic error: `"Oops! Looks like this goat wandered off the trail. Let's try another path."`
- Network error: `"The mountain signal is weak. Check your connection and try again."`
- 404/Not found: `"This trail doesn't exist. Let's find you a better one."`
- Validation errors: Keep specific and helpful, but prefix with `"Hold your hooves -- "` where appropriate.
- Payment failure: `"Payment didn't go through. Let's try that again."`

### 8. Onboarding Flow Copy

Update all onboarding screens (`src/app/(onboarding)/*`):

- **Welcome screen** (`welcome/page.tsx`): `"Welcome to Travelling Goats"` / `"Adventure is always better with the herd."`
- **Interests** (`interests/page.tsx`): `"What trails call to you?"` / `"Pick your adventure style"`
- **Budget** (`budget/page.tsx`): `"Choose your trekking style"` (keep budget tiers functional, just rephrase labels if needed)
- **Pickup city** (`pickup-city/page.tsx`): `"Where does your trail begin?"` / `"Select your base camp"`
- **Permissions** (`permissions/page.tsx`): `"Stay connected with the herd"` / contextual permission descriptions

### 9. Admin Panel Terminology

Update all admin panel labels and headers (`src/app/admin/*`):

| Old | New |
|-----|-----|
| Users | Goats |
| Trip Captains | Shepherds |
| Trips | Trails |
| Bookings | Trail Bookings |
| Analytics (if present) | Herd Analytics |
| Reports (if present) | Trail Reports |
| Dashboard header/title | Herd Dashboard |

Also update admin sidebar/navigation labels, admin page titles, table column headers, and admin empty states to match.

### 10. Notification Templates

If there are notification message templates (check `src/app/api/` and `src/app/(main)/notifications/`), update them:
- `"A new trail is waiting for you."`
- `"A new goat joined your herd."`
- `"Your Shepherd updated the itinerary."`
- `"Adventure starts soon -- get ready!"`
- `"Your herd is ready to go."`

### 11. Illustration & Asset References

- Add TODO comments or placeholder references where goat-themed illustrations should replace generic travel art. Use the format: `{/* TODO: Replace with Travelling Goats branded illustration -- [description] */}`
- Suggested illustration placements:
  - Empty state illustrations (goat on empty trail, goat looking through binoculars, campfire scene)
  - Onboarding screens (mountain/goat welcome illustration)
  - Login/registration (subtle mountain silhouette)
  - Success states (celebrating goat)
  - Error states (confused goat)

### 12. Micro-Animation Placeholders

Add CSS class names and TODO comments for future goat-themed micro-animations. Do NOT implement complex animations -- just add the structural hooks:

- `className="animate-hoofprints"` on loading indicators -- `{/* TODO: Animated hoofprint dots loading animation */}`
- `className="animate-bell-jiggle"` on notification bell icons -- `{/* TODO: Bell jiggle on new notification */}`
- `className="animate-goat-hop"` on success state icons -- `{/* TODO: Subtle hop animation on success */}`
- `className="animate-trail-draw"` on decorative trail elements -- `{/* TODO: Trail line drawing animation */}`

Add empty CSS keyframe stubs in `globals.css` for these animation names so they don't cause console warnings.

---

## File-by-File Scope Summary

Ensure you check and update (where relevant) at minimum these areas:

| Area | Files/Directories |
|------|-------------------|
| Root metadata & PWA | `src/app/layout.tsx`, `public/manifest.json` |
| Landing page | `src/components/landing/landing-page.tsx` |
| Auth flow | `src/app/(auth)/**` |
| Onboarding flow | `src/app/(onboarding)/**` |
| Main app pages | `src/app/(main)/**` (home, trips, search, saved, my-trips, profile, notifications, referral, rewards, wallet, help, emergency) |
| Booking flow | `src/app/(booking)/**` |
| Admin panel | `src/app/admin/**` |
| Shared components | `src/components/**` (booking, landing, layout, ui, admin) |
| API response messages | `src/app/api/**` (only user-facing error/success messages in responses) |
| Global styles | `src/app/globals.css` (animation stubs) |

---

## Verification Checklist

After completing all changes, verify:

1. **Zero "MeetMyRoute" references remain** in any user-facing string (search the entire `src/` directory and `public/` directory).
2. **PWA manifest** is updated with new brand name and description.
3. **Browser tab title** shows "Travelling Goats" on all pages.
4. **All button labels** match the new terminology mapping.
5. **All empty states** use goat-themed copy.
6. **Admin panel** uses goat terminology consistently.
7. **Onboarding screens** use updated copy.
8. **No functionality is broken** -- the app works exactly as before, just with new branding.
9. **No color changes** -- the `#FF385C` / `#FFFFFF` / `#222222` palette is untouched.
10. **No layout changes** -- page structure, component sizes, spacing, and responsive behavior are identical.
11. **Animation stubs** exist in `globals.css` and don't cause errors.

---

## Deliverable

Provide a summary report listing:
- Total files modified
- Every terminology change applied (with file paths)
- Any locations where manual follow-up is needed (e.g., logo image files, illustration assets)
- Confirmation that no functionality, layout, or color changes were made

---
*Original: "i am taking so risk decision, copy this exting code and create a new folder & also new git branch and keep that exsting code safe..."*
*Rephrased by prompt engineering agent*
