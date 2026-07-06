import { Injectable, NotFoundException } from '@nestjs/common';
import type { ApplicationState, VehicleFinanceType } from '@markaba/shared';
import { applyTransition } from '@markaba/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface CreateApplicationInput {
  customerId: string;
  financeType: VehicleFinanceType;
  requestedAmountNaira: number;
}

export interface TransitionApplicationInput {
  applicationId: string;
  to: ApplicationState;
  actor: string;
}

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(input: CreateApplicationInput, actor: string) {
    const application = await this.prisma.application.create({
      data: {
        customerId: input.customerId,
        financeType: input.financeType,
        requestedAmountNaira: input.requestedAmountNaira,
        state: 'SUBMITTED',
      },
    });

    await this.audit.log({
      actor,
      action: 'APPLICATION_CREATED',
      entityType: 'Application',
      entityId: application.id,
      metadata: { state: application.state },
    });

    return application;
  }

  async findById(id: string) {
    const application = await this.prisma.application.findUnique({ where: { id } });
    if (!application) {
      throw new NotFoundException(`Application ${id} not found`);
    }
    return application;
  }

  findLatestByCustomer(customerId: string) {
    return this.prisma.application.findFirst({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Applies a legal state transition and records it in the audit log.
   *
   * Delegates the legality check and the SSB-gated body (PURCHASE_CONFIRMED ->
   * CONTRACT_SIGNED) to `@markaba/shared`'s `applyTransition`, which throws
   * `NotImplementedError` for that transition — see CLAUDE.md §2.1. Callers must
   * let that error propagate; do not catch-and-continue.
   */
  async transition({ applicationId, to, actor }: TransitionApplicationInput) {
    const application = await this.findById(applicationId);
    const from = application.state as ApplicationState;

    const nextState = applyTransition(from, to);

    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: { state: nextState },
    });

    await this.audit.log({
      actor,
      action: 'APPLICATION_STATE_TRANSITION',
      entityType: 'Application',
      entityId: applicationId,
      metadata: { from, to: nextState },
    });

    return updated;
  }
}
