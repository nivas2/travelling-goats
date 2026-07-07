"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

export interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
  /** Override the default constraints (must also be enforced server-side). */
  accept?: string[];
  maxSizeMB?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  required?: boolean;
  /** Aspect-ratio hint for the preview box, e.g. "16/9". */
  aspect?: string;
  /** Recommended size, shown prominently (e.g. "Wide logo ~400×120px"). */
  recommend?: string;
}

const DEFAULTS = {
  accept: ["image/jpeg", "image/png", "image/webp"],
  maxSizeMB: 5,
  minWidth: 400,
  minHeight: 300,
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

export function ImageUpload(props: ImageUploadProps) {
  const {
    value,
    onChange,
    label,
    className,
    aspect = "16/9",
  } = props;
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
  const hint = `${typeLabel} · up to ${maxSizeMB} MB · ${minWidth}×${minHeight}–${maxWidth}×${maxHeight}px`;

  async function handleFile(file: File) {
    setError(null);

    if (!accept.includes(file.type)) {
      setError(`Unsupported type. Allowed: ${typeLabel}.`);
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Max ${maxSizeMB} MB.`);
      return;
    }
    try {
      const { width, height } = await readDimensions(file);
      if (width < minWidth || height < minHeight || width > maxWidth || height > maxHeight) {
        setError(
          `Image must be ${minWidth}×${minHeight}–${maxWidth}×${maxHeight}px (got ${width}×${height}).`
        );
        return;
      }
    } catch {
      setError("Could not read this image.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Upload failed");
      onChange(json.data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={className}>
      {label && (
        <span className="mb-1.5 block text-label-lg font-semibold text-on-surface">
          {label}
          {props.required && <span className="text-error"> *</span>}
        </span>
      )}

      {value ? (
        <div
          className="relative w-full overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low"
          style={{ aspectRatio: aspect }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Uploaded" className="h-full w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-8 items-center gap-1 rounded-full bg-black/55 px-3 text-label-sm text-white backdrop-blur-sm hover:bg-black/70"
            >
              <Icon name="edit" size={14} /> Replace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Remove image"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-error"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
              <Icon name="progress_activity" size={28} className="animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
          )}
        >
          <Icon
            name={uploading ? "progress_activity" : "cloud_upload"}
            size={32}
            className={cn("text-on-surface-variant", uploading && "animate-spin text-primary")}
          />
          <span className="text-label-lg font-semibold text-on-surface">
            {uploading ? "Uploading…" : "Click to upload a picture"}
          </span>
          {props.recommend && (
            <span className="text-label-sm text-on-surface-variant">{props.recommend}</span>
          )}
        </button>
      )}

      {/* Always-visible size guidance */}
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
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
