import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

// Next.js 16 passes params as a Promise, but next-auth v5 beta expects
// sync params. We wrap the handlers to resolve params before forwarding.
function wrapHandler(handler: Function) {
  return async (
    req: NextRequest,
    ctx: { params: Promise<{ nextauth: string[] }> }
  ) => {
    const resolvedParams = await ctx.params;
    return handler(req, { params: resolvedParams });
  };
}

export const GET = wrapHandler(handlers.GET);
export const POST = wrapHandler(handlers.POST);
