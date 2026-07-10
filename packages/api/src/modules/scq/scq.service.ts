import { Injectable, NotFoundException } from '@nestjs/common';
import { canTransitionScq, type ScqStatus } from '@markaba/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface RaiseScqInput {
  raisedBy: string;
  relatedEntityType: string;
  relatedEntityId: string;
  description: string;
}

/**
 * Sharia Compliance Query (SCQ) workflow — PRD A.3 escalation path. This service
 * tracks a human escalation; it never rules on anything itself, so it is not
 * blocked by CLAUDE.md §2.1 the way contract generation is. Every status change
 * is an explicit human action and is audit-logged.
 */
@Injectable()
export class ScqService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async raise(input: RaiseScqInput) {
    const scq = await this.prisma.shariaComplianceQuery.create({
      data: {
        raisedBy: input.raisedBy,
        relatedEntityType: input.relatedEntityType,
        relatedEntityId: input.relatedEntityId,
        description: input.description,
        status: 'OPEN',
      },
    });

    await this.audit.log({
      actor: input.raisedBy,
      action: 'SCQ_RAISED',
      entityType: 'ShariaComplianceQuery',
      entityId: scq.id,
      metadata: {
        relatedEntityType: input.relatedEntityType,
        relatedEntityId: input.relatedEntityId,
      },
    });

    return scq;
  }

  async findById(id: string) {
    const scq = await this.prisma.shariaComplianceQuery.findUnique({ where: { id } });
    if (!scq) {
      throw new NotFoundException(`ShariaComplianceQuery ${id} not found`);
    }
    return scq;
  }

  findAll() {
    return this.prisma.shariaComplianceQuery.findMany({ orderBy: { raisedAt: 'desc' } });
  }

  /**
   * Advances the SCQ to the next stage of the linear escalation (PRD A.3). Every
   * call is a manual human action — `actor` is the Head of Compliance / SSB member
   * making the call, never an automated ruling.
   */
  async advanceStatus(id: string, to: ScqStatus, actor: string, rulingSummary?: string) {
    const scq = await this.findById(id);
    const from = scq.status as ScqStatus;

    if (!canTransitionScq(from, to)) {
      throw new Error(`Illegal SCQ status transition: ${from} -> ${to}`);
    }

    const updated = await this.prisma.shariaComplianceQuery.update({
      where: { id },
      data: {
        status: to,
        ...(to === 'HEAD_OF_COMPLIANCE_REVIEWED' ? { headOfComplianceReviewedAt: new Date() } : {}),
        ...(to === 'RULED' ? { ssbRuledAt: new Date(), rulingSummary } : {}),
      },
    });

    await this.audit.log({
      actor,
      action: 'SCQ_STATUS_CHANGED',
      entityType: 'ShariaComplianceQuery',
      entityId: id,
      metadata: { from, to },
    });

    return updated;
  }
}
