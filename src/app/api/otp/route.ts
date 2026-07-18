import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger, getClientIp } from "@/lib/logger";
import { validateBody } from "@/lib/validate";
import { sendOtpSchema } from "@/lib/validations/otp";
import { applyRateLimit } from "@/lib/rate-limit";

const logger = createLogger({ route: "otp" });

// Send OTP
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateBody(sendOtpSchema, body);
    if (!validation.success) return validation.response;

    const { phone, email } = validation.data;
    // "target" is phone number or email — stored in OtpCode.phone field for both
    const target = (phone ?? email)!;

    // Rate limiting: 5/hour per target (PRD Section 9.3)
    const targetRateLimit = applyRateLimit("otp", target);
    if (targetRateLimit) return targetRateLimit;

    // Burst protection: 3/min per IP
    const ip = getClientIp(req);
    const ipRateLimit = applyRateLimit("otpBurst", ip);
    if (ipRateLimit) return ipRateLimit;

    // Mock OTP is only ever honoured outside production, so a leftover
    // OTP_MOCK_ENABLED=true in prod can neither fix the code nor leak it below.
    const mockEnabled =
      process.env.NODE_ENV !== "production" &&
      process.env.OTP_MOCK_ENABLED === "true";

    // Generate 6-digit OTP
    const code = mockEnabled
      ? (process.env.OTP_MOCK_CODE ?? "123456")
      : String(Math.floor(100000 + Math.random() * 900000));

    // Store OTP (expires in 5 minutes) — email stored in phone column (no migration)
    await prisma.otpCode.create({
      data: {
        phone: target,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // In production, send OTP via SMS or email service (Phase 2)
    const channel = email ? "email" : "phone";
    const maskedTarget = email
      ? email.replace(/(.{2})(.*)(@)/, "$1***$3")
      : target.slice(0, 4) + "****";

    const response: Record<string, unknown> = { success: true, message: "OTP sent successfully" };
    if (mockEnabled) {
      response.otp = code;
    }

    logger.info("OTP sent", { channel, target: maskedTarget });

    return NextResponse.json(response);
  } catch (error) {
    logger.error("OTP send error", error);
    return NextResponse.json(
      { success: false, error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
