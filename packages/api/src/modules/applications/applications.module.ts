import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CustomersModule } from '../customers/customers.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
  imports: [AuditModule, CustomersModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
