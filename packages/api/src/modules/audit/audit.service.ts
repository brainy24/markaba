import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogEntry {
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogRecord extends Omit<AuditLogEntry, 'metadata'> {
  id: string;
  createdAt: Date;
  metadata: Prisma.JsonValue;
}

/**
 * Append-only audit trail. This is a compliance foundation (CLAUDE.md §7) — every
 * state transition or decision-adjacent action must call `log`.
 *
 * Intentionally exposes only `log` and read methods. Do not add `update` or
 * `delete` methods to this service — audit records must never be mutated.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<AuditLogRecord> {
    return this.prisma.auditLog.create({
      data: {
        actor: entry.actor,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: (entry.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditLogRecord[]> {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
