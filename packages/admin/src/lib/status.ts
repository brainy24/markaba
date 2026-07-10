/** Maps an application state to a visual category for badge styling only. */
export type StatusTone = 'neutral' | 'progress' | 'positive' | 'warning' | 'negative';

const TONE_BY_STATE: Record<string, StatusTone> = {
  SUBMITTED: 'neutral',
  KYC_PENDING: 'neutral',
  OPEN_BANKING_CONSENT: 'neutral',
  UNDERWRITING: 'progress',
  APPROVED: 'positive',
  REFERRED: 'warning',
  DECLINED: 'negative',
  VEHICLE_SOURCING: 'progress',
  PURCHASE_CONFIRMED: 'progress',
  CONTRACT_SIGNED: 'progress',
  ACTIVE: 'positive',
  COMPLETED: 'positive',
  DEFAULTED: 'negative',
};

export function toneForState(state: string): StatusTone {
  return TONE_BY_STATE[state] ?? 'neutral';
}
