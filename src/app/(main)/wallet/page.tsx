"use client";

import { useEffect, useState, useCallback } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  WalletData,
  WalletTransactionData,
  SavingsGoalData,
} from "@/types";

// ---------------------------------------------------------------------------
// Transaction type helpers
// ---------------------------------------------------------------------------

type TransactionType =
  | "CREDIT"
  | "DEBIT"
  | "REFUND"
  | "REWARD"
  | "REFERRAL"
  | "GIFT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT";

const TX_META: Record<
  TransactionType,
  { icon: string; color: string; sign: "+" | "-" }
> = {
  CREDIT: { icon: "add_circle", color: "text-success", sign: "+" },
  DEBIT: { icon: "remove_circle", color: "text-error", sign: "-" },
  REFUND: { icon: "replay", color: "text-success", sign: "+" },
  REWARD: { icon: "stars", color: "text-success", sign: "+" },
  REFERRAL: { icon: "group_add", color: "text-success", sign: "+" },
  GIFT: { icon: "redeem", color: "text-success", sign: "+" },
  TRANSFER_IN: { icon: "call_received", color: "text-success", sign: "+" },
  TRANSFER_OUT: { icon: "call_made", color: "text-error", sign: "-" },
};

function getTxMeta(type: string) {
  return (
    TX_META[type as TransactionType] ?? {
      icon: "receipt_long",
      color: "text-on-surface-variant",
      sign: "+",
    }
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [goals, setGoals] = useState<SavingsGoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [addingMoney, setAddingMoney] = useState(false);

  // Goal form
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [creatingGoal, setCreatingGoal] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/wallet");
      if (!res.ok) throw new Error("Failed to fetch wallet data");
      const json = await res.json();
      setWallet(json.data?.wallet ?? json.data ?? null);
      setGoals(json.data?.savingsGoals ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleAddMoney = async () => {
    const paise = Math.round(Number(addAmount) * 100);
    if (!paise || paise <= 0) return;
    try {
      setAddingMoney(true);
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", amountPaise: paise }),
      });
      if (!res.ok) throw new Error("Payment failed");
      setAddMoneyOpen(false);
      setAddAmount("");
      fetchWallet();
    } catch {
      // Error handled silently; production would show toast
    } finally {
      setAddingMoney(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!goalName.trim() || !goalTarget) return;
    try {
      setCreatingGoal(true);
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createGoal",
          name: goalName.trim(),
          targetPaise: Math.round(Number(goalTarget) * 100),
          targetDate: goalDate || null,
        }),
      });
      if (!res.ok) throw new Error("Could not create goal");
      setCreateGoalOpen(false);
      setGoalName("");
      setGoalTarget("");
      setGoalDate("");
      fetchWallet();
    } catch {
      // silent
    } finally {
      setCreatingGoal(false);
    }
  };

  // -- Loading skeleton -------------------------------------------------------

  if (loading) {
    return (
      <div className="px-5 py-6 space-y-6">
        <Skeleton variant="card" height={160} />
        <Skeleton variant="text" lines={2} />
        <Skeleton variant="card" height={120} />
        <Skeleton variant="card" height={120} />
        <Skeleton variant="card" height={120} />
      </div>
    );
  }

  // -- Error ------------------------------------------------------------------

  if (error) {
    return (
      <div className="px-5 py-6">
        <EmptyState
          icon="error"
          title="Something went wrong"
          description={error}
          action={{ label: "Retry", onClick: fetchWallet }}
        />
      </div>
    );
  }

  // -- Render -----------------------------------------------------------------

  const balance = wallet?.balancePaise ?? 0;
  const transactions = wallet?.transactions ?? [];

  return (
    <div className="px-5 py-6 space-y-6">
      {/* -------- Balance Card -------- */}
      <GlassCard className="primary-gradient text-on-primary p-6">
        <p className="text-on-primary/70 text-label-lg font-label-lg">
          Total Balance
        </p>
        <h1 className="mt-1 text-display font-display leading-tight">
          {formatCurrency(balance)}
        </h1>

        <div className="mt-5 flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="border-white/40 text-white hover:bg-white/10"
            icon={<Icon name="add" size={18} />}
            onClick={() => setAddMoneyOpen(true)}
          >
            Add Money
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="border-white/40 text-white hover:bg-white/10"
            icon={<Icon name="send" size={18} />}
          >
            Transfer
          </Button>
        </div>
      </GlassCard>

      {/* -------- Savings Goals -------- */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title-lg font-title-lg text-on-surface">
            Savings Goals
          </h2>
          <Button
            variant="ghost"
            size="sm"
            icon={<Icon name="add" size={18} />}
            onClick={() => setCreateGoalOpen(true)}
          >
            Create Goal
          </Button>
        </div>

        {goals.length === 0 ? (
          <Card variant="outlined" className="py-8">
            <EmptyState
              icon="savings"
              title="No savings goals yet"
              description="Start saving for your next adventure"
              action={{
                label: "Create Goal",
                onClick: () => setCreateGoalOpen(true),
              }}
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const pct =
                goal.targetPaise > 0
                  ? Math.min(
                      100,
                      Math.round((goal.currentPaise / goal.targetPaise) * 100)
                    )
                  : 0;

              return (
                <Card key={goal.id} variant="outlined">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-title-md font-title-md text-on-surface truncate">
                        {goal.name}
                      </p>
                      <p className="mt-0.5 text-label-sm text-on-surface-variant">
                        {formatCurrency(goal.currentPaise)} of{" "}
                        {formatCurrency(goal.targetPaise)}
                      </p>
                    </div>
                    {goal.targetDate && (
                      <Badge variant="outline" className="shrink-0 ml-2">
                        {new Date(goal.targetDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </Badge>
                    )}
                  </div>
                  <ProgressBar
                    value={pct}
                    color="success"
                    showLabel
                    className="mt-3 w-full"
                  />
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* -------- Transaction History -------- */}
      <section>
        <h2 className="text-title-lg font-title-lg text-on-surface mb-4">
          Transaction History
        </h2>

        {transactions.length === 0 ? (
          <Card variant="outlined" className="py-8">
            <EmptyState
              icon="receipt_long"
              title="No transactions yet"
              description="Your transaction history will appear here"
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx: WalletTransactionData) => {
              const meta = getTxMeta(tx.type);
              return (
                <Card
                  key={tx.id}
                  variant="outlined"
                  className="flex items-center gap-3 p-3"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      meta.sign === "+"
                        ? "bg-success-container"
                        : "bg-error-container"
                    )}
                  >
                    <Icon
                      name={meta.icon}
                      size={20}
                      className={meta.color}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-medium text-on-surface truncate">
                      {tx.description}
                    </p>
                    <p className="text-label-sm text-on-surface-variant">
                      {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <p
                    className={cn(
                      "text-body-md font-semibold shrink-0",
                      meta.sign === "+" ? "text-success" : "text-error"
                    )}
                  >
                    {meta.sign}
                    {formatCurrency(tx.amountPaise)}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* -------- Add Money Modal -------- */}
      <Modal
        open={addMoneyOpen}
        onClose={() => setAddMoneyOpen(false)}
        title="Add Money"
        description="Top up your PackAlong wallet"
      >
        <div className="space-y-4">
          <Input
            label="Amount (in Rupees)"
            type="number"
            placeholder="e.g. 500"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            iconLeft={<span className="text-on-surface-variant font-medium">&#x20B9;</span>}
          />

          {addAmount && Number(addAmount) > 0 && (
            <p className="text-label-sm text-on-surface-variant">
              You will add{" "}
              <span className="font-semibold text-on-surface">
                {formatCurrency(Math.round(Number(addAmount) * 100))}
              </span>{" "}
              to your wallet
            </p>
          )}

          <Button
            fullWidth
            loading={addingMoney}
            onClick={handleAddMoney}
            disabled={!addAmount || Number(addAmount) <= 0}
            icon={<Icon name="lock" size={18} />}
          >
            Add via Razorpay
          </Button>
        </div>
      </Modal>

      {/* -------- Create Goal Modal -------- */}
      <Modal
        open={createGoalOpen}
        onClose={() => setCreateGoalOpen(false)}
        title="Create Savings Goal"
        description="Save towards your next trip"
      >
        <div className="space-y-4">
          <Input
            label="Goal Name"
            placeholder="e.g. Goa Trip Fund"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
          />
          <Input
            label="Target Amount (in Rupees)"
            type="number"
            placeholder="e.g. 10000"
            value={goalTarget}
            onChange={(e) => setGoalTarget(e.target.value)}
            iconLeft={<span className="text-on-surface-variant font-medium">&#x20B9;</span>}
          />
          <Input
            label="Target Date (optional)"
            type="date"
            value={goalDate}
            onChange={(e) => setGoalDate(e.target.value)}
          />

          <Button
            fullWidth
            loading={creatingGoal}
            onClick={handleCreateGoal}
            disabled={!goalName.trim() || !goalTarget || Number(goalTarget) <= 0}
          >
            Create Goal
          </Button>
        </div>
      </Modal>
    </div>
  );
}
