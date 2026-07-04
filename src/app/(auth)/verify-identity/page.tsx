"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { GlassCard } from "@/components/ui/glass-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import { maskAadhaar } from "@/lib/utils";

export default function VerifyIdentityPage() {
  const router = useRouter();

  const [aadhaar, setAadhaar] = useState("");
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Aadhaar is 12 digits
  const cleanAadhaar = aadhaar.replace(/\s/g, "");
  const isValidAadhaar = /^\d{12}$/.test(cleanAadhaar);
  const canSubmit = isValidAadhaar && selfiePreview && !isUploading;

  // Format aadhaar with spaces every 4 digits
  function formatAadhaarInput(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function handleAadhaarChange(e: ChangeEvent<HTMLInputElement>) {
    const formatted = formatAadhaarInput(e.target.value);
    setAadhaar(formatted);
    if (error) setError("");
  }

  function handleSelfieSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    setSelfieFile(file);
    setError("");

    // Generate preview
    const reader = new FileReader();
    reader.onload = () => setSelfiePreview(reader.result as string);
    reader.readAsDataURL(file);

    // Simulate upload progress
    simulateUpload();
  }

  function simulateUpload() {
    setIsUploading(true);
    setUploadProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setIsUploading(false);
      }
      setUploadProgress(Math.min(progress, 100));
    }, 300);
  }

  function handleRemoveSelfie() {
    setSelfieFile(null);
    setSelfiePreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    try {
      // In production, you would upload the selfie to storage first
      // and get back a URL. Here we simulate it.
      const selfieUrl = selfiePreview ?? "";

      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aadhaarNumber: cleanAadhaar,
          selfieUrl,
          idVerified: true,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Verification failed. Please try again.");
        return;
      }

      router.push("/verification-complete");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary-container/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-secondary-container/20 blur-3xl"
        aria-hidden="true"
      />

      <GlassCard className="w-full max-w-md space-y-6 p-6 md:max-w-xl md:p-8">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-body-md text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <Icon name="arrow_back" size={20} />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed">
            <Icon name="verified_user" size={28} className="text-primary" />
          </div>
          <h1 className="text-headline-md font-headline-md text-on-surface">
            Verify Your Identity
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            We need to verify your identity for safe travels
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Aadhaar Input */}
          <div className="space-y-1.5">
            <Input
              label="Aadhaar Number"
              placeholder="XXXX XXXX XXXX"
              type="text"
              inputMode="numeric"
              value={aadhaar}
              onChange={handleAadhaarChange}
              fullWidth
              inputSize="lg"
              iconLeft={
                <Icon name="badge" size={20} />
              }
            />
            {isValidAadhaar && (
              <p className="text-label-sm text-on-surface-variant">
                Masked: {maskAadhaar(cleanAadhaar)}
              </p>
            )}
          </div>

          {/* Selfie Upload */}
          <div className="space-y-2">
            <label className="text-label-lg font-semibold text-on-surface">
              Take a Selfie
            </label>

            {!selfiePreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-outline-variant p-8",
                  "bg-surface-container-low transition-all duration-200",
                  "hover:border-primary hover:bg-primary-fixed/5"
                )}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container">
                  <Icon
                    name="photo_camera"
                    size={28}
                    className="text-on-surface-variant"
                  />
                </div>
                <div className="text-center">
                  <p className="text-body-md font-medium text-on-surface">
                    Upload a clear selfie
                  </p>
                  <p className="text-label-sm text-on-surface-variant">
                    JPG, PNG up to 5MB
                  </p>
                </div>
              </button>
            ) : (
              <div className="relative overflow-hidden rounded-xl border-2 border-primary bg-surface-container-low">
                <img
                  src={selfiePreview}
                  alt="Selfie preview"
                  className="h-48 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveSelfie}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-inverse-surface/80 text-inverse-on-surface transition-colors hover:bg-inverse-surface"
                >
                  <Icon name="close" size={18} />
                </button>

                {/* Upload progress overlay */}
                {isUploading && (
                  <div className="absolute inset-x-0 bottom-0 bg-inverse-surface/60 px-4 py-3 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <ProgressBar
                        value={uploadProgress}
                        className="flex-1"
                        color="primary"
                      />
                      <span className="text-label-sm font-medium text-inverse-on-surface">
                        {Math.round(uploadProgress)}%
                      </span>
                    </div>
                  </div>
                )}

                {!isUploading && uploadProgress === 100 && (
                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-success/90 px-4 py-2">
                    <Icon name="check_circle" size={18} className="text-on-success" />
                    <span className="text-label-sm font-medium text-on-success">
                      Uploaded successfully
                    </span>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleSelfieSelect}
              className="hidden"
              aria-label="Upload selfie"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-center text-label-sm text-error" role="alert">
              {error}
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            disabled={!canSubmit}
            className="rounded-full"
          >
            Submit Verification
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
