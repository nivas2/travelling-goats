import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ service: "settings" });

// ---------------------------------------------------------------------------
// In-memory cache with TTL
// ---------------------------------------------------------------------------

interface CacheEntry {
  value: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function invalidateSettingsCache(): void {
  cache.clear();
}

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

export async function getSetting<T = string>(
  key: string,
  defaultValue: T
): Promise<T> {
  // Check cache
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    try {
      return JSON.parse(cached.value) as T;
    } catch {
      return cached.value as unknown as T;
    }
  }

  try {
    const row = await prisma.appSetting.findUnique({ where: { key } });
    if (!row) return defaultValue;

    cache.set(key, { value: row.value, expiresAt: Date.now() + CACHE_TTL_MS });

    try {
      return JSON.parse(row.value) as T;
    } catch {
      return row.value as unknown as T;
    }
  } catch (err) {
    logger.error("Failed to read setting", err, { key });
    return defaultValue;
  }
}

export async function setSetting(
  key: string,
  value: string,
  group?: string,
  label?: string
): Promise<void> {
  try {
    await prisma.appSetting.upsert({
      where: { key },
      update: { value, ...(group && { group }), ...(label && { label }) },
      create: { key, value, group: group ?? "general", label },
    });
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  } catch (err) {
    logger.error("Failed to write setting", err, { key });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Razorpay config
// ---------------------------------------------------------------------------

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  mode: "test" | "live";
}

export async function getRazorpayConfig(): Promise<RazorpayConfig> {
  const [keyId, keySecret, mode] = await Promise.all([
    getSetting("razorpay_key_id", process.env.RAZORPAY_KEY_ID ?? ""),
    getSetting("razorpay_key_secret", process.env.RAZORPAY_KEY_SECRET ?? ""),
    getSetting("razorpay_mode", "test"),
  ]);

  return {
    keyId: keyId || process.env.RAZORPAY_KEY_ID || "",
    keySecret: keySecret || process.env.RAZORPAY_KEY_SECRET || "",
    mode: mode === "live" ? "live" : "test",
  };
}

// ---------------------------------------------------------------------------
// Wallet topup config
// ---------------------------------------------------------------------------

export interface WalletTopupConfig {
  minPaise: number;
  maxPaise: number;
  presetsPaise: number[];
}

const DEFAULT_TOPUP_CONFIG: WalletTopupConfig = {
  minPaise: 10000, // ₹100
  maxPaise: 1000000, // ₹10,000
  presetsPaise: [10000, 50000, 100000, 200000], // ₹100, ₹500, ₹1000, ₹2000
};

export async function getWalletTopupConfig(): Promise<WalletTopupConfig> {
  const [minPaise, maxPaise, presetsPaise] = await Promise.all([
    getSetting<number>("wallet_topup_min_paise", DEFAULT_TOPUP_CONFIG.minPaise),
    getSetting<number>("wallet_topup_max_paise", DEFAULT_TOPUP_CONFIG.maxPaise),
    getSetting<number[]>(
      "wallet_topup_presets_paise",
      DEFAULT_TOPUP_CONFIG.presetsPaise
    ),
  ]);

  return { minPaise, maxPaise, presetsPaise };
}
