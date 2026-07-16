"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

/** "Refer & earn" banner for the logged-in Home.
 *  Copy/share a referral link — both the sender and the friend get a reward.
 *  `code` should be the user's real referral code when wired to the backend. */
export function ReferralCard({ code = "GOATS500", reward = "₹500" }: { code?: string; reward?: string }) {
  const [copied, setCopied] = useState(false);

  const link = () =>
    (typeof window !== "undefined" ? window.location.origin : "https://meetmyroute.com") +
    "/?ref=" +
    encodeURIComponent(code);

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(link());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  const share = async () => {
    const url = link();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Meet My Route",
          text: `Join me on Meet My Route — use my code ${code} and we both get ${reward} off your first trail.`,
          url,
        });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    copy();
  };

  return (
    <section className="mt-8 px-5">
      <div className="relative overflow-hidden rounded-[28px] bg-primary p-6 text-on-primary md:p-8">
        {/* decorative lime glow */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-lime/25 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* copy */}
          <div className="max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/15 px-3 py-1 text-[12px] font-semibold text-lime">
              <Icon name="redeem" size={14} filled />
              Refer &amp; earn
            </span>
            <h2 className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.01em] md:text-[30px]">
              Invite a friend, you both get {reward}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-on-primary/70">
              Share your code. When they book their first trail, {reward} lands in both your wallets.
            </p>
          </div>

          {/* actions */}
          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex items-center justify-between gap-2 rounded-full border border-white/15 bg-white/[0.06] py-1.5 pl-4 pr-1.5">
              <span className="font-mono text-[15px] font-bold tracking-[0.16em] text-lime">{code}</span>
              <button
                type="button"
                onClick={copy}
                className="flex h-9 items-center gap-1.5 rounded-full bg-lime px-4 text-[13px] font-semibold text-on-lime transition-transform active:scale-[0.97]"
              >
                <Icon name={copied ? "check" : "content_copy"} size={16} />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <button
              type="button"
              onClick={share}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-on-primary/70 transition-colors hover:text-on-primary"
            >
              <Icon name="ios_share" size={15} />
              or share invite link
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
