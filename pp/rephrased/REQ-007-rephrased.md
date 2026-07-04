---
id: REQ-007
original_prompt: "Application-wide UI polish to production quality"
rephrased_at: 2026-07-04T12:08:00Z
---

# Rephrased Prompt: UI Polish & Refinement Pass — Production-Quality Design System Implementation

## Objective

Perform a comprehensive, application-wide UI polish pass on this functionally complete application. The goal is to eliminate every visual and interaction artifact that makes the UI feel AI-generated, template-based, or unfinished. The result should feel like a handcrafted product from a world-class design team (Apple, Airbnb, Stripe, Linear caliber).

**Critical constraints:** Do NOT redesign the application. Do NOT change the brand colors, color palette, layout structure, user flows, or remove any functionality. The overall design direction is correct — your job is to refine execution quality, not rethink decisions.

## Scope

Review and refine **every screen**, **every component**, and **every interaction state** across the entire application. This is not a single-page fix — it is a systematic pass through the full codebase.

## Requirements

### 1. Spacing & Layout System
- Implement a strict 8px spacing system (4px for tight elements). Audit all margins, paddings, and gaps for consistency.
- Ensure consistent section spacing, container padding, and content density across all screens.
- Eliminate arbitrary spacing values — everything should snap to the 8px grid.
- Verify vertical rhythm between headings, paragraphs, cards, and form elements.

### 2. Typography Hierarchy
- Establish a clear, consistent type scale with deliberate size jumps between levels.
- Refine line-height values for readability (headings: 1.1–1.3, body: 1.5–1.7).
- Apply appropriate letter-spacing (tighter for large headings, normal/slightly open for body).
- Use font weight deliberately — no more than 3–4 weights across the system.
- Ensure text truncation, wrapping, and overflow are handled gracefully everywhere.

### 3. Buttons
- Establish a clear CTA hierarchy: Primary (filled, high contrast), Secondary (outlined or muted fill), Tertiary/Ghost (text-only or minimal).
- Standardize button sizes (height, horizontal padding) — use consistent sizing tiers (sm, md, lg).
- Implement refined states for every button: default, hover, active/pressed, focus-visible, disabled.
- Ensure minimum touch target of 44x44px on mobile.
- Add subtle transitions for state changes.

### 4. Cards & Containers
- Standardize border-radius across all cards.
- Refine box shadows — use layered, subtle shadows.
- Standardize internal card padding and content alignment.

### 5. Forms & Inputs
- Standardize input heights and internal padding.
- Refine input states: default, hover, focus, error, disabled.
- Ensure labels have consistent spacing above inputs.
- Position error messages consistently.

### 6. Navigation
- Refine active/selected states with clear visual indicators.
- Ensure hover states are subtle but responsive.
- Verify spacing between nav items is consistent.

### 7. Icons
- Ensure consistent icon sizing within each context.
- Verify consistent stroke width across all icons.
- Ensure icon-to-text alignment is vertically centered.

### 8. Images & Media
- Ensure consistent border-radius on images/thumbnails.
- Verify aspect ratios are maintained.
- Add appropriate loading states.

### 9. Micro-interactions & Transitions
- Add subtle hover animations on interactive elements.
- Implement smooth transitions.
- Add loading skeletons.

### 10. Responsive Design
- Verify at: mobile (375px), tablet (768px), laptop (1024px), desktop (1440px+).
- Ensure touch targets are appropriately sized.
- Cards and grids should reflow gracefully.

### 11. Accessibility
- Verify color contrast meets WCAG AA.
- Ensure all interactive elements have visible focus-visible indicators.
- Verify keyboard navigation works logically.

### 12. Consistency Audit
- Every instance of the same component type should look identical across all screens.
- Standardize border colors, divider styles, separator treatments.
- Ensure empty/error/loading states follow the same visual pattern.

## Success Criteria
- No arbitrary spacing values — 8px grid enforced throughout
- Typography has clear, consistent hierarchy
- Every button has proper states with smooth transitions
- All cards share consistent styling
- Form inputs have refined, consistent states
- The app looks polished at all breakpoints
- No element feels out of place or inconsistent
- The UI passes the "squint test"

## Deliverable
Report: screens refined, components improved, inconsistencies fixed, UX improvements, remaining recommendations.

---
*Original: "Application-wide UI polish..."*
*Rephrased by prompt engineering agent*
