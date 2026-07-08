"use client";

import { useEffect, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ui/image-upload";
import { useSortable } from "@/hooks/use-sortable";
import { SortHeader } from "@/components/admin/sort-header";
import { AdminTableToolbar } from "@/components/admin/admin-table-toolbar";
import { downloadCSV } from "@/lib/csv";

/* ---------- Types ---------- */

interface GlobalAddOn {
  id: string;
  name: string;
  description: string | null;
  pricePaise: number;
  icon: string | null;
  image: string | null;
  maxQuantity: number;
  isPopular: boolean;
  isActive: boolean;
}

interface GlobalSnack {
  id: string;
  name: string;
  description: string | null;
  pricePaise: number;
  category: string | null;
  icon: string | null;
  image: string | null;
  isVeg: boolean;
  isActive: boolean;
}

/* ---------- Page ---------- */

export default function AdminAddonsPage() {
  const [tab, setTab] = useState<"addons" | "snacks">("addons");
  const [addOns, setAddOns] = useState<GlobalAddOn[]>([]);
  const [snacks, setSnacks] = useState<GlobalSnack[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GlobalAddOn | GlobalSnack | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formImage, setFormImage] = useState("");
  // Add-on specific
  const [formMaxQuantity, setFormMaxQuantity] = useState("1");
  const [formIsPopular, setFormIsPopular] = useState(false);
  // Snack specific
  const [formCategory, setFormCategory] = useState("veg");

  useEffect(() => {
    fetchCatalog();
  }, []);

  async function fetchCatalog() {
    try {
      const res = await fetch("/api/admin/addons");
      const json = await res.json();
      if (json.success) {
        setAddOns(json.data?.addOns ?? []);
        setSnacks(json.data?.snacks ?? []);
      }
    } catch (err) {
      console.error("Failed to load catalog", err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormIcon("");
    setFormImage("");
    setFormMaxQuantity("1");
    setFormIsPopular(false);
    setFormCategory("veg");
    setEditingItem(null);
  }

  function openCreate() {
    resetForm();
    setShowModal(true);
  }

  function openEdit(item: GlobalAddOn | GlobalSnack) {
    setEditingItem(item);
    setFormName(item.name);
    setFormDescription(item.description ?? "");
    setFormPrice(String(item.pricePaise / 100));
    setFormIcon(item.icon ?? "");
    setFormImage(item.image ?? "");
    if ("maxQuantity" in item) {
      setFormMaxQuantity(String(item.maxQuantity));
      setFormIsPopular(item.isPopular);
    }
    if ("isVeg" in item) {
      setFormCategory(item.isVeg ? "veg" : "non-veg");
    }
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const pricePaise = Math.round(Number(formPrice) * 100);

      if (editingItem) {
        // Update
        const body: Record<string, unknown> = {
          name: formName,
          description: formDescription || null,
          pricePaise,
          icon: formIcon || null,
          image: formImage || null,
        };
        if (tab === "addons") {
          body.maxQuantity = Number(formMaxQuantity) || 1;
          body.isPopular = formIsPopular;
        } else {
          body.category = formCategory;
          body.isVeg = formCategory === "veg";
        }

        const res = await fetch(`/api/admin/addons/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!json.success) {
          alert(json.error ?? "Failed to update");
          return;
        }
      } else {
        // Create
        const body: Record<string, unknown> = {
          type: tab === "addons" ? "addon" : "snack",
          name: formName,
          description: formDescription || null,
          pricePaise,
          icon: formIcon || null,
          image: formImage || null,
        };
        if (tab === "addons") {
          body.maxQuantity = Number(formMaxQuantity) || 1;
          body.isPopular = formIsPopular;
        } else {
          body.category = formCategory;
          body.isVeg = formCategory === "veg";
        }

        const res = await fetch("/api/admin/addons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!json.success) {
          alert(json.error ?? "Failed to create");
          return;
        }
      }

      setShowModal(false);
      resetForm();
      fetchCatalog();
    } catch (err) {
      console.error("Save error", err);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: GlobalAddOn | GlobalSnack) {
    try {
      await fetch(`/api/admin/addons/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      // Optimistic update
      if ("maxQuantity" in item) {
        setAddOns((prev) =>
          prev.map((a) => (a.id === item.id ? { ...a, isActive: !a.isActive } : a))
        );
      } else {
        setSnacks((prev) =>
          prev.map((s) => (s.id === item.id ? { ...s, isActive: !s.isActive } : s))
        );
      }
    } catch (err) {
      console.error("Toggle error", err);
    }
  }

  async function handleDelete(item: GlobalAddOn | GlobalSnack) {
    if (!confirm(`Delete "${item.name}"? If bookings reference it, it will be deactivated instead.`)) return;
    try {
      const res = await fetch(`/api/admin/addons/${item.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchCatalog();
      } else {
        alert(json.error ?? "Failed to delete");
      }
    } catch (err) {
      console.error("Delete error", err);
    }
  }

  const activeItems: (GlobalAddOn | GlobalSnack)[] = tab === "addons" ? addOns : snacks;
  const { sortedData, sortConfig, requestSort } = useSortable({ data: activeItems });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-headline-md font-headline-md text-on-surface">Add-ons & Snacks Catalog</h1>
          <p className="text-body-md text-on-surface-variant">
            Manage global add-ons and snacks. Assign them to trips individually.
          </p>
        </div>
        <Button
          size="sm"
          onClick={openCreate}
          icon={<span className="material-symbols-outlined text-[18px]">add</span>}
        >
          {tab === "addons" ? "Create Add-on" : "Create Snack"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-surface-container p-1 w-fit">
        <button
          onClick={() => setTab("addons")}
          className={cn(
            "px-4 py-2 rounded-lg text-label-lg font-label-lg transition-colors",
            tab === "addons"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container-high"
          )}
        >
          Add-ons ({addOns.length})
        </button>
        <button
          onClick={() => setTab("snacks")}
          className={cn(
            "px-4 py-2 rounded-lg text-label-lg font-label-lg transition-colors",
            tab === "snacks"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container-high"
          )}
        >
          Snacks ({snacks.length})
        </button>
      </div>

      {/* Toolbar */}
      <AdminTableToolbar
        onExportCSV={() =>
          downloadCSV(sortedData, [
            { header: "Name", accessor: "name" },
            { header: "Price", accessor: (item: GlobalAddOn | GlobalSnack) => (item.pricePaise / 100).toFixed(2) },
            { header: "Active", accessor: (item: GlobalAddOn | GlobalSnack) => item.isActive ? "Yes" : "No" },
          ], `${tab}-${new Date().toISOString().slice(0, 10)}.csv`)
        }
        csvDisabled={sortedData.length === 0}
      />

      {/* Table */}
      <Card variant="elevated" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container">
                <SortHeader label="Name" sortKey="name" sortConfig={sortConfig} onSort={requestSort} className="text-left" />
                <SortHeader label="Price" sortKey="pricePaise" sortConfig={sortConfig} onSort={requestSort} className="text-right" />
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Icon</th>
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Image</th>
                {tab === "addons" && (
                  <>
                    <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Max Qty</th>
                    <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Popular</th>
                  </>
                )}
                {tab === "snacks" && (
                  <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Type</th>
                )}
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Active</th>
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/10">
                    <td colSpan={8} className="px-5 py-4">
                      <div className="h-5 animate-pulse rounded bg-surface-container-low" />
                    </td>
                  </tr>
                ))
              ) : tab === "addons" ? (
                (sortedData as GlobalAddOn[]).length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-on-surface-variant">No add-ons yet</td></tr>
                ) : (
                  (sortedData as GlobalAddOn[]).map((addon) => (
                    <tr key={addon.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-on-surface">{addon.name}</td>
                      <td className="px-5 py-3 text-right">{formatCurrency(addon.pricePaise)}</td>
                      <td className="px-5 py-3 text-center text-on-surface-variant">
                        {addon.icon ? <span className="material-symbols-outlined text-[18px]">{addon.icon}</span> : "—"}
                      </td>
                      <td className="px-5 py-3 text-center text-on-surface-variant">
                        {addon.image ? <span className="text-label-sm text-primary">Yes</span> : "—"}
                      </td>
                      <td className="px-5 py-3 text-center">{addon.maxQuantity}</td>
                      <td className="px-5 py-3 text-center">
                        {addon.isPopular && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-label-sm text-primary">Popular</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Switch checked={addon.isActive} onChange={() => toggleActive(addon)} />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(addon)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">edit</span>
                          </button>
                          <button onClick={() => handleDelete(addon)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-error/10 transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-error">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                (sortedData as GlobalSnack[]).length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-on-surface-variant">No snacks yet</td></tr>
                ) : (
                  (sortedData as GlobalSnack[]).map((snack) => (
                    <tr key={snack.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-on-surface">{snack.name}</td>
                      <td className="px-5 py-3 text-right">{formatCurrency(snack.pricePaise)}</td>
                      <td className="px-5 py-3 text-center text-on-surface-variant">
                        {snack.icon ? <span className="material-symbols-outlined text-[18px]">{snack.icon}</span> : "—"}
                      </td>
                      <td className="px-5 py-3 text-center text-on-surface-variant">
                        {snack.image ? <span className="text-label-sm text-primary">Yes</span> : "—"}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-label-sm", snack.isVeg ? "bg-success/10 text-success" : "bg-error/10 text-error")}>
                          <span className={cn("inline-block h-2 w-2 rounded-sm", snack.isVeg ? "bg-success" : "bg-error")} />
                          {snack.isVeg ? "Veg" : "Non-Veg"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Switch checked={snack.isActive} onChange={() => toggleActive(snack)} />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setTab("snacks"); openEdit(snack); }} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">edit</span>
                          </button>
                          <button onClick={() => handleDelete(snack)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-error/10 transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-error">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingItem ? `Edit ${tab === "addons" ? "Add-on" : "Snack"}` : `Create ${tab === "addons" ? "Add-on" : "Snack"}`}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder={tab === "addons" ? "e.g. Bonfire Night" : "e.g. Veg Biryani"}
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            fullWidth
          />
          <Input
            label="Description"
            placeholder="Optional description"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            fullWidth
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Price (₹)"
              type="number"
              placeholder="199"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              fullWidth
            />
            <Input
              label="Icon (Material Symbol)"
              placeholder="e.g. local_fire_department"
              value={formIcon}
              onChange={(e) => setFormIcon(e.target.value)}
              fullWidth
            />
          </div>
          <ImageUpload label="Image" value={formImage} onChange={setFormImage} recommend="Square ~400×400px" />
          <Input
            label="...or paste image URL"
            placeholder="https://..."
            value={formImage}
            onChange={(e) => setFormImage(e.target.value)}
            fullWidth
          />

          {tab === "addons" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Max Quantity"
                type="number"
                placeholder="1"
                value={formMaxQuantity}
                onChange={(e) => setFormMaxQuantity(e.target.value)}
                fullWidth
              />
              <div className="flex items-end pb-1">
                <Switch
                  label="Mark as Popular"
                  checked={formIsPopular}
                  onChange={setFormIsPopular}
                />
              </div>
            </div>
          )}

          {tab === "snacks" && (
            <Dropdown
              label="Category"
              options={[
                { label: "Veg", value: "veg" },
                { label: "Non-Veg", value: "non-veg" },
              ]}
              value={formCategory}
              onChange={setFormCategory}
            />
          )}
        </div>
        <div className="flex justify-end gap-3 pt-5">
          <Button variant="ghost" size="sm" onClick={() => { setShowModal(false); resetForm(); }}>
            Cancel
          </Button>
          <Button size="sm" loading={saving} onClick={handleSave}>
            {editingItem ? "Save Changes" : `Create ${tab === "addons" ? "Add-on" : "Snack"}`}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
