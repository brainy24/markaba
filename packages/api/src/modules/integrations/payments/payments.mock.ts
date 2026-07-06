import { Injectable } from '@nestjs/common';
import type { PaymentInstruction, PaymentProvider, PaymentQueueResult } from './payments.types';

/**
 * Mock Paystack adapter. Only ever queues a fake instruction for a human to
 * action — it never calls out to Paystack and never moves real money
 * (CLAUDE.md §2.3). Throws if the human-approval token is missing, modelling the
 * checkpoint even in sandbox mode.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  async queuePayment(instruction: PaymentInstruction): Promise<PaymentQueueResult> {
    if (!instruction.humanApprovalToken || !instruction.approvedBy) {
      throw new Error(
        'Refusing to queue a payment without a humanApprovalToken and approvedBy actor ' +
          '(CLAUDE.md §2.3 — money movement requires a human checkpoint).',
      );
    }

    return Promise.resolve({
      reference: `mock-paystack-${instruction.purpose}-${instruction.applicationId}`,
      status: 'QUEUED',
      approvedBy: instruction.approvedBy,
    });
  }
}
