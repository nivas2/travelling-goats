import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { getThemeCss } from "@/lib/theme/server";
import "./globals.css";

// Typography = SF Pro Display / Text via the native Apple system stack
// (renders SF Pro on iOS/macOS; graceful system fallback elsewhere). No web
// font is loaded — SF Pro is a system font. Family stacks live in globals.css.

export const metadata: Metadata = {
  title: {
    default: "Travelling Goats — Adventure Travel with the Herd",
    template: "%s | Travelling Goats",
  },
  description:
    "Join the herd. Discover curated group trails across India. Travel with fellow goats — verified explorers, transparent pricing, unforgettable adventures.",
  keywords: [
    "group travel",
    "solo travel India",
    "curated trips",
    "weekend getaway",
    "adventure travel",
    "Travelling Goats",
    "herd travel",
    "trail adventures",
  ],
  authors: [{ name: "Travelling Goats" }],
  creator: "Travelling Goats",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://meetmyroute.feastigo.com", // TODO: Update domain to travellinggoats
    siteName: "Travelling Goats",
    title: "Travelling Goats — Adventure Travel with the Herd",
    description:
      "Join the herd. Discover curated group trails across India. Travel with fellow goats.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Travelling Goats" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Travelling Goats — Adventure Travel with the Herd",
    description: "Join the herd. Discover curated group trails across India.",
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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
        {themeCss && <style id="tg-theme" dangerouslySetInnerHTML={{ __html: themeCss }} />}
      </head>
      <body className="min-h-dvh bg-background text-on-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
