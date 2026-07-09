/**
 * Forest × lime brand lockup used in app chrome (top nav, etc.). Renders a
 * forest badge with a lime mountain glyph + the "Travelling Goats" wordmark.
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
        className={`flex items-center justify-center bg-[#181D27] transition-transform duration-300 group-hover:-rotate-6 ${badge}`}
      >
        <span
          className={`material-symbols-outlined text-[#C6F135] ${icon}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          landscape
        </span>
      </span>
      <span
        className={`font-bold leading-none tracking-[-0.01em] ${text} ${onDark ? "text-white" : "text-[#181D27]"}`}
      >
        Travelling <span className={onDark ? "text-[#C6F135]" : "text-[#181D27]"}>Goats</span>
      </span>
    </span>
  );
}
