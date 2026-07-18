import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { Providers } from "@/components/providers";
import { getThemeCss } from "@/lib/theme/server";
import "./globals.css";

// Brand typeface — Bricolage Grotesque, self-hosted via next/font: no
// render-blocking external request, preloaded, and zero layout shift. Exposed
// as --font-bricolage, consumed by --font-sans/--font-display in globals.css.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
});

export const metadata: Metadata = {
  title: {
    default: "Meet My Route — Adventure Travel with the Community",
    template: "%s | Meet My Route",
  },
  description:
    "Join the community. Discover curated group trails across India. Travel with fellow explorers — verified explorers, transparent pricing, unforgettable adventures.",
  keywords: [
    "group travel",
    "solo travel India",
    "curated trips",
    "weekend getaway",
    "adventure travel",
    "Meet My Route",
    "community travel",
    "trail adventures",
  ],
  authors: [{ name: "Meet My Route" }],
  creator: "Meet My Route",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://meetmyroute.feastigo.com", // TODO: Update domain to travellinggoats
    siteName: "Meet My Route",
    title: "Meet My Route — Adventure Travel with the Community",
    description:
      "Join the community. Discover curated group trails across India. Travel with fellow explorers.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Meet My Route" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Meet My Route — Adventure Travel with the Community",
    description: "Join the community. Discover curated group trails across India.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  // No maximumScale / user-scalable lock — users must be able to pinch-zoom
  // (WCAG 1.4.4 Resize Text). iOS input auto-zoom is handled with ≥16px inputs.
  viewportFit: "cover",
  // When the on-screen keyboard opens, resize the layout viewport (and `dvh`)
  // so sticky-bottom inputs (e.g. the chat composer) ride above the keyboard
  // instead of being hidden behind it.
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Admin-configurable theme, injected as :root overrides over globals.css.
  const themeCss = await getThemeCss();

  return (
    <html
      lang="en"
      className={bricolage.variable}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Material Symbols icon font — axis range narrowed to what the app
            actually uses (single weight 400, FILL 0..1, no GRAD/negative grades)
            to shrink the download. display=block keeps icons invisible until load
            instead of flashing the raw ligature text (e.g. "location_on"). */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,400,0..1&display=block"
        />
        {themeCss && <style id="tg-theme" dangerouslySetInnerHTML={{ __html: themeCss }} />}
      </head>
      <body className="min-h-dvh bg-background text-on-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
