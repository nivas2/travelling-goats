"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  THEME_TOKENS,
  THEME_PRESETS,
  themeToCss,
  defaultThemeValues,
  type ThemeToken,
  type ThemeValues,
} from "@/lib/theme/registry";

function ColorField({
  token,
  value,
  onChange,
  onReset,
  isDefault,
}: {
  token: ThemeToken;
  value: string;
  onChange: (v: string) => void;
  onReset: () => void;
  isDefault: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="relative h-10 w-12 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-outline-variant">
        <span className="block h-full w-full" style={{ backgroundColor: value }} />
        <input
          type="color"
          value={/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <div className="min-w-0 flex-1">
        <p className="text-label-md font-semibold text-on-surface">{token.label}</p>
        {token.hint && <p className="text-label-sm text-on-surface-variant">{token.hint}</p>}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-28 rounded-lg border border-outline-variant bg-surface-container-low px-2 py-1.5 text-label-md text-on-surface outline-none focus:border-primary"
      />
      {!isDefault && (
        <button onClick={onReset} title="Reset" className="text-on-surface-variant hover:text-primary">
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
        </button>
      )}
    </div>
  );
}

function SelectField({
  token,
  value,
  onChange,
}: {
  token: ThemeToken;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-label-md font-semibold text-on-surface">{token.label}</p>
        {token.hint && <p className="text-label-sm text-on-surface-variant">{token.hint}</p>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[240px] rounded-lg border border-outline-variant bg-surface-container-low px-2 py-1.5 text-label-md text-on-surface outline-none focus:border-primary"
      >
        {token.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function AdminThemePage() {
  const [values, setValues] = useState<ThemeValues>(defaultThemeValues());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/theme");
        const json = await res.json();
        if (json.success) setValues({ ...defaultThemeValues(), ...json.data });
      } catch {
        /* keep defaults */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const groups = useMemo(() => {
    const g: Record<string, ThemeToken[]> = {};
    for (const t of THEME_TOKENS) (g[t.group] ??= []).push(t);
    return g;
  }, []);

  const defaults = useMemo(() => defaultThemeValues(), []);
  const set = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  async function save() {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const json = await res.json();
      setStatus(json.success ? "saved" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setStatus("idle"), 2500);
    }
  }

  const dirty = JSON.stringify(values) !== JSON.stringify(defaults);

  return (
    <div className="space-y-6">
      {/* Live preview — applies the current (unsaved) theme app-wide */}
      <style dangerouslySetInnerHTML={{ __html: themeToCss(values) }} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md font-headline-md text-on-surface">Theme</h1>
          <p className="text-body-md text-on-surface-variant">
            Colors, typography &amp; shape for the whole app. Changes preview live; Save to publish.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status === "saved" && <span className="text-label-md text-success">Saved ✓</span>}
          {status === "error" && <span className="text-label-md text-error">Save failed</span>}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setValues(defaultThemeValues())}
            disabled={!dirty}
          >
            Reset all
          </Button>
          <Button size="sm" loading={saving} onClick={save}>
            Save &amp; Publish
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface-container-low" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Quick palettes */}
            <Card variant="elevated" className="p-5">
              <h2 className="mb-1 text-title-md font-title-md text-on-surface">Quick Palettes</h2>
              <p className="mb-4 text-label-sm text-on-surface-variant">
                Apply a curated colour set, then fine-tune below.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {THEME_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setValues((prev) => ({ ...prev, ...p.values }))}
                    className="group flex items-center gap-2.5 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-left transition-colors hover:border-primary"
                  >
                    <span className="flex -space-x-1">
                      <span
                        className="h-6 w-6 rounded-full ring-2 ring-surface"
                        style={{ backgroundColor: p.values.primary }}
                      />
                      <span
                        className="h-6 w-6 rounded-full ring-2 ring-surface"
                        style={{ backgroundColor: p.values.accent }}
                      />
                      <span
                        className="h-6 w-6 rounded-full ring-2 ring-surface"
                        style={{ backgroundColor: p.values.secondary }}
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-label-md font-semibold text-on-surface">{p.name}</span>
                      {p.hint && (
                        <span className="block text-label-sm text-on-surface-variant">{p.hint}</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            {Object.entries(groups).map(([group, tokens]) => (
              <Card key={group} variant="elevated" className="p-5">
                <h2 className="mb-4 text-title-md font-title-md text-on-surface">{group}</h2>
                <div className="space-y-4">
                  {tokens.map((t) =>
                    t.type === "color" ? (
                      <ColorField
                        key={t.key}
                        token={t}
                        value={values[t.key] ?? t.default}
                        onChange={(v) => set(t.key, v)}
                        onReset={() => set(t.key, t.default)}
                        isDefault={(values[t.key] ?? t.default) === t.default}
                      />
                    ) : (
                      <SelectField
                        key={t.key}
                        token={t}
                        value={values[t.key] ?? t.default}
                        onChange={(v) => set(t.key, v)}
                      />
                    )
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Live preview panel */}
          <div className="lg:col-span-1">
            <Card variant="elevated" className="sticky top-6 space-y-4 p-5">
              <p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                Live Preview
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm">Primary</Button>
                <Button size="sm" variant="secondary">Secondary</Button>
                <Button size="sm" variant="destructive">Danger</Button>
              </div>
              <Card variant="outlined" className="p-4">
                <p className="text-title-md font-semibold text-on-surface">Sample Card</p>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  This card, buttons and badges update as you tweak the theme.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-label-sm text-primary">Primary</span>
                  <span className="rounded-full bg-success/10 px-2.5 py-1 text-label-sm text-success">Success</span>
                  <span className="rounded-full bg-warning/10 px-2.5 py-1 text-label-sm text-warning">Warning</span>
                  <span className="rounded-full bg-error/10 px-2.5 py-1 text-label-sm text-error">Error</span>
                </div>
              </Card>
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
                <span className="material-symbols-outlined text-[22px] text-primary">star</span>
                <span className="ml-2 text-body-md text-on-surface">Accent &amp; icons</span>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
