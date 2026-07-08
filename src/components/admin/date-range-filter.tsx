"use client";

import { Input } from "@/components/ui/input";

export interface DateRange {
  from: string;
  to: string;
}

export function filterByDateRange<T>(
  rows: T[],
  dateRange: DateRange,
  dateKey: string
): T[] {
  if (!dateRange.from && !dateRange.to) return rows;

  return rows.filter((row) => {
    const value = (row as Record<string, unknown>)[dateKey];
    if (!value) return false;
    const date = new Date(value as string);
    if (dateRange.from && date < new Date(dateRange.from)) return false;
    if (dateRange.to && date > new Date(dateRange.to + "T23:59:59")) return false;
    return true;
  });
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={value.from}
        onChange={(e) => onChange({ ...value, from: e.target.value })}
        inputSize="sm"
      />
      <span className="text-on-surface-variant text-body-md">to</span>
      <Input
        type="date"
        value={value.to}
        onChange={(e) => onChange({ ...value, to: e.target.value })}
        inputSize="sm"
      />
      {(value.from || value.to) && (
        <button
          onClick={() => onChange({ from: "", to: "" })}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors shrink-0"
          title="Clear dates"
        >
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            close
          </span>
        </button>
      )}
    </div>
  );
}
