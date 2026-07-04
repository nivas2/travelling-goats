"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export default function MainErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Auto-recover from chunk loading errors (stale cache after deployment).
    // ChunkLoadError means the browser has cached HTML that references old
    // JS chunks that no longer exist on the server.
    if (
      error.name === "ChunkLoadError" ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Failed to fetch dynamically imported module")
    ) {
      window.location.reload();
      return;
    }

    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <Icon
        name="error_outline"
        size={64}
        className="text-on-surface-variant/40"
      />
      <h2 className="mt-4 text-title-lg font-semibold text-on-surface">
        Something went wrong
      </h2>
      <p className="mt-2 text-body-md text-on-surface-variant max-w-sm">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="secondary" onClick={reset}>
          Try Again
        </Button>
        <Button onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </div>
    </div>
  );
}
