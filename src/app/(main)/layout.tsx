import { TopNavBar } from "@/components/layout/top-nav-bar";
import { BottomNavBar } from "@/components/layout/bottom-nav-bar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNavBar />

      <main className="flex-1 pb-24 md:pb-0">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>

      <BottomNavBar />
    </div>
  );
}
