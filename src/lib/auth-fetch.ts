import { signOut } from "next-auth/react";

/**
 * Check if a fetch response indicates an expired/invalid session.
 * Signs out (clears stale JWT) and redirects to login when true.
 * Returns true when the caller should abort further processing.
 */
export async function handleAuthError(
  res: Response,
  redirectUrl = "/login"
): Promise<boolean> {
  if (res.status === 401 || res.status === 403) {
    await signOut({ callbackUrl: redirectUrl });
    return true;
  }
  return false;
}
