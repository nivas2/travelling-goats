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

    const { phone } = validation.data;

    // Rate limiting: 5/hour per phone (PRD Section 9.3)
    const phoneRateLimit = applyRateLimit("otp", phone);
    if (phoneRateLimit) return phoneRateLimit;

    // Burst protection: 3/min per IP
    const ip = getClientIp(req);
    const ipRateLimit = applyRateLimit("otpBurst", ip);
    if (ipRateLimit) return ipRateLimit;

    // Generate 6-digit OTP
    const code =
      process.env.OTP_MOCK_ENABLED === "true"
        ? (process.env.OTP_MOCK_CODE ?? "123456")
        : String(Math.floor(100000 + Math.random() * 900000));

    // Store OTP (expires in 5 minutes)
    await prisma.otpCode.create({
      data: {
        phone,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // In production, send OTP via SMS service (Phase 2: MSG91)
    const response: Record<string, unknown> = { success: true, message: "OTP sent successfully" };
    if (process.env.OTP_MOCK_ENABLED === "true") {
      response.otp = code;
    }

    logger.info("OTP sent", { phone: phone.slice(0, 4) + "****" });

    return NextResponse.json(response);
  } catch (error) {
    logger.error("OTP send error", error);
    return NextResponse.json(
      { success: false, error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
