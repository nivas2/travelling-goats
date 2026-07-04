import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "PackAlong — Curated Group Travel for Young India",
    template: "%s | PackAlong",
  },
  description:
    "Discover curated group trips across India. Join solo or with friends. Verified travelers, transparent pricing, unforgettable experiences.",
  keywords: [
    "group travel",
    "solo travel India",
    "curated trips",
    "weekend getaway",
    "adventure travel",
    "PackAlong",
  ],
  authors: [{ name: "PackAlong" }],
  creator: "PackAlong",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://packalong.in",
    siteName: "PackAlong",
    title: "PackAlong — Curated Group Travel for Young India",
    description:
      "Discover curated group trips across India. Join solo or with friends.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PackAlong" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PackAlong — Curated Group Travel",
    description: "Discover curated group trips across India.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9f9" },
    { media: "(prefers-color-scheme: dark)", color: "#121414" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-dvh bg-background text-on-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
