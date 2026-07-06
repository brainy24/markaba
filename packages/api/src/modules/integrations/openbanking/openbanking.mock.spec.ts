import { MockOpenBankingProvider } from './openbanking.mock';

describe('MockOpenBankingProvider', () => {
  const provider = new MockOpenBankingProvider();

  it('grants consent immediately (sandbox behaviour)', async () => {
    const result = await provider.initiateConsent('cust-1');
    expect(result.status).toBe('GRANTED');
    expect(result.consentId).toContain('cust-1');
  });

  it('returns a fake income summary', async () => {
    const summary = await provider.getIncomeSummary('mock-consent-cust-1');
    expect(summary.monthlyIncomeNaira).toBeGreaterThan(0);
    expect(summary.transactionCount).toBeGreaterThan(0);
  });

  it('returns a fake, pending debit mandate', async () => {
    const mandate = await provider.createDebitMandate({ customerId: 'cust-1', amountNaira: 50_000 });
    expect(mandate.status).toBe('PENDING');
    expect(mandate.mandateId).toMatch(/^mock-mandate-/);
  });
});
