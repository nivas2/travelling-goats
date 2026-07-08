"use client";

import { useState, useMemo } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function compareValues(a: unknown, b: unknown): number {
  // Nullish values go last
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  // Booleans
  if (typeof a === "boolean" && typeof b === "boolean") {
    return a === b ? 0 : a ? -1 : 1;
  }

  // Numbers
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  const strA = String(a);
  const strB = String(b);

  // Date strings (ISO or parseable)
  const dateA = Date.parse(strA);
  const dateB = Date.parse(strB);
  if (!isNaN(dateA) && !isNaN(dateB) && strA.length > 6) {
    return dateA - dateB;
  }

  // Numeric strings
  const numA = Number(strA);
  const numB = Number(strB);
  if (!isNaN(numA) && !isNaN(numB) && strA !== "" && strB !== "") {
    return numA - numB;
  }

  // String comparison
  return strA.localeCompare(strB, undefined, { sensitivity: "base" });
}

export function useSortable<T>({
  data,
  defaultSort,
}: {
  data: T[];
  defaultSort?: SortConfig;
}) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(
    defaultSort ?? { key: "", direction: null }
  );

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return data;

    return [...data].sort((a, b) => {
      const valA = getNestedValue(a, sortConfig.key);
      const valB = getNestedValue(b, sortConfig.key);
      const result = compareValues(valA, valB);
      return sortConfig.direction === "desc" ? -result : result;
    });
  }, [data, sortConfig]);

  function requestSort(key: string) {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: "", direction: null };
    });
  }

  return { sortedData, sortConfig, requestSort };
}
