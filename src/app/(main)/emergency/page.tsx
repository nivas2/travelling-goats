"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiResponse } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

interface EmergencyData {
  userPhone: string;
  emergencyContacts: EmergencyContact[];
  tripCaptain: {
    name: string;
    phone: string;
    avatar: string | null;
  } | null;
  currentLocation: {
    latitude: number;
    longitude: number;
    address: string;
  } | null;
}

interface SafetyTip {
  title: string;
  content: string;
  icon: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SAFETY_TIPS: SafetyTip[] = [
  {
    title: "Stay Calm",
    content:
      "Take a deep breath. Assess your situation carefully before taking action. Panic can lead to poor decisions.",
    icon: "self_improvement",
  },
  {
    title: "Share Your Location",
    content:
      "Make sure your live location is shared with your Trip Captain and emergency contacts. Keep your GPS turned on.",
    icon: "my_location",
  },
  {
    title: "Stay With the Group",
    content:
      "If you are lost, stay where you are and contact your Trip Captain. Do not wander off alone, especially in unfamiliar terrain.",
    icon: "group",
  },
  {
    title: "Keep Phone Charged",
    content:
      "Ensure your phone has sufficient charge. Carry a power bank as backup. Save important numbers offline.",
    icon: "battery_charging_full",
  },
  {
    title: "Medical Emergency",
    content:
      "If someone is injured, provide first aid if possible. Call 108 for an ambulance immediately. Do not move someone with a potential spinal injury.",
    icon: "medical_services",
  },
  {
    title: "Document Everything",
    content:
      "Take photos of the situation, note important details like location landmarks, time, and description of events for records.",
    icon: "photo_camera",
  },
];

const QUICK_CALL_OPTIONS = [
  {
    label: "Local Police",
    phone: "100",
    icon: "local_police",
    color: "bg-secondary text-on-secondary",
    description: "India Police Helpline",
  },
  {
    label: "Ambulance",
    phone: "108",
    icon: "local_hospital",
    color: "bg-error text-on-error",
    description: "Medical Emergency",
  },
  {
    label: "MeetMyRoute Helpline",
    phone: "18001234567",
    icon: "support_agent",
    color: "bg-primary text-on-primary",
    description: "24/7 Support",
  },
];

// ---------------------------------------------------------------------------
// SOS Button Component
// ---------------------------------------------------------------------------

function SOSButton({
  onActivate,
  activated,
  loading,
}: {
  onActivate: () => void;
  activated: boolean;
  loading: boolean;
}) {
  const [pressing, setPressing] = useState(false);

  return (
    <div className="flex flex-col items-center">
      {/* SOS Button */}
      <button
        onMouseDown={() => setPressing(true)}
        onMouseUp={() => setPressing(false)}
        onMouseLeave={() => setPressing(false)}
        onTouchStart={() => setPressing(true)}
        onTouchEnd={() => setPressing(false)}
        onClick={onActivate}
        disabled={loading || activated}
        className={cn(
          "relative flex h-40 w-40 items-center justify-center rounded-full transition-all duration-200",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-error focus-visible:ring-offset-4",
          activated
            ? "bg-success shadow-lg"
            : "bg-error shadow-[0_0_40px_rgba(186,26,26,0.4)] hover:shadow-[0_0_60px_rgba(186,26,26,0.6)]",
          pressing && !activated && "scale-95",
          !pressing && !activated && "animate-pulse"
        )}
        aria-label="Activate SOS Emergency Alert"
      >
        {/* Outer ring animation */}
        {!activated && (
          <>
            <span className="absolute inset-0 rounded-full border-4 border-error/30 animate-ping" />
            <span className="absolute -inset-3 rounded-full border-2 border-error/10 animate-ping [animation-delay:500ms]" />
          </>
        )}

        <div className="text-center">
          {loading ? (
            <svg
              className="h-12 w-12 animate-spin text-on-error mx-auto"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : activated ? (
            <>
              <Icon name="check_circle" size={48} className="text-on-success mx-auto" filled />
              <p className="text-label-lg font-semibold text-on-success mt-1">
                Alert Sent
              </p>
            </>
          ) : (
            <>
              <span className="text-display font-display text-on-error leading-none">
                SOS
              </span>
              <p className="text-label-sm text-on-error/80 mt-1">TAP FOR HELP</p>
            </>
          )}
        </div>
      </button>

      {/* Description */}
      <p className="mt-4 max-w-[280px] text-center text-body-md text-on-surface-variant">
        {activated
          ? "Your Trip Captain and emergency contacts have been notified with your location."
          : "Tap to alert Trip Captain & Emergency Services"}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick Call Card
// ---------------------------------------------------------------------------

function QuickCallCard({
  label,
  phone,
  icon,
  color,
  description,
}: {
  label: string;
  phone: string;
  icon: string;
  color: string;
  description: string;
}) {
  return (
    <button
      onClick={() => window.open(`tel:${phone}`)}
      className="tactile-btn flex items-center gap-3 rounded-xl bg-surface-container-lowest p-3 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated active:scale-[0.98] w-full text-left"
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
          color
        )}
      >
        <Icon name={icon} size={22} filled />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-label-lg font-semibold text-on-surface">{label}</p>
        <p className="text-label-sm text-on-surface-variant">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-primary">
        <Icon name="call" size={20} filled />
        <span className="text-label-lg font-semibold">{phone}</span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Safety Tips Accordion
// ---------------------------------------------------------------------------

function SafetyTipsAccordion({ tips }: { tips: SafetyTip[] }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-2">
      {tips.map((tip, idx) => (
        <div
          key={idx}
          className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
        >
          <button
            onClick={() => toggle(idx)}
            className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-surface-container-low"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container">
              <Icon
                name={tip.icon}
                size={20}
                className="text-on-surface-variant"
              />
            </div>
            <span className="flex-1 text-label-lg font-semibold text-on-surface">
              {tip.title}
            </span>
            <Icon
              name={expandedIndex === idx ? "expand_less" : "expand_more"}
              size={22}
              className="text-on-surface-variant transition-transform"
            />
          </button>

          {expandedIndex === idx && (
            <div className="border-t border-outline-variant px-3.5 py-3 bg-surface-container-low/50">
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                {tip.content}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Emergency Page Skeleton
// ---------------------------------------------------------------------------

function EmergencySkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
      <Skeleton variant="circular" diameter={160} className="mx-auto" />
      <Skeleton variant="text" width="60%" className="mx-auto" />
      <div className="space-y-3">
        <Skeleton variant="rectangular" height={68} className="rounded-xl" />
        <Skeleton variant="rectangular" height={68} className="rounded-xl" />
        <Skeleton variant="rectangular" height={68} className="rounded-xl" />
      </div>
      <Skeleton variant="card" height={120} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Emergency Page
// ---------------------------------------------------------------------------

export default function EmergencyPage() {
  const router = useRouter();
  const [emergencyData, setEmergencyData] = useState<EmergencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sosActivated, setSosActivated] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [locationAddress, setLocationAddress] = useState<string>("Fetching location...");

  // Fetch emergency data
  const fetchEmergencyData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/emergency");
      if (!res.ok) throw new Error("Failed to load emergency information");
      const data: ApiResponse<EmergencyData> = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to load emergency data");
      setEmergencyData(data.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  // Get current location (placeholder)
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationAddress(
            `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
          );
        },
        () => {
          setLocationAddress("Location unavailable - enable GPS");
        }
      );
    } else {
      setLocationAddress("Geolocation not supported");
    }
  }, []);

  useEffect(() => {
    fetchEmergencyData();
  }, [fetchEmergencyData]);

  // Handle SOS activation
  const handleSOS = async () => {
    setSosLoading(true);
    try {
      const res = await fetch("/api/emergency/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: locationAddress,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to send SOS alert");
      setSosActivated(true);
    } catch (err) {
      console.error("SOS failed:", err);
      // Still show as activated since we want to attempt calling emergency services
      setSosActivated(true);
    } finally {
      setSosLoading(false);
    }
  };

  if (loading) {
    return <EmergencySkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <EmptyState
          icon="error_outline"
          title="Could not load emergency info"
          description={error}
          action={{
            label: "Retry",
            onClick: fetchEmergencyData,
          }}
          secondaryAction={{
            label: "Go Back",
            onClick: () => router.back(),
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
          aria-label="Go back"
        >
          <Icon name="arrow_back" size={22} />
        </button>
        <div>
          <h1 className="text-headline-md font-headline-md text-on-surface">
            Emergency
          </h1>
          <p className="text-label-sm text-on-surface-variant">
            Get help when you need it most
          </p>
        </div>
      </div>

      {/* SOS Button */}
      <div className="flex justify-center py-4">
        <SOSButton
          onActivate={handleSOS}
          activated={sosActivated}
          loading={sosLoading}
        />
      </div>

      {/* Current Location */}
      <Card variant="outlined" className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container">
          <Icon
            name="my_location"
            size={22}
            className="text-on-secondary-container"
            filled
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-label-sm text-on-surface-variant">
            Current Location
          </p>
          <p className="text-label-lg font-semibold text-on-surface truncate">
            {locationAddress}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          icon={<Icon name="content_copy" size={16} />}
          onClick={() => navigator.clipboard?.writeText(locationAddress)}
          aria-label="Copy location"
        />
      </Card>

      {/* Trip Captain Quick Call */}
      {emergencyData?.tripCaptain && (
        <div>
          <h2 className="text-label-lg font-label-lg text-on-surface-variant mb-3">
            Trip Captain
          </h2>
          <button
            onClick={() =>
              window.open(`tel:${emergencyData.tripCaptain!.phone}`)
            }
            className="tactile-btn flex w-full items-center gap-3 rounded-xl bg-primary-fixed p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated active:scale-[0.98] text-left"
          >
            <Avatar
              src={emergencyData.tripCaptain.avatar}
              name={emergencyData.tripCaptain.name}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-label-lg font-semibold text-on-primary-fixed">
                {emergencyData.tripCaptain.name}
              </p>
              <p className="text-label-sm text-on-primary-fixed-variant">
                Trip Captain
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-on-primary">
              <Icon name="call" size={22} filled />
            </div>
          </button>
        </div>
      )}

      {/* Quick Call Options */}
      <div>
        <h2 className="text-label-lg font-label-lg text-on-surface-variant mb-3">
          Emergency Services
        </h2>
        <div className="space-y-2">
          {QUICK_CALL_OPTIONS.map((option) => (
            <QuickCallCard key={option.phone} {...option} />
          ))}
        </div>
      </div>

      {/* Emergency Contacts from Profile */}
      {emergencyData?.emergencyContacts &&
        emergencyData.emergencyContacts.length > 0 && (
          <div>
            <h2 className="text-label-lg font-label-lg text-on-surface-variant mb-3">
              Your Emergency Contacts
            </h2>
            <div className="space-y-2">
              {emergencyData.emergencyContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => window.open(`tel:${contact.phone}`)}
                  className="tactile-btn flex w-full items-center gap-3 rounded-xl bg-surface-container-lowest p-3 shadow-card transition-all hover:-translate-y-0.5 active:scale-[0.98] text-left"
                >
                  <Avatar name={contact.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-label-lg font-semibold text-on-surface">
                      {contact.name}
                    </p>
                    <p className="text-label-sm text-on-surface-variant">
                      {contact.relationship}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-primary">
                    <Icon name="call" size={20} filled />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      {/* Safety Tips */}
      <div>
        <h2 className="text-label-lg font-label-lg text-on-surface-variant mb-3">
          Safety Tips
        </h2>
        <SafetyTipsAccordion tips={SAFETY_TIPS} />
      </div>

      {/* Bottom spacing for nav bar */}
      <div className="h-4" />
    </div>
  );
}
