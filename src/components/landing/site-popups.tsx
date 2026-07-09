"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Live activity toast — rotating social-proof "X from <city> just …" messages
// with local South-Indian names (Hyderabad / Bengaluru / Tamil Nadu).
// ---------------------------------------------------------------------------
const PEOPLE = [
  { name: "Sai Teja", city: "Hyderabad" },
  { name: "Anusha", city: "Hyderabad" },
  { name: "Ravi Teja", city: "Hyderabad" },
  { name: "Sravani", city: "Hyderabad" },
  { name: "Manikanta", city: "Hyderabad" },
  { name: "Praveen", city: "Bengaluru" },
  { name: "Deepika", city: "Bengaluru" },
  { name: "Kiran", city: "Bengaluru" },
  { name: "Chaitra", city: "Bengaluru" },
  { name: "Suhas", city: "Bengaluru" },
  { name: "Karthik", city: "Chennai" },
  { name: "Priyanka", city: "Madurai" },
  { name: "Vignesh", city: "Coimbatore" },
  { name: "Deepa", city: "Chennai" },
  { name: "Surya", city: "Trichy" },
];
const ACTIONS = ["just logged in", "just signed in", "is now online"];

function pick<T>(arr: T[], seed: number) {
  return arr[seed % arr.length];
}

