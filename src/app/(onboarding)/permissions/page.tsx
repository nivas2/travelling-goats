"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Permission {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const permissions: Permission[] = [
  {
    id: "push-notifications",
    title: "Push Notifications",
    description:
      "Get notified about trip updates, chat messages, and exclusive deals.",
    icon: "notifications_active",
  },
  {
    id: "location-access",
    title: "Location Access",
    description:
      "Share your location during trips for safety tracking and nearby recommendations.",
    icon: "my_location",
  },
];

export default function PermissionsPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    "push-notifications": false,
    "location-access": false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function togglePermission(id: string) {
    setEnabled((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  async function requestBrowserPermissions() {
    // Request push notification permission
    if (enabled["push-notifications"] && "Notification" in window) {
      try {
        await Notification.requestPermission();
      } catch {
        // Silently handle if blocked
      }
    }

    // Request geolocation permission
    if (enabled["location-access"] && "geolocation" in navigator) {
      try {
        await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
          });
        });
      } catch {
        // Silently handle if blocked
      }
    }
  }

  async function handleComplete() {
    setLoading(true);
    setError("");

    try {
      // Request browser-level permissions
      await requestBrowserPermissions();

      // Mark user as onboarded
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnboarded: true }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to complete setup.");
        return;
      }

      router.push("/home");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSkip() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnboarded: true }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to complete setup.");
        return;
      }

      router.push("/home");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const anyEnabled = Object.values(enabled).some(Boolean);

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="px-6 pt-safe">
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 text-body-md text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <Icon name="arrow_back" size={20} />
          </button>

          <span className="text-label-sm text-on-surface-variant">
            Step 4 of 4
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-6 pt-6">
        <div className="mb-6">
          <h1 className="text-headline-md font-headline-md text-on-surface">
            Stay in the loop
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Enable permissions for the best experience. You can change these
            anytime in settings.
          </p>
        </div>

        {/* Permission Cards */}
        <div className="flex flex-col gap-4">
          {permissions.map((perm) => (
            <Card key={perm.id} variant="outlined" className="p-4">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                    enabled[perm.id]
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant"
                  )}
                >
                  <Icon name={perm.icon} size={22} filled={enabled[perm.id]} />
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-title-md font-semibold text-on-surface">
                    {perm.title}
                  </h3>
                  <p className="mt-0.5 text-body-md text-on-surface-variant">
                    {perm.description}
                  </p>
                </div>

                {/* Toggle */}
                <Switch
                  checked={enabled[perm.id]}
                  onChange={() => togglePermission(perm.id)}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p
            className="mt-4 text-center text-label-sm text-error"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>

      {/* Bottom actions */}
      <div className="flex flex-col gap-3 px-6 pb-8 pb-safe pt-4">
        <Button
          type="button"
          fullWidth
          size="lg"
          loading={loading}
          onClick={anyEnabled ? handleComplete : handleSkip}
          className="rounded-full"
        >
          {anyEnabled ? "Start Your Adventure" : "Skip for Now"}
        </Button>

        {anyEnabled && (
          <Button
            type="button"
            fullWidth
            size="md"
            variant="ghost"
            onClick={handleSkip}
            disabled={loading}
          >
            Skip for now
          </Button>
        )}
      </div>
    </div>
  );
}
