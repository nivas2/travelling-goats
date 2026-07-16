---
id: REQ-009
title: Rebrand MeetMyRoute to Meet My Route
status: done
created_at: 2026-07-05T02:30:00Z
user_request: —
rephrased_prompt: pp/rephrased/REQ-009-rephrased.md
plan: pp/plans/REQ-009-plan.md
test_url: https://meetmyroute.feastigo.com
---

# Rebrand MeetMyRoute to Meet My Route

## What
Complete application-wide rebrand from "MeetMyRoute" to "Meet My Route" — replacing all brand name references, terminology (Trips→Trails, Trip Captain→Trip Captain, etc.), button labels (Book Now→Join the Community, Continue→Keep Trekking), empty/loading/success/error state copy, onboarding text, admin panel labels, and adding a new SVG logo component. Safety backup branch created first.

## Why
The user is rebranding the travel app to a premium goat/mountain adventure theme. The brand should feel sophisticated and community-driven — "fun but never childish."

## Done When
1. Zero "MeetMyRoute" references remain in user-facing strings
2. All terminology mapped (Trips→Trails, Trip Captain→Trip Captain, Solo→Lone Goat, etc.)
3. All button labels updated (Book Now→Join the Community, Continue→Keep Trekking, etc.)
4. Logo SVG component renders in navbar, login, admin sidebar, landing page
5. All empty/loading/success/error states use goat-themed copy
6. Onboarding slides updated with new brand copy
7. Admin panel labels updated
8. CSS animation stubs added
9. NO color, functionality, layout, or routing changes
10. `npm run build` succeeds

## Context
- ~42 files to modify, 1 new file (logo component)
- 50+ MeetMyRoute instances across the codebase
- User provided PNG logo: goat-in-map-pin with mountain silhouette
- Backup branch required before work begins
- Domain URLs get TODO comments, not changed
- "Continue with Google" stays (OAuth standard)

## Rephrased Prompt
See [pp/rephrased/REQ-009-rephrased.md] for the enhanced prompt.

## Implementation Plan
See [pp/plans/REQ-009-plan.md] for the detailed 14-phase plan.

---
*Captured after 3 clarifying questions (logo asset, backup scope, button scope)*
*Rephrased prompt: pp/rephrased/REQ-009-rephrased.md*
*Plan: pp/plans/REQ-009-plan.md*
*Source: Original Prompt #9 in pp/original-prompts.md*
