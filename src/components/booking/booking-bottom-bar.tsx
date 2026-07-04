"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface BookingBottomBarProps {
  step: number;
  totalSteps: number;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
  isLoading?: boolean;
  priceSummary?: {
    label: string;
    amountPaise: number;
  };
  /** Extra content (e.g. skip button) rendered before the next button */
  leftAction?: React.ReactNode;
  /** Custom content to replace the back arrow (e.g. motivational text) */
  leftContent?: React.ReactNode;
}

export function BookingBottomBar({
  step,
  totalSteps,
  onNext,
  onBack,
  nextLabel = "Keep Trekking",
  isNextDisabled = false,
  isLoading = false,
  priceSummary,
  leftAction,
  leftContent,
}: BookingBottomBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/10 bg-surface/95 backdrop-blur-md pb-safe">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Left side: custom content / back + price info */}
        <div className="flex flex-1 items-center gap-3">
          {leftContent ? (
            leftContent
          ) : (
            <>
              {onBack && step > 1 && (
                <button
                  type="button"
                  onClick={onBack}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-surface-container transition-colors"
                  aria-label="Go back"
                >
                  <span className="material-symbols-outlined text-[22px] text-on-surface-variant">
                    arrow_back
                  </span>
                </button>
              )}

              {priceSummary && (
                <div className="min-w-0">
                  <p className="text-label-sm text-on-surface-variant truncate">
                    {priceSummary.label}
                  </p>
                  <p className="text-title-md font-title-md text-primary">
                    {formatCurrency(priceSummary.amountPaise)}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right side: actions */}
        <div className="flex items-center gap-2">
          {leftAction}
          <Button
            size="lg"
            onClick={onNext}
            disabled={isNextDisabled}
            loading={isLoading}
            className="min-w-[120px]"
          >
            {nextLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