export function LiveActivityToast() {
  const [item, setItem] = useState<{ name: string; city: string; action: string } | null>(null);

  useEffect(() => {
    let alive = true;
    let hideT: ReturnType<typeof setTimeout>;
    let nextT: ReturnType<typeof setTimeout>;
    let n = 0;

    const cycle = () => {
      if (!alive) return;
      n += 1;
      const p = pick(PEOPLE, Math.floor(Math.random() * PEOPLE.length) + n);
      const a = pick(ACTIONS, Math.floor(Math.random() * ACTIONS.length) + n);
      setItem({ name: p.name, city: p.city, action: a });
      hideT = setTimeout(() => alive && setItem(null), 5000);
      // Next toast in 3–5 minutes.
      nextT = setTimeout(cycle, 180000 + Math.random() * 120000);
    };

    // First toast shortly after load, then every few minutes.
    const startT = setTimeout(cycle, 6000);
    return () => {
      alive = false;
      clearTimeout(startT);
      clearTimeout(hideT);
      clearTimeout(nextT);
    };
  }, []);

  if (!item) return null;

  const initials = item.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="lp-activity fixed bottom-[13.5rem] left-3 z-[55] flex max-w-[300px] items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-2.5 pr-4 shadow-[0_16px_40px_rgba(20,30,40,0.16)] sm:bottom-24 md:bottom-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C6F135] text-[13px] font-bold text-[#181D27]">
        {initials}
      </span>
      <div className="min-w-0">
        <p className="text-[13px] leading-snug text-on-surface">
          <span className="font-semibold">{item.name}</span> from {item.city}{" "}
          <span className="text-on-surface-variant">{item.action}</span>
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-[#3d8a4e]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C6F135]" />
          just now · verified
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cookie consent banner — bottom, dismiss persisted in localStorage.
// ---------------------------------------------------------------------------
export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("tg_cookie_consent")) {
      const t = setTimeout(() => setShow(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  const decide = (value: "accepted" | "declined") => {
    localStorage.setItem("tg_cookie_consent", value);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-2xl rounded-[22px] border border-white/10 bg-[#181D27] p-4 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] md:inset-x-auto md:left-1/2 md:w-full md:-translate-x-1/2">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined mt-0.5 text-[22px] text-[#C6F135]">cookie</span>
          <p className="text-[13px] leading-relaxed text-white/80">
            We use cookies to personalise trips, remember your preferences and
            analyse traffic. See our{" "}
            <a href="#" className="font-semibold text-white underline underline-offset-2">
              Cookie Policy
            </a>
            .
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => decide("declined")}
            className="rounded-full px-4 py-2 text-[13px] font-semibold text-white/70 transition-colors hover:text-white"
          >
            Decline
          </button>
          <button
            onClick={() => decide("accepted")}
            className="rounded-full bg-[#C6F135] px-5 py-2 text-[13px] font-semibold text-[#181D27] transition-transform active:scale-95"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subscribe modal — pops on load with name / email / phone / WhatsApp.
// Shows every load until the visitor subscribes; "Skip for now" + X dismiss it.
// ---------------------------------------------------------------------------
export function SubscribeModal() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", whatsapp: "" });

  useEffect(() => {
    // Never show again once subscribed; also respect a prior dismissal so it
    // doesn't reappear on every load.
    if (localStorage.getItem("tg_subscribed") || localStorage.getItem("tg_subscribe_dismissed")) return;
    const t = setTimeout(() => setOpen(true), 1400);
    return () => clearTimeout(t);
  }, []);

  // Skip / close — remember it so the form doesn't pop up again and again.
  const dismiss = () => {
    localStorage.setItem("tg_subscribe_dismissed", "1");
    setOpen(false);
  };

  const valid =
    form.name.trim().length > 1 &&
    /^\S+@\S+\.\S+$/.test(form.email) &&
    /^[6-9]\d{9}$/.test(form.phone);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    // Persist locally so it doesn't reappear. Wire to your CRM/newsletter API here.
    localStorage.setItem("tg_subscribed", "1");
    localStorage.setItem("tg_subscriber", JSON.stringify(form));
    setDone(true);
    setTimeout(() => setOpen(false), 1600);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white p-6 shadow-[0_30px_70px_rgba(0,0,0,0.4)] md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* close */}
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {done ? (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#C6F135]">
              <span className="material-symbols-outlined text-[34px] text-[#181D27]">check</span>
            </div>
            <h3 className="mt-4 text-[22px] font-semibold tracking-[-0.02em] text-on-surface">You&apos;re in! 🐐</h3>
            <p className="mt-1.5 text-[14px] text-on-surface-variant">
              We&apos;ll send the best trip drops your way.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C6F135]/20 px-3 py-1 text-[12px] font-semibold text-[#181D27]">
                <span className="material-symbols-outlined text-[15px]">local_offer</span>
                Members save more
              </span>
              <h3 className="mt-3 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-on-surface">
                Join the herd
              </h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-on-surface-variant">
                Get early access to curated trips, exclusive offers and travel
                inspiration — straight to your inbox &amp; WhatsApp.
              </p>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-3">
              {[
                { k: "name" as const, label: "Full name", type: "text", ph: "Priya Sharma", icon: "person" },
                { k: "email" as const, label: "Email", type: "email", ph: "you@example.com", icon: "mail" },
                { k: "phone" as const, label: "Phone", type: "tel", ph: "9876543210", icon: "call" },
                { k: "whatsapp" as const, label: "WhatsApp number (optional)", type: "tel", ph: "9876543210", icon: "chat" },
              ].map((f) => (
                <label key={f.k} className="block">
                  <span className="mb-1 block text-[12px] font-medium text-on-surface-variant">{f.label}</span>
                  <div className="flex items-center gap-2 rounded-2xl bg-surface-container px-3.5 ring-1 ring-black/[0.06] focus-within:ring-2 focus-within:ring-[#181D27]/40">
                    <span className="material-symbols-outlined text-[19px] text-on-surface-variant">{f.icon}</span>
                    <input
                      type={f.type}
                      value={form[f.k]}
                      onChange={set(f.k)}
                      placeholder={f.ph}
                      inputMode={f.type === "tel" ? "numeric" : undefined}
                      className="w-full bg-transparent py-3 text-[15px] text-on-surface outline-none placeholder:text-on-surface-variant/50"
                    />
                  </div>
                </label>
              ))}

              <button
                type="submit"
                disabled={!valid}
                className="mt-1 w-full rounded-full bg-[#C6F135] py-3.5 text-[15px] font-semibold text-[#181D27] shadow-[0_10px_26px_rgba(198,241,53,0.4)] transition active:scale-[0.98] disabled:opacity-50"
              >
                Subscribe
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="w-full py-1 text-center text-[13px] font-medium text-on-surface-variant transition-colors hover:text-on-surface"
              >
                Skip for now
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
