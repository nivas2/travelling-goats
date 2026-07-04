"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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

type HubSection = "main" | "journal" | "companions" | "playlist";

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
  const colorStyles = {
    default: "bg-surface-container-low text-on-surface hover:bg-surface-container",
    red: "bg-error text-on-error hover:bg-error/90 shadow-lg",
    blue: "bg-secondary text-on-secondary hover:bg-secondary/90",
    green: "bg-success text-on-success hover:bg-success/90",
    orange: "bg-warning text-on-surface hover:bg-warning/90",
    purple: "bg-tertiary text-on-tertiary hover:bg-tertiary/90",
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/90 px-3 py-1 text-label-sm font-semibold text-on-success">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-on-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-on-success" />
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

function MemoryCard({ memory }: { memory: MemoryData }) {
  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-card">
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={memory.imageUrl}
          alt={memory.caption || "Trip memory"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
      </div>
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
// Companion Card
// ---------------------------------------------------------------------------

function CompanionCard({ companion }: { companion: CompanionData }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-3">
      <Avatar
        src={companion.avatar}
        name={companion.name}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-label-lg font-semibold text-on-surface truncate">
            {companion.name}
          </p>
          {companion.isCaptain && (
            <Badge variant="default" className="text-[10px] px-1.5 h-4">
              Captain
            </Badge>
          )}
        </div>
        <p className="text-label-sm text-on-surface-variant flex items-center gap-1">
          <Icon name="location_city" size={14} />
          {companion.city || "Unknown City"}
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
        <div className="mt-3 space-y-2 border-t border-outline-variant pt-3">
          <div className="flex items-center gap-2 text-body-md text-on-surface">
            <Icon name="emergency" size={18} className="text-error" />
            <span>Emergency: 112</span>
          </div>
          <div className="flex items-center gap-2 text-body-md text-on-surface">
            <Icon name="local_police" size={18} className="text-secondary" />
            <span>Police: 100</span>
          </div>
          <div className="flex items-center gap-2 text-body-md text-on-surface">
            <Icon name="local_hospital" size={18} className="text-error" />
            <span>Ambulance: 108</span>
          </div>
          <div className="flex items-center gap-2 text-body-md text-on-surface">
            <Icon name="fire_truck" size={18} className="text-warning" />
            <span>Fire: 101</span>
          </div>
          <p className="mt-2 text-label-sm text-on-surface-variant">
            Keep your phone charged. Share your live location with your emergency
            contact. Stay with the group and follow the Trip Captain&apos;s
            instructions.
          </p>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Spotify-like Playlist Placeholder
// ---------------------------------------------------------------------------

function PlaylistSection({ onBack }: { onBack: () => void }) {
  const tracks = [
    { title: "Road Trip Vibes", artist: "Travel Beats", duration: "3:42" },
    { title: "Mountain Sunrise", artist: "Nature Sounds", duration: "4:15" },
    { title: "Coastal Breeze", artist: "Chill Waves", duration: "3:58" },
    { title: "Campfire Stories", artist: "Acoustic Mix", duration: "5:01" },
    { title: "Highway Winds", artist: "Indie Road", duration: "4:22" },
    { title: "Starlit Sky", artist: "Ambient Space", duration: "6:10" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
          aria-label="Go back"
        >
          <Icon name="arrow_back" size={22} />
        </button>
        <h2 className="text-title-lg font-semibold text-on-surface">
          Trip Playlist
        </h2>
      </div>

      <Card className="bg-inverse-surface text-inverse-on-surface p-0 overflow-hidden">
        {/* Playlist Header */}
        <div className="primary-gradient p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
              <Icon name="headphones" size={28} className="text-white" />
            </div>
            <div>
              <p className="text-label-sm text-white/70">TRIP PLAYLIST</p>
              <h3 className="text-title-md font-semibold text-white">
                Road Trip Mix
              </h3>
              <p className="text-label-sm text-white/70">
                {tracks.length} songs
              </p>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="divide-y divide-inverse-on-surface/10">
          {tracks.map((track, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 px-4 py-3 hover:bg-inverse-on-surface/5 transition-colors"
            >
              <span className="w-5 text-label-sm text-inverse-on-surface/50 text-center">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-body-md text-inverse-on-surface truncate">
                  {track.title}
                </p>
                <p className="text-label-sm text-inverse-on-surface/60">
                  {track.artist}
                </p>
              </div>
              <span className="text-label-sm text-inverse-on-surface/50">
                {track.duration}
              </span>
            </div>
          ))}
        </div>

        {/* Player Bar */}
        <div className="border-t border-inverse-on-surface/10 px-4 py-3">
          <p className="text-center text-label-sm text-inverse-on-surface/40">
            Connect your Spotify to listen together
          </p>
        </div>
      </Card>
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
  const { error: toastError } = useToast();
  const tripId = params.id;

  const [hubData, setHubData] = useState<TripHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<HubSection>("main");
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [submittingMemory, setSubmittingMemory] = useState(false);

  const fetchHubData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/hub`);
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

  useEffect(() => {
    fetchHubData();
  }, [fetchHubData]);

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
        <PlaylistSection onBack={() => setSection("main")} />
      </div>
    );
  }

  if (section === "journal") {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setSection("main")}
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
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (section === "companions") {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setSection("main")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
            aria-label="Go back"
          >
            <Icon name="arrow_back" size={22} />
          </button>
          <h2 className="text-title-lg font-semibold text-on-surface">
            Companions
          </h2>
          <Badge variant="secondary" className="ml-auto">
            {hubData.companions.length}
          </Badge>
        </div>

        <div className="space-y-3">
          {/* Sort: captain first */}
          {[...hubData.companions]
            .sort((a, b) => (b.isCaptain ? 1 : 0) - (a.isCaptain ? 1 : 0))
            .map((companion) => (
              <CompanionCard key={companion.id} companion={companion} />
            ))}
        </div>
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
            label="Live Location"
            color="blue"
            onClick={() => {
              /* Would open native maps or share location */
            }}
          />
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
            icon="group"
            label="Companions"
            color="orange"
            onClick={() => setSection("companions")}
          />
          <QuickActionButton
            icon="call"
            label="Trip Captain"
            color="default"
            onClick={() => window.open(`tel:${hubData.tripCaptain.phone}`)}
          />
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
              <div
                key={memory.id}
                className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl shadow-card"
              >
                <Image
                  src={memory.imageUrl}
                  alt={memory.caption || "Trip memory"}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>
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

      {/* Companions Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-label-sm text-on-surface-variant">
            Your Companions
          </h3>
          <button
            onClick={() => setSection("companions")}
            className="text-label-lg font-semibold text-primary"
          >
            View All
          </button>
        </div>

        <div className="flex -space-x-3">
          {hubData.companions.slice(0, 5).map((companion) => (
            <Avatar
              key={companion.id}
              src={companion.avatar}
              name={companion.name}
              size="lg"
              className="ring-3 ring-surface"
            />
          ))}
          {hubData.companions.length > 5 && (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high text-label-lg font-semibold text-on-surface-variant ring-3 ring-surface">
              +{hubData.companions.length - 5}
            </div>
          )}
        </div>

        {/* Trip Captain highlight */}
        <Card
          variant="outlined"
          className="mt-3 flex items-center gap-3 p-3"
        >
          <Avatar
            src={hubData.tripCaptain.avatar}
            name={hubData.tripCaptain.name}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-label-sm text-on-surface-variant">Trip Captain</p>
            <p className="text-label-lg font-semibold text-on-surface truncate">
              {hubData.tripCaptain.name}
            </p>
            <p className="text-label-sm text-on-surface-variant flex items-center gap-1">
              <Icon name="location_city" size={14} />
              {hubData.tripCaptain.city}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={<Icon name="call" size={16} />}
            onClick={() => window.open(`tel:${hubData.tripCaptain.phone}`)}
          >
            Call
          </Button>
        </Card>
      </div>

      {/* Safety Info */}
      <SafetyInfoCard />
    </div>
  );
}
