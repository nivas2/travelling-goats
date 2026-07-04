"use client";

import { forwardRef, useState, type ImgHTMLAttributes } from "react";
import { cn, getInitials } from "@/lib/utils";

export interface AvatarProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "size" | "src"> {
  /** Image source URL */
  src?: string | null;
  /** Full name used for initials fallback */
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Show a green online status dot */
  online?: boolean;
}

const sizeStyles: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-label-sm",
  md: "h-10 w-10 text-label-lg",
  lg: "h-14 w-14 text-title-md",
  xl: "h-20 w-20 text-title-lg",
};

const indicatorSizes: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "h-1.5 w-1.5 border",
  sm: "h-2 w-2 border-[1.5px]",
  md: "h-2.5 w-2.5 border-2",
  lg: "h-3 w-3 border-2",
  xl: "h-4 w-4 border-2",
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      src,
      name,
      alt,
      size = "md",
      online,
      ...props
    },
    ref
  ) => {
    const [imgError, setImgError] = useState(false);
    const showImage = !!src && !imgError;
    const initials = name ? getInitials(name) : "?";

    return (
      <div ref={ref} className={cn("relative inline-flex shrink-0", className)}>
        <div
          className={cn(
            "flex items-center justify-center rounded-full overflow-hidden",
            "bg-primary-container text-on-primary-container font-semibold",
            sizeStyles[size]
          )}
        >
          {showImage ? (
            <img
              src={src}
              alt={alt ?? name ?? "Avatar"}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
              {...props}
            />
          ) : (
            <span aria-label={name ?? "Avatar"}>{initials}</span>
          )}
        </div>

        {online !== undefined && (
          <span
            className={cn(
              "absolute bottom-0 right-0 rounded-full border-surface-container-lowest",
              online ? "bg-success" : "bg-outline",
              indicatorSizes[size]
            )}
            aria-label={online ? "Online" : "Offline"}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };
