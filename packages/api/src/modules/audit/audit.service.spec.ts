import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let records: Array<Record<string, unknown>>;
  let prisma: { auditLog: { create: jest.Mock; findMany: jest.Mock } };

  beforeEach(async () => {
    records = [];
    prisma = {
      auditLog: {
        create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
          const record = { id: `audit-${records.length}`, createdAt: new Date(), ...data };
          records.push(record);
          return Promise.resolve(record);
        }),
        findMany: jest.fn(({ where }: { where: { entityType: string; entityId: string } }) =>
          Promise.resolve(
            records.filter(
              (r) => r.entityType === where.entityType && r.entityId === where.entityId,
            ),
          ),
        ),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(AuditService);
  });

  it('persists a timestamped record capturing the actor', async () => {
    const record = await service.log({
      actor: 'system',
      action: 'APPLICATION_STATE_CHANGED',
      entityType: 'Application',
      entityId: 'app-1',
      metadata: { from: 'SUBMITTED', to: 'KYC_PENDING' },
    });

    expect(record.actor).toBe('system');
    expect(record.createdAt).toBeInstanceOf(Date);
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it('appends rather than mutates — each log call creates a new record', async () => {
    await service.log({ actor: 'a', action: 'X', entityType: 'Application', entityId: '1' });
    await service.log({ actor: 'a', action: 'Y', entityType: 'Application', entityId: '1' });

    const history = await service.findByEntity('Application', '1');
    expect(history).toHaveLength(2);
    expect(history[0]?.action).toBe('X');
    expect(history[1]?.action).toBe('Y');
  });

  it('exposes no update or delete method — records are immutable once written', () => {
    expect((service as unknown as Record<string, unknown>)['update']).toBeUndefined();
    expect((service as unknown as Record<string, unknown>)['delete']).toBeUndefined();
  });
});
