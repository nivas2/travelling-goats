/**
 * Theme token registry — the single source of truth for the admin Theme Manager.
 *
 * Each token maps a friendly control (color picker / select) to one or more CSS
 * variables consumed by Tailwind utilities. `themeToCss()` turns saved values
 * into a `:root { … }` override block injected at runtime, so changing a value
 * here restyles the whole app without touching code.
 *
 * Keep this file free of server-only imports (used by both server + client).
 */

export interface ThemeToken {
  key: string;
  label: string;
  hint?: string;
  group: string;
  type: "color" | "select";
  vars: string[];
  default: string;
  options?: { label: string; value: string }[];
}

export const THEME_TOKENS: ThemeToken[] = [
  // ---- Brand Colors ----
  {
    key: "primary",
    label: "Primary",
    hint: "Main brand color — buttons, links, highlights",
    group: "Brand Colors",
    type: "color",
    vars: ["--brand-primary"],
    default: "#FF385C",
  },
  {
    key: "secondary",
    label: "Secondary",
    hint: "Secondary buttons & dark accents",
    group: "Brand Colors",
    type: "color",
    vars: ["--brand-secondary"],
    default: "#222222",
  },
  {
    key: "accent",
    label: "Accent",
    hint: "Stars, ratings, tertiary highlights",
    group: "Brand Colors",
    type: "color",
    vars: ["--brand-accent"],
    default: "#FF385C",
  },
  // ---- Status Colors ----
  {
    key: "success",
    label: "Success",
    hint: "Confirmations, positive states",
    group: "Status Colors",
    type: "color",
    vars: ["--brand-success"],
    default: "#2e7d32",
  },
  {
    key: "warning",
    label: "Warning",
    hint: "Cautions, pending states",
    group: "Status Colors",
    type: "color",
    vars: ["--brand-warning"],
    default: "#f57c00",
  },
  {
    key: "error",
    label: "Error / Danger",
    hint: "Errors, destructive actions",
    group: "Status Colors",
    type: "color",
    vars: ["--brand-error"],
    default: "#FF385C",
  },
  // ---- Surfaces ----
  {
    key: "background",
    label: "Page Background",
    group: "Surfaces",
    type: "color",
    vars: ["--brand-background"],
    default: "#FFFFFF",
  },
  {
    key: "surface",
    label: "Card Surface",
    group: "Surfaces",
    type: "color",
    vars: ["--brand-surface"],
    default: "#FFFFFF",
  },
  // ---- Typography ----
  {
    key: "font",
    label: "Font Family",
    group: "Typography",
    type: "select",
    vars: ["--font-sans", "--font-display"],
    default: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
    options: [
      { label: "Plus Jakarta Sans (default)", value: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif' },
      { label: "Inter / System", value: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif' },
      { label: "Rounded (system)", value: 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif' },
      { label: "Georgia (serif)", value: 'Georgia, "Times New Roman", serif' },
      { label: "Monospace", value: 'ui-monospace, "SF Mono", Menlo, monospace' },
    ],
  },
  // ---- Shape ----
  {
    key: "roundness",
    label: "Corner Roundness",
    hint: "How rounded cards, buttons & inputs are",
    group: "Shape",
    type: "select",
    vars: [], // handled via ROUNDNESS_PRESETS
    default: "default",
    options: [
      { label: "Sharp", value: "sharp" },
      { label: "Default", value: "default" },
      { label: "Extra Rounded", value: "round" },
    ],
  },
];

// Radius scale per roundness preset (empty = keep globals.css defaults).
const ROUNDNESS_PRESETS: Record<string, Record<string, string>> = {
  sharp: {
    "--radius-xs": "2px",
    "--radius-sm": "3px",
    "--radius-md": "4px",
    "--radius-lg": "6px",
    "--radius-xl": "8px",
    "--radius-2xl": "10px",
  },
  default: {},
  round: {
    "--radius-xs": "8px",
    "--radius-sm": "12px",
    "--radius-md": "16px",
    "--radius-lg": "22px",
    "--radius-xl": "28px",
    "--radius-2xl": "34px",
  },
};

export type ThemeValues = Record<string, string>;

// Curated palettes the admin can apply in one click. Each sets the colour
// tokens (font/roundness are left untouched). "Mountain Mist" is tuned to the
// cool tones of the landing hero photo.
export interface ThemePreset {
  name: string;
  hint?: string;
  swatch: string; // representative colour shown as a dot
  values: ThemeValues;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: "Coral",
    hint: "The original brand look",
    swatch: "#FF385C",
    values: {
      primary: "#FF385C", secondary: "#222222", accent: "#FF385C",
      success: "#2e7d32", warning: "#f57c00", error: "#FF385C",
      background: "#FFFFFF", surface: "#FFFFFF",
    },
  },
  {
    name: "Mountain Mist",
    hint: "Suits the hero image",
    swatch: "#0E7C7B",
    values: {
      primary: "#0E7C7B", secondary: "#1F2A37", accent: "#E8833A",
      success: "#2f855a", warning: "#dd8a1a", error: "#E5484D",
      background: "#FBFDFC", surface: "#FFFFFF",
    },
  },
  {
    name: "Sunset Trail",
    hint: "Warm golden-hour tones",
    swatch: "#E8623A",
    values: {
      primary: "#E8623A", secondary: "#2B2118", accent: "#F2A93B",
      success: "#4C8C4A", warning: "#E08A00", error: "#D64545",
      background: "#FFFDFB", surface: "#FFFFFF",
    },
  },
  {
    name: "Alpine Forest",
    hint: "Deep evergreen & bark",
    swatch: "#2E7D5B",
    values: {
      primary: "#2E7D5B", secondary: "#1E2A22", accent: "#C97B2C",
      success: "#2f855a", warning: "#d98324", error: "#C0492E",
      background: "#FBFDFB", surface: "#FFFFFF",
    },
  },
  {
    name: "Coastal Blue",
    hint: "Ocean & sky",
    swatch: "#1E6FB0",
    values: {
      primary: "#1E6FB0", secondary: "#17273A", accent: "#16B1C9",
      success: "#2f855a", warning: "#e0932b", error: "#E5484D",
      background: "#FBFDFF", surface: "#FFFFFF",
    },
  },
];

export function defaultThemeValues(): ThemeValues {
  const v: ThemeValues = {};
  for (const t of THEME_TOKENS) v[t.key] = t.default;
  return v;
}

const TOKEN_BY_KEY = Object.fromEntries(THEME_TOKENS.map((t) => [t.key, t]));

/** Build a `:root { … }` CSS override block from saved theme values. */
export function themeToCss(values: ThemeValues): string {
  const decls: string[] = [];
  for (const [key, value] of Object.entries(values)) {
    if (!value) continue;
    const token = TOKEN_BY_KEY[key];
    if (!token) continue;
    if (key === "roundness") {
      const preset = ROUNDNESS_PRESETS[value] ?? {};
      for (const [cssVar, v] of Object.entries(preset)) decls.push(`${cssVar}:${v}`);
      continue;
    }
    // Skip values equal to default to keep the injected block minimal.
    if (value === token.default) continue;
    for (const cssVar of token.vars) decls.push(`${cssVar}:${value}`);
  }
  if (decls.length === 0) return "";
  return `:root{${decls.join(";")}}`;
}
