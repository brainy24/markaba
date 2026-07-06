import { Module } from '@nestjs/common';
import { KycModule } from './kyc/kyc.module';
import { OpenBankingModule } from './openbanking/openbanking.module';
import { PaymentsModule } from './payments/payments.module';
import { TelematicsModule } from './telematics/telematics.module';
import { ESignatureModule } from './esignature/esignature.module';

@Module({
  imports: [KycModule, OpenBankingModule, PaymentsModule, TelematicsModule, ESignatureModule],
  exports: [KycModule, OpenBankingModule, PaymentsModule, TelematicsModule, ESignatureModule],
})
export class IntegrationsModule {}
