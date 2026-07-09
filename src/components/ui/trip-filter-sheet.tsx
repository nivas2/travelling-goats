"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";

// ---------------------------------------------------------------------------
// Filter shape
// ---------------------------------------------------------------------------

export interface TripFilters {
  /** Selected trip lengths in days. 5 is treated as "5+ days". */
  durations: number[];
  /** Budget bounds in rupees (null = unbounded). */
  minPriceRupees: number | null;
  maxPriceRupees: number | null;
  /** Category label ("" = any). */
  category: string;
  /** Destination city ("" = any). */
  city: string;
}

export const EMPTY_FILTERS: TripFilters = {
  durations: [],
  minPriceRupees: null,
  maxPriceRupees: null,
  category: "",
  city: "",
};

/** How many filter dimensions are active — for the little count badge. */
export function activeFilterCount(f: TripFilters): number {
  let n = 0;
  if (f.durations.length) n += 1;
  if (f.minPriceRupees != null || f.maxPriceRupees != null) n += 1;
  if (f.category) n += 1;
  if (f.city) n += 1;
  return n;
}

const DURATION_OPTIONS = [
  { label: "1 day", value: 1 },
  { label: "2 days", value: 2 },
  { label: "3 days", value: 3 },
  { label: "4 days", value: 4 },
  { label: "5+ days", value: 5 },
];

// Quick budget presets (rupees). Selecting one just fills the range fields.
const BUDGET_PRESETS = [
  { label: "Budget · under ₹4k", min: null, max: 4000 },
  { label: "₹4k – ₹8k", min: 4000, max: 8000 },
  { label: "₹8k – ₹15k", min: 8000, max: 15000 },
  { label: "Premium · ₹15k+", min: 15000, max: null },
];

function presetActive(f: TripFilters, p: { min: number | null; max: number | null }) {
  return f.minPriceRupees === p.min && f.maxPriceRupees === p.max;
}

// ---------------------------------------------------------------------------
// Sheet
// ---------------------------------------------------------------------------

export function TripFilterSheet({
  open,
  onClose,
  value,
  categories,
  cities,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  value: TripFilters;
  /** Category labels to offer. */
  categories: string[];
  /** Destination cities to offer. */
  cities: string[];
  onApply: (filters: TripFilters) => void;
}) {
  // Draft state — only committed to the parent on "Apply". Re-seeded from the
  // incoming value each time the sheet transitions closed → open, using the
  // render-phase state-adjustment pattern (avoids a syncing effect).
  const [draft, setDraft] = useState<TripFilters>(value);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }

  const toggleDuration = (d: number) =>
    setDraft((prev) => ({
      ...prev,
      durations: prev.durations.includes(d)
        ? prev.durations.filter((x) => x !== d)
        : [...prev.durations, d].sort((a, b) => a - b),
    }));

  const setPrice = (key: "minPriceRupees" | "maxPriceRupees", raw: string) =>
    setDraft((prev) => ({
      ...prev,
      [key]: raw.trim() === "" ? null : Math.max(0, parseInt(raw, 10) || 0),
    }));

  const count = activeFilterCount(draft);

  return (
    <Modal open={open} onClose={onClose} title="Filter trips" size="sm">
      <div className="space-y-3.5">
        {/* Duration */}
        <FilterRow icon="calendar_today" label="Trip length">
          {DURATION_OPTIONS.map((d) => (
            <FilterChip
              key={d.value}
              active={draft.durations.includes(d.value)}
              onClick={() => toggleDuration(d.value)}
            >
              {d.label}
            </FilterChip>
          ))}
        </FilterRow>

        {/* Budget */}
        <FilterRow icon="payments" label="Budget">
          {BUDGET_PRESETS.map((p) => (
            <FilterChip
              key={p.label}
              active={presetActive(draft, p)}
              onClick={() =>
                setDraft((prev) =>
                  presetActive(prev, p)
                    ? { ...prev, minPriceRupees: null, maxPriceRupees: null }
                    : { ...prev, minPriceRupees: p.min, maxPriceRupees: p.max }
                )
              }
            >
              {p.label}
            </FilterChip>
          ))}
        </FilterRow>
        <div className="flex items-center gap-2">
          <PriceInput
            placeholder="Min ₹"
            value={draft.minPriceRupees}
            onChange={(v) => setPrice("minPriceRupees", v)}
          />
          <span className="text-on-surface-variant">–</span>
          <PriceInput
            placeholder="Max ₹"
            value={draft.maxPriceRupees}
            onChange={(v) => setPrice("maxPriceRupees", v)}
          />
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <FilterRow icon="category" label="Category">
            {categories.map((c) => (
              <FilterChip
                key={c}
                active={draft.category === c}
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    category: prev.category === c ? "" : c,
                  }))
                }
              >
                {c}
              </FilterChip>
            ))}
          </FilterRow>
        )}

        {/* Location / city */}
        {cities.length > 0 && (
          <FilterRow icon="location_on" label="Destination">
            {cities.map((c) => (
              <FilterChip
                key={c}
                active={draft.city === c}
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    city: prev.city === c ? "" : c,
                  }))
                }
              >
                {c}
              </FilterChip>
            ))}
          </FilterRow>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-outline-variant/60 pt-3">
          <button
            type="button"
            onClick={() => setDraft(EMPTY_FILTERS)}
            className="text-label-lg font-semibold text-on-surface-variant hover:text-on-surface"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-label-lg font-semibold text-on-primary transition-transform active:scale-[0.98]"
          >
            Show trips
            {count > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-on-primary/20 px-1.5 text-label-sm">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/** A compact labelled row whose options scroll horizontally (keeps height low). */
function FilterRow({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-1.5 flex items-center gap-1.5 text-label-md font-semibold text-on-surface">
        <Icon name={icon} size={16} className="text-primary" />
        {label}
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 hide-scrollbar">
        {children}
      </div>
    </section>
  );
}

/** Small pill used across the sheet — shrink-0 so rows scroll instead of wrap. */
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-label-md font-medium transition-colors " +
        (active
          ? "border-primary bg-primary text-on-primary"
          : "border-outline-variant bg-surface-container-low text-on-surface hover:border-primary/40")
      }
    >
      {children}
    </button>
  );
}

function PriceInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: number | null;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-10 w-full flex-1 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
}
