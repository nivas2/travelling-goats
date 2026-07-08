"use client";

import { cn } from "@/lib/utils";
import type { SortConfig } from "@/hooks/use-sortable";

interface SortHeaderProps {
  label: string;
  sortKey: string;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  className?: string;
}

export function SortHeader({
  label,
  sortKey,
  sortConfig,
  onSort,
  className,
}: SortHeaderProps) {
  const isActive = sortConfig.key === sortKey && sortConfig.direction !== null;
  const icon =
    isActive && sortConfig.direction === "desc"
      ? "arrow_downward"
      : "arrow_upward";

  return (
    <th
      className={cn(
        "px-4 py-3 font-label-lg text-on-surface-variant select-none cursor-pointer group",
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span
          className={cn(
            "material-symbols-outlined text-[14px] transition-opacity",
            isActive
              ? "opacity-100 text-primary"
              : "opacity-0 group-hover:opacity-50"
          )}
        >
          {icon}
        </span>
      </span>
    </th>
  );
}
