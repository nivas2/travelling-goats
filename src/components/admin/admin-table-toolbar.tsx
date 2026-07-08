"use client";

import { Button } from "@/components/ui/button";
import { DateRangeFilter, type DateRange } from "./date-range-filter";

interface AdminTableToolbarProps {
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  onExportCSV?: () => void;
  csvDisabled?: boolean;
  children?: React.ReactNode;
}

export function AdminTableToolbar({
  dateRange,
  onDateRangeChange,
  onExportCSV,
  csvDisabled,
  children,
}: AdminTableToolbarProps) {
  const hasContent = dateRange || onExportCSV || children;
  if (!hasContent) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {dateRange && onDateRangeChange && (
        <DateRangeFilter value={dateRange} onChange={onDateRangeChange} />
      )}
      {children}
      {onExportCSV && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onExportCSV}
          disabled={csvDisabled}
          icon={
            <span className="material-symbols-outlined text-[18px]">
              download
            </span>
          }
        >
          Export CSV
        </Button>
      )}
    </div>
  );
}
