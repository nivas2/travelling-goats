"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

interface VehicleType {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  isActive: boolean;
  _count: { templates: number };
}

export default function VehicleTypesPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [types, setTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state for creating/editing
  const [formName, setFormName] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTypes();
  }, []);

  async function fetchTypes() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/vehicle-types?includeInactive=true");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setTypes(json.data ?? []);
    } catch {
      toastError("Failed to load vehicle types");
    } finally {
      setLoading(false);
    }
  }

  function startEditing(type: VehicleType) {
    setEditingId(type.id);
    setFormName(type.name);
    setFormIcon(type.icon ?? "");
    setFormDescription(type.description ?? "");
  }

  function resetForm() {
    setEditingId(null);
    setFormName("");
    setFormIcon("");
    setFormDescription("");
  }

  async function handleSave() {
    if (!formName.trim()) {
      toastError("Name is required");
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: formName.trim(),
        icon: formIcon.trim() || undefined,
        description: formDescription.trim() || undefined,
      };

      const isEdit = editingId !== null;
      const url = isEdit
        ? `/api/admin/vehicle-types/${editingId}`
        : "/api/admin/vehicle-types";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to save");
      }

      toastSuccess(isEdit ? "Vehicle type updated" : "Vehicle type created");
      resetForm();
      fetchTypes();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(type: VehicleType) {
    try {
      const res = await fetch(`/api/admin/vehicle-types/${type.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !type.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toastSuccess(`Vehicle type ${type.isActive ? "deactivated" : "activated"}`);
      fetchTypes();
    } catch {
      toastError("Failed to update vehicle type");
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton height={48} />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={64} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-headline-md text-on-surface">
          Vehicle Types
        </h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Manage vehicle categories (Bus, Traveller, SUV, etc.)
        </p>
      </div>

      {/* Add/Edit Form */}
      <Card variant="outlined" className="p-5 space-y-4">
        <h3 className="text-title-md font-title-md text-on-surface">
          {editingId ? "Edit Vehicle Type" : "Add Vehicle Type"}
        </h3>
        <Input
          label="Name"
          placeholder="e.g. Bus, Traveller, SUV"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Icon (Material Symbol)"
            placeholder="e.g. directions_bus"
            value={formIcon}
            onChange={(e) => setFormIcon(e.target.value)}
          />
          <Input
            label="Description"
            placeholder="Optional description"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
          />
        </div>
        {formIcon && (
          <div className="flex items-center gap-2">
            <span className="text-label-sm text-on-surface-variant">Preview:</span>
            <span className="material-symbols-outlined text-[24px] text-primary">
              {formIcon}
            </span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleSave} loading={saving}>
            {editingId ? "Update" : "Create"}
          </Button>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      {/* List */}
      <div className="space-y-2">
        {types.map((type) => (
          <Card
            key={type.id}
            variant="outlined"
            className={cn(
              "flex items-center justify-between",
              !type.isActive && "opacity-50"
            )}
          >
            <div className="flex items-center gap-3">
              {type.icon && (
                <span className="material-symbols-outlined text-[24px] text-primary">
                  {type.icon}
                </span>
              )}
              <div>
                <p className="text-title-md font-title-md text-on-surface">
                  {type.name}
                </p>
                {type.description && (
                  <p className="text-body-sm text-on-surface-variant">
                    {type.description}
                  </p>
                )}
                <p className="text-label-sm text-on-surface-variant">
                  {type._count.templates} template{type._count.templates !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => startEditing(type)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container"
                title="Edit"
              >
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                  edit
                </span>
              </button>
              <button
                onClick={() => handleToggleActive(type)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container"
                title={type.isActive ? "Deactivate" : "Activate"}
              >
                <span
                  className={cn(
                    "material-symbols-outlined text-[18px]",
                    type.isActive ? "text-error" : "text-success"
                  )}
                >
                  {type.isActive ? "toggle_off" : "toggle_on"}
                </span>
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
