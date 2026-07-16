"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";

/**
 * Simple scaffold for static/info pages (About, Terms, Privacy, Refund).
 * Provides a back button + title header and a prose container.
 */
export function ContentPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-2xl px-5 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <Icon name="arrow_back" size={24} />
        </button>
        <div>
          <h1 className="text-title-lg font-title-lg text-on-surface">{title}</h1>
          {subtitle && (
            <p className="text-label-sm text-on-surface-variant">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="space-y-5 text-body-md text-on-surface [&_h2]:text-title-md [&_h2]:font-title-md [&_h2]:text-on-surface [&_h2]:mt-6 [&_h2]:mb-1.5 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </div>
  );
}
