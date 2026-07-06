import { Module } from '@nestjs/common';
import { getProviderMode, throwLiveModeNotImplemented } from '../provider-mode';
import { OPEN_BANKING_PROVIDER } from './openbanking.types';
import { MockOpenBankingProvider } from './openbanking.mock';

@Module({
  providers: [
    {
      provide: OPEN_BANKING_PROVIDER,
      useFactory: () => {
        if (getProviderMode() === 'live') {
          // HUMAN-CHECKPOINT: live provider wiring requires credentials + registration.
          throwLiveModeNotImplemented('Mono/Okra open-banking provider');
        }
        return new MockOpenBankingProvider();
      },
    },
  ],
  exports: [OPEN_BANKING_PROVIDER],
})
export class OpenBankingModule {}
