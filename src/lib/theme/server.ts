import prisma from "@/lib/prisma";
import { defaultThemeValues, themeToCss, type ThemeValues } from "./registry";

const THEME_KEY = "theme.tokens";

/** Saved theme values merged over defaults (admin reads this to populate the form). */
export async function getThemeValues(): Promise<ThemeValues> {
  const base = defaultThemeValues();
  try {
    const row = await prisma.cmsContent.findUnique({ where: { key: THEME_KEY } });
    if (row?.content) {
      const saved = JSON.parse(row.content) as ThemeValues;
      return { ...base, ...saved };
    }
  } catch {
    // DB unavailable — fall back to defaults.
  }
  return base;
}

/** The `:root { … }` override string injected in the root layout. */
export async function getThemeCss(): Promise<string> {
  const values = await getThemeValues();
  return themeToCss(values);
}

export async function saveThemeValues(values: ThemeValues): Promise<void> {
  const content = JSON.stringify(values);
  await prisma.cmsContent.upsert({
    where: { key: THEME_KEY },
    create: { key: THEME_KEY, title: "Theme", content, type: "theme", isActive: true },
    update: { content },
  });
}
