---
id: REQ-007
title: Application-Wide UI Polish Pass
planned_at: 2026-07-04T12:15:00Z
files_to_modify: [globals.css, 22 components, 49+ pages]
estimated_complexity: complex
---

# Implementation Plan: UI Polish & Refinement Pass

## Objective

Systematically refine every shared UI component and page to eliminate inconsistencies, enforce an 8px spacing system, standardize visual hierarchy, and achieve production-grade design quality. No redesign — only refinement.

## Codebase Analysis

The app has a solid Material 3 design token system with well-defined CSS custom properties. The inconsistencies are in how pages USE those tokens — not the tokens themselves. The main issues:

1. **Spacing**: Pages use px-5, px-8, px-4 inconsistently. Gaps range from gap-2 to gap-4 arbitrarily.
2. **Typography**: Admin pages use hardcoded `text-2xl font-bold` instead of design tokens. Page titles inconsistently use headline-md vs title-lg.
3. **Cards**: Internal padding ranges from p-3 to p-6 with no standard.
4. **Buttons**: CTA placement inconsistent (floating vs inline).
5. **Admin pages**: Completely off-system — use hardcoded sizes, colors, borders.
6. **Border opacities**: /10, /20, /50 used without clear pattern.
7. **Empty states**: Different vertical margins across pages.

## Implementation Strategy

Work in 3 layers — **Components first** (cascades everywhere), then **User Pages**, then **Admin Pages**.

### Layer 1: Shared UI Components (14 components)

| # | Component | File | Changes |
|---|-----------|------|---------|
| 1 | Button | `src/components/ui/button.tsx` | Refine hover transitions (150ms ease), improve disabled opacity, ensure consistent padding tiers |
| 2 | Card | `src/components/ui/card.tsx` | Standardize padding to p-5 (from p-4), improve shadow quality, ensure consistent border-radius |
| 3 | Input | `src/components/ui/input.tsx` | Standardize height (48px/44px), refine focus ring, improve error state, add hover border |
| 4 | Chip | `src/components/ui/chip.tsx` | Ensure consistent sizing, improve selected state contrast |
| 5 | Badge | `src/components/ui/badge.tsx` | Standardize sizing, improve contrast |
| 6 | Modal | `src/components/ui/modal.tsx` | Improve backdrop, refine animations |
| 7 | Skeleton | `src/components/ui/skeleton.tsx` | Improve animation smoothness |
| 8 | Tabs | `src/components/ui/tabs.tsx` | Improve active indicator, refine spacing |
| 9 | RadioCard | `src/components/ui/radio-card.tsx` | Improve selected state, refine padding |
| 10 | Dropdown | `src/components/ui/dropdown.tsx` | Improve open/close transitions, refine menu shadow |
| 11 | Toast | `src/components/ui/toast.tsx` | Refine positioning, improve animation |
| 12 | EmptyState | `src/components/ui/empty-state.tsx` | Standardize spacing and icon container |
| 13 | Avatar | `src/components/ui/avatar.tsx` | Ensure ring consistency |
| 14 | BottomSheet | `src/components/ui/bottom-sheet.tsx` | Refine drag handle, improve overlay |

### Layer 2: Layout Components (5 components)

| # | Component | File | Changes |
|---|-----------|------|---------|
| 1 | BottomNavBar | `src/components/layout/bottom-nav-bar.tsx` | Refine active state, improve touch targets |
| 2 | TopNavBar | `src/components/layout/top-nav-bar.tsx` | Improve scroll transition, refine spacing |
| 3 | PageHeader | `src/components/layout/page-header.tsx` | Standardize height, improve alignment |
| 4 | AdminSidebar | `src/components/layout/admin-sidebar.tsx` | Apply design tokens, improve states |
| 5 | FAB | `src/components/layout/floating-action-button.tsx` | Refine shadow, improve hover |

### Layer 3: User Pages (30+ pages)

Standardize every page to:
- **Page padding**: `px-5` on mobile, proper max-width containers on desktop
- **Section spacing**: `space-y-6` between major sections
- **Heading hierarchy**: `text-headline-md font-headline-md` for page titles, `text-title-lg font-title-lg` for section headers
- **Title-description gap**: `mt-1` consistently
- **Card internal padding**: `p-5`
- **List gaps**: `gap-3` for card lists, `gap-2` for chip wraps
- **Empty state margin**: Consistent `py-16` centered

Key pages:
- Home, Search, Saved, My Trips, Profile, Edit Profile, Settings
- Wallet, Rewards, Referral, Help, Emergency
- Notifications
- Trip Detail, Trip Hub, Trip Chat, Trip Reviews, Trip Itinerary, Trip Feedback
- Login, OTP, Verify Identity
- Welcome, Interests, Budget, Pickup City, Permissions
- Booking flow (Travelers, Details, Seats, Add-ons, Payment, Success, Ticket, Status)

### Layer 4: Admin Pages (14 pages)

Bring admin pages onto the design token system:
- Replace `text-2xl font-bold` → `text-headline-md font-headline-md`
- Replace hardcoded colors → design token classes
- Standardize table styling
- Apply consistent card variants
- Fix sidebar token usage

## Edge Cases & Considerations

- **tailwind-merge conflicts**: The cn() function uses twMerge which strips custom classes like `text-on-primary` when combined with `text-body-md`. Use inline styles where needed (already patched in Chip).
- **Dark mode**: All refinements must work in both light and dark themes. Use semantic token colors, not hardcoded values.
- **Mobile responsiveness**: All spacing changes must be tested at 375px mentally.
- **No breaking changes**: Only CSS/styling changes — no functional changes, no prop changes that break existing usage.

## Success Criteria

- 8px grid enforced (no arbitrary spacing values)
- Consistent typography hierarchy across all pages
- All buttons have smooth transitions
- Cards have uniform styling
- Forms have refined states
- Admin pages match user-facing quality
- No component feels different from its siblings

---
*Generated in plan mode*
