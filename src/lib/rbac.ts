import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

interface AuthResult {
  id: string;
  role: UserRole;
}

type AuthSuccess = { success: true; user: AuthResult };
type AuthFailure = { success: false; response: NextResponse };

export async function requireAuth(): Promise<AuthSuccess | AuthFailure> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      ),
    };
  }

  return { success: true, user };
}

export async function requireRole(
  ...roles: UserRole[]
): Promise<AuthSuccess | AuthFailure> {
  const result = await requireAuth();
  if (!result.success) return result;

  if (!roles.includes(result.user.role)) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return result;
}

export async function requireAdmin(): Promise<AuthSuccess | AuthFailure> {
  return requireRole("ADMIN");
}
