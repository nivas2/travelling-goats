import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

const { GET: authGET, POST: authPOST } = handlers;

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ nextauth: string[] }> }
) {
  const params = await ctx.params;
  return authGET(req, { params } as unknown as Record<string, unknown>);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ nextauth: string[] }> }
) {
  const params = await ctx.params;
  return authPOST(req, { params } as unknown as Record<string, unknown>);
}
