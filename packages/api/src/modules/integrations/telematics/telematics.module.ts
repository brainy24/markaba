import { Module } from '@nestjs/common';
import { getProviderMode, throwLiveModeNotImplemented } from '../provider-mode';
import { TELEMATICS_PROVIDER } from './telematics.types';
import { MockTelematicsProvider } from './telematics.mock';

@Module({
  providers: [
    {
      provide: TELEMATICS_PROVIDER,
      useFactory: () => {
        if (getProviderMode() === 'live') {
          // HUMAN-CHECKPOINT: live provider wiring requires credentials + registration.
          throwLiveModeNotImplemented('Initrack telematics provider');
        }
        return new MockTelematicsProvider();
      },
    },
  ],
  exports: [TELEMATICS_PROVIDER],
})
export class TelematicsModule {}
