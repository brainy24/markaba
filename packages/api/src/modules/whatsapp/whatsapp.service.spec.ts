import { Test } from '@nestjs/testing';
import { CustomersService } from '../customers/customers.service';
import { ApplicationsService } from '../applications/applications.service';
import { WhatsAppService } from './whatsapp.service';

describe('WhatsAppService', () => {
  let service: WhatsAppService;
  let customers: { findByPhoneNumber: jest.Mock; create: jest.Mock };
  let applications: {
    create: jest.Mock;
    findLatestByCustomer: jest.Mock;
  };

  beforeEach(async () => {
    customers = {
      findByPhoneNumber: jest.fn(() => Promise.resolve(null)),
      create: jest.fn(() => Promise.resolve({ id: 'cust-1', phone: '+2348000000001' })),
    };
    applications = {
      create: jest.fn(() => Promise.resolve({ id: 'app-1', state: 'SUBMITTED' })),
      findLatestByCustomer: jest.fn(() => Promise.resolve(null)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        WhatsAppService,
        { provide: CustomersService, useValue: customers },
        { provide: ApplicationsService, useValue: applications },
      ],
    }).compile();

    service = moduleRef.get(WhatsAppService);
  });

  it('answers education questions from the static FAQ content, no PII involved', async () => {
    const reply = await service.handleMessage({ from: '+2348000000001', text: 'what is ijarah?' });
    expect(reply).toContain('lease-to-own');
    expect(customers.create).not.toHaveBeenCalled();
  });

  it('creates a new customer + application on "apply", using only the sender phone number', async () => {
    const reply = await service.handleMessage({ from: '+2348000000001', text: 'apply' });

    expect(customers.create).toHaveBeenCalledWith({
      displayName: 'Pending KYC',
      phone: '+2348000000001',
    });
    expect(applications.create).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'cust-1' }),
      'whatsapp-bot',
    );
    expect(reply).toContain('app-1');
    expect(reply).toContain('SUBMITTED');
  });

  it('reuses an existing customer record instead of creating a duplicate', async () => {
    customers.findByPhoneNumber.mockResolvedValueOnce({
      id: 'cust-existing',
      phone: '+2348000000001',
    });

    await service.handleMessage({ from: '+2348000000001', text: 'apply' });

    expect(customers.create).not.toHaveBeenCalled();
    expect(applications.create).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'cust-existing' }),
      'whatsapp-bot',
    );
  });

  it('reports application status when one exists', async () => {
    customers.findByPhoneNumber.mockResolvedValueOnce({ id: 'cust-1' });
    applications.findLatestByCustomer.mockResolvedValueOnce({ id: 'app-1', state: 'UNDERWRITING' });

    const reply = await service.handleMessage({ from: '+2348000000001', text: 'status' });
    expect(reply).toContain('UNDERWRITING');
  });

  it('tells a customer with no record to apply first when checking status', async () => {
    const reply = await service.handleMessage({ from: '+2348000000001', text: 'status' });
    expect(reply).toMatch(/apply/i);
  });

  it('falls back to the menu for an unrecognised message', async () => {
    const reply = await service.handleMessage({ from: '+2348000000001', text: 'good morning' });
    expect(reply).toMatch(/didn't understand/i);
  });
});
