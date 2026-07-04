"use client";

import { useEffect, useState } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";

/* ---------- Types ---------- */

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  minOrderPaise: number;
  maxDiscountPaise: number | null;
  maxUses: number | null;
  currentUses: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
}

/* ---------- Page ---------- */

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    try {
      const res = await fetch("/api/admin/coupons");
      const json = await res.json();
      if (json.success) setCoupons(json.data ?? []);
    } catch (err) {
      console.error("Failed to load coupons", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(coupon: Coupon) {
    try {
      await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
      );
    } catch (err) {
      console.error("Failed to toggle coupon", err);
    }
  }

  async function createCoupon() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.toUpperCase(),
          description,
          discountType,
          discountValue: discountType === "PERCENTAGE" ? Number(discountValue) : Number(discountValue) * 100,
          minOrderPaise: Number(minOrder || 0) * 100,
          maxDiscountPaise: maxDiscount ? Number(maxDiscount) * 100 : null,
          maxUses: maxUses ? Number(maxUses) : null,
          validFrom: validFrom ? new Date(validFrom).toISOString() : new Date().toISOString(),
          validUntil: validUntil ? new Date(validUntil).toISOString() : null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowCreate(false);
        resetForm();
        fetchCoupons();
      } else {
        alert(json.error ?? "Failed to create coupon");
      }
    } catch (err) {
      console.error("Failed to create coupon", err);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setCode("");
    setDescription("");
    setDiscountType("PERCENTAGE");
    setDiscountValue("");
    setMinOrder("");
    setMaxDiscount("");
    setMaxUses("");
    setValidFrom("");
    setValidUntil("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Coupon Management</h1>
          <p className="text-sm text-on-surface-variant">Create and manage discount coupons</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreate(true)}
          icon={<span className="material-symbols-outlined text-[18px]">add</span>}
        >
          Create Coupon
        </Button>
      </div>

      {/* Table */}
      <Card variant="elevated" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-[#f9f9f9]">
                <th className="px-5 py-3 text-left font-medium text-on-surface-variant">Code</th>
                <th className="px-5 py-3 text-left font-medium text-on-surface-variant">Description</th>
                <th className="px-5 py-3 text-center font-medium text-on-surface-variant">Type</th>
                <th className="px-5 py-3 text-right font-medium text-on-surface-variant">Value</th>
                <th className="px-5 py-3 text-center font-medium text-on-surface-variant">Usage</th>
                <th className="px-5 py-3 text-center font-medium text-on-surface-variant">Status</th>
                <th className="px-5 py-3 text-right font-medium text-on-surface-variant">Validity</th>
                <th className="px-5 py-3 text-center font-medium text-on-surface-variant">Active</th>
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
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-on-surface-variant">No coupons found</td>
                </tr>
              ) : (
                coupons.map((coupon) => {
                  const isExpired = coupon.validUntil && new Date(coupon.validUntil) < new Date();
                  return (
                    <tr key={coupon.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-[#f9f9f9]/50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-mono font-bold text-[#ae2f34]">{coupon.code}</span>
                      </td>
                      <td className="px-5 py-3 text-on-surface-variant max-w-[200px] truncate">{coupon.description}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", coupon.discountType === "PERCENTAGE" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700")}>
                          {coupon.discountType === "PERCENTAGE" ? "%" : "Fixed"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium">
                        {coupon.discountType === "PERCENTAGE"
                          ? `${coupon.discountValue}%`
                          : formatCurrency(coupon.discountValue)}
                      </td>
                      <td className="px-5 py-3 text-center text-on-surface-variant">
                        {coupon.currentUses}/{coupon.maxUses ?? "Unlimited"}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", isExpired ? "bg-red-100 text-red-800" : coupon.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600")}>
                          {isExpired ? "Expired" : coupon.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-on-surface-variant text-xs">
                        {coupon.validUntil ? `Until ${formatDate(coupon.validUntil)}` : "No expiry"}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Switch
                          checked={coupon.isActive}
                          onChange={() => toggleActive(coupon)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Coupon Modal */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); resetForm(); }}
        title="Create Coupon"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Coupon Code"
              placeholder="e.g. SUMMER25"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              fullWidth
            />
            <Dropdown
              label="Discount Type"
              options={[
                { label: "Percentage", value: "PERCENTAGE" },
                { label: "Fixed Amount", value: "FIXED" },
              ]}
              value={discountType}
              onChange={setDiscountType}
            />
          </div>
          <Input
            label="Description"
            placeholder="Coupon description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label={discountType === "PERCENTAGE" ? "Discount (%)" : "Discount (₹)"}
              type="number"
              placeholder={discountType === "PERCENTAGE" ? "25" : "500"}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              fullWidth
            />
            <Input
              label="Min Order (₹)"
              type="number"
              placeholder="1000"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              fullWidth
            />
            <Input
              label="Max Discount (₹)"
              type="number"
              placeholder="Optional"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              fullWidth
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Max Uses"
              type="number"
              placeholder="Unlimited"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              fullWidth
            />
            <Input
              label="Valid From"
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              fullWidth
            />
            <Input
              label="Valid Until"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              fullWidth
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-5">
          <Button variant="ghost" size="sm" onClick={() => { setShowCreate(false); resetForm(); }}>
            Cancel
          </Button>
          <Button size="sm" loading={saving} onClick={createCoupon}>
            Create Coupon
          </Button>
        </div>
      </Modal>
    </div>
  );
}
