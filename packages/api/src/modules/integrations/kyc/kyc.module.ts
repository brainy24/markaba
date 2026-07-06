import { Module } from '@nestjs/common';
import { getProviderMode, throwLiveModeNotImplemented } from '../provider-mode';
import { KYC_PROVIDER } from './kyc.types';
import { MockKycProvider } from './kyc.mock';

@Module({
  providers: [
    {
      provide: KYC_PROVIDER,
      useFactory: () => {
        if (getProviderMode() === 'live') {
          // HUMAN-CHECKPOINT: live provider wiring requires credentials + registration.
          throwLiveModeNotImplemented('Smile Identity KYC provider');
        }
        return new MockKycProvider();
      },
    },
  ],
  exports: [KYC_PROVIDER],
})
export class KycModule {}
