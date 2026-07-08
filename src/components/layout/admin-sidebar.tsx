"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/brand-logo";

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", href: "/admin/dashboard" },
  { label: "Trails", icon: "flight_takeoff", href: "/admin/trips" },
  { label: "Vehicles", icon: "directions_bus", href: "/admin/vehicles" },
  { label: "Add-ons & Snacks", icon: "restaurant_menu", href: "/admin/addons" },
  { label: "Pickup Points", icon: "pin_drop", href: "/admin/pickup-points" },
  { label: "Users", icon: "group", href: "/admin/users" },
  { label: "Bookings", icon: "confirmation_number", href: "/admin/bookings" },
  { label: "Payments", icon: "payments", href: "/admin/payments" },
  { label: "Coupons", icon: "local_offer", href: "/admin/coupons" },
  { label: "Referrals", icon: "share", href: "/admin/referrals" },
  { label: "Notifications", icon: "notifications", href: "/admin/notifications" },
  { label: "Reviews", icon: "reviews", href: "/admin/reviews" },
  { label: "Theme", icon: "palette", href: "/admin/theme" },
  { label: "Site Content", icon: "edit_note", href: "/admin/content" },
  { label: "FAQs", icon: "quiz", href: "/admin/faqs" },
  { label: "Testimonials", icon: "format_quote", href: "/admin/testimonials" },
  { label: "Private Requests", icon: "shield", href: "/admin/private-requests" },
  { label: "SOS Alerts", icon: "sos", href: "/admin/sos" },
  { label: "Revenue", icon: "payments", href: "/admin/revenue" },
  { label: "Herd Analytics", icon: "analytics", href: "/admin/analytics" },
  { label: "Support", icon: "support_agent", href: "/admin/support" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin" || pathname === "/admin/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className={cn(
          "fixed top-4 left-4 z-50 md:hidden",
          "flex items-center justify-center",
          "h-10 w-10 rounded-xl",
          "bg-surface-container-lowest shadow-card",
          "hover:bg-surface-container-high transition-colors"
        )}
        aria-label="Open sidebar"
      >
        <span className="material-symbols-outlined text-[22px] text-on-surface">
          menu
        </span>
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-on-surface/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-dvh",
          "bg-surface-container-lowest border-r border-outline-variant/15",
          "flex flex-col",
          "transition-all duration-300 ease-in-out",
          // Desktop sizing
          collapsed ? "md:w-[72px]" : "md:w-[260px]",
          // Mobile: slide in/out
          mobileOpen ? "translate-x-0 w-[280px]" : "-translate-x-full w-[280px]",
          "md:translate-x-0"
        )}
      >
        {/* Logo Area */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-outline-variant/10">
          {!collapsed && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5"
              onClick={() => setMobileOpen(false)}
            >
              <BrandLogo size="sm" />
              <span className="ml-1 text-label-sm text-on-surface-variant/60 font-medium">
                Admin
              </span>
            </Link>
          )}

          {/* Collapse Toggle (desktop only) */}
          <button
            onClick={() => {
              setCollapsed((prev) => !prev);
              setMobileOpen(false);
            }}
            className={cn(
              "hidden md:flex items-center justify-center",
              "h-8 w-8 rounded-full",
              "hover:bg-surface-container active:scale-95",
              "transition-all duration-200",
              collapsed && "mx-auto"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              {collapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>

          {/* Mobile Close */}
          <button
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex md:hidden items-center justify-center",
              "h-8 w-8 rounded-lg",
              "hover:bg-surface-container-high transition-colors"
            )}
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
              close
            </span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <ul className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                      "transition-all duration-200",
                      "group",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
                      collapsed && "md:justify-center md:px-0"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <span
                      className={cn(
                        "material-symbols-outlined text-[22px] shrink-0",
                        active && "filled"
                      )}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span
                        className={cn(
                          "text-body-md truncate",
                          "md:block",
                          active ? "font-semibold" : "font-medium"
                        )}
                      >
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-outline-variant/10 px-3 py-3 flex flex-col gap-0.5">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl",
              "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
              "transition-all duration-200",
              collapsed && "md:justify-center md:px-0"
            )}
            title={collapsed ? "Back to App" : undefined}
          >
            <span className="material-symbols-outlined text-[22px] shrink-0">
              exit_to_app
            </span>
            {!collapsed && (
              <span className="text-body-md font-medium">Back to App</span>
            )}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl w-full",
              "text-error hover:bg-error/10",
              "transition-all duration-200",
              collapsed && "md:justify-center md:px-0"
            )}
            title={collapsed ? "Log Out" : undefined}
          >
            <span className="material-symbols-outlined text-[22px] shrink-0">
              logout
            </span>
            {!collapsed && (
              <span className="text-body-md font-medium">Log Out</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
