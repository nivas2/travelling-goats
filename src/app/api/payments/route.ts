import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Razorpay from "razorpay";
import crypto from "crypto";
import { createLogger, getClientIp } from "@/lib/logger";
import { validateBody } from "@/lib/validate";
import { createPaymentSchema, verifyPaymentSchema } from "@/lib/validations/payment";
import { applyRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

const logger = createLogger({ route: "payments" });

const isTestMode = !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET;

const razorpay = isTestMode
  ? null
  : new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

// Create Razorpay order
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = applyRateLimit("payment", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const validation = validateBody(createPaymentSchema, body);
    if (!validation.success) return validation.response;

    const { bookingId, useWallet, walletAmountPaise } = validation.data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    if (booking.payment) {
      return NextResponse.json(
        { success: false, error: "Payment already exists for this booking" },
        { status: 400 }
      );
    }

    let walletDeduction = 0;
    if (useWallet && walletAmountPaise > 0) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } });
      if (wallet && wallet.balancePaise >= walletAmountPaise) {
        walletDeduction = Math.min(walletAmountPaise, booking.totalPricePaise);
      }
    }

    const userId = session.user.id;
    const payableAmount = booking.totalPricePaise - walletDeduction;

    if (payableAmount <= 0) {
      // Full wallet payment — use interactive transaction with locking
      const result = await prisma.$transaction(async (tx) => {
        // Lock wallet row
        const [wallet] = await tx.$queryRaw<
          Array<{ id: string; balancePaise: number }>
        >(
          Prisma.sql`SELECT id, "balancePaise" FROM wallets WHERE "userId" = ${userId} FOR UPDATE`
        );

        if (!wallet || wallet.balancePaise < walletDeduction) {
          throw new Error("INSUFFICIENT_WALLET_BALANCE");
        }

        const newBalance = wallet.balancePaise - walletDeduction;

        const payment = await tx.payment.create({
          data: {
            bookingId,
            amountPaise: booking.totalPricePaise,
            walletAmountPaise: walletDeduction,
            status: "CAPTURED",
            method: "wallet",
          },
        });

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balancePaise: newBalance },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId: userId,
            type: "DEBIT",
            amountPaise: walletDeduction,
            description: `Payment for booking ${booking.bookingNumber}`,
            referenceId: bookingId,
            balanceAfterPaise: newBalance,
          },
        });

        await tx.booking.update({
          where: { id: bookingId },
          data: { status: "CONFIRMED" },
        });

        await tx.trip.update({
          where: { id: booking.tripId },
          data: { currentBookings: { increment: booking.travelerCount } },
        });

        return payment;
      });

      const ip = getClientIp(req);
      auditLog({
        userId: session.user.id,
        action: "PAYMENT_CREATED",
        entityType: "payment",
        entityId: result.id,
        metadata: { bookingId, method: "wallet", amountPaise: booking.totalPricePaise },
        ipAddress: ip,
      });

      return NextResponse.json({ success: true, data: { payment: result, fullWalletPayment: true } });
    }

    // Test mode — skip Razorpay, auto-confirm booking
    if (isTestMode || !razorpay) {
      const testResult = await prisma.$transaction(async (tx) => {
        const testPayment = await tx.payment.create({
          data: {
            bookingId,
            amountPaise: booking.totalPricePaise,
            walletAmountPaise: walletDeduction,
            status: "CAPTURED",
            method: "test",
          },
        });

        await tx.booking.update({
          where: { id: bookingId },
          data: { status: "CONFIRMED" },
        });

        await tx.trip.update({
          where: { id: booking.tripId },
          data: { currentBookings: { increment: booking.travelerCount } },
        });

        return testPayment;
      });

      const ip = getClientIp(req);
      auditLog({
        userId: session.user.id,
        action: "PAYMENT_CREATED",
        entityType: "payment",
        entityId: testResult.id,
        metadata: { bookingId, method: "test", amountPaise: booking.totalPricePaise },
        ipAddress: ip,
      });

      return NextResponse.json({
        success: true,
        data: { payment: testResult, testMode: true, bookingId },
      });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: payableAmount,
      currency: "INR",
      receipt: booking.bookingNumber,
      notes: {
        bookingId,
        userId: session.user.id,
      },
    });

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        razorpayOrderId: order.id,
        amountPaise: booking.totalPricePaise,
        walletAmountPaise: walletDeduction,
        status: "PENDING",
      },
    });

    const ip = getClientIp(req);
    auditLog({
      userId: session.user.id,
      action: "PAYMENT_CREATED",
      entityType: "payment",
      entityId: payment.id,
      metadata: { bookingId, method: "razorpay", amountPaise: payableAmount },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      data: {
        payment,
        orderId: order.id,
        amount: payableAmount,
        currency: "INR",
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_WALLET_BALANCE") {
      return NextResponse.json(
        { success: false, error: "Insufficient wallet balance" },
        { status: 400 }
      );
    }
    logger.error("Payment creation error", error);
    return NextResponse.json(
      { success: false, error: "Failed to create payment" },
      { status: 500 }
    );
  }
}

