"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

type Traveler = { name?: string; age?: number | string };
type Result = {
  status: "success" | "already" | "error";
  message: string;
  bookingNumber?: string;
  tripTitle?: string;
  travelers?: Traveler[];
  travelerCount?: number;
  leadName?: string;
  checkedInAt?: string | null;
};

// A scanned QR may hold a full verify URL or a raw token — pull the token out.
function extractToken(raw: string): string {
  try {
    const u = new URL(raw);
    return u.searchParams.get("t") || raw;
  } catch {
    return raw;
  }
}

function VerifyTicketContent() {
  const params = useSearchParams();
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number | null>(null);

  const verify = useCallback(async (rawValue: string) => {
    const token = extractToken(rawValue.trim());
    if (!token) return;
    setBusy(true);
    try {
      const res = await fetch("/api/bookings/verify-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, checkIn: true }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setResult({ status: "error", message: json.error ?? "Verification failed" });
        return;
      }
      const d = json.data;
      const travelers: Traveler[] = Array.isArray(d.travelers) ? d.travelers : [];
      setResult({
        status: d.alreadyCheckedIn ? "already" : "success",
        message: d.alreadyCheckedIn ? "Already checked in" : "Checked in successfully",
        bookingNumber: d.bookingNumber,
        tripTitle: d.trip?.title,
        travelers,
        travelerCount: d.travelerCount,
        leadName: d.user?.name,
        checkedInAt: d.checkedInAt,
      });
    } catch {
      setResult({ status: "error", message: "Network error. Try again." });
    } finally {
      setBusy(false);
    }
  }, []);

  // Auto-verify when opened from a scanned QR link (/verify?t=…)
  useEffect(() => {
    const t = params.get("t");
    if (t) verify(t);
  }, [params, verify]);

  const stopScan = useCallback(() => {
    if (loopRef.current) {
      cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    }
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const startScan = useCallback(async () => {
    setResult(null);
    // BarcodeDetector is available on Chrome/Android; iOS Safari has no support.
    const Detector = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!Detector) {
      setResult({
        status: "error",
        message: "Live scan isn't supported on this browser. Scan the ticket QR with your phone's camera app, or paste the code below.",
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setScanning(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new Detector({ formats: ["qr_code"] });
      const tick = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            stopScan();
            verify(codes[0].rawValue);
            return;
          }
        } catch {
          /* keep scanning */
        }
        loopRef.current = requestAnimationFrame(tick);
      };
      loopRef.current = requestAnimationFrame(tick);
    } catch {
      setResult({ status: "error", message: "Couldn't access the camera. Grant permission or paste the code." });
      setScanning(false);
    }
  }, [stopScan, verify]);

  useEffect(() => () => stopScan(), [stopScan]);

  const tone =
    result?.status === "success"
      ? { bg: "bg-success", text: "text-white", icon: "check_circle" }
      : result?.status === "already"
      ? { bg: "bg-warning", text: "text-on-surface", icon: "info" }
      : { bg: "bg-error", text: "text-white", icon: "cancel" };

  return (
    <div className="mx-auto max-w-md px-5 py-6">
      <h1 className="text-headline-md font-headline-md text-on-surface">Verify Ticket</h1>
      <p className="mt-1 text-body-md text-on-surface-variant">
        Scan a traveller&apos;s ticket QR to check them in. Only this trip&apos;s captain can verify.
      </p>

      {/* Scanner */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          className={scanning ? "h-64 w-full object-cover" : "hidden"}
          playsInline
          muted
        />
        {!scanning && (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-white/70">
            <Icon name="qr_code_scanner" size={48} />
            <span className="text-label-md">Camera preview</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        {!scanning ? (
          <Button className="flex-1" onClick={startScan} loading={busy}>
            <Icon name="photo_camera" size={18} /> Start Scan
          </Button>
        ) : (
          <Button className="flex-1" variant="secondary" onClick={stopScan}>
            Stop
          </Button>
        )}
      </div>

      {/* Manual fallback */}
      <div className="mt-4">
        <label className="mb-1 block text-label-md text-on-surface-variant">
          Or paste the ticket code / link
        </label>
        <div className="flex gap-2">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Paste QR value…"
            className="flex-1 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
          />
          <Button onClick={() => verify(manual)} disabled={!manual.trim() || busy}>
            Verify
          </Button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-outline-variant">
          <div className={`flex items-center gap-2 px-4 py-3 ${tone.text} ${tone.bg}`}>
            <Icon name={tone.icon} size={24} filled />
            <span className="text-title-md font-semibold">{result.message}</span>
          </div>
          {result.status !== "error" && (
            <div className="space-y-2 bg-surface-container-lowest p-4">
              {result.tripTitle && (
                <Row label="Trip" value={result.tripTitle} />
              )}
              {result.bookingNumber && <Row label="Booking" value={result.bookingNumber} />}
              {result.leadName && <Row label="Lead traveller" value={result.leadName} />}
              <Row label="Travellers" value={String(result.travelerCount ?? result.travelers?.length ?? 1)} />
              {result.travelers && result.travelers.length > 0 && (
                <ul className="mt-1 space-y-1">
                  {result.travelers.map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-body-md text-on-surface">
                      <Icon name="person" size={16} className="text-primary" />
                      {t.name || `Traveller ${i + 1}`}
                      {t.age ? <span className="text-on-surface-variant">· {t.age} yrs</span> : null}
                    </li>
                  ))}
                </ul>
              )}
              {result.checkedInAt && (
                <p className="pt-1 text-label-md text-on-surface-variant">
                  Checked in at{" "}
                  {new Date(result.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          )}
          <div className="bg-surface-container-lowest px-4 pb-4">
            <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
              Verify another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyTicketPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md space-y-4 px-5 py-6">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-surface-container" />
          <div className="h-4 w-full animate-pulse rounded bg-surface-container" />
          <div className="h-64 w-full animate-pulse rounded-2xl bg-surface-container" />
        </div>
      }
    >
      <VerifyTicketContent />
    </Suspense>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-label-md text-on-surface-variant">{label}</span>
      <span className="text-body-md font-medium text-on-surface">{value}</span>
    </div>
  );
}
