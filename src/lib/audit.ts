import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import type { Prisma } from "@prisma/client";

const logger = createLogger({ service: "audit" });

export interface AuditEntry {
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Fire-and-forget audit log — never blocks the main request flow.
 */
export function auditLog(entry: AuditEntry): void {
  prisma.auditLog
    .create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: (entry.metadata as Prisma.InputJsonValue) ?? undefined,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
      },
    })
    .catch((err) => {
      logger.error("Failed to write audit log", err, { entry });
    });
}
