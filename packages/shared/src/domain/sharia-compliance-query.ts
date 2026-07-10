/**
 * ShariaComplianceQuery (SCQ) — the escalation record for any Sharia-compliance
 * concern (PRD A.3 escalation path, A.6 data model). This is a data record and a
 * manual workflow tracker, not a ruling engine — every status change here is a
 * human action (Head of Compliance / SSB), logged via the audit utility. Nothing
 * in this file evaluates or rules on anything, so it is not blocked by CLAUDE.md
 * §2.1 the way contract generation is.
 */
export const SCQ_STATUSES = [
  'OPEN',
  'HEAD_OF_COMPLIANCE_REVIEWED',
  'SSB_REVIEWING',
  'RULED',
] as const;

export type ScqStatus = (typeof SCQ_STATUSES)[number];

export interface ShariaComplianceQuery {
  id: string;
  raisedBy: string;
  relatedEntityType: string;
  relatedEntityId: string;
  description: string;
  status: ScqStatus;
  raisedAt: Date;
  headOfComplianceReviewedAt?: Date;
  ssbRuledAt?: Date;
  rulingSummary?: string;
}

/** Linear escalation — no skipping stages, no going backwards (PRD A.3). */
const SCQ_TRANSITIONS: Readonly<Record<ScqStatus, readonly ScqStatus[]>> = {
  OPEN: ['HEAD_OF_COMPLIANCE_REVIEWED'],
  HEAD_OF_COMPLIANCE_REVIEWED: ['SSB_REVIEWING'],
  SSB_REVIEWING: ['RULED'],
  RULED: [],
};

export function canTransitionScq(from: ScqStatus, to: ScqStatus): boolean {
  return SCQ_TRANSITIONS[from].includes(to);
}
