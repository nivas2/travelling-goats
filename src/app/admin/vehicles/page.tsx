"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

interface VehicleTemplate {
  id: string;
  name: string;
  totalSeats: number;
  status: string;
  registrationNumber: string | null;
  createdAt: string;
  vehicleType: { id: string; name: string; icon: string | null };
  _count: { seats: number; trips: number };
}

export default function VehiclesPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [templates, setTemplates] = useState<VehicleTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/vehicles");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setTemplates(json.data?.templates ?? []);
    } catch {
      toastError("Failed to load vehicle templates");
    } finally {
      setLoading(false);
    }
  }

  async function handleClone(id: string) {
    try {
      const res = await fetch(`/api/admin/vehicles/${id}/clone`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to clone");
      toastSuccess("Template cloned successfully");
      fetchTemplates();
    } catch {
      toastError("Failed to clone template");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`/api/admin/vehicles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to delete");
      }
      toastSuccess("Template deleted");
      fetchTemplates();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to delete template");
    }
  }

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-success/10 text-success",
    INACTIVE: "bg-on-surface-variant/10 text-on-surface-variant",
    MAINTENANCE: "bg-warning/10 text-warning",
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton height={48} />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={72} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-headline-md text-on-surface">
            Vehicle Templates
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Manage vehicle layouts and seat configurations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/admin/vehicles/types")}
            icon={<span className="material-symbols-outlined text-[18px]">category</span>}
          >
            Vehicle Types
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/admin/vehicles/new")}
            icon={<span className="material-symbols-outlined text-[18px]">add</span>}
          >
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Table */}
      {templates.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 py-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40">
            directions_bus
          </span>
          <div>
            <p className="text-title-md font-title-md text-on-surface">
              No vehicle templates yet
            </p>
            <p className="text-body-md text-on-surface-variant mt-1">
              Create your first vehicle template to get started
            </p>
          </div>
          <Button onClick={() => router.push("/admin/vehicles/new")}>
            Create Template
          </Button>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant/15">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container-low">
                <th className="px-4 py-3 text-label-lg font-label-lg text-on-surface-variant">
                  Name
                </th>
                <th className="px-4 py-3 text-label-lg font-label-lg text-on-surface-variant">
                  Type
                </th>
                <th className="px-4 py-3 text-label-lg font-label-lg text-on-surface-variant text-center">
                  Seats
                </th>
                <th className="px-4 py-3 text-label-lg font-label-lg text-on-surface-variant text-center">
                  Status
                </th>
                <th className="px-4 py-3 text-label-lg font-label-lg text-on-surface-variant text-center">
                  Trips
                </th>
                <th className="px-4 py-3 text-label-lg font-label-lg text-on-surface-variant text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-outline-variant/5 hover:bg-surface-container-low/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-body-md font-medium text-on-surface">
                        {t.name}
                      </p>
                      {t.registrationNumber && (
                        <p className="text-label-sm text-on-surface-variant">
                          {t.registrationNumber}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {t.vehicleType.icon && (
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                          {t.vehicleType.icon}
                        </span>
                      )}
                      <span className="text-body-md text-on-surface">
                        {t.vehicleType.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-body-md text-on-surface">{t.totalSeats}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2.5 py-0.5 text-label-sm font-label-sm",
                        statusColor[t.status] ?? "bg-surface-container text-on-surface-variant"
                      )}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-body-md text-on-surface">
                      {t._count.trips}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`/admin/vehicles/${t.id}/edit`)}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                          edit
                        </span>
                      </button>
                      <button
                        onClick={() => handleClone(t.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container"
                        title="Clone"
                      >
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                          content_copy
                        </span>
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-error/10"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[18px] text-error">
                          delete
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
