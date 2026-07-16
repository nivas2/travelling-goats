"use client";

import { usePathname } from "next/navigation";

// Immersive trip sub-pages (chat, shepherd, hub) run full-screen with their own
// header + composer, and the top/bottom nav bars are hidden for them. Drop the
// bottom padding (reserved for the floating nav) and the max-width centering so
// their h-dvh layout fills the viewport cleanly.
const IMMERSIVE = /^\/trips\/[^/]+\/(chat|shepherd|hub)/;

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const immersive = IMMERSIVE.test(pathname);

  return (
    <main className={immersive ? "flex-1" : "flex-1 pb-24 md:pb-0"}>
      <div className={immersive ? "" : "mx-auto w-full max-w-7xl"}>{children}</div>
    </main>
  );
}
