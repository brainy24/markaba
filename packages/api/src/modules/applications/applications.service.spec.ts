import { Test } from '@nestjs/testing';
import { NotImplementedError } from '@markaba/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApplicationsService } from './applications.service';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prisma: {
    application: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
  };
  let audit: { log: jest.Mock };
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

    const moduleRef = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = moduleRef.get(ApplicationsService);
  });

  it('creates an application in SUBMITTED and audits it', async () => {
    const application = await service.create(
      { customerId: 'cust-1', financeType: 'IJARAH', requestedAmountNaira: 5_000_000 },
      'whatsapp-bot',
    );

    expect(application.state).toBe('SUBMITTED');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'APPLICATION_CREATED', actor: 'whatsapp-bot' }),
    );
  });

  it('applies a legal transition and audits from/to', async () => {
    await service.create(
      { customerId: 'cust-1', financeType: 'IJARAH', requestedAmountNaira: 5_000_000 },
      'system',
    );

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
    await service.create(
      { customerId: 'cust-1', financeType: 'IJARAH', requestedAmountNaira: 5_000_000 },
      'system',
    );

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
});
