"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const router = useRouter();

  // Preferences
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [showOnCompanionList, setShowOnCompanionList] = useState(true);

  // Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      await fetch("/api/users", { method: "DELETE" });
      router.push("/login");
    } catch {
      // error handled silently
    } finally {
      setDeleting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Section renderer
  // ---------------------------------------------------------------------------

  interface SettingItem {
    icon: string;
    label: string;
    description?: string;
    type: "toggle" | "link" | "action";
    checked?: boolean;
    onChange?: (v: boolean) => void;
    onClick?: () => void;
    href?: string;
    destructive?: boolean;
  }

  const sections: { title: string; items: SettingItem[] }[] = [
    {
      title: "Account",
      items: [
        {
          icon: "phone",
          label: "Change Phone Number",
          type: "link",
          href: "/profile/change-phone",
        },
        {
          icon: "delete_forever",
          label: "Delete Account",
          description: "Permanently delete your account and data",
          type: "action",
          onClick: () => setDeleteModalOpen(true),
          destructive: true,
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: "dark_mode",
          label: "Dark Mode",
          type: "toggle",
          checked: darkMode,
          onChange: handleDarkModeToggle,
        },
        {
          icon: "language",
          label: "Language",
          description: "English",
          type: "link",
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          icon: "notifications",
          label: "Push Notifications",
          type: "toggle",
          checked: pushNotifications,
          onChange: setPushNotifications,
        },
        {
          icon: "email",
          label: "Email Notifications",
          type: "toggle",
          checked: emailNotifications,
          onChange: setEmailNotifications,
        },
      ],
    },
    {
      title: "Privacy",
      items: [
        {
          icon: "visibility",
          label: "Profile Visibility",
          description: "Allow others to see your profile",
          type: "toggle",
          checked: profileVisibility,
          onChange: setProfileVisibility,
        },
        {
          icon: "group",
          label: "Show on Companion List",
          description: "Appear in trip companion suggestions",
          type: "toggle",
          checked: showOnCompanionList,
          onChange: setShowOnCompanionList,
        },
      ],
    },
    {
      title: "Legal",
      items: [
        {
          icon: "description",
          label: "Terms of Service",
          type: "link",
          href: "/terms",
        },
        {
          icon: "privacy_tip",
          label: "Privacy Policy",
          type: "link",
          href: "/privacy",
        },
        {
          icon: "receipt_long",
          label: "Refund Policy",
          type: "link",
          href: "/refund-policy",
        },
      ],
    },
  ];

  return (
    <div className="px-5 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <Icon name="arrow_back" size={24} />
        </button>
        <h1 className="text-title-lg font-title-lg text-on-surface">
          Settings
        </h1>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-label-sm text-on-surface-variant mb-3 uppercase tracking-wide">
            {section.title}
          </h2>
          <Card variant="outlined" className="p-0 overflow-hidden">
            {section.items.map((item, idx) => {
              const isLast = idx === section.items.length - 1;

              return (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4",
                    !isLast && "border-b border-outline-variant/50",
                    item.type !== "toggle" &&
                      "cursor-pointer hover:bg-surface-container transition-colors"
                  )}
                  onClick={() => {
                    if (item.type === "link" && item.href) {
                      router.push(item.href);
                    } else if (item.type === "action" && item.onClick) {
                      item.onClick();
                    }
                  }}
                  role={item.type !== "toggle" ? "button" : undefined}
                  tabIndex={item.type !== "toggle" ? 0 : undefined}
                >
                  <Icon
                    name={item.icon}
                    size={22}
                    className={cn(
                      item.destructive
                        ? "text-error"
                        : "text-on-surface-variant"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-body-lg",
                        item.destructive
                          ? "text-error font-medium"
                          : "text-on-surface"
                      )}
                    >
                      {item.label}
                    </p>
                    {item.description && (
                      <p className="text-label-sm text-on-surface-variant mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {item.type === "toggle" && (
                    <Switch
                      checked={item.checked}
                      onChange={item.onChange}
                    />
                  )}
                  {item.type === "link" && (
                    <Icon
                      name="chevron_right"
                      size={20}
                      className="text-on-surface-variant shrink-0"
                    />
                  )}
                </div>
              );
            })}
          </Card>
        </section>
      ))}

      {/* App version */}
      <p className="text-center text-label-sm text-on-surface-variant pt-2 pb-4">
        Travelling Goats v1.0.0
      </p>

      {/* Delete Account Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Account"
        description="This action is permanent and cannot be undone. All your data, bookings, wallet balance, and reward points will be lost."
        size="sm"
      >
        <div className="flex gap-3 mt-4">
          <Button
            variant="ghost"
            fullWidth
            onClick={() => setDeleteModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            fullWidth
            loading={deleting}
            onClick={handleDeleteAccount}
          >
            Delete Account
          </Button>
        </div>
      </Modal>
    </div>
  );
}
