"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export default function VerificationCompletePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [showContent, setShowContent] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  // Staggered entrance animation
  useEffect(() => {
    const checkTimer = setTimeout(() => setShowCheck(true), 300);
    const contentTimer = setTimeout(() => setShowContent(true), 800);
    return () => {
      clearTimeout(checkTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  function handleContinue() {
    const user = session?.user as Record<string, unknown> | undefined;
    if (user?.isOnboarded) {
      router.push("/home");
    } else {
      router.push("/welcome");
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5">
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-success-container/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-primary-container/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center md:max-w-xl">
        {/* Animated Checkmark */}
        <div
          className={cn(
            "relative flex h-28 w-28 items-center justify-center transition-all duration-700",
            showCheck
              ? "scale-100 opacity-100"
              : "scale-50 opacity-0"
          )}
        >
          {/* Outer ring */}
          <div className="absolute inset-0 animate-ping rounded-full bg-success/20" />
          <div className="absolute inset-0 rounded-full bg-success/10" />

          {/* Inner circle */}
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-success shadow-lg">
            <Icon
              name="check"
              size={48}
              className={cn(
                "text-on-success transition-all duration-500 delay-300",
                showCheck ? "scale-100 opacity-100" : "scale-0 opacity-0"
              )}
            />
          </div>
        </div>

        {/* Text Content */}
        <div
          className={cn(
            "space-y-3 transition-all duration-700",
            showContent
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          )}
        >
          <h1 className="text-headline-lg font-headline-lg text-on-surface">
            Verified Successfully
          </h1>
          <p className="text-body-lg text-on-surface-variant">
            Your identity has been verified. You can now enjoy the full
            PackAlong experience with trusted travelers.
          </p>
        </div>

        {/* Trust badges */}
        <div
          className={cn(
            "flex gap-6 transition-all duration-700 delay-200",
            showContent
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          )}
        >
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-container">
              <Icon name="shield" size={20} className="text-success" filled />
            </div>
            <span className="text-label-sm text-on-surface-variant">
              Verified
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed">
              <Icon name="group" size={20} className="text-primary" filled />
            </div>
            <span className="text-label-sm text-on-surface-variant">
              Trusted
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-fixed">
              <Icon
                name="travel_explore"
                size={20}
                className="text-secondary"
                filled
              />
            </div>
            <span className="text-label-sm text-on-surface-variant">
              Ready
            </span>
          </div>
        </div>

        {/* Continue button */}
        <div
          className={cn(
            "w-full transition-all duration-700 delay-500",
            showContent
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          )}
        >
          <Button
            type="button"
            fullWidth
            size="lg"
            onClick={handleContinue}
            className="rounded-full"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
