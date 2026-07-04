---
id: REQ-008
original_prompt: "pls understand the complete code deeply & pls use this color pallet across all places instead of current onw"
rephrased_at: 2026-07-05T00:10:00Z
---

# Rephrased Prompt: Replace Entire Color Palette with 3-Color System

## Objective

Perform a comprehensive audit of the entire codebase and replace **all** existing colors with the following strict 3-color palette:

| Color     | Hex       | Role                          |
|-----------|-----------|-------------------------------|
| Coral/Pink-Red | `#FF385C` | Primary accent (buttons, highlights, active states, badges, links, icons) |
| White     | `#FFFFFF` | Backgrounds, cards, light surfaces, light text on dark backgrounds |
| Dark Charcoal | `#222222` | Primary text, headings, dark backgrounds, borders, shadows |

---

## Requirements

### 1. Deep Codebase Analysis (Do First)
- Read and understand the full project structure — all components, pages, layouts, and style files.
- Identify every instance of color usage across the entire codebase: inline styles, CSS/SCSS files, Tailwind classes, styled-components, theme configuration files, CSS variables, and any design token definitions.
- Catalog all current colors being used (hex codes, RGB values, named colors, Tailwind color utilities, opacity variants, CSS variables, etc.).

### 2. Color Replacement Rules
Apply the following mapping logic across **every file** in the project:

- **All primary/accent/brand colors** (e.g., blues, greens, oranges, or any other hue currently used as the primary) → `#FF385C`
- **All background colors, light/neutral surfaces, white-ish tones** → `#FFFFFF`
- **All text colors, dark tones, heading colors, near-blacks, grays used for text** → `#222222`
- **Borders and dividers**: Use `#222222` with appropriate opacity (e.g., `rgba(34, 34, 34, 0.1)` or Tailwind equivalents) for subtle borders, or solid `#222222` for prominent ones.
- **Shadows**: Adjust box-shadow colors to use `#222222` with low opacity rather than any other color.
- **Hover/focus/active states**: Use opacity variants or slight darkening/lightening of the 3 palette colors (e.g., `#FF385C` at 80% opacity for hover, `#222222` at 70% for secondary hover states).
- **Disabled states**: Use `#222222` with reduced opacity (e.g., 30-40%) for disabled text/elements, and `#FFFFFF` with a slight tint for disabled backgrounds.
- **Gradients**: Replace any existing gradients with combinations of the 3 palette colors or remove them in favor of flat colors from the palette.
- **Placeholder text**: Use `#222222` with reduced opacity (e.g., 50%).
- **Success/error/warning colors**: Replace these with `#FF385C` for error/destructive states and `#222222` for neutral confirmations, since the palette is strictly 3 colors.

### 3. Where to Apply
- **Global theme/config files** (Tailwind config, CSS variables, theme providers, etc.)
- **All component files** (every `.tsx`, `.jsx`, `.css`, `.scss`, `.module.css` file)
- **Layout and page files**
- **Inline styles** in JSX/TSX
- **SVG fill/stroke colors** if any exist inline
- **Any third-party component overrides or custom styles**
- **Status bar, meta theme-color, or manifest color definitions** if present

### 4. Maintain Proper Contrast and Readability
- Ensure `#FFFFFF` text is only used on `#FF385C` or `#222222` backgrounds (never white-on-white).
- Ensure `#222222` text is only used on `#FFFFFF` backgrounds (never dark-on-dark).
- Ensure `#FF385C` is used as accent — buttons, links, highlights — and has sufficient contrast against its background.
- Preserve all existing visual hierarchy using font weight, size, and opacity rather than introducing new colors.

---

## Expected Behavior

- The app should look visually cohesive with only coral-red, white, and dark charcoal visible across every screen and component.
- No remnant of any old color palette should remain anywhere in the codebase.
- Interactive elements (buttons, links, toggles) should use `#FF385C` as their primary color.
- All text should be `#222222` on light backgrounds or `#FFFFFF` on dark/accent backgrounds.
- Hover, focus, and active states should still be visually distinguishable using opacity or shade variations of the 3 colors.
- The app must remain fully functional — no broken styles, missing backgrounds, or invisible text.

---

## Success Criteria

1. **Zero off-palette colors remain** — a search of the entire codebase for hex codes, RGB values, named CSS colors, and Tailwind color classes returns only `#FF385C`, `#FFFFFF`, `#222222`, and their opacity/alpha variants.
2. **Visual consistency** — every page, component, modal, dropdown, toast, badge, and UI element uses only the 3-color palette.
3. **Readability preserved** — no contrast violations where text becomes unreadable against its background.
4. **Responsiveness intact** — no layout or responsive behavior is broken by the color changes.
5. **Functional integrity** — the application works exactly as before; only the colors have changed.

---
*Original: "pls understand the complete code deeply & pls use this color pallet across all places instead of current onw"*
*Rephrased by prompt engineering agent*
