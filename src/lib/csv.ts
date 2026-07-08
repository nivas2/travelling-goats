export interface CsvColumn<T> {
  header: string;
  accessor: string | ((row: T) => unknown);
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function escapeCell(value: unknown): string {
  const str = value == null ? "" : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

export function downloadCSV<T>(
  rows: T[],
  columns: CsvColumn<T>[],
  filename: string
) {
  const header = columns.map((c) => escapeCell(c.header)).join(",");
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        const value =
          typeof col.accessor === "function"
            ? col.accessor(row)
            : getNestedValue(row, col.accessor);
        return escapeCell(value);
      })
      .join(",")
  );

  // BOM prefix for Excel Unicode support
  const bom = "\uFEFF";
  const csv = bom + [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
