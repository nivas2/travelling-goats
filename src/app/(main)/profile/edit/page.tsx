"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { Dropdown } from "@/components/ui/dropdown";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const editProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long"),
  email: z.string().email("Invalid email address").or(z.literal("")),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  city: z.string().max(100, "City name is too long").optional(),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GENDER_OPTIONS = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Non-binary", value: "NON_BINARY" },
  { label: "Prefer not to say", value: "PREFER_NOT_TO_SAY" },
];

const ALL_INTERESTS = [
  "Trekking",
  "Beach",
  "Mountains",
  "Wildlife",
  "Heritage",
  "Adventure Sports",
  "Photography",
  "Camping",
  "Road Trips",
  "Backpacking",
  "Spiritual",
  "Food Tours",
  "Nightlife",
  "Water Sports",
  "Cycling",
  "Skiing",
  "Cultural",
  "Wellness",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EditProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      dateOfBirth: "",
      gender: "",
      city: "",
      bio: "",
    },
  });

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to load profile");
      const json = await res.json();
      const userData: UserProfile = json.data ?? json;
      setUser(userData);
      setSelectedInterests(userData.interests ?? []);
      setAvatarPreview(userData.avatar);
      reset({
        name: userData.name ?? "",
        email: userData.email ?? "",
        dateOfBirth: userData.dateOfBirth
          ? new Date(userData.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: userData.gender ?? "",
        city: userData.city ?? "",
        bio: userData.bio ?? "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const onSubmit = async (formData: EditProfileFormData) => {
    try {
      setSaving(true);

      const body: Record<string, unknown> = {
        ...formData,
        interests: selectedInterests,
      };

      // Remove empty optional fields so they don't cause validation errors
      if (!body.gender) delete body.gender;
      if (!body.dateOfBirth) delete body.dateOfBirth;

      // If there is an avatar file, we would normally upload it first.
      // For now we include the preview (base64) or existing URL.
      if (avatarFile) {
        body.avatar = avatarPreview;
      }

      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to save profile");
      }

      toastSuccess("Profile updated successfully");
      router.push("/profile");
    } catch (err) {
      toastError(
        err instanceof Error ? err.message : "Failed to save profile"
      );
    } finally {
      setSaving(false);
    }
  };

  // -- Loading ---------------------------------------------------------------

  if (loading) {
    return (
      <div className="px-5 py-6 space-y-6">
        <div className="flex justify-center">
          <Skeleton variant="circular" diameter={80} />
        </div>
        <Skeleton variant="card" height={56} />
        <Skeleton variant="card" height={56} />
        <Skeleton variant="card" height={56} />
        <Skeleton variant="card" height={56} />
        <Skeleton variant="card" height={100} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-6">
        <EmptyState
          icon="error"
          title="Could not load profile"
          description={error}
          action={{ label: "Retry", onClick: fetchUser }}
        />
      </div>
    );
  }

  return (
    <div className="px-5 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <Icon name="arrow_back" size={24} />
        </button>
        <h1 className="text-title-lg font-title-lg text-on-surface">
          Edit Profile
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Avatar upload */}
        <div className="flex flex-col items-center mb-1">
          <div className="relative">
            <Avatar
              src={avatarPreview}
              name={user?.name ?? "U"}
              size="xl"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary shadow-elevated"
            >
              <Icon name="camera_alt" size={16} />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 text-label-lg text-primary font-label-lg"
          >
            Change Photo
          </button>
        </div>

        {/* Name */}
        <Input
          label="Full Name"
          placeholder="Your full name"
          error={errors.name?.message}
          {...register("name")}
        />

        {/* Email */}
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        {/* Date of Birth */}
        <Input
          label="Date of Birth"
          type="date"
          error={errors.dateOfBirth?.message}
          {...register("dateOfBirth")}
        />

        {/* Gender */}
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <Dropdown
              label="Gender"
              options={GENDER_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select gender"
            />
          )}
        />

        {/* City */}
        <Input
          label="City"
          placeholder="e.g. Mumbai"
          error={errors.city?.message}
          {...register("city")}
        />

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-label-lg font-semibold text-on-surface">
            Bio
          </label>
          <textarea
            placeholder="Tell us a bit about yourself..."
            rows={3}
            maxLength={500}
            className={cn(
              "w-full rounded-xl bg-surface-container-low text-on-surface",
              "border border-outline-variant px-4 py-3 text-body-lg",
              "placeholder:text-on-surface-variant/50",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
              "resize-none",
              errors.bio && "border-error focus:ring-error focus:border-error"
            )}
            {...register("bio")}
          />
          {errors.bio && (
            <p className="text-label-sm text-error">{errors.bio.message}</p>
          )}
        </div>

        {/* Interests */}
        <div>
          <label className="text-label-lg font-semibold text-on-surface mb-3 block">
            Interests
          </label>
          <div className="flex flex-wrap gap-3">
            {ALL_INTERESTS.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <Chip
                  key={interest}
                  variant={isSelected ? "selected" : "outlined"}
                  color="primary"
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Chip>
              );
            })}
          </div>
        </div>

        {/* Save */}
        <div className="pt-2 pb-4">
          <Button
            type="submit"
            fullWidth
            loading={saving}
            disabled={!isDirty && !avatarFile && JSON.stringify([...selectedInterests].sort()) === JSON.stringify([...(user?.interests ?? [])].sort())}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
