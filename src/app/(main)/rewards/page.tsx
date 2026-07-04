"use client";

import { useEffect, useState, useCallback } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tier definitions
// ---------------------------------------------------------------------------

interface TierDef {
  name: string;
  icon: string;
  minPoints: number;
  color: string;
  bgGradient: string;
  benefits: string[];
}

const TIERS: TierDef[] = [
  {
    name: "Explorer",
    icon: "hiking",
    minPoints: 0,
    color: "text-on-surface-variant",
    bgGradient: "from-surface-container-high to-surface-container",
    benefits: [
      "Access to all trips",
      "Basic reward points on bookings",
      "Referral bonus program",
    ],
  },
  {
    name: "Adventurer",
    icon: "landscape",
    minPoints: 500,
    color: "text-secondary",
    bgGradient: "from-secondary/20 to-secondary/5",
    benefits: [
      "All Explorer benefits",
      "1.5x reward points on bookings",
      "Early access to new trips",
      "Priority customer support",
    ],
  },
  {
    name: "Voyager",
    icon: "flight_takeoff",
    minPoints: 2000,
    color: "text-tertiary",
    bgGradient: "from-tertiary/20 to-tertiary/5",
    benefits: [
      "All Adventurer benefits",
      "2x reward points on bookings",
      "Free add-on on every trip",
      "Exclusive Voyager-only trips",
      "Birthday bonus points",
    ],
  },
  {
    name: "Legend",
    icon: "diamond",
    minPoints: 5000,
    color: "text-primary",
    bgGradient: "from-primary/20 to-primary/5",
    benefits: [
      "All Voyager benefits",
      "3x reward points on bookings",
      "Complimentary trip upgrade",
      "VIP concierge service",
      "Invite-only Legend meetups",
      "Lifetime membership perks",
    ],
  },
];

