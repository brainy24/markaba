import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: { customer: { create: jest.Mock; findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      customer: {
        create: jest.fn(({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: 'cust-1', ...data }),
        ),
        findUnique: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [CustomersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(CustomersService);
  });

  it('creates a customer', async () => {
    const customer = await service.create({
      fullName: 'Amina Yusuf',
      phoneNumber: '+2348000000001',
    });
    expect(customer.id).toBe('cust-1');
  });

  it('finds a customer by id', async () => {
    prisma.customer.findUnique.mockResolvedValueOnce({ id: 'cust-1', fullName: 'Amina Yusuf' });
    const customer = await service.findById('cust-1');
    expect(customer.fullName).toBe('Amina Yusuf');
  });

  it('throws NotFoundException for an unknown id', async () => {
    prisma.customer.findUnique.mockResolvedValueOnce(null);
    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });

  it('finds a customer by phone number', async () => {
    prisma.customer.findUnique.mockResolvedValueOnce({ id: 'cust-1', phoneNumber: '+2348000000001' });
    const customer = await service.findByPhoneNumber('+2348000000001');
    expect(customer?.id).toBe('cust-1');
  });
});