// Verify Razorpay payment — CRITICAL: now requires auth
export async function PUT(req: NextRequest) {
  try {
    // Auth check (was missing — critical security fix)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = applyRateLimit("payment", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const validation = validateBody(verifyPaymentSchema, body);
    if (!validation.success) return validation.response;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = validation.data;

    // Verify signature
    const signBody = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "")
      .update(signBody)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      auditLog({
        userId: session.user.id,
        action: "PAYMENT_FAILED",
        entityType: "payment",
        entityId: bookingId,
        metadata: { reason: "Invalid signature" },
        ipAddress: getClientIp(req),
      });
      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }

    const verifyUserId = session.user.id;

    // Use interactive transaction with row locking
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "CAPTURED",
        },
      });

      // Verify booking ownership
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking || booking.userId !== verifyUserId) {
        throw new Error("BOOKING_OWNERSHIP_MISMATCH");
      }

      // Deduct wallet if applicable — with row locking
      if (payment.walletAmountPaise > 0) {
        const [wallet] = await tx.$queryRaw<
          Array<{ id: string; balancePaise: number }>
        >(
          Prisma.sql`SELECT id, "balancePaise" FROM wallets WHERE "userId" = ${booking.userId} FOR UPDATE`
        );

        if (wallet) {
          if (wallet.balancePaise < payment.walletAmountPaise) {
            throw new Error("INSUFFICIENT_WALLET_BALANCE");
          }

          const newBalance = wallet.balancePaise - payment.walletAmountPaise;

          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balancePaise: newBalance },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              userId: booking.userId,
              type: "DEBIT",
              amountPaise: payment.walletAmountPaise,
              description: `Payment for booking ${booking.bookingNumber}`,
              referenceId: bookingId,
              balanceAfterPaise: newBalance,
            },
          });
        }
      }

      // Confirm booking
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED" },
        include: {
          trip: { select: { id: true, title: true } },
        },
      });

      // Update trip bookings count
      await tx.trip.update({
        where: { id: updatedBooking.tripId },
        data: { currentBookings: { increment: updatedBooking.travelerCount } },
      });

      return { payment, booking: updatedBooking };
    });

    const ip = getClientIp(req);
    auditLog({
      userId: session.user.id,
      action: "PAYMENT_VERIFIED",
      entityType: "payment",
      entityId: result.payment.id,
      metadata: { bookingId, razorpayPaymentId: razorpay_payment_id },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "BOOKING_OWNERSHIP_MISMATCH") {
        return NextResponse.json(
          { success: false, error: "Booking does not belong to you" },
          { status: 403 }
        );
      }
      if (error.message === "INSUFFICIENT_WALLET_BALANCE") {
        return NextResponse.json(
          { success: false, error: "Insufficient wallet balance for partial payment" },
          { status: 400 }
        );
      }
    }
    logger.error("Payment verification error", error);
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