const EARNING_RULES = [
  { icon: "confirmation_number", label: "Book a trip", points: "100 pts / booking" },
  { icon: "rate_review", label: "Write a review", points: "20 pts / review" },
  { icon: "group_add", label: "Refer a friend", points: "50 pts / referral" },
  { icon: "cake", label: "Birthday bonus", points: "100 pts (Voyager+)" },
  { icon: "auto_awesome", label: "First booking bonus", points: "200 pts" },
  { icon: "loyalty", label: "Complete profile", points: "50 pts" },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RewardHistoryItem {
  id: string;
  type: string;
  points: number;
  description: string;
  createdAt: string;
}

interface RewardsData {
  points: number;
  tier: string;
  history: RewardHistoryItem[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RewardsPage() {
  const [data, setData] = useState<RewardsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRewards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/rewards");
      if (!res.ok) throw new Error("Failed to fetch rewards");
      const json = await res.json();
      setData(json.data ?? json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  if (loading) {
    return (
      <div className="px-5 py-6 space-y-6">
        <Skeleton variant="card" height={180} />
        <Skeleton variant="text" lines={3} />
        <Skeleton variant="card" height={140} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-6">
        <EmptyState
          icon="error"
          title="Could not load rewards"
          description={error}
          action={{ label: "Retry", onClick: fetchRewards }}
        />
      </div>
    );
  }

  const points = data?.points ?? 0;
  const tierName = data?.tier ?? "Explorer";
  const history = data?.history ?? [];

  const currentTier =
    TIERS.find((t) => t.name === tierName) ?? TIERS[0];
  const currentTierIdx = TIERS.indexOf(currentTier);
  const nextTier =
    currentTierIdx < TIERS.length - 1 ? TIERS[currentTierIdx + 1] : null;

  const progressToNext = nextTier
    ? Math.min(
        100,
        Math.round(
          ((points - currentTier.minPoints) /
            (nextTier.minPoints - currentTier.minPoints)) *
            100
        )
      )
    : 100;

  return (
    <div className="px-5 py-6 space-y-6">
      {/* -------- Current Tier Card -------- */}
      <GlassCard
        className={cn("bg-gradient-to-br p-6", currentTier.bgGradient)}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-lowest/80"
            )}
          >
            <Icon
              name={currentTier.icon}
              size={32}
              filled
              className={currentTier.color}
            />
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant">
              Current Tier
            </p>
            <h2 className="text-headline-md font-headline-md text-on-surface">
              {currentTier.name}
            </h2>
          </div>
        </div>

        {/* Points */}
        <div className="mt-5">
          <p className="text-label-sm text-on-surface-variant">
            Reward Points
          </p>
          <p className="text-headline-lg font-headline-lg text-on-surface">
            {points.toLocaleString("en-IN")}
          </p>
        </div>

        {/* Progress to next tier */}
        {nextTier ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-label-sm text-on-surface-variant mb-1">
              <span>Progress to {nextTier.name}</span>
              <span>
                {points.toLocaleString("en-IN")} /{" "}
                {nextTier.minPoints.toLocaleString("en-IN")} pts
              </span>
            </div>
            <ProgressBar value={progressToNext} className="w-full" />
          </div>
        ) : (
          <Badge className="mt-4" variant="default">
            Max Tier Reached
          </Badge>
        )}
      </GlassCard>

      {/* -------- Tabs -------- */}
      <Tabs defaultValue="benefits">
        <TabList>
          <Tab value="benefits">Benefits</Tab>
          <Tab value="history">History</Tab>
          <Tab value="earn">How to Earn</Tab>
        </TabList>

        {/* -- Benefits Panel -- */}
        <TabPanel value="benefits">
          <div className="space-y-4">
            {TIERS.map((tier) => {
              const isCurrent = tier.name === currentTier.name;
              const isLocked = tier.minPoints > points;

              return (
                <Card
                  key={tier.name}
                  variant={isCurrent ? "elevated" : "outlined"}
                  className={cn(isLocked && "opacity-60")}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Icon
                      name={tier.icon}
                      size={24}
                      filled
                      className={tier.color}
                    />
                    <h3 className="text-title-md font-title-md text-on-surface flex-1">
                      {tier.name}
                    </h3>
                    {isCurrent && (
                      <Badge variant="default">Current</Badge>
                    )}
                    {isLocked && (
                      <Badge variant="outline">
                        {tier.minPoints.toLocaleString("en-IN")} pts
                      </Badge>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {tier.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="flex items-start gap-2 text-body-md text-on-surface-variant"
                      >
                        <Icon
                          name="check_circle"
                          size={18}
                          className={cn(
                            "mt-0.5 shrink-0",
                            isLocked
                              ? "text-outline"
                              : "text-success"
                          )}
                        />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </TabPanel>

        {/* -- History Panel -- */}
        <TabPanel value="history">
          {history.length === 0 ? (
            <EmptyState
              icon="history"
              title="No points history"
              description="Earn points by booking trips, writing reviews, and more"
            />
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <Card
                  key={item.id}
                  variant="outlined"
                  className="flex items-center gap-3 p-3"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      item.points > 0
                        ? "bg-success-container"
                        : "bg-error-container"
                    )}
                  >
                    <Icon
                      name={item.points > 0 ? "add_circle" : "remove_circle"}
                      size={20}
                      className={
                        item.points > 0 ? "text-success" : "text-error"
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-medium text-on-surface truncate">
                      {item.description}
                    </p>
                    <p className="text-label-sm text-on-surface-variant">
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "text-body-md font-semibold shrink-0",
                      item.points > 0 ? "text-success" : "text-error"
                    )}
                  >
                    {item.points > 0 ? "+" : ""}
                    {item.points} pts
                  </p>
                </Card>
              ))}
            </div>
          )}
        </TabPanel>

        {/* -- How to Earn Panel -- */}
        <TabPanel value="earn">
          <div className="space-y-3">
            {EARNING_RULES.map((rule) => (
              <Card
                key={rule.label}
                variant="outlined"
                className="flex items-center gap-3 p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed">
                  <Icon
                    name={rule.icon}
                    size={20}
                    className="text-on-primary-fixed"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-medium text-on-surface">
                    {rule.label}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {rule.points}
                </Badge>
              </Card>
            ))}
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
