"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
} from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  /** Renders a country code prefix (e.g. "+91") before the input */
  countryCode?: string;
  /** Controls the visual size of the input */
  inputSize?: "sm" | "md" | "lg";
  /** Wraps input in full-width container */
  fullWidth?: boolean;
}

const inputSizeStyles: Record<NonNullable<InputProps["inputSize"]>, string> = {
  sm: "h-10 text-body-md px-3",
  md: "h-12 text-body-lg px-4",
  lg: "h-14 text-body-lg px-5",
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      iconLeft,
      iconRight,
      countryCode,
      inputSize = "md",
      fullWidth = false,
      type = "text",
      id: externalId,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const id = externalId ?? autoId;

    const hasLeftAdornment = !!iconLeft || !!countryCode;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={id}
            className="text-label-lg font-semibold text-on-surface"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {/* Left icon */}
          {iconLeft && !countryCode && (
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-on-surface-variant">
              {iconLeft}
            </span>
          )}

          {/* Country code prefix */}
          {countryCode && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-on-surface-variant font-medium text-body-md border-r border-outline-variant pr-3">
              {countryCode}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            type={type}
            className={cn(
              "w-full rounded-xl bg-surface-container-low text-on-surface",
              "border border-outline-variant",
              "placeholder:text-on-surface-variant/50",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
              "disabled:cursor-not-allowed disabled:opacity-50",
              inputSizeStyles[inputSize],
              hasLeftAdornment && !countryCode && "pl-11",
              countryCode && "pl-[4.5rem]",
              iconRight && "pr-11",
              error &&
                "border-error focus:ring-error focus:border-error",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${id}-error` : helperText ? `${id}-helper` : undefined
            }
            {...props}
          />

          {/* Right icon */}
          {iconRight && (
            <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-on-surface-variant">
              {iconRight}
            </span>
          )}
        </div>

        {error && (
          <p
            id={`${id}-error`}
            className="text-label-sm text-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${id}-helper`}
            className="text-label-sm text-on-surface-variant"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
