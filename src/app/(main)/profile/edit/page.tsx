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
// Validation — email removed (now changes via OTP flow)
// ---------------------------------------------------------------------------

const editProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long"),
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
// Inline OTP verification hook
// ---------------------------------------------------------------------------

function useInlineOtp(channel: "phone" | "email") {
  const [editMode, setEditMode] = useState(false);
  const [value, setValue] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEditMode(false);
    setValue("");
    setOtp("");
    setOtpSent(false);
    setSending(false);
    setVerifying(false);
    setError(null);
  };

  const sendOtp = async () => {
    setError(null);
    setSending(true);
    try {
      const body = channel === "phone" ? { phone: value } : { email: value };
      const res = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send OTP");
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const verify = async (): Promise<boolean> => {
    setError(null);
    setVerifying(true);
    try {
      const url =
        channel === "phone"
          ? "/api/users/change-phone"
          : "/api/users/change-email";
      const body =
        channel === "phone"
          ? { phone: value, otp }
          : { email: value, otp };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Verification failed");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      return false;
    } finally {
      setVerifying(false);
    }
  };

  return {
    editMode,
    setEditMode,
    value,
    setValue,
    otp,
    setOtp,
    otpSent,
    sending,
    verifying,
    error,
    sendOtp,
    verify,
    reset,
  };
}

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

  const phoneOtp = useInlineOtp("phone");
  const emailOtp = useInlineOtp("email");

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

  const handlePhoneVerify = async () => {
    const ok = await phoneOtp.verify();
    if (ok) {
      toastSuccess("Phone number updated");
      phoneOtp.reset();
      fetchUser();
    }
  };

  const handleEmailVerify = async () => {
    const ok = await emailOtp.verify();
    if (ok) {
      toastSuccess("Email updated");
      emailOtp.reset();
      fetchUser();
    }
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

        {/* Phone — read-only with inline OTP change flow */}
        <div className="flex flex-col gap-1.5">
          <label className="text-label-lg font-semibold text-on-surface">
            Phone Number
          </label>

          {!phoneOtp.editMode ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-12 rounded-xl bg-surface-container-low border border-outline-variant px-4 flex items-center text-body-lg text-on-surface">
                {user?.phone ? `+91 ${user.phone}` : "Not added"}
              </div>
              <button
                type="button"
                onClick={() => phoneOtp.setEditMode(true)}
                className="text-label-lg text-primary font-semibold whitespace-nowrap"
              >
                {user?.phone ? "Change" : "Add"}
              </button>
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-outline-variant p-4 bg-surface-container-lowest">
              <div className="flex gap-2">
                <Input
                  placeholder="10-digit phone"
                  countryCode="+91"
                  value={phoneOtp.value}
                  onChange={(e) => phoneOtp.setValue(e.target.value)}
                  disabled={phoneOtp.otpSent}
                  fullWidth
                />
                {!phoneOtp.otpSent && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={phoneOtp.sendOtp}
                    loading={phoneOtp.sending}
                    disabled={!/^[6-9]\d{9}$/.test(phoneOtp.value)}
                  >
                    Send OTP
                  </Button>
                )}
              </div>

              {phoneOtp.otpSent && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter OTP"
                    value={phoneOtp.otp}
                    onChange={(e) => phoneOtp.setOtp(e.target.value)}
                    maxLength={6}
                    fullWidth
                  />
                  <Button
                    type="button"
                    onClick={handlePhoneVerify}
                    loading={phoneOtp.verifying}
                    disabled={phoneOtp.otp.length !== 6}
                  >
                    Verify
                  </Button>
                </div>
              )}

              {phoneOtp.error && (
                <p className="text-label-sm text-error">{phoneOtp.error}</p>
              )}

              <button
                type="button"
                onClick={phoneOtp.reset}
                className="text-label-md text-on-surface-variant"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Email — read-only with inline OTP change flow */}
        <div className="flex flex-col gap-1.5">
          <label className="text-label-lg font-semibold text-on-surface">
            Email
          </label>

          {!emailOtp.editMode ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-12 rounded-xl bg-surface-container-low border border-outline-variant px-4 flex items-center text-body-lg text-on-surface">
                {user?.email || "Not added"}
              </div>
              <button
                type="button"
                onClick={() => emailOtp.setEditMode(true)}
                className="text-label-lg text-primary font-semibold whitespace-nowrap"
              >
                {user?.email ? "Change" : "Add"}
              </button>
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-outline-variant p-4 bg-surface-container-lowest">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={emailOtp.value}
                  onChange={(e) => emailOtp.setValue(e.target.value)}
                  disabled={emailOtp.otpSent}
                  fullWidth
                />
                {!emailOtp.otpSent && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={emailOtp.sendOtp}
                    loading={emailOtp.sending}
                    disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOtp.value)}
                  >
                    Send OTP
                  </Button>
                )}
              </div>

              {emailOtp.otpSent && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter OTP"
                    value={emailOtp.otp}
                    onChange={(e) => emailOtp.setOtp(e.target.value)}
                    maxLength={6}
                    fullWidth
                  />
                  <Button
                    type="button"
                    onClick={handleEmailVerify}
                    loading={emailOtp.verifying}
                    disabled={emailOtp.otp.length !== 6}
                  >
                    Verify
                  </Button>
                </div>
              )}

              {emailOtp.error && (
                <p className="text-label-sm text-error">{emailOtp.error}</p>
              )}

              <button
                type="button"
                onClick={emailOtp.reset}
                className="text-label-md text-on-surface-variant"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

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
