---
id: REQ-003
title: Fix Branding, Login Dark Mode, Auto-Login, My Trips, Seed Data, Admin Audit
planned_at: 2026-07-04T09:50:00Z
files_to_modify:
  - src/components/layout/top-nav-bar.tsx
  - src/components/layout/admin-sidebar.tsx
  - src/app/(auth)/login/page.tsx
  - src/components/theme-provider.tsx
  - src/app/globals.css
  - src/app/api/bookings/route.ts
  - src/app/(main)/my-trips/page.tsx
  - prisma/seed.ts (new)
  - Multiple admin pages
estimated_complexity: complex
---

# Implementation Plan: Fix Critical Issues + Seed Data + Admin Audit

## Objective
Fix 6 categories of issues: branding, login visual bug, auto-login after logout, My Trips error, empty content (seed data), and admin panel functionality.

## Codebase Analysis

### Issue 1: "Meet MyRoute" → "MeetMyRoute"
- **3 locations** render the name with a space:
  - `src/components/layout/top-nav-bar.tsx` (lines 40-46): Two separate `<span>` elements
  - `src/app/(auth)/login/page.tsx` (lines 74-75): `Meet<span>MyRoute</span>`
  - `src/components/layout/admin-sidebar.tsx` (lines 90-95): Two separate `<span>` elements
- The brand should render as "MeetMyRoute" with "MyRoute" in primary color

### Issue 2: Login page dark overlay in Chrome
- **Root cause**: `ThemeProvider` defaults to `"system"`. Chrome dark mode → adds `.dark` class → triggers `.dark .glass-card { background: rgba(30, 32, 32, 0.7) }` — nearly opaque dark background on the login card
- **The app has no proper dark mode support** — only `.glass-card` has a `.dark` variant, everything else stays light. The result is a broken mixed appearance.
- **Fix**: Force light mode as default since dark mode is not designed yet. Change ThemeProvider default from `"system"` to `"light"`.

### Issue 3: Auto-login after logout
- NextAuth uses JWT strategy with cookies. `signOut()` should clear the session cookie.
- **Potential causes**:
  - Root `/` path redirects authenticated users to `/home` in `src/app/page.tsx`. If the session cookie isn't fully cleared, the redirect happens.
  - Multiple browser tabs — one tab's cookie refresh re-authenticates.
  - Need to verify cookie clearing in `signOut` and check `src/app/page.tsx` redirect logic.

### Issue 4: My Trips "Failed to fetch bookings"
- **Root cause**: Frontend sends `status=UPCOMING` but BookingStatus enum only has `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `REFUNDED`. There is no `UPCOMING` or `ONGOING` status.
- The API passes the status directly to Prisma `where: { status }`, which finds no matches or errors.
- **Fix**: The GET handler needs to map tab names to date-based queries:
  - `UPCOMING` = CONFIRMED + startDate > now
  - `ONGOING` = CONFIRMED + startDate <= now && endDate >= now
  - `COMPLETED` = COMPLETED status OR endDate < now

### Issue 5: Seed data
- Create a Prisma seed script with 5-8 realistic Indian travel trips
- Include proper categories (Adventure, Beach, Mountain, Cultural, Wildlife)
- Set trip status to PUBLISHED so they appear in the app
- Use placeholder images from Unsplash for cover images
- Include itinerary days, add-ons, snack options
- Ensure admin can manage all seeded data via existing admin CRUD

### Issue 6: Admin panel audit
- 14 admin pages to check
- Key areas: trip CRUD, user management, booking management, coupon management
- Verify API endpoints work correctly
- Check for crashes and missing functionality

## Implementation Steps

### Step 1: Fix branding — "MeetMyRoute" single word
- **top-nav-bar.tsx**: Merge two spans into one: `<span>Meet</span><span className="text-primary">MyRoute</span>` → `<span>Meet<span className="text-primary">MyRoute</span></span>` (no space)
- **login/page.tsx**: Already correct format `Meet<span>MyRoute</span>` — just verify no visual space
- **admin-sidebar.tsx**: Same merge as top-nav-bar

### Step 2: Fix login dark overlay
- **theme-provider.tsx**: Change default from `"system"` to `"light"` so dark mode doesn't activate automatically
- **globals.css**: Verify `.dark .glass-card` styles remain for future dark mode support but don't trigger by default

### Step 3: Fix auto-login after logout
- Check and fix the signOut flow to ensure cookies are fully cleared
- Verify `src/app/page.tsx` redirect logic
- May need to add `redirect: true` or `callbackUrl` to signOut calls

### Step 4: Fix My Trips bookings API
- **bookings/route.ts GET**: Instead of filtering by status directly, map the tab values:
  - `UPCOMING`: `status IN (PENDING, CONFIRMED)` AND `trip.startDate > now`
  - `ONGOING`: `status = CONFIRMED` AND `trip.startDate <= now` AND `trip.endDate >= now`
  - `COMPLETED`: `status = COMPLETED` OR (`status = CONFIRMED` AND `trip.endDate < now`)
  - No filter (no status param): return all user's bookings

### Step 5: Create seed script
- **New file**: `prisma/seed.ts`
- 5-8 trips with Indian destinations (Manali, Goa, Rishikesh, Coorg, Ladakh, Kerala, Jaipur, Meghalaya)
- Realistic pricing in paise (e.g., 499900 = Rs. 4,999)
- Include itinerary days, categories, cover images
- Create an admin user if not exists
- **package.json**: Add `prisma.seed` script reference

### Step 6: Admin panel audit
- Read and test each admin page
- Fix any API mismatches or crashes
- Verify trip create/edit/delete works with the admin API

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| src/components/layout/top-nav-bar.tsx | modify | Remove space in brand name |
| src/components/layout/admin-sidebar.tsx | modify | Remove space in brand name |
| src/app/(auth)/login/page.tsx | modify | Verify brand name rendering |
| src/components/theme-provider.tsx | modify | Default to "light" instead of "system" |
| src/app/api/bookings/route.ts | modify | Map UPCOMING/ONGOING/COMPLETED to date-based queries |
| prisma/seed.ts | create | Database seed script with sample trips |
| package.json | modify | Add prisma seed config |
| Admin pages | audit | Check all 14 admin pages for functionality |

## Edge Cases & Considerations
- Seed script should be idempotent (check if data exists before inserting)
- Bookings query must handle timezone correctly for ongoing vs upcoming
- Dark mode toggle in settings page should still work for users who explicitly choose dark mode
- Admin pages may rely on trip data existing — seed first, then audit

## Testing Strategy
- Verify "MeetMyRoute" renders without space in header, login, admin sidebar
- Open login page in Chrome with dark mode — should show light background
- Logout → revisit site → should stay logged out
- Open /my-trips → Upcoming/Ongoing/Completed tabs should load without errors
- /home should show populated trips after seeding
- Admin panel: create, edit, delete a trip
