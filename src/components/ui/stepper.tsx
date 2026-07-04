import React from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type StepStatus = "completed" | "active" | "pending";

export interface Step {
  /** Displayed step number (1‑based). Auto‑generated from index if omitted. */
  number?: number;
  title: string;
  status: StepStatus;
}

export interface StepperProps {
  steps: Step[];
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function Stepper({ steps, className }: StepperProps) {
  return (
    <div
      className={cn("flex w-full items-center", className)}
      role="list"
      aria-label="Progress steps"
    >
      {steps.map((step, idx) => {
        const stepNumber = step.number ?? idx + 1;
        const isLast = idx === steps.length - 1;

        return (
          <React.Fragment key={idx}>
            {/* Step indicator */}
            <div className="flex flex-col items-center" role="listitem">
              {/* Circle */}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-label-lg transition-colors",
                  step.status === "completed" &&
                    "bg-primary text-on-primary",
                  step.status === "active" &&
                    "bg-primary text-on-primary ring-4 ring-primary-container",
                  step.status === "pending" &&
                    "bg-surface-container text-on-surface-variant",
                )}
              >
                {step.status === "completed" ? (
                  <span className="material-symbols-outlined text-[18px]">
                    check
                  </span>
                ) : (
                  <span className="text-label-lg font-label-lg">
                    {stepNumber}
                  </span>
                )}
              </div>

              {/* Title */}
              <span
                className={cn(
                  "mt-1.5 whitespace-nowrap text-label-sm font-label-sm",
                  step.status === "active"
                    ? "text-primary"
                    : step.status === "completed"
                      ? "text-on-surface"
                      : "text-on-surface-variant",
                )}
              >
                {step.title}
              </span>
            </div>

            {/* Connecting line */}
            {!isLast && (
              <div
                className={cn(
                  "mx-2 mb-5 h-0.5 flex-1",
                  steps[idx + 1]?.status !== "pending"
                    ? "bg-primary"
                    : "bg-surface-container",
                )}
                aria-hidden
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

Stepper.displayName = "Stepper";

export { Stepper };
