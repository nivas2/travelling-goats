"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  CONTENT_BLOCKS,
  orderedBlocks,
  type BlockDef,
  type FieldDef,
  type ContentMap,
} from "@/lib/content/registry";

/* ------------------------------------------------------------------ */
/*  Field inputs                                                       */
/* ------------------------------------------------------------------ */

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const base =
    "w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md text-on-surface outline-none transition-colors focus:border-primary";

  // Toggle fields render as a labelled switch (stored as "true"/"false").
  if (field.type === "toggle") {
    const on = value !== "false";
    return (
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5">
        <span className="text-body-md text-on-surface">{field.label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => onChange(on ? "false" : "true")}
          className={
            "relative h-6 w-11 shrink-0 rounded-full transition-colors " +
            (on ? "bg-primary" : "bg-outline-variant")
          }
        >
          <span
            className={
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all " +
              (on ? "left-[22px]" : "left-0.5")
            }
          />
        </button>
      </label>
    );
  }

  // Image fields get an uploader + a paste-URL fallback.
  if (field.type === "image") {
    return (
      <div className="block">
        <span className="mb-1 block text-label-sm font-label-sm text-on-surface-variant">
          {field.label}
        </span>
        <ImageUpload
          value={value}
          onChange={onChange}
          recommend={field.recommend}
          minWidth={field.minWidth}
          minHeight={field.minHeight}
          maxWidth={field.maxWidth}
          maxHeight={field.maxHeight}
          aspect={field.aspect}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…or paste an image URL"
          className={base + " mt-2"}
        />
      </div>
    );
  }

  return (
    <label className="block">
      <span className="mb-1 block text-label-sm font-label-sm text-on-surface-variant">
        {field.label}
      </span>
      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={2}
          className={base + " resize-y"}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={base}
        />
      )}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  Single-object block editor                                        */
/* ------------------------------------------------------------------ */

function SingleEditor({
  block,
  value,
  onChange,
}: {
  block: BlockDef;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {block.fields.map((f) => (
        <div key={f.name} className={f.type === "textarea" || f.type === "image" ? "md:col-span-2" : ""}>
          <FieldInput
            field={f}
            value={value?.[f.name] ?? ""}
            onChange={(v) => onChange({ ...value, [f.name]: v })}
          />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  List block editor                                                 */
/* ------------------------------------------------------------------ */

function ListEditor({
  block,
  items,
  onChange,
}: {
  block: Extract<BlockDef, { kind: "list" }>;
  items: Record<string, string>[];
  onChange: (v: Record<string, string>[]) => void;
}) {
  const emptyItem = () =>
    Object.fromEntries(block.fields.map((f) => [f.name, ""])) as Record<string, string>;

  const update = (i: number, next: Record<string, string>) => {
    const copy = items.slice();
    copy[i] = next;
    onChange(copy);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const copy = items.slice();
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };
  const canRemove = items.length > (block.min ?? 0);
  const canAdd = block.max === undefined || items.length < block.max;

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-xl border border-outline-variant/40 bg-surface-container-low/40 p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-label-sm font-label-sm text-on-surface-variant">
              {block.itemLabel} {i + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-surface-container disabled:opacity-30"
                title="Move up"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-surface-container disabled:opacity-30"
                title="Move down"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
              </button>
              <button
                onClick={() => remove(i)}
                disabled={!canRemove}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-error hover:bg-error/10 disabled:opacity-30"
                title="Remove"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {block.fields.map((f) => (
              <div key={f.name} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                <FieldInput
                  field={f}
                  value={item?.[f.name] ?? ""}
                  onChange={(v) => update(i, { ...item, [f.name]: v })}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange([...items, emptyItem()])}
        disabled={!canAdd}
      >
        + Add {block.itemLabel}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Block card (with per-block save)                                  */
/* ------------------------------------------------------------------ */

function BlockCard({
  block,
  value,
  onChange,
}: {
  block: BlockDef;
  value: ContentMap[string];
  onChange: (v: ContentMap[string]) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  async function save() {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: block.key, content: value }),
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

  return (
    <Card variant="elevated" className="p-5">
      <div className="mb-4">
        <h3 className="text-title-md font-title-md text-on-surface">{block.label}</h3>
        {block.description && (
          <p className="mt-0.5 text-body-sm text-on-surface-variant">{block.description}</p>
        )}
      </div>

      {block.kind === "single" ? (
        <SingleEditor
          block={block}
          value={(value as Record<string, string>) ?? {}}
          onChange={onChange}
        />
      ) : (
        <ListEditor
          block={block}
          items={(value as Record<string, string>[]) ?? []}
          onChange={onChange}
        />
      )}

      <div className="mt-4 flex items-center gap-3">
        <Button size="sm" loading={saving} onClick={save}>
          Save
        </Button>
        {status === "saved" && (
          <span className="text-label-sm text-success">Saved ✓</span>
        )}
        {status === "error" && (
          <span className="text-label-sm text-error">Failed to save</span>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function AdminContentPage() {
  const [values, setValues] = useState<ContentMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/content");
        const json = await res.json();
        if (json.success) setValues(json.data ?? {});
      } catch {
        // leave empty; editors fall back to blanks
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const groups = useMemo(() => {
    const g: Record<string, BlockDef[]> = {};
    for (const block of CONTENT_BLOCKS) {
      (g[block.group] ??= []).push(block);
    }
    // Show blocks top-to-bottom in the same order they appear on the page.
    for (const key of Object.keys(g)) g[key] = orderedBlocks(g[key]);
    return g;
  }, []);

  const groupNames = useMemo(() => Object.keys(groups), [groups]);
  const [activeGroup, setActiveGroup] = useState<string>("");
  const current = activeGroup || groupNames[0] || "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-headline-md text-on-surface">Site Content</h1>
        <p className="text-body-md text-on-surface-variant">
          Edit the marketing content shown on the landing and home pages. Changes go live immediately.
        </p>
      </div>

      {/* Landing Page / Home Feed tabs */}
      <div className="flex gap-1 border-b border-outline-variant">
        {groupNames.map((g) => {
          const active = current === g;
          return (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={
                "-mb-px border-b-2 px-4 py-2.5 text-label-lg font-semibold transition-colors " +
                (active
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface")
              }
            >
              {g}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface-container-low" />
          ))}
        </div>
      ) : (
        <section className="space-y-4">
          {(groups[current] ?? []).map((block) => (
            <BlockCard
              key={block.key}
              block={block}
              value={values[block.key]}
              onChange={(v) => setValues((prev) => ({ ...prev, [block.key]: v }))}
            />
          ))}
        </section>
      )}
    </div>
  );
}
