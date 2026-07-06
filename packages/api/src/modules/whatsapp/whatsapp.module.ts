import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { ApplicationsModule } from '../applications/applications.module';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';

@Module({
  imports: [CustomersModule, ApplicationsModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppService],
})
export class WhatsAppModule {}
