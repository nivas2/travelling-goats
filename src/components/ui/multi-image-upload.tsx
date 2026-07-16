"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

export interface MultiImageUploadProps {
  /** Current gallery URLs. */
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  /** Maximum number of photos allowed. */
  max?: number;
  className?: string;
  accept?: string[];
  maxSizeMB?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  recommend?: string;
}

const DEFAULTS = {
  accept: ["image/jpeg", "image/png", "image/webp"],
  maxSizeMB: 5,
  minWidth: 800,
  minHeight: 500,
  maxWidth: 6000,
  maxHeight: 6000,
};

function readDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

/**
 * Gallery uploader — upload several photos (up to `max`) that populate a trip's
 * `images[]`. Reuses the same /api/upload endpoint as the single ImageUpload.
 */
export function MultiImageUpload(props: MultiImageUploadProps) {
  const { value, onChange, label, className } = props;
  const max = props.max ?? 6;
  const accept = props.accept ?? DEFAULTS.accept;
  const maxSizeMB = props.maxSizeMB ?? DEFAULTS.maxSizeMB;
  const minWidth = props.minWidth ?? DEFAULTS.minWidth;
  const minHeight = props.minHeight ?? DEFAULTS.minHeight;
  const maxWidth = props.maxWidth ?? DEFAULTS.maxWidth;
  const maxHeight = props.maxHeight ?? DEFAULTS.maxHeight;

  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeLabel = accept
    .map((t) => t.replace("image/", "").toUpperCase().replace("JPEG", "JPG"))
    .join(", ");
  const hint = `${typeLabel} · up to ${maxSizeMB} MB each · min ${minWidth}×${minHeight}px`;
  const remaining = max - value.length;

  async function validateAndUpload(file: File): Promise<string> {
    if (!accept.includes(file.type)) throw new Error(`Unsupported type: ${file.name}`);
    if (file.size > maxSizeMB * 1024 * 1024) throw new Error(`${file.name} is over ${maxSizeMB} MB`);
    const { width, height } = await readDimensions(file);
    if (width < minWidth || height < minHeight || width > maxWidth || height > maxHeight) {
      throw new Error(
        `${file.name} must be ${minWidth}×${minHeight}–${maxWidth}×${maxHeight}px (got ${width}×${height}).`
      );
    }
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error ?? "Upload failed");
    return json.data.url as string;
  }

  async function handleFiles(files: FileList) {
    setError(null);
    const slots = max - value.length;
    if (slots <= 0) {
      setError(`You can add up to ${max} photos.`);
      return;
    }
    const picked = Array.from(files).slice(0, slots);
    const dropped = files.length - picked.length;

    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of picked) {
        try {
          uploaded.push(await validateAndUpload(file));
        } catch (e) {
          setError(e instanceof Error ? e.message : "Upload failed");
        }
      }
      if (uploaded.length) onChange([...value, ...uploaded]);
      if (dropped > 0) {
        setError((prev) =>
          [prev, `Only ${max} photos allowed — ${dropped} skipped.`].filter(Boolean).join(" ")
        );
      }
    } finally {
      setUploading(false);
    }
  }

  const removeAt = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-label-lg font-semibold text-on-surface">{label}</span>
          <span className="text-label-sm font-medium text-on-surface-variant">
            {value.length}/{max}
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {value.map((url, i) => (
          <div
            key={url + i}
            className="group relative aspect-square overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-error"
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            <Icon
              name={uploading ? "progress_activity" : "add_photo_alternate"}
              size={26}
              className={cn("text-on-surface-variant", uploading && "animate-spin text-primary")}
            />
            <span className="px-1 text-label-sm font-medium text-on-surface-variant">
              {uploading ? "Uploading…" : "Add photo"}
            </span>
          </button>
        )}
      </div>

      <div className="mt-1.5 space-y-0.5">
        {props.recommend && (
          <p className="text-label-sm font-medium text-on-surface-variant">
            <Icon name="aspect_ratio" size={13} className="mr-1 -mt-0.5 inline align-middle" />
            Recommended: {props.recommend}
          </p>
        )}
        <p className="text-label-sm text-on-surface-variant/70">{hint}</p>
      </div>

      {error && <p className="mt-1 text-label-sm text-error">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
