import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(self)",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://api.razorpay.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https://images.unsplash.com https://res.cloudinary.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://*.mzstatic.com",
            "media-src 'self' blob: https://*.itunes.apple.com https://*.mzstatic.com",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://api.razorpay.com https://lumberjack-cx.razorpay.com",
            "frame-src https://api.razorpay.com https://checkout.razorpay.com",
            "object-src 'none'",
            "base-uri 'self'",
          ].join("; "),
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ],
    },
  ],
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
