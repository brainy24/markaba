import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { ApplicationsModule } from '../applications/applications.module';
import { AuditModule } from '../audit/audit.module';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { AnthropicClient } from './agent/anthropic-client';
import { ConversationalAgentService } from './agent/conversational-agent.service';

@Module({
  imports: [CustomersModule, ApplicationsModule, AuditModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, AnthropicClient, ConversationalAgentService],
})
export class WhatsAppModule {}
