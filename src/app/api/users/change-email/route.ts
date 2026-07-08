import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger, getClientIp } from "@/lib/logger";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const logger = createLogger({ route: "users-change-email" });

// Verify an OTP for a new email and update the current user's email.
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = applyRateLimit("api", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const otp = String(body?.otp ?? "").trim();

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Enter a valid email address" },
        { status: 400 }
      );
    }
    if (!otp) {
      return NextResponse.json({ success: false, error: "OTP is required" }, { status: 400 });
    }

    // Email must not belong to a different account.
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "This email is already in use" },
        { status: 400 }
      );
    }
    if (existing && existing.id === session.user.id) {
      return NextResponse.json(
        { success: false, error: "This is already your email" },
        { status: 400 }
      );
    }

    // Verify OTP — email stored in OtpCode.phone column (reusing field, no migration)
    const mockOk =
      process.env.OTP_MOCK_ENABLED === "true" &&
      otp === (process.env.OTP_MOCK_CODE ?? "123456");

    let valid = mockOk;
    if (!valid) {
      const record = await prisma.otpCode.findFirst({
        where: { phone: email, code: otp, verified: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      });
      if (record) {
        valid = true;
        await prisma.otpCode.update({ where: { id: record.id }, data: { verified: true } });
      }
    }

    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { email },
      select: { id: true, email: true },
    });

    auditLog({
      userId: session.user.id,
      action: "USER_EMAIL_CHANGED",
      entityType: "user",
      entityId: session.user.id,
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    logger.error("Change email error", error);
    return NextResponse.json(
      { success: false, error: "Failed to change email" },
      { status: 500 }
    );
  }
}
