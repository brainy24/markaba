import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CustomersService } from './customers.service';

@Module({
  imports: [AuditModule],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
