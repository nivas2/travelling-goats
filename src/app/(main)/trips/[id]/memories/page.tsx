"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

interface Photo {
  id: string;
  imageUrl: string;
  caption: string;
  userName: string;
  userAvatar: string | null;
  createdAt: string;
  isMine: boolean;
}

export default function TripMemoriesPage() {
  const { id: tripId } = useParams<{ id: string }>();
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/memories`);
      const json = await res.json();
      if (json.success) setPhotos(json.data as Photo[]);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toastError("Please choose an image file");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch(`/api/trips/${tripId}/memories`, { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Upload failed");
      setPhotos((prev) => [{ ...json.data, isMine: true }, ...prev]);
      toastSuccess("Photo added to memories");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(id: string) {
    // Only ever called for the viewer's own photos; server re-checks ownership.
    const prev = photos;
    setPhotos((p) => p.filter((x) => x.id !== id));
    setLightbox(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/memories/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to delete");
    } catch (err) {
      setPhotos(prev); // rollback
      toastError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="min-h-dvh bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-background/85 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-on-surface ring-1 ring-black/5 transition active:scale-95"
          >
            <Icon name="arrow_back" size={22} />
          </button>
          <div>
            <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-on-surface">Trip Memories</h1>
            <p className="text-[12px] text-on-surface-variant">{photos.length} photo{photos.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-full bg-lime px-4 py-2.5 text-[14px] font-semibold text-on-surface shadow-[0_8px_22px_rgba(198,241,53,0.38)] transition active:scale-95 disabled:opacity-60"
        >
          <Icon name={uploading ? "hourglass_top" : "add_a_photo"} size={18} filled />
          {uploading ? "Uploading…" : "Add photo"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />
      </div>

      {/* Grid */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="aspect-square rounded-2xl" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon="photo_camera"
              title="No memories yet"
              description="Add your favourite photos from this trip — everyone on the trip can see them."
              action={{ label: "Add a photo", onClick: () => fileRef.current?.click() }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setLightbox(p)}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-surface-container ring-1 ring-black/5"
                aria-label="Open photo"
              >
                <Image
                  src={p.imageUrl}
                  alt={p.caption || "Trip memory"}
                  fill
                  sizes="(max-width:640px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized={p.imageUrl.startsWith("data:")}
                />
                {p.isMine && (
                  <span className="absolute left-2 top-2 rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold text-on-surface">
                    You
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <Avatar src={p.userAvatar} name={p.userName} size="xs" />
                  <span className="truncate text-[11px] font-medium text-white">{p.userName}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/92 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="flex items-center gap-2">
              <Avatar src={lightbox.userAvatar} name={lightbox.userName} size="sm" />
              <div>
                <p className="text-[14px] font-semibold text-white">{lightbox.userName}</p>
                <p className="text-[11px] text-white/60">
                  {new Date(lightbox.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition active:scale-95"
            >
              <Icon name="close" size={22} />
            </button>
          </div>

          <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightbox.imageUrl}
              alt={lightbox.caption || "Trip memory"}
              fill
              sizes="100vw"
              className="object-contain"
              unoptimized={lightbox.imageUrl.startsWith("data:")}
            />
          </div>

          <div className="flex items-center justify-between gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3" onClick={(e) => e.stopPropagation()}>
            <p className="line-clamp-2 flex-1 text-[13px] text-white/85">{lightbox.caption}</p>
            {/* Delete shown only on the viewer's own photos (server also enforces). */}
            {lightbox.isMine && (
              <button
                onClick={() => onDelete(lightbox.id)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-4 py-2.5 text-[13px] font-semibold text-white backdrop-blur transition hover:bg-error active:scale-95"
              >
                <Icon name="delete" size={18} />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
