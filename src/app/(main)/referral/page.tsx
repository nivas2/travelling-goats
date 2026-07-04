"use client";

import { useEffect, useState, useCallback } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReferredUser {
  id: string;
  name: string;
  status: "PENDING" | "COMPLETED" | "EXPIRED";
  rewardPaise: number;
  createdAt: string;
}

interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  completedReferrals: number;
  totalEarningsPaise: number;
  referredUsers: ReferredUser[];
}

// ---------------------------------------------------------------------------
// Tier rewards
// ---------------------------------------------------------------------------

const REWARD_TIERS = [
  { range: "1st - 5th", reward: 200_00, label: "200" },
  { range: "6th - 15th", reward: 300_00, label: "300" },
  { range: "16th+", reward: 500_00, label: "500" },
];

const STATUS_META: Record<
  ReferredUser["status"],
  { label: string; badgeVariant: "default" | "secondary" | "outline" }
> = {
  COMPLETED: { label: "Completed", badgeVariant: "default" },
  PENDING: { label: "Pending", badgeVariant: "secondary" },
  EXPIRED: { label: "Expired", badgeVariant: "outline" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchReferrals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/referrals");
      if (!res.ok) throw new Error("Failed to load referral data");
      const json = await res.json();
      setData(json.data ?? json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const handleCopyCode = async () => {
    if (!data?.referralCode) return;
    try {
      await navigator.clipboard.writeText(data.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const handleCopyLink = async () => {
    if (!data?.referralLink) return;
    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const handleShareWhatsApp = () => {
    if (!data) return;
    const msg = encodeURIComponent(
      `Join MeetMyRoute and get rewarded! Use my referral code: ${data.referralCode}\n${data.referralLink}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const handleShareMore = async () => {
    if (!data || !navigator.share) return;
    try {
      await navigator.share({
        title: "Join MeetMyRoute",
        text: `Use my referral code ${data.referralCode} to sign up and earn rewards!`,
        url: data.referralLink,
      });
    } catch {
      // share cancelled
    }
  };

  // -- Loading ---------------------------------------------------------------

  if (loading) {
    return (
      <div className="px-5 py-6 space-y-6">
        <Skeleton variant="card" height={180} />
        <Skeleton variant="card" height={100} />
        <Skeleton variant="text" lines={3} />
        <Skeleton variant="card" height={120} />
      </div>
    );
  }

  // -- Error -----------------------------------------------------------------

  if (error) {
    return (
      <div className="px-5 py-6">
        <EmptyState
          icon="error"
          title="Something went wrong"
          description={error}
          action={{ label: "Retry", onClick: fetchReferrals }}
        />
      </div>
    );
  }

  const referralCode = data?.referralCode ?? "";
  const referredUsers = data?.referredUsers ?? [];
  const totalReferrals = data?.totalReferrals ?? 0;
  const completedReferrals = data?.completedReferrals ?? 0;
  const totalEarningsPaise = data?.totalEarningsPaise ?? 0;

  return (
    <div className="px-5 py-6 space-y-6">
      {/* -------- Refer & Earn Banner -------- */}
      <GlassCard className="primary-gradient text-on-primary p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Icon name="redeem" size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-headline-md font-headline-md">
              Refer &amp; Earn
            </h1>
            <p className="mt-1 text-body-md text-white/80">
              Invite friends to MeetMyRoute and earn up to{" "}
              <span className="font-semibold text-white">&#x20B9;500</span> per
              referral!
            </p>
          </div>
        </div>
      </GlassCard>

      {/* -------- Referral Code -------- */}
      <Card variant="elevated" className="p-5">
        <p className="text-label-sm text-on-surface-variant mb-2">
          Your Referral Code
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-xl border-2 border-dashed border-primary/40 bg-primary-fixed/10 px-4 py-3 text-center">
            <span className="text-headline-md font-headline-md tracking-widest text-primary">
              {referralCode}
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyCode}
            icon={
              <Icon name={copied ? "check" : "content_copy"} size={18} />
            }
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        {/* Share buttons */}
        <div className="mt-4 flex gap-3">
          <Button
            variant="primary"
            size="sm"
            fullWidth
            icon={<Icon name="chat" size={18} />}
            onClick={handleShareWhatsApp}
          >
            WhatsApp
          </Button>
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            icon={<Icon name="link" size={18} />}
            onClick={handleCopyLink}
          >
            Copy Link
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Icon name="share" size={18} />}
            onClick={handleShareMore}
          >
            More
          </Button>
        </div>
      </Card>

      {/* -------- Stats Row -------- */}
      <div className="grid grid-cols-3 gap-3">
        <Card variant="outlined" className="text-center p-3">
          <p className="text-headline-md font-headline-md text-primary">
            {totalReferrals}
          </p>
          <p className="text-label-sm text-on-surface-variant mt-1">
            Total
          </p>
        </Card>
        <Card variant="outlined" className="text-center p-3">
          <p className="text-headline-md font-headline-md text-success">
            {completedReferrals}
          </p>
          <p className="text-label-sm text-on-surface-variant mt-1">
            Completed
          </p>
        </Card>
        <Card variant="outlined" className="text-center p-3">
          <p className="text-headline-md font-headline-md text-tertiary">
            {formatCurrency(totalEarningsPaise)}
          </p>
          <p className="text-label-sm text-on-surface-variant mt-1">
            Earned
          </p>
        </Card>
      </div>

      {/* -------- Tiered Rewards -------- */}
      <section>
        <h2 className="text-title-lg font-title-lg text-on-surface mb-3">
          Reward Tiers
        </h2>
        <div className="space-y-2">
          {REWARD_TIERS.map((tier) => (
            <Card
              key={tier.range}
              variant="outlined"
              className="flex items-center justify-between p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed">
                  <Icon
                    name="emoji_events"
                    size={20}
                    className="text-on-primary-fixed"
                  />
                </div>
                <div>
                  <p className="text-body-md font-medium text-on-surface">
                    Referral {tier.range}
                  </p>
                  <p className="text-label-sm text-on-surface-variant">
                    Per successful referral
                  </p>
                </div>
              </div>
              <Badge variant="default" className="text-label-lg px-3 py-1">
                &#x20B9;{tier.label}
              </Badge>
            </Card>
          ))}
        </div>
      </section>

      {/* -------- Your Referrals -------- */}
      <section>
        <h2 className="text-title-lg font-title-lg text-on-surface mb-3">
          Your Referrals
        </h2>

        {referredUsers.length === 0 ? (
          <Card variant="outlined" className="py-8">
            <EmptyState
              icon="group"
              title="No referrals yet"
              description="Share your code to start earning rewards"
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {referredUsers.map((user) => {
              const statusMeta = STATUS_META[user.status];
              return (
                <Card
                  key={user.id}
                  variant="outlined"
                  className="flex items-center gap-3 p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container">
                    <Icon
                      name="person"
                      size={20}
                      className="text-on-secondary-container"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-medium text-on-surface truncate">
                      {user.name}
                    </p>
                    <p className="text-label-sm text-on-surface-variant">
                      {new Date(user.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={statusMeta.badgeVariant}>
                      {statusMeta.label}
                    </Badge>
                    {user.status === "COMPLETED" && (
                      <span className="text-label-sm font-semibold text-success">
                        +{formatCurrency(user.rewardPaise)}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
