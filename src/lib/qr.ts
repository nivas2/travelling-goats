import crypto from "crypto";

const QR_SECRET = process.env.QR_SECRET || process.env.NEXTAUTH_SECRET || "";

interface QrPayload {
  bookingId: string;
  bookingNumber: string;
  userId: string;
  tripId: string;
  travelerCount: number;
}

function sign(data: string): string {
  return crypto
    .createHmac("sha256", QR_SECRET)
    .update(data)
    .digest("base64url");
}

export function generateQrToken(payload: QrPayload): string {
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(payloadStr);
  return `${payloadStr}.${signature}`;
}

export function verifyQrToken(
  token: string
): { valid: true; payload: QrPayload } | { valid: false } {
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };

  const [payloadStr, providedSig] = parts;
  const expectedSig = sign(payloadStr);

  // Timing-safe comparison
  const a = Buffer.from(providedSig, "base64url");
  const b = Buffer.from(expectedSig, "base64url");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false };
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadStr, "base64url").toString("utf-8")
    ) as QrPayload;
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}
