import { NextResponse } from "next/server";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  timestamps: number[];
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(store: Map<string, RateLimitEntry>, windowMs: number) {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

function getStore(name: string): Map<string, RateLimitEntry> {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  return store;
}

function check(
  store: Map<string, RateLimitEntry>,
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();

  // Periodic cleanup
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanup(store, config.windowMs);
    lastCleanup = now;
  }

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => now - t < config.windowMs);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const resetMs = config.windowMs - (now - oldestInWindow);
    return {
      allowed: false,
      remaining: 0,
      resetMs,
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    resetMs: config.windowMs,
  };
}

// Pre-configured limiters (aligned with PRD Section 9.3)
export const rateLimiters = {
  otp: { maxRequests: 5, windowMs: 60 * 60 * 1000 },        // 5/hour per phone
  otpBurst: { maxRequests: 3, windowMs: 60 * 1000 },         // 3/min per IP
  auth: { maxRequests: 10, windowMs: 5 * 60 * 1000 },        // 10/5min per IP
  api: { maxRequests: 100, windowMs: 60 * 1000 },            // 100/min per user
  payment: { maxRequests: 5, windowMs: 60 * 1000 },          // 5/min per user
  booking: { maxRequests: 10, windowMs: 60 * 1000 },         // 10/min per user
  admin: { maxRequests: 30, windowMs: 60 * 1000 },           // 30/min per user
} as const;

export type RateLimiterName = keyof typeof rateLimiters;

export function applyRateLimit(
  limiterName: RateLimiterName,
  key: string
): NextResponse | null {
  const config = rateLimiters[limiterName];
  const store = getStore(limiterName);
  const result = check(store, key, config);

  if (!result.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(result.resetMs / 1000)),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}
