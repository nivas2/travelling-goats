import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/rbac";

const logger = createLogger({ route: "admin-payments" });

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.response;

    const [payments, captured, pending, failed, revenue] = await Promise.all([
      prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          bookingId: true,
          booking: {
            select: {
              bookingNumber: true,
              user: { select: { name: true } },
            },
          },
          amountPaise: true,
          method: true,
          razorpayPaymentId: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.payment.count({ where: { status: "CAPTURED" } }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.payment.count({ where: { status: "FAILED" } }),
      prisma.payment.aggregate({
        _sum: { amountPaise: true },
        where: { status: "CAPTURED" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        payments,
        summary: {
          totalRevenuePaise: revenue._sum.amountPaise ?? 0,
          capturedCount: captured,
          pendingCount: pending,
          failedCount: failed,
        },
      },
    });
  } catch (error) {
    logger.error("Admin payments fetch error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
