/**
 * Markaba Credit Score (MCS) result shape — a recommendation for a human to
 * consider, never a binding decision (CLAUDE.md §2.3). Lives in `shared` because
 * `Application.mcsRecommendation` stores it. The scoring logic itself (the
 * `CreditService` stub) lives in `packages/api/src/modules/credit` — this file is
 * the data shape only.
 */
export type CreditRecommendation =
  'RECOMMEND_APPROVE' | 'RECOMMEND_REFER' | 'RECOMMEND_MANUAL_REVIEW' | 'RECOMMEND_DECLINE';

export interface ScoreFactor {
  factor: string;
  contribution: number;
}

export interface CreditScoreResult {
  score: number;
  recommendation: CreditRecommendation;
  explanation: ScoreFactor[];
}
