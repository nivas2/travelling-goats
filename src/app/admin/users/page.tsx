"use client";

import { useEffect, useState } from "react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";

/* ---------- Types ---------- */

interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
  status: string;
  isVerified: boolean;
  totalTrips: number;
  createdAt: string;
}

/* ---------- Helpers ---------- */

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    ADMIN: "bg-primary/10 text-primary",
    TRIP_CAPTAIN: "bg-primary/10 text-primary",
    SUPPORT: "bg-surface-container text-on-surface-variant",
    USER: "bg-surface-container text-on-surface-variant",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-label-sm capitalize", colors[role] ?? "bg-surface-container text-on-surface-variant")}>
      {role.toLowerCase().replace("_", " ")}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-success/10 text-success",
    SUSPENDED: "bg-warning/10 text-warning",
    BANNED: "bg-error/10 text-error",
    DELETED: "bg-surface-container text-on-surface-variant",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-label-sm capitalize", colors[status] ?? "bg-surface-container text-on-surface-variant")}>
      {status.toLowerCase()}
    </span>
  );
}

/* ---------- Page ---------- */

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"role" | "suspend" | "delete" | null>(null);
  const [selectedRole, setSelectedRole] = useState("USER");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users");
        const json = await res.json();
        if (json.success) setUsers(json.data ?? []);
      } catch (err) {
        console.error("Failed to load users", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  async function handleAction() {
    if (!actionUser || !actionType) return;
    setProcessing(true);
    try {
      const body: Record<string, unknown> = {};
      if (actionType === "role") body.role = selectedRole;
      if (actionType === "suspend") body.status = actionUser.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
      if (actionType === "delete") body.status = "DELETED";

      const res = await fetch(`/api/admin/users/${actionUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === actionUser.id ? { ...u, ...body } as User : u))
        );
      }
    } catch (err) {
      console.error("Action failed", err);
    } finally {
      setProcessing(false);
      setActionUser(null);
      setActionType(null);
    }
  }

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.phone ?? "").includes(search);
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-headline-md text-on-surface">User Management</h1>
        <p className="text-body-md text-on-surface-variant">
          Manage users, roles, and account status
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="sm:w-72">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            inputSize="sm"
            iconLeft={<span className="material-symbols-outlined text-[20px]">search</span>}
          />
        </div>
        <div className="w-40">
          <Dropdown
            placeholder="Role"
            options={[
              { label: "All Roles", value: "ALL" },
              { label: "User", value: "USER" },
              { label: "Admin", value: "ADMIN" },
              { label: "Trip Captain", value: "TRIP_CAPTAIN" },
              { label: "Support", value: "SUPPORT" },
            ]}
            value={roleFilter}
            onChange={setRoleFilter}
          />
        </div>
        <div className="w-40">
          <Dropdown
            placeholder="Status"
            options={[
              { label: "All Status", value: "ALL" },
              { label: "Active", value: "ACTIVE" },
              { label: "Suspended", value: "SUSPENDED" },
              { label: "Banned", value: "BANNED" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* Table */}
      <Card variant="elevated" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container">
                <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">User</th>
                <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">Email</th>
                <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">Phone</th>
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Role</th>
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Status</th>
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Verified</th>
                <th className="px-4 py-3 text-right font-label-lg text-on-surface-variant">Joined</th>
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Trips</th>
                <th className="px-4 py-3 text-right font-label-lg text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/10">
                    <td colSpan={9} className="px-5 py-4">
                      <div className="h-5 animate-pulse rounded bg-surface-container-low" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-on-surface-variant">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container/50 transition-colors">
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
                    <td className="px-5 py-3 text-on-surface-variant">{user.email ?? "-"}</td>
                    <td className="px-5 py-3 text-on-surface-variant">{user.phone ?? "-"}</td>
                    <td className="px-5 py-3 text-center"><RoleBadge role={user.role} /></td>
                    <td className="px-5 py-3 text-center"><StatusBadge status={user.status} /></td>
                    <td className="px-5 py-3 text-center">
                      {user.isVerified ? (
                        <span className="material-symbols-outlined text-[18px] text-success">verified</span>
                      ) : (
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant/40">cancel</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-on-surface-variant text-label-sm">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-center">{user.totalTrips}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setActionUser(user); setActionType("role"); setSelectedRole(user.role); }}
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors"
                          title="Change Role"
                        >
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">admin_panel_settings</span>
                        </button>
                        <button
                          onClick={() => { setActionUser(user); setActionType("suspend"); }}
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-warning/10 transition-colors"
                          title={user.status === "SUSPENDED" ? "Activate" : "Suspend"}
                        >
                          <span className="material-symbols-outlined text-[18px] text-warning">
                            {user.status === "SUSPENDED" ? "lock_open" : "lock"}
                          </span>
                        </button>
                        <button
                          onClick={() => { setActionUser(user); setActionType("delete"); }}
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-error/10 transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[18px] text-error">delete</span>
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

      {/* Action Modal */}
      <Modal
        open={!!actionUser && !!actionType}
        onClose={() => { setActionUser(null); setActionType(null); }}
        title={
          actionType === "role"
            ? "Change User Role"
            : actionType === "suspend"
            ? actionUser?.status === "SUSPENDED" ? "Activate User" : "Suspend User"
            : "Delete User"
        }
        size="sm"
      >
        {actionType === "role" && (
          <div className="space-y-4">
            <p className="text-body-md text-on-surface-variant">
              Change role for <strong>{actionUser?.name ?? "this user"}</strong>
            </p>
            <Dropdown
              options={[
                { label: "User", value: "USER" },
                { label: "Admin", value: "ADMIN" },
                { label: "Trip Captain", value: "TRIP_CAPTAIN" },
                { label: "Support", value: "SUPPORT" },
              ]}
              value={selectedRole}
              onChange={setSelectedRole}
            />
          </div>
        )}
        {actionType === "suspend" && (
          <p className="text-body-md text-on-surface-variant">
            Are you sure you want to {actionUser?.status === "SUSPENDED" ? "activate" : "suspend"}{" "}
            <strong>{actionUser?.name ?? "this user"}</strong>?
          </p>
        )}
        {actionType === "delete" && (
          <p className="text-body-md text-on-surface-variant">
            Are you sure you want to delete <strong>{actionUser?.name ?? "this user"}</strong>?
            This action cannot be undone.
          </p>
        )}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" size="sm" onClick={() => { setActionUser(null); setActionType(null); }}>
            Cancel
          </Button>
          <Button
            variant={actionType === "delete" ? "destructive" : "primary"}
            size="sm"
            loading={processing}
            onClick={handleAction}
          >
            {actionType === "role" ? "Update Role" : actionType === "suspend" ? (actionUser?.status === "SUSPENDED" ? "Activate" : "Suspend") : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
