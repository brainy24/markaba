import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ScqService } from './scq.service';

@Module({
  imports: [AuditModule],
  providers: [ScqService],
  exports: [ScqService],
})
export class ScqModule {}
