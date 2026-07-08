"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";

/* ---------- Types ---------- */

interface PickupCity {
  id: string;
  name: string;
  state: string | null;
  icon: string | null;
  isActive: boolean;
  order: number;
  pickupPoints?: PickupPoint[];
}

interface PickupPoint {
  id: string;
  cityId: string;
  name: string;
  address: string;
  icon: string | null;
  landmark: string | null;
  isActive: boolean;
  order: number;
  city?: PickupCity;
}

/* ---------- Page ---------- */

export default function AdminPickupPointsPage() {
  const [tab, setTab] = useState<"cities" | "points">("cities");
  const [cities, setCities] = useState<PickupCity[]>([]);
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [filterCityId, setFilterCityId] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PickupCity | PickupPoint | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields — city
  const [formName, setFormName] = useState("");
  const [formState, setFormState] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formOrder, setFormOrder] = useState("0");

  // Form fields — point
  const [formCityId, setFormCityId] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formLandmark, setFormLandmark] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/admin/pickup-points");
      const json = await res.json();
      if (json.success) {
        setCities(json.data?.cities ?? []);
        setPoints(json.data?.points ?? []);
      }
    } catch (err) {
      console.error("Failed to load pickup points", err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormName("");
    setFormState("");
    setFormIcon("");
    setFormOrder("0");
    setFormCityId("");
    setFormAddress("");
    setFormLandmark("");
    setEditingItem(null);
  }

  function openCreate() {
    resetForm();
    if (tab === "points" && cities.length > 0) {
      setFormCityId(filterCityId || cities[0].id);
    }
    setShowModal(true);
  }

  function openEdit(item: PickupCity | PickupPoint) {
    setEditingItem(item);
    setFormName(item.name);
    setFormIcon(item.icon ?? "");
    setFormOrder(String(item.order));

    if ("state" in item && !("address" in item)) {
      // City
      setFormState((item as PickupCity).state ?? "");
    } else {
      // Point
      const point = item as PickupPoint;
      setFormCityId(point.cityId);
      setFormAddress(point.address);
      setFormLandmark(point.landmark ?? "");
    }
    setShowModal(true);
  }

  function isCity(item: PickupCity | PickupPoint | null): item is PickupCity {
    return item !== null && !("address" in item);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editingItem) {
        const body: Record<string, unknown> = { name: formName, icon: formIcon || null, order: Number(formOrder) || 0 };
        if (tab === "cities" || isCity(editingItem)) {
          body.state = formState || null;
        } else {
          body.cityId = formCityId;
          body.address = formAddress;
          body.landmark = formLandmark || null;
        }

        const res = await fetch(`/api/admin/pickup-points/${editingItem.id}`, {
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
        const body: Record<string, unknown> = {
          type: tab === "cities" ? "city" : "point",
          name: formName,
          icon: formIcon || null,
          order: Number(formOrder) || 0,
        };
        if (tab === "cities") {
          body.state = formState || null;
        } else {
          body.cityId = formCityId;
          body.address = formAddress;
          body.landmark = formLandmark || null;
        }

        const res = await fetch("/api/admin/pickup-points", {
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
      fetchData();
    } catch (err) {
      console.error("Save error", err);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: PickupCity | PickupPoint) {
    try {
      await fetch(`/api/admin/pickup-points/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if ("address" in item) {
        setPoints((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, isActive: !p.isActive } : p))
        );
      } else {
        setCities((prev) =>
          prev.map((c) => (c.id === item.id ? { ...c, isActive: !c.isActive } : c))
        );
      }
    } catch (err) {
      console.error("Toggle error", err);
    }
  }

  async function handleDelete(item: PickupCity | PickupPoint) {
    if (!confirm(`Delete "${item.name}"? If trips reference it, it will be deactivated instead.`)) return;
    try {
      const res = await fetch(`/api/admin/pickup-points/${item.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchData();
      } else {
        alert(json.error ?? "Failed to delete");
      }
    } catch (err) {
      console.error("Delete error", err);
    }
  }

  const filteredPoints = filterCityId
    ? points.filter((p) => p.cityId === filterCityId)
    : points;

  const editingIsCity = editingItem ? isCity(editingItem) : tab === "cities";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-headline-md font-headline-md text-on-surface">Pickup Points</h1>
          <p className="text-body-md text-on-surface-variant">
            Manage pickup cities and boarding locations. Assign them to trips individually.
          </p>
        </div>
        <Button
          size="sm"
          onClick={openCreate}
          icon={<span className="material-symbols-outlined text-[18px]">add</span>}
        >
          {tab === "cities" ? "Create City" : "Create Point"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-surface-container p-1 w-fit">
        <button
          onClick={() => setTab("cities")}
          className={cn(
            "px-4 py-2 rounded-lg text-label-lg font-label-lg transition-colors",
            tab === "cities"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container-high"
          )}
        >
          Cities ({cities.length})
        </button>
        <button
          onClick={() => setTab("points")}
          className={cn(
            "px-4 py-2 rounded-lg text-label-lg font-label-lg transition-colors",
            tab === "points"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container-high"
          )}
        >
          Points ({points.length})
        </button>
      </div>

      {/* City filter for points tab */}
      {tab === "points" && cities.length > 0 && (
        <div className="w-64">
          <Dropdown
            label="Filter by City"
            options={[
              { label: "All Cities", value: "" },
              ...cities.map((c) => ({ label: c.name, value: c.id })),
            ]}
            value={filterCityId}
            onChange={setFilterCityId}
          />
        </div>
      )}

      {/* Table */}
      <Card variant="elevated" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container">
                <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">Name</th>
                {tab === "cities" ? (
                  <>
                    <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">State</th>
                    <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Icon</th>
                    <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Points</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">City</th>
                    <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">Address</th>
                    <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Icon</th>
                    <th className="px-4 py-3 text-left font-label-lg text-on-surface-variant">Landmark</th>
                  </>
                )}
                <th className="px-4 py-3 text-center font-label-lg text-on-surface-variant">Order</th>
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
              ) : tab === "cities" ? (
                cities.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-on-surface-variant">No cities yet</td></tr>
                ) : (
                  cities.map((city) => (
                    <tr key={city.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-on-surface">{city.name}</td>
                      <td className="px-5 py-3 text-on-surface-variant">{city.state ?? "—"}</td>
                      <td className="px-5 py-3 text-center text-on-surface-variant">
                        {city.icon ? <span className="material-symbols-outlined text-[18px]">{city.icon}</span> : "—"}
                      </td>
                      <td className="px-5 py-3 text-center">{city.pickupPoints?.length ?? 0}</td>
                      <td className="px-5 py-3 text-center">{city.order}</td>
                      <td className="px-5 py-3 text-center">
                        <Switch checked={city.isActive} onChange={() => toggleActive(city)} />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(city)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">edit</span>
                          </button>
                          <button onClick={() => handleDelete(city)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-error/10 transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-error">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                filteredPoints.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-on-surface-variant">No pickup points yet</td></tr>
                ) : (
                  filteredPoints.map((point) => (
                    <tr key={point.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-on-surface">{point.name}</td>
                      <td className="px-5 py-3 text-on-surface-variant">{point.city?.name ?? "—"}</td>
                      <td className="px-5 py-3 text-on-surface-variant">{point.address}</td>
                      <td className="px-5 py-3 text-center text-on-surface-variant">
                        {point.icon ? <span className="material-symbols-outlined text-[18px]">{point.icon}</span> : "—"}
                      </td>
                      <td className="px-5 py-3 text-on-surface-variant">{point.landmark ?? "—"}</td>
                      <td className="px-5 py-3 text-center">{point.order}</td>
                      <td className="px-5 py-3 text-center">
                        <Switch checked={point.isActive} onChange={() => toggleActive(point)} />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setTab("points"); openEdit(point); }} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">edit</span>
                          </button>
                          <button onClick={() => handleDelete(point)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-error/10 transition-colors">
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
        title={editingItem ? `Edit ${editingIsCity ? "City" : "Point"}` : `Create ${tab === "cities" ? "City" : "Point"}`}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder={editingIsCity || tab === "cities" ? "e.g. Bengaluru" : "e.g. Majestic Bus Stand"}
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            fullWidth
          />

          {(editingIsCity || (!editingItem && tab === "cities")) ? (
            <>
              <Input
                label="State"
                placeholder="e.g. Karnataka"
                value={formState}
                onChange={(e) => setFormState(e.target.value)}
                fullWidth
              />
            </>
          ) : (
            <>
              <Dropdown
                label="City"
                options={cities.map((c) => ({ label: c.name, value: c.id }))}
                value={formCityId}
                onChange={setFormCityId}
              />
              <Input
                label="Address"
                placeholder="e.g. Kempegowda Bus Station, Bangalore"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                fullWidth
              />
              <Input
                label="Landmark (optional)"
                placeholder="e.g. Near metro station"
                value={formLandmark}
                onChange={(e) => setFormLandmark(e.target.value)}
                fullWidth
              />
            </>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Icon (Material Symbol)"
              placeholder="e.g. location_city"
              value={formIcon}
              onChange={(e) => setFormIcon(e.target.value)}
              fullWidth
            />
            <Input
              label="Sort Order"
              type="number"
              placeholder="0"
              value={formOrder}
              onChange={(e) => setFormOrder(e.target.value)}
              fullWidth
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-5">
          <Button variant="ghost" size="sm" onClick={() => { setShowModal(false); resetForm(); }}>
            Cancel
          </Button>
          <Button size="sm" loading={saving} onClick={handleSave}>
            {editingItem ? "Save Changes" : `Create ${tab === "cities" ? "City" : "Point"}`}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
