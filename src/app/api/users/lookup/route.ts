import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const phone = req.nextUrl.searchParams.get("phone")?.trim();
    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { success: false, error: "Valid phone number required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true, avatar: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No user found with this phone number" },
        { status: 404 }
      );
    }

    if (user.id === session.user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot transfer to yourself" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch {
    return NextResponse.json(
      { success: false, error: "Lookup failed" },
      { status: 500 }
    );
  }
}
