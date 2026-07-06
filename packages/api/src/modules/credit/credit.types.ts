import type { KycStatus, VehicleFinanceType } from '@markaba/shared';

/**
 * Mock inputs for Phase 1 scoring. `monthlyIncomeNaira` and
 * `existingMonthlyObligationsNaira` stand in for what the real model will pull
 * from the open-banking income check (Phase 2) — never live data in this phase.
 */
export interface CreditScoringInput {
  requestedAmountNaira: number;
  financeType: VehicleFinanceType;
  kycStatus: KycStatus;
  monthlyIncomeNaira: number;
  existingMonthlyObligationsNaira?: number;
}

export type CreditRecommendation =
  | 'RECOMMEND_APPROVE'
  | 'RECOMMEND_REFER'
  | 'RECOMMEND_MANUAL_REVIEW'
  | 'RECOMMEND_DECLINE';

export interface ScoreFactor {
  factor: string;
  contribution: number;
}

/**
 * A recommendation for a human to consider — never a binding decision
 * (CLAUDE.md §2.3). `score` is the Markaba Credit Score, 0–1000.
 */
export interface CreditScoreResult {
  score: number;
  recommendation: CreditRecommendation;
  explanation: ScoreFactor[];
}
