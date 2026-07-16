import { TopNavBar } from "@/components/layout/top-nav-bar";
import { BottomNavBar } from "@/components/layout/bottom-nav-bar";
import { MainContent } from "@/components/layout/main-content";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNavBar />

      <MainContent>{children}</MainContent>

      <BottomNavBar />
    </div>
  );
}
