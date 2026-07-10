import { Injectable, NotFoundException } from '@nestjs/common';
import type { ApplicationState, CreditScoreResult, FinanceProduct } from '@markaba/shared';
import {
  applyTransition,
  isBindingCreditDecision,
  isProhibitedUse,
  MissingHumanApprovalError,
} from '@markaba/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ScqService } from '../scq/scq.service';

export interface CreateApplicationInput {
  customerId: string;
  product: FinanceProduct;
  financedAmount: number;
  downPaymentPct: number;
  termMonths: number;
  declaredVehicleUse: string;
}

export interface TransitionApplicationInput {
  applicationId: string;
  to: ApplicationState;
  actor: string;
  /**
   * Required for a binding credit decision (CLAUDE.md §2.3) — see
   * `isBindingCreditDecision`. In Phase 1 this is a mock token constructed from
   * an authenticated admin session (see packages/admin), not a cryptographic
   * signature; a production version needs a real signed-action token.
   */
  humanApprovalToken?: string;
}

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly scq: ScqService,
  ) {}

  async create(input: CreateApplicationInput, actor: string) {
    const application = await this.prisma.application.create({
      data: {
        customerId: input.customerId,
        product: input.product,
        financedAmount: input.financedAmount,
        downPaymentPct: input.downPaymentPct,
        termMonths: input.termMonths,
        declaredVehicleUse: input.declaredVehicleUse,
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

    // Vehicle-use screening (PRD A.6, A.3 Sharia rule 4): a deterministic denylist
    // lookup, not Sharia-interpretive judgment, so not blocked by CLAUDE.md §2.1.
    // A match routes to a human via an SCQ — it never auto-declines.
    if (isProhibitedUse(input.declaredVehicleUse)) {
      await this.scq.raise({
        raisedBy: actor,
        relatedEntityType: 'Application',
        relatedEntityId: application.id,
        description: `Declared vehicle use "${input.declaredVehicleUse}" matched the prohibited-use denylist.`,
      });
    }

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
   * Persists the Phase 1 MCS stub's output (score/recommendation/explanation) —
   * never a binding decision itself (CLAUDE.md §2.3), just the recommendation a
   * human considers at UNDERWRITING.
   */
  async recordCreditScore(applicationId: string, result: CreditScoreResult, actor: string) {
    await this.findById(applicationId);

    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: { mcsRecommendation: result as unknown as object },
    });

    await this.audit.log({
      actor,
      action: 'MCS_SCORED',
      entityType: 'Application',
      entityId: applicationId,
      metadata: { score: result.score, recommendation: result.recommendation },
    });

    return updated;
  }

  /**
   * Applies a legal state transition and records it in the audit log.
   *
   * Delegates the legality check and the SSB-gated body (PURCHASE_CONFIRMED ->
   * CONTRACT_SIGNED) to `@markaba/shared`'s `applyTransition`, which throws
   * `NotImplementedError` for that transition — see CLAUDE.md §2.1. Callers must
   * let that error propagate; do not catch-and-continue.
   *
   * A binding credit decision (approve/decline out of UNDERWRITING/REFERRED)
   * additionally requires `humanApprovalToken` (CLAUDE.md §2.3) — this function
   * refuses to execute one autonomously.
   */
  async transition({ applicationId, to, actor, humanApprovalToken }: TransitionApplicationInput) {
    const application = await this.findById(applicationId);
    const from = application.state as ApplicationState;

    const nextState = applyTransition(from, to);

    if (isBindingCreditDecision(from, nextState) && !humanApprovalToken) {
      throw new MissingHumanApprovalError(
        `Transitioning ${applicationId} from ${from} to ${nextState} is a binding credit ` +
          'decision and requires a humanApprovalToken (CLAUDE.md §2.3).',
      );
    }

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
