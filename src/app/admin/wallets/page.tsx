"use client";

import { useEffect, useState, useCallback } from "react";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import type { WalletTransactionData } from "@/types";
import { useSortable } from "@/hooks/use-sortable";
import { SortHeader } from "@/components/admin/sort-header";
import { AdminTableToolbar } from "@/components/admin/admin-table-toolbar";
import { downloadCSV } from "@/lib/csv";

/* ---------- Types ---------- */

interface WalletUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  wallet: {
    id: string;
    balancePaise: number;
    isFrozen: boolean;
    frozenReason: string | null;
  } | null;
}

interface WalletStats {
  totalBalancePaise: number;
  totalWallets: number;
  frozenWallets: number;
}

/* ---------- Page ---------- */

export default function AdminWalletsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [users, setUsers] = useState<WalletUser[]>([]);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // History modal
  const [historyUser, setHistoryUser] = useState<WalletUser | null>(null);
  const [historyTxns, setHistoryTxns] = useState<WalletTransactionData[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Action modal
  const [actionUser, setActionUser] = useState<WalletUser | null>(null);
  const [actionType, setActionType] = useState<"credit" | "debit" | "freeze" | "unfreeze" | "refund" | null>(null);
  const [actionAmount, setActionAmount] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchUsers = useCallback(async (searchTerm?: string) => {
    try {
      setLoading(true);
      const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
      const res = await fetch(`/api/admin/wallets${query}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users ?? []);
        setStats(json.data.stats ?? null);
      }
    } catch (err) {
      console.error("Failed to load wallets", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    fetchUsers(search);
  };

  async function openHistory(user: WalletUser) {
    setHistoryUser(user);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/admin/wallets/${user.id}`);
      const json = await res.json();
      if (json.success) {
        setHistoryTxns(json.data.transactions ?? []);
      }
    } catch {
      toastError("Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  }

  function openAction(user: WalletUser, type: typeof actionType) {
    setActionUser(user);
    setActionType(type);
    setActionAmount("");
    setActionReason("");
  }

  async function handleAction() {
    if (!actionUser || !actionType) return;
    setProcessing(true);
    try {
      const body: Record<string, unknown> = {
        action: actionType,
        reason: actionReason,
      };
      if (["credit", "debit", "refund"].includes(actionType)) {
        body.amountPaise = Math.round(Number(actionAmount) * 100);
      }

      const res = await fetch(`/api/admin/wallets/${actionUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        toastSuccess(`${actionType} completed`);
        setActionUser(null);
        setActionType(null);
        fetchUsers(search);
      } else {
        toastError(json.error ?? "Action failed");
      }
    } catch {
      toastError("Action failed");
    } finally {
      setProcessing(false);
    }
  }

  const needsAmount = !!actionType && ["credit", "debit", "refund"].includes(actionType);

  const { sortedData, sortConfig, requestSort } = useSortable({ data: users });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-headline-md text-on-surface">Wallet Management</h1>
        <p className="text-body-md text-on-surface-variant">
          View and manage user wallets
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="elevated" className="text-center">
            <p className="text-label-lg text-on-surface-variant">Total Balance</p>
            <p className="text-headline-sm font-headline-sm text-primary mt-1">
              {formatCurrency(stats.totalBalancePaise)}
            </p>
          </Card>
          <Card variant="elevated" className="text-center">
            <p className="text-label-lg text-on-surface-variant">Total Wallets</p>
            <p className="text-headline-sm font-headline-sm text-on-surface mt-1">
              {stats.totalWallets}
            </p>
          </Card>
          <Card variant="elevated" className="text-center">
            <p className="text-label-lg text-on-surface-variant">Frozen Wallets</p>
            <p className={cn("text-headline-sm font-headline-sm mt-1", stats.frozenWallets > 0 ? "text-error" : "text-on-surface")}>
              {stats.frozenWallets}
            </p>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2 items-end">
        <div className="sm:w-72">
          <Input
            placeholder="Search by name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            inputSize="sm"
            iconLeft={<span className="material-symbols-outlined text-[20px]">search</span>}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button variant="secondary" size="sm" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Toolbar */}
      <AdminTableToolbar
        onExportCSV={() =>
          downloadCSV(sortedData, [
            { header: "Name", accessor: "name" },
            { header: "Email", accessor: "email" },
            { header: "Phone", accessor: "phone" },
            { header: "Balance", accessor: (u: WalletUser) => ((u.wallet?.balancePaise ?? 0) / 100).toFixed(2) },
            { header: "Status", accessor: (u: WalletUser) => u.wallet?.isFrozen ? "Frozen" : "Active" },
          ], `wallets-${new Date().toISOString().slice(0, 10)}.csv`)
        }
        csvDisabled={sortedData.length === 0}
      />

      {/* Table */}
      <Card variant="elevated" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container">
                <SortHeader label="User" sortKey="name" sortConfig={sortConfig} onSort={requestSort} className="text-left" />
                <SortHeader label="Phone" sortKey="phone" sortConfig={sortConfig} onSort={requestSort} className="text-left" />
                <SortHeader label="Email" sortKey="email" sortConfig={sortConfig} onSort={requestSort} className="text-left" />
                <SortHeader label="Balance" sortKey="wallet.balancePaise" sortConfig={sortConfig} onSort={requestSort} className="text-right" />
                <SortHeader label="Status" sortKey="wallet.isFrozen" sortConfig={sortConfig} onSort={requestSort} className="text-center" />
                <th className="px-4 py-3 text-right font-label-lg text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/10">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-5 animate-pulse rounded bg-surface-container-low" />
                    </td>
                  </tr>
                ))
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-on-surface-variant">
                    No users found
                  </td>
                </tr>
              ) : (
                sortedData.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container/50 transition-colors cursor-pointer"
                    onClick={() => openHistory(user)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-label-sm font-bold shrink-0">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            getInitials(user.name ?? "U")
                          )}
                        </div>
                        <span className="font-medium text-on-surface">{user.name ?? "Unnamed"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-on-surface-variant">{user.phone ?? "-"}</td>
                    <td className="px-5 py-3 text-on-surface-variant">{user.email ?? "-"}</td>
                    <td className="px-5 py-3 text-right font-medium text-on-surface">
                      {formatCurrency(user.wallet?.balancePaise ?? 0)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {user.wallet?.isFrozen ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-error/10 px-2.5 py-0.5 text-label-sm text-error">
                          <span className="material-symbols-outlined text-[14px]">ac_unit</span>
                          Frozen
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-label-sm text-success">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openAction(user, "credit")}
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-success/10 transition-colors"
                          title="Credit"
                        >
                          <span className="material-symbols-outlined text-[18px] text-success">add_circle</span>
                        </button>
                        <button
                          onClick={() => openAction(user, "debit")}
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-error/10 transition-colors"
                          title="Debit"
                        >
                          <span className="material-symbols-outlined text-[18px] text-error">remove_circle</span>
                        </button>
                        <button
                          onClick={() => openAction(user, user.wallet?.isFrozen ? "unfreeze" : "freeze")}
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-warning/10 transition-colors"
                          title={user.wallet?.isFrozen ? "Unfreeze" : "Freeze"}
                        >
                          <span className="material-symbols-outlined text-[18px] text-warning">
                            {user.wallet?.isFrozen ? "lock_open" : "ac_unit"}
                          </span>
                        </button>
                        <button
                          onClick={() => openAction(user, "refund")}
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors"
                          title="Refund"
                        >
                          <span className="material-symbols-outlined text-[18px] text-primary">replay</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* History Modal */}
      <Modal
        open={!!historyUser}
        onClose={() => { setHistoryUser(null); setHistoryTxns([]); }}
        title={`Wallet History — ${historyUser?.name ?? "User"}`}
        size="lg"
      >
        <div className="space-y-2">
          {historyUser?.wallet && (
            <div className="flex items-center justify-between rounded-xl bg-surface-container px-4 py-3 mb-4">
              <span className="text-body-md text-on-surface-variant">Balance</span>
              <span className="text-title-md font-title-md text-on-surface">
                {formatCurrency(historyUser.wallet.balancePaise)}
              </span>
            </div>
          )}

          {historyLoading ? (
            <p className="text-body-md text-on-surface-variant py-8 text-center">Loading...</p>
          ) : historyTxns.length === 0 ? (
            <p className="text-body-md text-on-surface-variant py-8 text-center">No transactions</p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {historyTxns.map((tx) => {
                const isCredit = !["DEBIT", "TRANSFER_OUT", "ADMIN_DEBIT"].includes(tx.type);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg border border-outline-variant/10 px-4 py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-on-surface truncate">
                        {tx.description}
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        {tx.type} &middot;{" "}
                        {new Date(tx.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className={cn("text-body-md font-semibold shrink-0 ml-3", isCredit ? "text-success" : "text-error")}>
                      {isCredit ? "+" : "-"}{formatCurrency(tx.amountPaise)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Action Modal */}
      <Modal
        open={!!actionUser && !!actionType}
        onClose={() => { setActionUser(null); setActionType(null); }}
        title={`${actionType?.charAt(0).toUpperCase()}${actionType?.slice(1) ?? ""} Wallet — ${actionUser?.name ?? "User"}`}
        size="sm"
      >
        <div className="space-y-4">
          {needsAmount && (
            <Input
              label="Amount (₹)"
              type="number"
              placeholder="e.g. 500"
              value={actionAmount}
              onChange={(e) => setActionAmount(e.target.value)}
            />
          )}
          <div>
            <label className="block text-label-lg font-label-lg text-on-surface mb-1.5">Reason</label>
            <textarea
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              rows={3}
              placeholder="Reason for this action..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => { setActionUser(null); setActionType(null); }}>
              Cancel
            </Button>
            <Button
              variant={actionType === "debit" ? "destructive" : "primary"}
              size="sm"
              loading={processing}
              onClick={handleAction}
              disabled={
                !actionReason.trim() ||
                (needsAmount && (!actionAmount || Number(actionAmount) <= 0))
              }
            >
              Confirm {actionType}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
