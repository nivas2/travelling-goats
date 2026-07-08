"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";

interface SettingRow {
  key: string;
  value: string;
  group: string;
  label: string | null;
}

export default function AdminSettingsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Razorpay settings
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");
  const [razorpayMode, setRazorpayMode] = useState<"test" | "live">("test");

  // Wallet settings
  const [minTopup, setMinTopup] = useState("100");
  const [maxTopup, setMaxTopup] = useState("10000");
  const [presets, setPresets] = useState("100,500,1000,2000");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const map = new Map<string, string>();
          json.data.forEach((s: SettingRow) => map.set(s.key, s.value));

          if (map.has("razorpay_key_id")) setRazorpayKeyId(map.get("razorpay_key_id")!);
          if (map.has("razorpay_key_secret")) setRazorpayKeySecret(map.get("razorpay_key_secret")!);
          if (map.has("razorpay_mode")) setRazorpayMode(map.get("razorpay_mode") as "test" | "live");

          if (map.has("wallet_topup_min_paise")) {
            setMinTopup(String(Number(map.get("wallet_topup_min_paise")!) / 100));
          }
          if (map.has("wallet_topup_max_paise")) {
            setMaxTopup(String(Number(map.get("wallet_topup_max_paise")!) / 100));
          }
          if (map.has("wallet_topup_presets_paise")) {
            try {
              const arr = JSON.parse(map.get("wallet_topup_presets_paise")!) as number[];
              setPresets(arr.map((p) => p / 100).join(","));
            } catch { /* use default */ }
          }
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const presetsPaise = presets
        .split(",")
        .map((s) => Math.round(Number(s.trim()) * 100))
        .filter((n) => n > 0);

      const settings = [
        { key: "razorpay_key_id", value: razorpayKeyId, group: "razorpay", label: "Razorpay Key ID" },
        { key: "razorpay_key_secret", value: razorpayKeySecret, group: "razorpay", label: "Razorpay Key Secret" },
        { key: "razorpay_mode", value: razorpayMode, group: "razorpay", label: "Razorpay Mode" },
        { key: "wallet_topup_min_paise", value: String(Math.round(Number(minTopup) * 100)), group: "wallet", label: "Min Top-up (paise)" },
        { key: "wallet_topup_max_paise", value: String(Math.round(Number(maxTopup) * 100)), group: "wallet", label: "Max Top-up (paise)" },
        { key: "wallet_topup_presets_paise", value: JSON.stringify(presetsPaise), group: "wallet", label: "Top-up Presets (paise)" },
      ];

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const json = await res.json();
      if (json.success) {
        toastSuccess("Settings saved");
      } else {
        toastError(json.error ?? "Failed to save");
      }
    } catch {
      toastError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-headline-md font-headline-md text-on-surface">Settings</h1>
          <p className="text-body-md text-on-surface-variant">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-headline-md text-on-surface">Settings</h1>
        <p className="text-body-md text-on-surface-variant">
          Configure payment gateway and wallet settings
        </p>
      </div>

      {/* Razorpay Config */}
      <Card variant="elevated" className="space-y-5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[22px] text-primary">credit_card</span>
          <h2 className="text-title-lg font-title-lg text-on-surface">Razorpay Configuration</h2>
        </div>

        <Input
          label="Key ID"
          placeholder="rzp_test_..."
          value={razorpayKeyId}
          onChange={(e) => setRazorpayKeyId(e.target.value)}
        />

        <Input
          label="Key Secret"
          type="password"
          placeholder={razorpayKeySecret ? undefined : "Enter secret key"}
          value={razorpayKeySecret}
          onChange={(e) => setRazorpayKeySecret(e.target.value)}
        />

        <div className="flex items-center justify-between rounded-xl border border-outline-variant/20 px-4 py-3">
          <div>
            <p className="text-title-md font-title-md text-on-surface">Live Mode</p>
            <p className="text-body-sm text-on-surface-variant">
              {razorpayMode === "live"
                ? "Processing real payments"
                : "Using test/sandbox mode"}
            </p>
          </div>
          <Switch
            checked={razorpayMode === "live"}
            onChange={(checked) => setRazorpayMode(checked ? "live" : "test")}
          />
        </div>
      </Card>

      {/* Wallet Settings */}
      <Card variant="elevated" className="space-y-5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[22px] text-primary">account_balance_wallet</span>
          <h2 className="text-title-lg font-title-lg text-on-surface">Wallet Top-up Limits</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Minimum Top-up (₹)"
            type="number"
            value={minTopup}
            onChange={(e) => setMinTopup(e.target.value)}
          />
          <Input
            label="Maximum Top-up (₹)"
            type="number"
            value={maxTopup}
            onChange={(e) => setMaxTopup(e.target.value)}
          />
        </div>

        <Input
          label="Preset Amounts (₹, comma-separated)"
          placeholder="100,500,1000,2000"
          value={presets}
          onChange={(e) => setPresets(e.target.value)}
        />
        <p className="text-label-sm text-on-surface-variant">
          These amounts appear as quick-add chips on the wallet page
        </p>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button loading={saving} onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
