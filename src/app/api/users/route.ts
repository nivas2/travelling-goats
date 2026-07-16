import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLogger, getClientIp } from "@/lib/logger";
import { validateBody } from "@/lib/validate";
import { updateUserSchema } from "@/lib/validations/user";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const logger = createLogger({ route: "users" });

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        avatar: true,
        role: true,
        dateOfBirth: true,
        whatsappNumber: true,
        gender: true,
        bio: true,
        city: true,
        interests: true,
        budgetPreference: true,
        pickupCity: true,
        isVerified: true,
        isOnboarded: true,
        idVerified: true,
        referralCode: true,
        rewardPoints: true,
        rewardTier: true,
        totalTrips: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    logger.error("User fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = applyRateLimit("api", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const validation = validateBody(updateUserSchema, body);
    if (!validation.success) return validation.response;

    const data: Record<string, unknown> = { ...validation.data };

    if (data.dateOfBirth && typeof data.dateOfBirth === "string") {
      data.dateOfBirth = new Date(data.dateOfBirth as string);
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        avatar: true,
        city: true,
        interests: true,
        isOnboarded: true,
        idVerified: true,
      },
    });

    const ip = getClientIp(req);
    auditLog({
      userId: session.user.id,
      action: "USER_UPDATED",
      entityType: "user",
      entityId: session.user.id,
      metadata: { fields: Object.keys(validation.data) },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    logger.error("User update error", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// Account deletion — soft delete + anonymize. We keep the row (bookings, payments
// and other records reference it via FK) but mark it DELETED and strip personal
// data so it can no longer sign in or be identified.
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = applyRateLimit("api", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const userId = session.user.id;
    const stamp = Date.now();

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "DELETED",
        // Release unique fields (phone/email) so they can be reused, and clear PII.
        phone: `deleted-${stamp}-${userId}`,
        email: null,
        name: "Deleted User",
        avatar: null,
        bio: null,
        city: null,
        isOnboarded: false,
      },
    });

    // Invalidate any pending sign-in artifacts.
    await prisma.session.deleteMany({ where: { userId } }).catch(() => {});

    auditLog({
      userId,
      action: "USER_DELETED",
      entityType: "user",
      entityId: userId,
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("User delete error", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
