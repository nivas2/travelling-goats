"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  rightAction?: ReactNode;
  onBack?: () => void;
  className?: string;
}

export function PageHeader({
  title,
  rightAction,
  onBack,
  className,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full",
        "bg-surface/95 backdrop-blur-md",
        "border-b border-outline-variant/10",
        className
      )}
    >
      <div className="flex items-center justify-between px-2 py-2 md:px-4">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className={cn(
            "flex items-center justify-center",
            "h-10 w-10 rounded-full",
            "hover:bg-surface-container-high",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          )}
          aria-label="Go back"
        >
          <span className="material-symbols-outlined text-[22px] text-on-surface">
            arrow_back
          </span>
        </button>

        {/* Title */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-title-md font-semibold text-on-surface truncate max-w-[60%] text-center">
          {title}
        </h1>

        {/* Right Action */}
        <div className="flex items-center min-w-[40px] justify-end">
          {rightAction || <span className="h-10 w-10" />}
        </div>
      </div>
    </header>
  );
}
