---
id: REQ-003
title: Fix Branding, Login Dark Mode, Auto-Login, My Trips, Seed Data, Admin Audit
status: done
claimed_at: 2026-07-04T10:00:00Z
completed_at: 2026-07-04T11:30:00Z
created_at: 2026-07-04T09:50:00Z
complexity: 4
rephrased_prompt: pp/rephrased/REQ-003-rephrased.md
plan: pp/plans/REQ-003-plan.md
files_modified:
  - src/components/layout/top-nav-bar.tsx
  - src/components/layout/admin-sidebar.tsx
  - src/components/theme-provider.tsx
  - src/app/(main)/profile/page.tsx
  - src/app/api/bookings/route.ts
  - prisma/seed.ts
files_created:
  - src/app/api/admin/users/route.ts
  - src/app/api/admin/users/[id]/route.ts
  - src/app/api/admin/bookings/route.ts
  - src/app/api/admin/bookings/[id]/route.ts
  - src/app/api/admin/payments/route.ts
  - src/app/api/admin/coupons/route.ts
  - src/app/api/admin/coupons/[id]/route.ts
  - src/app/api/admin/referrals/route.ts
  - src/app/api/admin/reviews/route.ts
  - src/app/api/admin/reviews/[id]/route.ts
  - src/app/api/admin/analytics/route.ts
  - src/app/api/admin/notifications/route.ts
  - src/app/api/admin/support/route.ts
  - src/app/api/admin/support/[id]/route.ts
  - src/app/api/admin/support/[id]/reply/route.ts
---

# Fix Critical Issues + Seed Data + Admin Audit

## What
Fix 6 categories of issues in MeetMyRoute: (1) Brand name shows "Meet MyRoute" with space — should be "MeetMyRoute", (2) Login page has dark overlay in Chrome due to unfinished dark mode, (3) Auto-login after logout due to session not clearing, (4) My Trips page crashes with "Failed to fetch bookings" because UPCOMING/ONGOING don't match BookingStatus enum, (5) App looks empty — need seed data with 5-8 realistic Indian trips, (6) Full admin panel audit.

## Why
These are production-blocking issues. Users can't view their trips, can't stay logged out, and the app looks empty/broken in Chrome.

## Done When
1. "MeetMyRoute" appears as one word everywhere (header, login, admin)
2. Login page has no dark overlay in any browser
3. Logout fully clears session — revisiting site stays logged out
4. /my-trips loads Upcoming/Ongoing/Completed tabs without errors
5. Home page shows 5-8 populated trips with realistic data
6. Admin panel is fully functional (trip CRUD, user management, etc.)

## Context
- Brand name split across two `<span>` elements in 3 locations
- ThemeProvider defaults to "system" — Chrome dark mode triggers `.dark .glass-card` dark background
- BookingStatus enum: PENDING, CONFIRMED, CANCELLED, COMPLETED, REFUNDED — no UPCOMING/ONGOING
- Frontend sends `status=UPCOMING` to API which passes it directly to Prisma where clause
- App has no trip data — all sections on /home are empty
- 14 admin pages need audit

## Root Causes Identified
- **Branding**: Two separate `<span>` elements with whitespace between them
- **Dark overlay**: `.dark .glass-card { background: rgba(30,32,32,0.7) }` triggered by system dark mode
- **Auto-login**: JWT session cookie may not be properly cleared on signOut
- **My Trips**: Status enum mismatch — needs date-based query mapping instead
- **Empty content**: No seed data exists in database
- **Admin**: Need full audit of 14 pages

## Rephrased Prompt
See [pp/rephrased/REQ-003-rephrased.md] for the enhanced prompt.

## Implementation Plan
See [pp/plans/REQ-003-plan.md] for the detailed plan.

---
*Captured after 2 clarifying questions*
*User chose: 5-8 trips for seed data, full admin audit*
