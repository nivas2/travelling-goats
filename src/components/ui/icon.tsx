import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  /** Material Symbols icon name (e.g. "home", "search", "favorite") */
  name: string;
  /** Icon size in pixels. Defaults to 24. */
  size?: number;
  /** Use the filled variant of the icon */
  filled?: boolean;
}

const Icon = forwardRef<HTMLSpanElement, IconProps>(
  ({ name, size = 24, filled = false, className, style, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "material-symbols-outlined select-none",
        filled && "filled",
        className
      )}
      style={{
        fontSize: size,
        width: size,
        height: size,
        lineHeight: `${size}px`,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  )
);

Icon.displayName = "Icon";

export { Icon };
