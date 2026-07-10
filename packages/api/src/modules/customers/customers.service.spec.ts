import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotImplementedError } from '@markaba/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: { customer: { create: jest.Mock; findUnique: jest.Mock } };
  let audit: { log: jest.Mock };

  beforeEach(async () => {
    prisma = {
      customer: {
        create: jest.fn(({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: 'cust-1', ...data }),
        ),
        findUnique: jest.fn(),
      },
    };
    audit = { log: jest.fn(() => Promise.resolve({})) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = moduleRef.get(CustomersService);
  });

  it('creates a customer', async () => {
    const customer = await service.create({
      displayName: 'Amina Yusuf',
      phone: '+2348000000001',
    });
    expect(customer.id).toBe('cust-1');
  });

  it('finds a customer by id', async () => {
    prisma.customer.findUnique.mockResolvedValueOnce({ id: 'cust-1', displayName: 'Amina Yusuf' });
    const customer = await service.findById('cust-1');
    expect(customer.displayName).toBe('Amina Yusuf');
  });

  it('throws NotFoundException for an unknown id', async () => {
    prisma.customer.findUnique.mockResolvedValueOnce(null);
    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });

  it('finds a customer by phone number', async () => {
    prisma.customer.findUnique.mockResolvedValueOnce({ id: 'cust-1', phone: '+2348000000001' });
    const customer = await service.findByPhoneNumber('+2348000000001');
    expect(customer?.id).toBe('cust-1');
  });

  describe('scheduleDeletion', () => {
    it('audit-logs the request and throws NotImplementedError — no real purge in Phase 1', async () => {
      await expect(service.scheduleDeletion('cust-1', 'compliance-officer')).rejects.toBeInstanceOf(
        NotImplementedError,
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETION_SCHEDULED',
          actor: 'compliance-officer',
          entityType: 'Customer',
          entityId: 'cust-1',
        }),
      );
    });
  });
});
