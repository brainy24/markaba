import { VehiclesController } from './vehicles.controller';
import type { VehiclesService } from './vehicles.service';

describe('VehiclesController', () => {
  it('strips actor out of the body before calling create()', async () => {
    const vehicles = { create: jest.fn(() => Promise.resolve({ id: 'veh-1' })) };
    const controller = new VehiclesController(vehicles as unknown as VehiclesService);

    const result = await controller.create({
      make: 'Toyota',
      model: 'Corolla',
      year: 2021,
      vin: 'JT2AE09W5M0123456',
      mileage: 42_000,
      marketValuation: 8_500_000,
      actor: 'ops-1',
    });

    expect(vehicles.create).toHaveBeenCalledWith(
      {
        make: 'Toyota',
        model: 'Corolla',
        year: 2021,
        vin: 'JT2AE09W5M0123456',
        mileage: 42_000,
        marketValuation: 8_500_000,
      },
      'ops-1',
    );
    expect(result).toEqual({ id: 'veh-1' });
  });

  it('delegates findById', async () => {
    const vehicles = { findById: jest.fn(() => Promise.resolve({ id: 'veh-1' })) };
    const controller = new VehiclesController(vehicles as unknown as VehiclesService);

    await controller.findById('veh-1');
    expect(vehicles.findById).toHaveBeenCalledWith('veh-1');
  });

  it('delegates recordPurchase', async () => {
    const vehicles = { recordPurchase: jest.fn(() => Promise.resolve({ id: 'veh-1' })) };
    const controller = new VehiclesController(vehicles as unknown as VehiclesService);

    await controller.recordPurchase('veh-1', { purchaseReceiptRef: 'ref-1', actor: 'ops-1' });
    expect(vehicles.recordPurchase).toHaveBeenCalledWith('veh-1', 'ref-1', 'ops-1');
  });

  it('delegates recordGpsFitment', async () => {
    const vehicles = { recordGpsFitment: jest.fn(() => Promise.resolve({ id: 'veh-1' })) };
    const controller = new VehiclesController(vehicles as unknown as VehiclesService);

    await controller.recordGpsFitment('veh-1', { actor: 'ops-1' });
    expect(vehicles.recordGpsFitment).toHaveBeenCalledWith('veh-1', 'ops-1');
  });
});
