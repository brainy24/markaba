import { Module } from '@nestjs/common';
import { getProviderMode, throwLiveModeNotImplemented } from '../provider-mode';
import { PAYMENT_PROVIDER } from './payments.types';
import { MockPaymentProvider } from './payments.mock';

@Module({
  providers: [
    {
      provide: PAYMENT_PROVIDER,
      useFactory: () => {
        if (getProviderMode() === 'live') {
          // HUMAN-CHECKPOINT: live provider wiring requires credentials + registration.
          throwLiveModeNotImplemented('Paystack payment provider');
        }
        return new MockPaymentProvider();
      },
    },
  ],
  exports: [PAYMENT_PROVIDER],
})
export class PaymentsModule {}
