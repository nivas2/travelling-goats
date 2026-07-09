"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { handleAuthError } from "@/lib/auth-fetch";
import Image from "next/image";
import { cn, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import type { ApiResponse } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TripHubData {
  id: string;
  tripTitle: string;
  destination: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  duration: number;
  currentDay: number;
  status: "ONGOING" | "COMPLETED";
  tripCaptain: {
    id: string;
    name: string;
    avatar: string | null;
    phone: string;
    city: string;
  };
  isCaptain: boolean;
  companions: CompanionData[];
  memories: MemoryData[];
}

interface CompanionData {
  id: string;
  name: string;
  avatar: string | null;
  city: string;
  isCaptain: boolean;
}

interface MemoryData {
  id: string;
  imageUrl: string;
  caption: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  createdAt: string;
}

type HubSection = "main" | "journal" | "playlist";

// ---------------------------------------------------------------------------
// Quick Action Button
// ---------------------------------------------------------------------------

function QuickActionButton({
  icon,
  label,
  color = "default",
  onClick,
}: {
  icon: string;
  label: string;
  color?: "default" | "red" | "blue" | "green" | "orange" | "purple";
  onClick: () => void;
}) {
  // All quick actions share the lime-green / black look — except SOS (red).
  const lime = "bg-[#C6F135] text-[#181D27] hover:brightness-[1.04] shadow-[0_8px_22px_rgba(198,241,53,0.30)]";
  const colorStyles = {
    default: lime,
    red: "bg-error text-white hover:bg-error/90 shadow-[0_8px_22px_rgba(220,38,38,0.28)]",
    blue: lime,
    green: lime,
    orange: lime,
    purple: lime,
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "tactile-btn flex flex-col items-center justify-center gap-2 rounded-2xl p-4 transition-all active:scale-[0.97]",
        colorStyles[color]
      )}
    >
      <Icon name={icon} size={28} filled />
      <span className="text-label-sm font-semibold text-center leading-tight">
        {label}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Status Banner
// ---------------------------------------------------------------------------

function StatusBanner({
  tripTitle,
  currentDay,
  totalDays,
  destination,
  coverImage,
}: {
  tripTitle: string;
  currentDay: number;
  totalDays: number;
  destination: string;
  coverImage: string;
}) {
  const progress = (currentDay / totalDays) * 100;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Background Image */}
      <div className="relative h-44 w-full overflow-hidden">
        <Image
          src={coverImage || "/placeholder-trip.jpg"}
          alt={tripTitle}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        {/* Content overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C6F135] px-3 py-1 text-label-sm font-semibold text-[#181D27]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#181D27] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#181D27]" />
              </span>
              Live Trip
            </span>
          </div>

          <h1 className="text-title-lg font-semibold text-white text-shadow-premium">
            {tripTitle}
          </h1>
          <p className="mt-0.5 text-body-md text-white/80">{destination}</p>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-label-sm text-white/80 mb-1.5">
              <span>Day {currentDay} of {totalDays}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Memory Card
// ---------------------------------------------------------------------------

function MemoryCard({
  memory,
  canDelete,
  onDelete,
  onOpen,
}: {
  memory: MemoryData;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
  onOpen?: (memory: MemoryData) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-card">
      <button
        type="button"
        onClick={() => onOpen?.(memory)}
        className="relative block h-48 w-full overflow-hidden"
        aria-label="Open photo"
      >
        <Image
          src={memory.imageUrl}
          alt={memory.caption || "Trip memory"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
        {canDelete && onDelete && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(memory.id);
            }}
            aria-label="Delete memory"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-error"
          >
            <Icon name="delete" size={18} />
          </span>
        )}
      </button>
      <div className="p-3">
        {memory.caption && (
          <p className="text-body-md text-on-surface line-clamp-2 mb-2">
            {memory.caption}
          </p>
        )}
        <div className="flex items-center gap-2">
          <Avatar
            src={memory.userAvatar}
            name={memory.userName}
            size="xs"
          />
          <span className="text-label-sm text-on-surface-variant truncate">
            {memory.userName}
          </span>
          <span className="text-label-sm text-on-surface-variant/60 ml-auto shrink-0">
            {formatDate(memory.createdAt, "relative")}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Memory Form
// ---------------------------------------------------------------------------

function AddMemoryForm({
  onSubmit,
  onCancel,
  submitting,
}: {
  onSubmit: (caption: string, imageFile: File) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    onSubmit(caption, selectedFile);
  };

  return (
    <Card variant="outlined" className="mt-4">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-title-md">Add a Memory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Image Upload */}
          {preview ? (
            <div className="relative h-48 w-full overflow-hidden rounded-xl">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          ) : (
            <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low hover:bg-surface-container transition-colors">
              <Icon name="add_photo_alternate" size={32} className="text-on-surface-variant mb-1" />
              <span className="text-body-md text-on-surface-variant">
                Tap to upload photo
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          )}

          {/* Caption */}
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            rows={2}
            className={cn(
              "w-full resize-none rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5",
              "text-body-md text-on-surface placeholder:text-on-surface-variant/50",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            )}
          />
        </CardContent>

        {/* Actions */}
        <div className="flex items-center gap-2 px-4 pb-4">
          <Button
            type="submit"
            size="sm"
            disabled={!selectedFile || submitting}
            loading={submitting}
            icon={<Icon name="upload" size={16} />}
          >
            Share Memory
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Memory Preview (full-screen lightbox)
// ---------------------------------------------------------------------------

function MemoryPreview({
  memory,
  onClose,
}: {
  memory: MemoryData | null;
  onClose: () => void;
}) {
  if (!memory) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
    >
      <button
        onClick={onClose}
        aria-label="Close preview"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <Icon name="close" size={24} />
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={memory.imageUrl}
        alt={memory.caption || "Trip memory"}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] max-w-full rounded-lg object-contain"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-4 w-full max-w-lg text-center text-white"
      >
        {memory.caption && <p className="text-body-lg">{memory.caption}</p>}
        <p className="mt-1 text-label-sm text-white/60">
          {memory.userName} · {formatDate(memory.createdAt, "relative")}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Safety Info Card
// ---------------------------------------------------------------------------

function SafetyInfoCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card variant="outlined" className="border-warning/30 bg-warning-container/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 text-left"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/20">
          <Icon name="shield" size={22} className="text-warning" filled />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-label-lg font-semibold text-on-surface">
            Safety Information
          </p>
          <p className="text-label-sm text-on-surface-variant">
            Emergency contacts & local guidelines
          </p>
        </div>
        <Icon
          name={expanded ? "expand_less" : "expand_more"}
          size={22}
          className="text-on-surface-variant"
        />
      </button>

      {expanded && (
        <div className="mt-3 space-y-1 border-t border-outline-variant pt-3">
          {[
            { icon: "emergency", color: "text-error", label: "Emergency", num: "112" },
            { icon: "local_police", color: "text-secondary", label: "Police", num: "100" },
            { icon: "local_hospital", color: "text-error", label: "Ambulance", num: "108" },
            { icon: "fire_truck", color: "text-warning", label: "Fire", num: "101" },
          ].map((e) => (
            <a
              key={e.num}
              href={`tel:${e.num}`}
              className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-body-md text-on-surface hover:bg-surface-container"
            >
              <Icon name={e.icon} size={18} className={e.color} />
              <span className="flex-1">
                {e.label}: {e.num}
              </span>
              <Icon name="call" size={16} className="text-primary" />
            </a>
          ))}
          <p className="mt-2 text-label-sm text-on-surface-variant">
            Keep your phone charged. Share your live location with your emergency
            contact. Stay with the group and follow the Shepherd&apos;s
            instructions.
          </p>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Trip "Bus" Playlist — travellers suggest songs (iTunes search) & play 30s previews
// ---------------------------------------------------------------------------

interface PlaylistTrack {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  previewUrl: string | null;
  sourceUrl: string | null;
  addedById: string;
  addedByName: string;
}

interface SongResult {
  externalId: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  previewUrl: string | null;
  sourceUrl: string | null;
}

function PlaylistSection({ tripId, onBack }: { tripId: string; onBack: () => void }) {
  const { data: session } = useSession();
  const { error: toastError } = useToast();
  const myId = session?.user?.id;

  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SongResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load the trip playlist.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/playlist`);
        const json = await res.json();
        if (active && json.success) setTracks(json.data ?? []);
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [tripId]);

  // Debounced song search via the iTunes proxy.
  useEffect(() => {
    const q = query.trim();
    const t = setTimeout(async () => {
      if (!q) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(`/api/music/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        setResults(json.success ? json.data ?? [] : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  function togglePlay(id: string, previewUrl: string | null) {
    if (!previewUrl) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (playingId === id) {
      audio.pause();
      setPlayingId(null);
      return;
    }
    audio.src = previewUrl;
    audio.play().then(() => setPlayingId(id)).catch(() => setPlayingId(null));
  }

  async function addSong(song: SongResult) {
    setAddingId(song.externalId);
    try {
      const res = await fetch(`/api/trips/${tripId}/playlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(song),
      });
      if (await handleAuthError(res)) return;
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to add");
      setTracks((prev) => [...prev, json.data as PlaylistTrack]);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to add song");
    } finally {
      setAddingId(null);
    }
  }

  async function removeSong(id: string) {
    const prev = tracks;
    setTracks((t) => t.filter((x) => x.id !== id));
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    }
    const res = await fetch(`/api/trips/${tripId}/playlist/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setTracks(prev);
      toastError("Couldn't remove song");
    }
  }

  const inPlaylist = new Set(tracks.map((t) => t.title + "|" + t.artist));

  // A single song shown as a card (artwork + title/artist, with preview + add).
  const songCard = (s: SongResult, pidPrefix: string) => {
    const already = inPlaylist.has(s.title + "|" + s.artist);
    const pid = pidPrefix + s.externalId;
    return (
      <div>
        <div className="relative aspect-square w-full overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.artworkUrl ?? "/placeholder-trip.jpg"}
            alt=""
            className="h-full w-full object-cover"
          />
          {s.previewUrl && (
            <button
              onClick={() => togglePlay(pid, s.previewUrl)}
              aria-label="Preview"
              className="absolute bottom-1 left-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
            >
              <Icon name={playingId === pid ? "pause" : "play_arrow"} size={18} filled />
            </button>
          )}
          <button
            onClick={() => addSong(s)}
            disabled={already || addingId === s.externalId}
            aria-label="Add to playlist"
            className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm disabled:opacity-50"
          >
            <Icon name={already ? "check" : "add"} size={18} />
          </button>
        </div>
        <p className="mt-1 truncate text-label-md text-on-surface">{s.title}</p>
        <p className="truncate text-label-sm text-on-surface-variant">{s.artist}</p>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-surface-container-high"
          aria-label="Go back"
        >
          <Icon name="arrow_back" size={22} />
        </button>
        <h2 className="flex-1 text-title-lg font-semibold text-on-surface">Bus Playlist</h2>
        <Button size="sm" icon={<Icon name="add" size={16} />} onClick={() => setSearchOpen((v) => !v)}>
          Suggest
        </Button>
      </div>

      {/* Search panel */}
      {searchOpen && (
        <Card variant="outlined" className="mb-4 p-3">
          <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-3">
            <Icon name="search" size={18} className="text-on-surface-variant" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs, artists…"
              className="w-full bg-transparent py-2.5 text-body-md text-on-surface outline-none"
            />
            {searching && <Icon name="progress_activity" size={18} className="animate-spin text-primary" />}
          </div>

          <div className="mt-2 max-h-96 overflow-y-auto">
            {results.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {results.map((r) => (
                  <div key={r.externalId}>{songCard(r, "s-")}</div>
                ))}
              </div>
            )}
            {!searching && query.trim() && results.length === 0 && (
              <p className="py-4 text-center text-label-md text-on-surface-variant">No songs found.</p>
            )}
          </div>
        </Card>
      )}


      {/* Playlist */}
      <Card variant="elevated" className="overflow-hidden p-0">
        <div className="primary-gradient flex items-center gap-3 p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
            <Icon name="headphones" size={28} className="text-white" filled />
          </div>
          <div>
            <p className="text-label-sm text-white/70">TRIP PLAYLIST</p>
            <h3 className="text-title-md font-semibold text-white">On the Bus</h3>
            <p className="text-label-sm text-white/70">{tracks.length} song{tracks.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-container-low" />
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Icon name="queue_music" size={40} className="mx-auto text-on-surface-variant/40" />
            <p className="mt-2 text-body-md text-on-surface-variant">
              No songs yet. Tap <span className="font-semibold text-primary">Suggest</span> to add the first one!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/40">
            {tracks.map((t, idx) => (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="w-5 text-center text-label-sm text-on-surface-variant/60">{idx + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.artworkUrl ?? "/placeholder-trip.jpg"}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-md text-on-surface">{t.title}</p>
                  <p className="truncate text-label-sm text-on-surface-variant">
                    {t.artist} · <span className="opacity-70">{t.addedByName}</span>
                  </p>
                </div>
                {t.previewUrl && (
                  <button
                    onClick={() => togglePlay(t.id, t.previewUrl)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10"
                    aria-label={playingId === t.id ? "Pause" : "Play"}
                  >
                    <Icon name={playingId === t.id ? "pause_circle" : "play_circle"} size={26} filled />
                  </button>
                )}
                {(t.addedById === myId) && (
                  <button
                    onClick={() => removeSong(t.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-error/10 hover:text-error"
                    aria-label="Remove"
                  >
                    <Icon name="close" size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-outline-variant/40 px-4 py-3">
          <p className="text-center text-label-sm text-on-surface-variant/70">
            30-second previews · powered by iTunes
          </p>
        </div>
      </Card>

      {/* Hidden shared audio element for previews */}
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hub Page Skeleton
// ---------------------------------------------------------------------------

function HubSkeleton() {
  return (
    <div className="space-y-4 px-4 py-6">
      <Skeleton variant="rectangular" height={176} className="rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={100} className="rounded-2xl" />
        ))}
      </div>
      <Skeleton variant="card" height={200} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Hub Page
// ---------------------------------------------------------------------------

export default function TripHubPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const myId = session?.user?.id;
  const { error: toastError, success: toastSuccess, info: toastInfo } = useToast();
  const tripId = params.id;

  const [hubData, setHubData] = useState<TripHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<HubSection>("main");
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [submittingMemory, setSubmittingMemory] = useState(false);
  const [previewMemory, setPreviewMemory] = useState<MemoryData | null>(null);
  const [locating, setLocating] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);

  // Get the device's current location and share it (native share → WhatsApp etc.,
  // otherwise open Google Maps at the pin). Requires a secure context
  // (localhost or https) and location permission.
  const shareLiveLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toastError("Location isn't supported on this device");
      return;
    }
    setLocating(true);
    toastInfo("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const text = `📍 My live location on the trip: ${mapsUrl}`;
        try {
          const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
          if (nav.share) {
            await nav.share({ title: "My Live Location", text, url: mapsUrl });
          } else {
            window.open(mapsUrl, "_blank", "noopener,noreferrer");
            toastSuccess("Opened your location in Maps");
          }
        } catch {
          /* user cancelled the share sheet */
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        toastError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — enable it in your browser settings"
            : "Couldn't get your location. Try again outdoors."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [toastError, toastInfo, toastSuccess]);

  const fetchHubData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/hub`);
      if (await handleAuthError(res)) return;
      if (!res.ok) throw new Error("Failed to load trip hub");
      const data: ApiResponse<TripHubData> = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to load trip hub");
      setHubData(data.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  // Fetch unread chat count
  const fetchChatUnread = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/room?tripId=${tripId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) setChatUnread(data.data?.unreadCount ?? 0);
    } catch {
      // Best-effort
    }
  }, [tripId]);

  useEffect(() => {
    fetchHubData();
    fetchChatUnread();
  }, [fetchHubData, fetchChatUnread]);

  const handleAddMemory = async (caption: string, imageFile: File) => {
    setSubmittingMemory(true);
    try {
      const formData = new FormData();
      formData.append("tripId", tripId);
      formData.append("caption", caption);
      formData.append("image", imageFile);

      const res = await fetch(`/api/trips/${tripId}/memories`, {
        method: "POST",
        body: formData,
      });
      if (await handleAuthError(res)) return;
      if (!res.ok) throw new Error("Failed to upload memory");
      const data: ApiResponse<MemoryData> = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to upload memory");

      if (data.data && hubData) {
        setHubData({
          ...hubData,
          memories: [data.data, ...hubData.memories],
        });
      }
      setShowAddMemory(false);
    } catch {
      toastError("Failed to add memory");
    } finally {
      setSubmittingMemory(false);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    const prev = hubData;
    if (hubData) {
      setHubData({ ...hubData, memories: hubData.memories.filter((m) => m.id !== memoryId) });
    }
    try {
      const res = await fetch(`/api/trips/${tripId}/memories/${memoryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      if (prev) setHubData(prev);
      toastError("Couldn't delete memory");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg">
        <HubSkeleton />
      </div>
    );
  }

  if (error || !hubData) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <EmptyState
          icon="error_outline"
          title="Could not load Trip Hub"
          description={error ?? "Something went wrong. Please try again."}
          action={{
            label: "Retry",
            onClick: fetchHubData,
          }}
          secondaryAction={{
            label: "Go Back",
            onClick: () => router.back(),
          }}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Sub-sections
  // ---------------------------------------------------------------------------

  if (section === "playlist") {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <PlaylistSection tripId={tripId} onBack={() => setSection("main")} />
      </div>
    );
  }

  // Completed trips: the Hub is just the Memory Journal (nothing live to show).
  const isCompleted = hubData.status === "COMPLETED";

  if (section === "journal" || isCompleted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => (isCompleted ? router.back() : setSection("main"))}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
            aria-label="Go back"
          >
            <Icon name="arrow_back" size={22} />
          </button>
          <h2 className="text-title-lg font-semibold text-on-surface flex-1">
            Memory Journal
          </h2>
          {!showAddMemory && (
            <Button
              size="sm"
              icon={<Icon name="add_photo_alternate" size={16} />}
              onClick={() => setShowAddMemory(true)}
            >
              Add Memory
            </Button>
          )}
        </div>

        {/* Add Memory Form */}
        {showAddMemory && (
          <AddMemoryForm
            onSubmit={handleAddMemory}
            onCancel={() => setShowAddMemory(false)}
            submitting={submittingMemory}
          />
        )}

        {/* Memory Grid */}
        {hubData.memories.length === 0 ? (
          <EmptyState
            icon="photo_camera"
            title="No memories yet"
            description="Capture your trip moments and share them with your travel companions."
            action={{
              label: "Add First Memory",
              onClick: () => setShowAddMemory(true),
            }}
            className="mt-8"
          />
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {hubData.memories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                canDelete={memory.userId === myId}
                onDelete={handleDeleteMemory}
                onOpen={setPreviewMemory}
              />
            ))}
          </div>
        )}

        <MemoryPreview memory={previewMemory} onClose={() => setPreviewMemory(null)} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main Hub View
  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
          aria-label="Go back"
        >
          <Icon name="arrow_back" size={22} />
        </button>
        <h2 className="text-title-lg font-semibold text-on-surface">
          Trip Hub
        </h2>
      </div>

      {/* Status Banner */}
      <StatusBanner
        tripTitle={hubData.tripTitle}
        currentDay={hubData.currentDay}
        totalDays={hubData.duration}
        destination={hubData.destination}
        coverImage={hubData.coverImage}
      />

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-label-sm text-on-surface-variant mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <QuickActionButton
            icon="sos"
            label="SOS Emergency"
            color="red"
            onClick={() => router.push("/emergency")}
          />
          <QuickActionButton
            icon="my_location"
            label={locating ? "Locating…" : "Live Location"}
            color="blue"
            onClick={shareLiveLocation}
          />
          <div className="relative">
            <QuickActionButton
              icon="chat"
              label="Group Chat"
              color="orange"
              onClick={() => router.push(`/trips/${tripId}/chat`)}
            />
            {chatUnread > 0 && (
              <Badge count={chatUnread} position="absolute" />
            )}
          </div>
          <QuickActionButton
            icon="music_note"
            label="Playlist"
            color="purple"
            onClick={() => setSection("playlist")}
          />
          <QuickActionButton
            icon="photo_camera"
            label="Memory Journal"
            color="green"
            onClick={() => setSection("journal")}
          />
          <QuickActionButton
            icon="call"
            label="Shepherd"
            color="default"
            onClick={() =>
              hubData.tripCaptain.phone
                ? window.open(`tel:${hubData.tripCaptain.phone}`)
                : toastError("Your Shepherd's number isn't available yet")
            }
          />
          {hubData.isCaptain && (
            <QuickActionButton
              icon="qr_code_scanner"
              label="Verify Tickets"
              color="green"
              onClick={() => router.push("/verify")}
            />
          )}
        </div>
      </div>

      {/* Recent Memories Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-label-sm text-on-surface-variant">
            Recent Memories
          </h3>
          {hubData.memories.length > 0 && (
            <button
              onClick={() => setSection("journal")}
              className="text-label-lg font-semibold text-primary"
            >
              View All
            </button>
          )}
        </div>

        {hubData.memories.length === 0 ? (
          <Card
            variant="outlined"
            clickable
            className="flex flex-col items-center justify-center py-8"
            onClick={() => {
              setSection("journal");
              setShowAddMemory(true);
            }}
          >
            <Icon name="add_photo_alternate" size={36} className="text-on-surface-variant mb-2" />
            <p className="text-body-md text-on-surface-variant">
              Capture your first memory
            </p>
          </Card>
        ) : (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {hubData.memories.slice(0, 6).map((memory) => (
              <button
                key={memory.id}
                type="button"
                onClick={() => setPreviewMemory(memory)}
                className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl shadow-card"
                aria-label="Open photo"
              >
                <Image
                  src={memory.imageUrl}
                  alt={memory.caption || "Trip memory"}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </button>
            ))}
            {hubData.memories.length > 6 && (
              <button
                onClick={() => setSection("journal")}
                className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant"
              >
                <Icon name="photo_library" size={24} />
                <span className="text-label-sm mt-1">
                  +{hubData.memories.length - 6} more
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Your Shepherd */}
      <div>
        <h3 className="text-label-sm text-on-surface-variant mb-3">Your Shepherd</h3>
        <Card variant="outlined" className="flex items-center gap-3 p-3">
          <Avatar
            src={hubData.tripCaptain.avatar}
            name={hubData.tripCaptain.name}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-label-sm text-on-surface-variant">Shepherd</p>
            <p className="text-label-lg font-semibold text-on-surface truncate">
              {hubData.tripCaptain.name}
            </p>
            {hubData.tripCaptain.city && (
              <p className="text-label-sm text-on-surface-variant flex items-center gap-1">
                <Icon name="location_city" size={14} />
                {hubData.tripCaptain.city}
              </p>
            )}
          </div>
          {hubData.tripCaptain.phone && (
            <Button
              size="sm"
              variant="secondary"
              icon={<Icon name="call" size={16} />}
              onClick={() => window.open(`tel:${hubData.tripCaptain.phone}`)}
            >
              Call
            </Button>
          )}
        </Card>
      </div>

      {/* Safety Info */}
      <SafetyInfoCard />

      <MemoryPreview memory={previewMemory} onClose={() => setPreviewMemory(null)} />
    </div>
  );
}
