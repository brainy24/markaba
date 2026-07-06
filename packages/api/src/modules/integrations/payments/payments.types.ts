export type PaymentPurpose = 'DISBURSEMENT' | 'REPAYMENT_COLLECTION';
export type PaymentStatus = 'QUEUED';

/**
 * `humanApprovalToken` and `approvedBy` are mandatory (CLAUDE.md §2.3 — disbursement
 * and collections escalation are human-accountable actions). Code may only *queue*
 * a payment instruction; it must never execute a binding transfer autonomously.
 */
export interface PaymentInstruction {
  applicationId: string;
  amountNaira: number;
  purpose: PaymentPurpose;
  humanApprovalToken: string;
  approvedBy: string;
}

export interface PaymentQueueResult {
  reference: string;
  status: PaymentStatus;
  approvedBy: string;
}

/** Adapter interface for the payment provider (Paystack in production). */
export interface PaymentProvider {
  /** Queues a payment instruction. Never moves money by itself — see above. */
  queuePayment(instruction: PaymentInstruction): Promise<PaymentQueueResult>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
