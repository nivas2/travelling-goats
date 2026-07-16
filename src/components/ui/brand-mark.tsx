/**
 * Forest × lime brand lockup used in app chrome (top nav, etc.). Renders a
 * forest badge with a lime mountain glyph + the "Meet My Route" wordmark.
 * Non-link by design so callers can wrap it in their own <Link>.
 */
export function BrandMark({
  size = "sm",
  onDark = false,
}: {
  size?: "sm" | "md";
  onDark?: boolean;
}) {
  const badge = size === "md" ? "h-11 w-11 rounded-2xl" : "h-9 w-9 rounded-xl";
  const icon = size === "md" ? "text-[24px]" : "text-[20px]";
  const text = size === "md" ? "text-[21px]" : "text-[18px]";
  return (
    <span className="group inline-flex items-center gap-2.5">
      <span
        className={`flex items-center justify-center bg-primary transition-transform duration-300 group-hover:-rotate-6 ${badge}`}
      >
        <span
          className={`material-symbols-outlined text-lime ${icon}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          landscape
        </span>
      </span>
      <span
        className={`font-bold leading-none tracking-[-0.01em] ${text} ${onDark ? "text-white" : "text-on-surface"}`}
      >
        Meet My <span className={onDark ? "text-lime" : "text-on-surface"}>Route</span>
      </span>
    </span>
  );
}
