import type { FinanceProduct, KycStatus } from '@markaba/shared';

// Re-exported from @markaba/shared — Application.mcsRecommendation stores this
// shape, so the type lives in the shared domain, not here.
export type { CreditRecommendation, CreditScoreResult, ScoreFactor } from '@markaba/shared';

/**
 * Mock inputs for Phase 1 scoring. `monthlyIncomeNaira` and
 * `existingMonthlyObligationsNaira` stand in for what the real model will pull
 * from the open-banking income check (Phase 2) — never live data in this phase.
 */
export interface CreditScoringInput {
  financedAmount: number;
  product: FinanceProduct;
  kycStatus: KycStatus;
  monthlyIncomeNaira: number;
  existingMonthlyObligationsNaira?: number;
}
