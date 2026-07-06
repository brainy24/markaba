import { ApplicationsController } from './applications.controller';
import type { CustomersService } from '../customers/customers.service';
import type { ApplicationsService } from './applications.service';

describe('ApplicationsController', () => {
  it('returns an empty array when no customer matches the phone number', async () => {
    const customers = { findByPhoneNumber: jest.fn(() => Promise.resolve(null)) };
    const applications = { findLatestByCustomer: jest.fn() };
    const controller = new ApplicationsController(
      customers as unknown as CustomersService,
      applications as unknown as ApplicationsService,
    );

    const result = await controller.findMine('+2348000000001');
    expect(result).toEqual([]);
    expect(applications.findLatestByCustomer).not.toHaveBeenCalled();
  });

  it('returns the latest application for a known customer', async () => {
    const customers = {
      findByPhoneNumber: jest.fn(() => Promise.resolve({ id: 'cust-1' })),
    };
    const applications = {
      findLatestByCustomer: jest.fn(() => Promise.resolve({ id: 'app-1', state: 'UNDERWRITING' })),
    };
    const controller = new ApplicationsController(
      customers as unknown as CustomersService,
      applications as unknown as ApplicationsService,
    );

    const result = await controller.findMine('+2348000000001');
    expect(result).toEqual([{ id: 'app-1', state: 'UNDERWRITING' }]);
  });

  it('returns an empty array when the customer has no applications yet', async () => {
    const customers = {
      findByPhoneNumber: jest.fn(() => Promise.resolve({ id: 'cust-1' })),
    };
    const applications = { findLatestByCustomer: jest.fn(() => Promise.resolve(null)) };
    const controller = new ApplicationsController(
      customers as unknown as CustomersService,
      applications as unknown as ApplicationsService,
    );

    const result = await controller.findMine('+2348000000001');
    expect(result).toEqual([]);
  });
});
