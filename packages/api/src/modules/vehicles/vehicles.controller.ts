import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { VehiclesService, type CreateVehicleInput } from './vehicles.service';

interface RecordPurchaseBody {
  purchaseReceiptRef: string;
  actor: string;
}

interface RecordGpsFitmentBody {
  actor: string;
}

interface CreateVehicleBody extends CreateVehicleInput {
  actor: string;
}

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Post()
  create(@Body() body: CreateVehicleBody) {
    const { actor, ...input } = body;
    return this.vehicles.create(input, actor);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.vehicles.findById(id);
  }

  @Post(':id/record-purchase')
  recordPurchase(@Param('id') id: string, @Body() body: RecordPurchaseBody) {
    return this.vehicles.recordPurchase(id, body.purchaseReceiptRef, body.actor);
  }

  @Post(':id/record-gps-fitment')
  recordGpsFitment(@Param('id') id: string, @Body() body: RecordGpsFitmentBody) {
    return this.vehicles.recordGpsFitment(id, body.actor);
  }
}
