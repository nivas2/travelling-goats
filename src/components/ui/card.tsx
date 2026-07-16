import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "solid";
  /** Makes the card clickable with hover effects */
  clickable?: boolean;
  /** Renders as a button element when true (for accessibility) */
  asButton?: boolean;
}

const variantStyles: Record<NonNullable<CardProps["variant"]>, string> = {
  default:
    "bg-white ring-1 ring-black/[0.06] shadow-[0_1px_3px_rgba(20,30,40,0.05)]",
  elevated:
    "bg-white ring-1 ring-black/[0.05] shadow-[0_12px_34px_rgba(20,30,40,0.10)]",
  outlined: "bg-white ring-1 ring-black/[0.08]",
  solid: "bg-white ring-1 ring-black/[0.06] shadow-[0_1px_3px_rgba(20,30,40,0.05)]",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "default",
      clickable = false,
      asButton = false,
      children,
      ...props
    },
    ref
  ) => {
    const classes = cn(
      "rounded-[20px] p-5",
      variantStyles[variant],
      clickable &&
        "cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(20,30,40,0.12)] active:scale-[0.99]",
      className
    );

    if (asButton) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={classes}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {children}
        </button>
      );
    }

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

/* ---------- Sub-components ---------- */

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1.5 pb-3", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-title-lg font-semibold text-on-surface", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-body-md text-on-surface-variant", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("py-2", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-2 pt-3", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
