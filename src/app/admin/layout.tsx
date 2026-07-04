import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = (session?.user as Record<string, unknown>)?.role === "ADMIN";

  // Show bare layout for login page (unauthenticated or non-admin)
  if (!isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 ml-0 md:ml-[260px] transition-all duration-300">
        <div className="p-4 pt-16 md:p-8 md:pt-8">{children}</div>
      </main>
    </div>
  );
}
