import { CreditService } from './credit.service';
import type { CreditScoringInput } from './credit.types';

describe('CreditService', () => {
  const service = new CreditService();

  const baseInput: CreditScoringInput = {
    requestedAmountNaira: 3_600_000,
    financeType: 'IJARAH',
    kycStatus: 'VERIFIED',
    monthlyIncomeNaira: 200_000,
  };

  it('never returns a binding decision — only RECOMMEND_* outcomes', () => {
    const result = service.score(baseInput);
    expect(result.recommendation.startsWith('RECOMMEND_')).toBe(true);
  });

  it('recommends approval for a strong profile (>=750)', () => {
    const result = service.score({
      ...baseInput,
      kycStatus: 'VERIFIED',
      monthlyIncomeNaira: 500_000,
    });
    expect(result.score).toBeGreaterThanOrEqual(750);
    expect(result.recommendation).toBe('RECOMMEND_APPROVE');
  });

  it('recommends referral for a mid-band profile (600-749)', () => {
    const result = service.score({
      ...baseInput,
      kycStatus: 'PENDING',
      monthlyIncomeNaira: 175_000,
    });
    expect(result.score).toBeGreaterThanOrEqual(600);
    expect(result.score).toBeLessThan(750);
    expect(result.recommendation).toBe('RECOMMEND_REFER');
  });

  it('recommends manual review for a weak-but-not-failing profile (500-599)', () => {
    const result = service.score({
      ...baseInput,
      kycStatus: 'NOT_STARTED',
      monthlyIncomeNaira: 175_000,
      existingMonthlyObligationsNaira: 10_000,
    });
    expect(result.score).toBeGreaterThanOrEqual(500);
    expect(result.score).toBeLessThan(600);
    expect(result.recommendation).toBe('RECOMMEND_MANUAL_REVIEW');
  });

  it('recommends decline for a failed-KYC, high-debt profile (<=499)', () => {
    const result = service.score({
      ...baseInput,
      kycStatus: 'FAILED',
      monthlyIncomeNaira: 50_000,
      existingMonthlyObligationsNaira: 45_000,
    });
    expect(result.score).toBeLessThan(500);
    expect(result.recommendation).toBe('RECOMMEND_DECLINE');
  });

  it('is deterministic for identical input', () => {
    expect(service.score(baseInput)).toEqual(service.score(baseInput));
  });

  it('clamps the score into [0, 1000]', () => {
    const result = service.score({
      ...baseInput,
      kycStatus: 'FAILED',
      monthlyIncomeNaira: 1,
      existingMonthlyObligationsNaira: 1,
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1000);
  });

  it('returns a factor-by-factor explanation covering every input dimension', () => {
    const result = service.score(baseInput);
    const factors = result.explanation.map((f) => f.factor);
    expect(factors.some((f) => f.startsWith('kycStatus'))).toBe(true);
    expect(factors).toContain('affordabilityRatio');
    expect(factors).toContain('existingDebtToIncome');
  });
});
