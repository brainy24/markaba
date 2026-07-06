import { Module } from '@nestjs/common';
import { getProviderMode, throwLiveModeNotImplemented } from '../provider-mode';
import { ESIGNATURE_PROVIDER } from './esignature.types';
import { MockESignatureProvider } from './esignature.mock';

@Module({
  providers: [
    {
      provide: ESIGNATURE_PROVIDER,
      useFactory: () => {
        if (getProviderMode() === 'live') {
          // HUMAN-CHECKPOINT: live provider wiring requires credentials + registration.
          throwLiveModeNotImplemented('DocuSign/Zoho Sign e-signature provider');
        }
        return new MockESignatureProvider();
      },
    },
  ],
  exports: [ESIGNATURE_PROVIDER],
})
export class ESignatureModule {}
