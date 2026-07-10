import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TelematicsModule } from '../integrations/telematics/telematics.module';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [AuditModule, TelematicsModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
