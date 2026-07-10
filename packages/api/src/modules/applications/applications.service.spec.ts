import { Test } from '@nestjs/testing';
import { MissingHumanApprovalError, NotImplementedError } from '@markaba/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ScqService } from '../scq/scq.service';
import { ApplicationsService } from './applications.service';

const VALID_INPUT = {
  customerId: 'cust-1',
  product: 'IJARAH' as const,
  financedAmount: 5_000_000,
  downPaymentPct: 20,
  termMonths: 36,
  declaredVehicleUse: 'personal_commute',
};

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prisma: {
    application: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
  };
  let audit: { log: jest.Mock };
  let scq: { raise: jest.Mock };
  let stored: Record<string, unknown> | undefined;

  beforeEach(async () => {
    stored = undefined;
    prisma = {
      application: {
        create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
          stored = { id: 'app-1', ...data };
          return Promise.resolve(stored);
        }),
        findUnique: jest.fn(() => Promise.resolve(stored)),
        update: jest.fn(({ data }: { data: Record<string, unknown> }) => {
          stored = { ...stored, ...data };
          return Promise.resolve(stored);
        }),
      },
    };
    audit = { log: jest.fn(() => Promise.resolve({})) };
    scq = { raise: jest.fn(() => Promise.resolve({ id: 'scq-1', status: 'OPEN' })) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: ScqService, useValue: scq },
      ],
    }).compile();

    service = moduleRef.get(ApplicationsService);
  });

  it('creates an application in SUBMITTED and audits it', async () => {
    const application = await service.create(VALID_INPUT, 'whatsapp-bot');

    expect(application.state).toBe('SUBMITTED');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'APPLICATION_CREATED', actor: 'whatsapp-bot' }),
    );
  });

  it('does not raise an SCQ for an ordinary declared use', async () => {
    await service.create(VALID_INPUT, 'whatsapp-bot');
    expect(scq.raise).not.toHaveBeenCalled();
  });

  it('raises an SCQ instead of auto-declining when declaredVehicleUse matches the denylist', async () => {
    await service.create(
      { ...VALID_INPUT, declaredVehicleUse: 'gambling_operations' },
      'whatsapp-bot',
    );

    expect(scq.raise).toHaveBeenCalledWith(
      expect.objectContaining({
        raisedBy: 'whatsapp-bot',
        relatedEntityType: 'Application',
        relatedEntityId: 'app-1',
      }),
    );
    // The application itself is still created in SUBMITTED — not auto-declined.
    expect(stored?.state).toBe('SUBMITTED');
  });

  it('applies a legal, non-binding transition without requiring a human-approval token', async () => {
    await service.create(VALID_INPUT, 'system');

    const updated = await service.transition({
      applicationId: 'app-1',
      to: 'KYC_PENDING',
      actor: 'system',
    });

    expect(updated.state).toBe('KYC_PENDING');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'APPLICATION_STATE_TRANSITION',
        metadata: { from: 'SUBMITTED', to: 'KYC_PENDING' },
      }),
    );
  });

  it('rejects an illegal transition without touching persistence', async () => {
    await service.create(VALID_INPUT, 'system');

    await expect(
      service.transition({ applicationId: 'app-1', to: 'ACTIVE', actor: 'system' }),
    ).rejects.toThrow(/Illegal application state transition/);
    expect(prisma.application.update).not.toHaveBeenCalled();
  });

  it('propagates NotImplementedError for the SSB-gated contract-signing transition', async () => {
    stored = { id: 'app-1', state: 'PURCHASE_CONFIRMED' };

    await expect(
      service.transition({ applicationId: 'app-1', to: 'CONTRACT_SIGNED', actor: 'system' }),
    ).rejects.toBeInstanceOf(NotImplementedError);
    expect(prisma.application.update).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  describe('binding credit decisions (CLAUDE.md §2.3)', () => {
    it('refuses to approve out of UNDERWRITING without a humanApprovalToken', async () => {
      stored = { id: 'app-1', state: 'UNDERWRITING' };

      await expect(
        service.transition({ applicationId: 'app-1', to: 'APPROVED', actor: 'credit-analyst-1' }),
      ).rejects.toBeInstanceOf(MissingHumanApprovalError);
      expect(prisma.application.update).not.toHaveBeenCalled();
    });

    it('refuses to decline out of REFERRED without a humanApprovalToken', async () => {
      stored = { id: 'app-1', state: 'REFERRED' };

      await expect(
        service.transition({ applicationId: 'app-1', to: 'DECLINED', actor: 'credit-analyst-1' }),
      ).rejects.toBeInstanceOf(MissingHumanApprovalError);
    });

    it('approves out of UNDERWRITING when a humanApprovalToken is supplied', async () => {
      stored = { id: 'app-1', state: 'UNDERWRITING' };

      const updated = await service.transition({
        applicationId: 'app-1',
        to: 'APPROVED',
        actor: 'credit-analyst-1',
        humanApprovalToken: 'mock-approval:CreditAnalyst:credit-analyst-1',
      });

      expect(updated.state).toBe('APPROVED');
    });

    it('does not require a token for the non-binding referral leg', async () => {
      stored = { id: 'app-1', state: 'UNDERWRITING' };

      const updated = await service.transition({
        applicationId: 'app-1',
        to: 'REFERRED',
        actor: 'system',
      });

      expect(updated.state).toBe('REFERRED');
    });
  });

  describe('recordCreditScore', () => {
    it('persists the MCS result and audit-logs MCS_SCORED', async () => {
      await service.create(VALID_INPUT, 'system');

      const result = {
        score: 620,
        recommendation: 'RECOMMEND_REFER' as const,
        explanation: [{ factor: 'kycStatus:VERIFIED', contribution: 150 }],
      };

      const updated = await service.recordCreditScore('app-1', result, 'system');

      expect(updated.mcsRecommendation).toEqual(result);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MCS_SCORED',
          metadata: { score: 620, recommendation: 'RECOMMEND_REFER' },
        }),
      );
    });
  });
});
