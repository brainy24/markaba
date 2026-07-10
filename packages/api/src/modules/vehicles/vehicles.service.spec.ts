import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TELEMATICS_PROVIDER } from '../integrations/telematics/telematics.types';
import { VehiclesService } from './vehicles.service';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let prisma: { vehicle: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock } };
  let audit: { log: jest.Mock };
  let telematics: { provisionDevice: jest.Mock; getLocation: jest.Mock };
  let stored: Record<string, unknown> | undefined;

  beforeEach(async () => {
    stored = undefined;
    prisma = {
      vehicle: {
        create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
          stored = { id: 'veh-1', status: 'SOURCING', ...data };
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
    telematics = {
      provisionDevice: jest.fn(() =>
        Promise.resolve({ deviceId: 'mock-initrack-veh-1', status: 'PROVISIONED' }),
      ),
      getLocation: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: TELEMATICS_PROVIDER, useValue: telematics },
      ],
    }).compile();

    service = moduleRef.get(VehiclesService);
  });

  const CREATE_INPUT = {
    make: 'Toyota',
    model: 'Corolla',
    year: 2021,
    vin: 'JT2AE09W5M0123456',
    mileage: 42_000,
    marketValuation: 8_500_000,
  };

  it('creates a vehicle with null purchaseReceiptRef and gpsImei', async () => {
    const vehicle = await service.create(CREATE_INPUT, 'ops-1');
    expect(vehicle.purchaseReceiptRef).toBeUndefined();
    expect(vehicle.gpsImei).toBeUndefined();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'VEHICLE_CREATED', actor: 'ops-1' }),
    );
  });

  it('records a purchase, sets status to PURCHASE_CONFIRMED, and audits it', async () => {
    await service.create(CREATE_INPUT, 'ops-1');
    const updated = await service.recordPurchase('veh-1', 'receipt-ref-001', 'ops-1');

    expect(updated.purchaseReceiptRef).toBe('receipt-ref-001');
    expect(updated.status).toBe('PURCHASE_CONFIRMED');
    expect(updated.purchaseConfirmedAt).toBeInstanceOf(Date);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'VEHICLE_PURCHASE_RECORDED', actor: 'ops-1' }),
    );
  });

  it('fits a GPS tracker via the mock telematics adapter and audits it', async () => {
    await service.create(CREATE_INPUT, 'ops-1');
    const updated = await service.recordGpsFitment('veh-1', 'ops-1');

    expect(updated.gpsImei).toBe('mock-initrack-veh-1');
    expect(telematics.provisionDevice).toHaveBeenCalledWith('veh-1');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'VEHICLE_GPS_FITTED', actor: 'ops-1' }),
    );
  });

  it('throws NotFoundException for an unknown vehicle', async () => {
    await expect(service.recordPurchase('missing', 'ref', 'ops-1')).rejects.toThrow(
      'Vehicle missing not found',
    );
  });
});
