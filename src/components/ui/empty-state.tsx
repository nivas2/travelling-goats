import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Button, type ButtonProps } from "@/components/ui/button";

export interface EmptyStateProps {
  /** Material Symbols icon name */
  icon?: string;
  /** Custom icon element (overrides `icon` string) */
  iconElement?: ReactNode;
  title: string;
  description?: string;
  /** Primary action button config */
  action?: {
    label: string;
    onClick: () => void;
  } & Partial<Pick<ButtonProps, "variant" | "icon" | "loading">>;
  /** Optional secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  iconElement,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-12",
        className
      )}
    >
      {/* Icon */}
      {(icon || iconElement) && (
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container">
          {iconElement ?? (
            <Icon
              name={icon!}
              size={40}
              className="text-on-surface-variant"
            />
          )}
        </div>
      )}

      {/* Title */}
      <h3 className="text-title-lg font-semibold text-on-surface">{title}</h3>

      {/* Description */}
      {description && (
        <p className="mt-2 max-w-xs text-body-md text-on-surface-variant">
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
          {action && (
            <Button
              variant={action.variant ?? "primary"}
              icon={action.icon}
              loading={action.loading}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
