import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  TELEMATICS_PROVIDER,
  type TelematicsProvider,
} from '../integrations/telematics/telematics.types';

export interface CreateVehicleInput {
  make: string;
  model: string;
  year: number;
  vin: string;
  mileage: number;
  inspectionGrade?: string;
  marketValuation: number;
}

/**
 * Operations Lead workflow (PRD B.5): sourcing a vehicle, recording its purchase,
 * and fitting a GPS tracker. Recording a purchase receipt is evidence-recording,
 * not contract generation — it is the precondition the Sharia-critical
 * `PURCHASE_CONFIRMED -> CONTRACT_SIGNED` state-machine gate checks for, but this
 * service does not itself decide anything Sharia-critical (CLAUDE.md §2.1).
 */
@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(TELEMATICS_PROVIDER) private readonly telematics: TelematicsProvider,
  ) {}

  async create(input: CreateVehicleInput, actor: string) {
    // purchaseReceiptRef and gpsImei are intentionally left unset — null until
    // PURCHASE_CONFIRMED / GPS fitment (PRD A.6).
    const vehicle = await this.prisma.vehicle.create({ data: input });

    await this.audit.log({
      actor,
      action: 'VEHICLE_CREATED',
      entityType: 'Vehicle',
      entityId: vehicle.id,
    });

    return vehicle;
  }

  async findById(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
    return vehicle;
  }

  /**
   * Records a verified purchase receipt — Markaba/SPV has bought the vehicle and
   * is now the legal owner (PRD A.2.1, A.3 Sharia rule 1). This is the fact the
   * `PURCHASE_CONFIRMED` application state and the SSB-gated `CONTRACT_SIGNED`
   * transition depend on.
   */
  async recordPurchase(vehicleId: string, purchaseReceiptRef: string, actor: string) {
    await this.findById(vehicleId);

    const updated = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        purchaseReceiptRef,
        purchaseConfirmedAt: new Date(),
        status: 'PURCHASE_CONFIRMED',
      },
    });

    await this.audit.log({
      actor,
      action: 'VEHICLE_PURCHASE_RECORDED',
      entityType: 'Vehicle',
      entityId: vehicleId,
      metadata: { purchaseReceiptRef },
    });

    return updated;
  }

  /** Fits a GPS tracker at possession (PRD B.1 stage 9), via the mock Initrack adapter. */
  async recordGpsFitment(vehicleId: string, actor: string) {
    await this.findById(vehicleId);

    const { deviceId } = await this.telematics.provisionDevice(vehicleId);

    const updated = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { gpsImei: deviceId },
    });

    await this.audit.log({
      actor,
      action: 'VEHICLE_GPS_FITTED',
      entityType: 'Vehicle',
      entityId: vehicleId,
      metadata: { deviceId },
    });

    return updated;
  }
}
