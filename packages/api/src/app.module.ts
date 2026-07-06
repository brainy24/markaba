import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { CustomersModule } from './modules/customers/customers.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { CreditModule } from './modules/credit/credit.module';
import { ShariaModule } from './modules/sharia/sharia.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    CustomersModule,
    ApplicationsModule,
    WhatsAppModule,
    IntegrationsModule,
    CreditModule,
    ShariaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
