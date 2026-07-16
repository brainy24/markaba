import { Test } from '@nestjs/testing';
import { CustomersService } from '../customers/customers.service';
import { ApplicationsService } from '../applications/applications.service';
import { ConversationalAgentService } from './agent/conversational-agent.service';
import { WhatsAppService } from './whatsapp.service';

describe('WhatsAppService', () => {
  let service: WhatsAppService;
  let customers: { findByPhoneNumber: jest.Mock; create: jest.Mock };
  let applications: {
    create: jest.Mock;
    findLatestByCustomer: jest.Mock;
  };
  let agent: { reply: jest.Mock };

  beforeEach(async () => {
    customers = {
      findByPhoneNumber: jest.fn(() => Promise.resolve(null)),
      create: jest.fn(() => Promise.resolve({ id: 'cust-1', phone: '+2348000000001' })),
    };
    applications = {
      create: jest.fn(() => Promise.resolve({ id: 'app-1', state: 'SUBMITTED' })),
      findLatestByCustomer: jest.fn(() => Promise.resolve(null)),
    };
    agent = { reply: jest.fn(() => Promise.resolve('Ijarah is a lease-to-own arrangement.')) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        WhatsAppService,
        { provide: CustomersService, useValue: customers },
        { provide: ApplicationsService, useValue: applications },
        { provide: ConversationalAgentService, useValue: agent },
      ],
    }).compile();

    service = moduleRef.get(WhatsAppService);
  });

  it('delegates education questions to the conversational agent, no PII involved', async () => {
    const reply = await service.handleMessage({ from: '+2348000000001', text: 'what is ijarah?' });

    expect(agent.reply).toHaveBeenCalledWith('+2348000000001', 'what is ijarah?');
    expect(reply).toBe('Ijarah is a lease-to-own arrangement.');
    expect(customers.create).not.toHaveBeenCalled();
  });

  it('delegates an unrecognised message to the conversational agent too', async () => {
    const reply = await service.handleMessage({ from: '+2348000000001', text: 'good morning' });

    expect(agent.reply).toHaveBeenCalledWith('+2348000000001', 'good morning');
    expect(reply).toBe('Ijarah is a lease-to-own arrangement.');
  });

  it('never lets the conversational agent trigger apply/status itself', async () => {
    await service.handleMessage({ from: '+2348000000001', text: 'what is ijarah?' });

    expect(applications.create).not.toHaveBeenCalled();
    expect(applications.findLatestByCustomer).not.toHaveBeenCalled();
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
    expect(agent.reply).not.toHaveBeenCalled();
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
    expect(agent.reply).not.toHaveBeenCalled();
  });

  it('tells a customer with no record to apply first when checking status', async () => {
    const reply = await service.handleMessage({ from: '+2348000000001', text: 'status' });
    expect(reply).toMatch(/apply/i);
  });
});
