import { MockPaymentProvider } from './payments.mock';

describe('MockPaymentProvider', () => {
  const provider = new MockPaymentProvider();

  it('queues a payment when given a human-approval token', async () => {
    const result = await provider.queuePayment({
      applicationId: 'app-1',
      amountNaira: 5_000_000,
      purpose: 'DISBURSEMENT',
      humanApprovalToken: 'approval-token-123',
      approvedBy: 'credit-analyst-1',
    });
    expect(result.status).toBe('QUEUED');
    expect(result.approvedBy).toBe('credit-analyst-1');
  });

  it('refuses to queue a payment without a human-approval token', async () => {
    await expect(
      provider.queuePayment({
        applicationId: 'app-1',
        amountNaira: 5_000_000,
        purpose: 'DISBURSEMENT',
        humanApprovalToken: '',
        approvedBy: 'credit-analyst-1',
      }),
    ).rejects.toThrow(/human checkpoint/);
  });

  it('refuses to queue a payment without an accountable actor', async () => {
    await expect(
      provider.queuePayment({
        applicationId: 'app-1',
        amountNaira: 5_000_000,
        purpose: 'REPAYMENT_COLLECTION',
        humanApprovalToken: 'token',
        approvedBy: '',
      }),
    ).rejects.toThrow(/human checkpoint/);
  });
});
