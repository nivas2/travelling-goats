import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { getThemeCss } from "@/lib/theme/server";
import "./globals.css";

// Typography = SF Pro Display / Text via the native Apple system stack
// (renders SF Pro on iOS/macOS; graceful system fallback elsewhere). No web
// font is loaded — SF Pro is a system font. Family stacks live in globals.css.

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
  maximumScale: 1,
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
      className=""
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* display=block: keep icons invisible until the font loads instead of
            flashing the raw ligature text (e.g. "location_on"). */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
        {/* Brand typeface — Bricolage Grotesque (Regular / Medium / Bold) */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,700&display=swap"
        />
        {themeCss && <style id="tg-theme" dangerouslySetInnerHTML={{ __html: themeCss }} />}
      </head>
      <body className="min-h-dvh bg-background text-on-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
