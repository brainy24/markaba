import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ScqService } from './scq.service';

describe('ScqService', () => {
  let service: ScqService;
  let prisma: {
    shariaComplianceQuery: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let audit: { log: jest.Mock };
  let stored: Record<string, unknown> | undefined;

  beforeEach(async () => {
    stored = undefined;
    prisma = {
      shariaComplianceQuery: {
        create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
          stored = { id: 'scq-1', raisedAt: new Date(), ...data };
          return Promise.resolve(stored);
        }),
        findUnique: jest.fn(() => Promise.resolve(stored)),
        update: jest.fn(({ data }: { data: Record<string, unknown> }) => {
          stored = { ...stored, ...data };
          return Promise.resolve(stored);
        }),
        findMany: jest.fn(() => Promise.resolve(stored ? [stored] : [])),
      },
    };
    audit = { log: jest.fn(() => Promise.resolve({})) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ScqService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = moduleRef.get(ScqService);
  });

  it('raises an SCQ in OPEN and audits it', async () => {
    const scq = await service.raise({
      raisedBy: 'system',
      relatedEntityType: 'Application',
      relatedEntityId: 'app-1',
      description: 'Declared vehicle use matched the prohibited-use denylist.',
    });

    expect(scq.status).toBe('OPEN');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SCQ_RAISED', actor: 'system' }),
    );
  });

  it('advances through the linear escalation and audits from/to', async () => {
    await service.raise({
      raisedBy: 'system',
      relatedEntityType: 'Application',
      relatedEntityId: 'app-1',
      description: 'test',
    });

    const reviewed = await service.advanceStatus(
      'scq-1',
      'HEAD_OF_COMPLIANCE_REVIEWED',
      'compliance-1',
    );
    expect(reviewed.status).toBe('HEAD_OF_COMPLIANCE_REVIEWED');
    expect(reviewed.headOfComplianceReviewedAt).toBeInstanceOf(Date);

    const ruled = await service.advanceStatus('scq-1', 'SSB_REVIEWING', 'compliance-1');
    expect(ruled.status).toBe('SSB_REVIEWING');

    const final = await service.advanceStatus(
      'scq-1',
      'RULED',
      'ssb-scholar-1',
      'No breach found.',
    );
    expect(final.status).toBe('RULED');
    expect(final.rulingSummary).toBe('No breach found.');
    expect(final.ssbRuledAt).toBeInstanceOf(Date);

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SCQ_STATUS_CHANGED', actor: 'ssb-scholar-1' }),
    );
  });

  it('rejects skipping a stage without touching persistence', async () => {
    await service.raise({
      raisedBy: 'system',
      relatedEntityType: 'Application',
      relatedEntityId: 'app-1',
      description: 'test',
    });

    await expect(service.advanceStatus('scq-1', 'RULED', 'compliance-1')).rejects.toThrow(
      /Illegal SCQ status transition/,
    );
    expect(prisma.shariaComplianceQuery.update).not.toHaveBeenCalled();
  });

  it('lists all SCQs newest first', async () => {
    await service.raise({
      raisedBy: 'system',
      relatedEntityType: 'Application',
      relatedEntityId: 'app-1',
      description: 'test',
    });
    const all = await service.findAll();
    expect(all).toHaveLength(1);
  });
});
