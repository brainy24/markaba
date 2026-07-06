// STUB — Phase 1 rule-based placeholder. Real model = Phase 2, see PRD §7.7. Never
// issues a binding decision.
import { Injectable } from '@nestjs/common';
import type { CreditRecommendation, CreditScoreResult, CreditScoringInput, ScoreFactor } from './credit.types';

const BASE_SCORE = 500;

/** Assumed term (months) used only to estimate an installment for the affordability
 *  heuristic below. A placeholder, not a real underwriting term. */
const ASSUMED_TERM_MONTHS = 36;

const KYC_CONTRIBUTION: Record<CreditScoringInput['kycStatus'], number> = {
  VERIFIED: 150,
  PENDING: 0,
  NOT_STARTED: -100,
  FAILED: -400,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function bandRecommendation(score: number): CreditRecommendation {
  if (score >= 750) return 'RECOMMEND_APPROVE';
  if (score >= 600) return 'RECOMMEND_REFER';
  if (score >= 500) return 'RECOMMEND_MANUAL_REVIEW';
  return 'RECOMMEND_DECLINE';
}

@Injectable()
export class CreditService {
  /**
   * Deterministic Phase 1 stub score (0–1000) + a factor-by-factor explanation.
   * Consumed by a human underwriter — this function only recommends, it never
   * approves, declines, or otherwise binds Markaba to a credit decision.
   */
  score(input: CreditScoringInput): CreditScoreResult {
    const explanation: ScoreFactor[] = [];

    const kycContribution = KYC_CONTRIBUTION[input.kycStatus];
    explanation.push({ factor: `kycStatus:${input.kycStatus}`, contribution: kycContribution });

    const estimatedMonthlyInstallment = input.requestedAmountNaira / ASSUMED_TERM_MONTHS;
    const affordabilityRatio =
      estimatedMonthlyInstallment > 0
        ? input.monthlyIncomeNaira / estimatedMonthlyInstallment
        : 0;
    const affordabilityContribution = clamp(
      Math.round((affordabilityRatio - 1) * 200),
      -300,
      300,
    );
    explanation.push({ factor: 'affordabilityRatio', contribution: affordabilityContribution });

    const debtToIncome =
      input.monthlyIncomeNaira > 0
        ? (input.existingMonthlyObligationsNaira ?? 0) / input.monthlyIncomeNaira
        : 1;
    const debtToIncomeContribution = clamp(-Math.round(debtToIncome * 300), -300, 0);
    explanation.push({ factor: 'existingDebtToIncome', contribution: debtToIncomeContribution });

    const score = clamp(
      BASE_SCORE + kycContribution + affordabilityContribution + debtToIncomeContribution,
      0,
      1000,
    );

    return { score, recommendation: bandRecommendation(score), explanation };
  }
}
