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
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency } from "@/lib/utils";
import {
  loadRazorpayScript,
  type RazorpayOptions,
  type RazorpayResponse,
} from "@/lib/razorpay-client";
import type {
  WalletData,
  WalletTransactionData,
  SavingsGoalData,
  WalletTopupConfig,
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
  | "TRANSFER_OUT"
  | "TOPUP"
  | "ADMIN_CREDIT"
  | "ADMIN_DEBIT";

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
  TOPUP: { icon: "account_balance_wallet", color: "text-success", sign: "+" },
  ADMIN_CREDIT: { icon: "admin_panel_settings", color: "text-success", sign: "+" },
  ADMIN_DEBIT: { icon: "admin_panel_settings", color: "text-error", sign: "-" },
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
  const { success: toastSuccess, error: toastError } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [goals, setGoals] = useState<SavingsGoalData[]>([]);
  const [topupConfig, setTopupConfig] = useState<WalletTopupConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [addingMoney, setAddingMoney] = useState(false);

  // Goal form
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [creatingGoal, setCreatingGoal] = useState(false);

  // Transfer form
  const [transferPhone, setTransferPhone] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/wallet");
      if (!res.ok) throw new Error("Failed to fetch wallet data");
      const json = await res.json();
      setWallet(json.data?.wallet ?? json.data ?? null);
      setGoals(json.data?.savingsGoals ?? []);
      if (json.data?.topupConfig) setTopupConfig(json.data.topupConfig);
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

    // Validate against topup limits
    if (topupConfig) {
      if (paise < topupConfig.minPaise) {
        toastError(`Minimum top-up is ${formatCurrency(topupConfig.minPaise)}`);
        return;
      }
      if (paise > topupConfig.maxPaise) {
        toastError(`Maximum top-up is ${formatCurrency(topupConfig.maxPaise)}`);
        return;
      }
    }

    try {
      setAddingMoney(true);

      // 1. Create top-up order
      const orderRes = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountPaise: paise }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderJson.error ?? "Failed to create order");

      // Test mode — auto-credited
      if (orderJson.data?.testMode) {
        setAddMoneyOpen(false);
        setAddAmount("");
        toastSuccess("Money added successfully");
        fetchWallet();
        return;
      }

      // 2. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Failed to load payment gateway");

      // 3. Open Razorpay checkout
      const { orderId, amount, currency, key } = orderJson.data;

      const options: RazorpayOptions = {
        key,
        amount,
        currency,
        name: "Travelling Goats",
        description: "Wallet Top-up",
        order_id: orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch("/api/wallet/topup", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (!verifyRes.ok) throw new Error("Verification failed");
            setAddMoneyOpen(false);
            setAddAmount("");
            toastSuccess("Money added successfully!");
            fetchWallet();
          } catch {
            toastError("Top-up verification failed. Contact support.");
          } finally {
            setAddingMoney(false);
          }
        },
        theme: { color: "#FF385C" },
        modal: {
          ondismiss: () => setAddingMoney(false),
        },
      };

      const razorpay = new window.Razorpay!(options);
      razorpay.on("payment.failed", () => {
        toastError("Payment failed. Please try again.");
        setAddingMoney(false);
      });
      razorpay.open();
      // Don't setAddingMoney(false) here — Razorpay is still open
      return;
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to add money");
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
      toastSuccess("Savings goal created");
      fetchWallet();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setCreatingGoal(false);
    }
  };

  const handleLookupRecipient = async () => {
    const phone = transferPhone.trim();
    if (phone.length < 10) return;
    try {
      setLookingUp(true);
      setLookupError(null);
      setRecipientName(null);
      setRecipientId(null);
      const res = await fetch(`/api/users/lookup?phone=${encodeURIComponent(phone)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setRecipientId(json.data.id);
        setRecipientName(json.data.name ?? "User");
      } else {
        setLookupError(json.error ?? "User not found");
      }
    } catch {
      setLookupError("Lookup failed");
    } finally {
      setLookingUp(false);
    }
  };

  const handleTransfer = async () => {
    const paise = Math.round(Number(transferAmount) * 100);
    if (!paise || paise <= 0 || !recipientId) return;
    try {
      setTransferring(true);
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "TRANSFER_OUT",
          amountPaise: paise,
          recipientId,
          description: `Transfer to ${recipientName}`,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Transfer failed");
      setTransferOpen(false);
      setTransferPhone("");
      setTransferAmount("");
      setRecipientId(null);
      setRecipientName(null);
      setLookupError(null);
      toastSuccess(`Sent ${formatCurrency(paise)} to ${recipientName}`);
      fetchWallet();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setTransferring(false);
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
      {/* -------- Frozen Banner -------- */}
      {wallet?.isFrozen && (
        <Card variant="outlined" className="border-error/30 bg-error/5 flex items-center gap-3 p-4">
          <Icon name="ac_unit" size={22} className="text-error shrink-0" />
          <div>
            <p className="text-title-md font-title-md text-error">Wallet Frozen</p>
            <p className="text-body-sm text-on-surface-variant">
              {wallet.frozenReason ?? "Your wallet has been frozen. Contact support for help."}
            </p>
          </div>
        </Card>
      )}

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
            className="border-white/40 text-white hover:bg-white/10 whitespace-nowrap"
            icon={<Icon name="add" size={18} />}
            onClick={() => setAddMoneyOpen(true)}
          >
            Add Money
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="border-white/40 text-white hover:bg-white/10 whitespace-nowrap"
            icon={<Icon name="send" size={18} />}
            onClick={() => setTransferOpen(true)}
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
          <div className="space-y-3">
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
        onClose={() => { setAddMoneyOpen(false); setAddAmount(""); }}
        title="Add Money"
        description="Top up your Travelling Goats wallet"
      >
        <div className="space-y-4">
          {wallet?.isFrozen ? (
            <div className="rounded-xl bg-error/10 px-4 py-3 text-body-md text-error">
              Your wallet is frozen. Please contact support.
            </div>
          ) : (
            <>
              {/* Preset chips */}
              {topupConfig && topupConfig.presetsPaise.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {topupConfig.presetsPaise.map((paise) => (
                    <button
                      key={paise}
                      type="button"
                      onClick={() => setAddAmount(String(paise / 100))}
                      className={cn(
                        "rounded-full px-4 py-2 text-label-lg font-label-lg border transition-colors",
                        Number(addAmount) === paise / 100
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
                      )}
                    >
                      {formatCurrency(paise)}
                    </button>
                  ))}
                </div>
              )}

              <Input
                label="Custom Amount (in Rupees)"
                type="number"
                placeholder="e.g. 500"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                iconLeft={<span className="text-on-surface-variant font-medium">&#x20B9;</span>}
              />

              {topupConfig && (
                <p className="text-label-sm text-on-surface-variant">
                  Min: {formatCurrency(topupConfig.minPaise)} &middot; Max: {formatCurrency(topupConfig.maxPaise)}
                </p>
              )}

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
                Pay via Razorpay
              </Button>
            </>
          )}
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

      {/* -------- Transfer Modal -------- */}
      <Modal
        open={transferOpen}
        onClose={() => {
          setTransferOpen(false);
          setTransferPhone("");
          setTransferAmount("");
          setRecipientId(null);
          setRecipientName(null);
          setLookupError(null);
        }}
        title="Transfer Money"
        description="Send money to another Travelling Goats user"
      >
        <div className="space-y-4">
          {/* Phone lookup */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="Recipient Phone"
                type="tel"
                placeholder="e.g. 9876543210"
                value={transferPhone}
                onChange={(e) => {
                  setTransferPhone(e.target.value);
                  setRecipientId(null);
                  setRecipientName(null);
                  setLookupError(null);
                }}
                iconLeft={<span className="text-on-surface-variant font-medium">+91</span>}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={lookingUp}
              onClick={handleLookupRecipient}
              disabled={transferPhone.trim().length < 10}
              className="mb-0.5"
            >
              Find
            </Button>
          </div>

          {/* Lookup result */}
          {recipientName && (
            <div className="flex items-center gap-2 rounded-xl bg-success-container/30 px-3 py-2">
              <Icon name="check_circle" size={18} className="text-success" />
              <span className="text-body-md text-on-surface font-medium">{recipientName}</span>
            </div>
          )}
          {lookupError && (
            <p className="text-label-sm text-error">{lookupError}</p>
          )}

          {/* Amount */}
          {recipientId && (
            <>
              <Input
                label="Amount (in Rupees)"
                type="number"
                placeholder="e.g. 500"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                iconLeft={<span className="text-on-surface-variant font-medium">&#x20B9;</span>}
              />

              {transferAmount && Number(transferAmount) > 0 && (
                <p className="text-label-sm text-on-surface-variant">
                  You will send{" "}
                  <span className="font-semibold text-on-surface">
                    {formatCurrency(Math.round(Number(transferAmount) * 100))}
                  </span>{" "}
                  to <span className="font-semibold text-on-surface">{recipientName}</span>
                </p>
              )}

              <Button
                fullWidth
                loading={transferring}
                onClick={handleTransfer}
                disabled={!transferAmount || Number(transferAmount) <= 0}
                icon={<Icon name="send" size={18} />}
              >
                Send Money
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
