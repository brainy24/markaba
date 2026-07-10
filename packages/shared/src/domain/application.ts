/**
 * Application — the origination case for a single customer's vehicle finance
 * request. `state` is authoritative and must only ever move via `canTransition`
 * (see state-machine.ts). Nothing in this file executes Sharia-critical or
 * money-moving logic — see CLAUDE.md §2.1 and §2.3.
 */
import type { CreditScoreResult } from './credit-score';

export type FinanceProduct = 'IJARAH' | 'MURABAHA';

export interface Application {
  id: string;
  customerId: string;
  vehicleId?: string;
  guarantorIds: string[];
  state: ApplicationState;
  product: FinanceProduct;
  financedAmount: number;
  downPaymentPct: number;
  termMonths: number;
  /** Screened against the prohibited-use denylist — see prohibited-use.ts. */
  declaredVehicleUse: string;
  /**
   * The full Phase 1 MCS stub output (score + recommendation + explanation),
   * not just the enum — the admin explanation view needs the factor breakdown.
   * Unset until `UNDERWRITING` scores it. Never a binding decision (CLAUDE.md §2.3).
   */
  mcsRecommendation?: CreditScoreResult;
  createdAt: Date;
  updatedAt: Date;
}

export const APPLICATION_STATES = [
  'SUBMITTED',
  'KYC_PENDING',
  'OPEN_BANKING_CONSENT',
  'UNDERWRITING',
  'APPROVED',
  'REFERRED',
  'DECLINED',
  'VEHICLE_SOURCING',
  'PURCHASE_CONFIRMED',
  'CONTRACT_SIGNED',
  'ACTIVE',
  'COMPLETED',
  'DEFAULTED',
] as const;

export type ApplicationState = (typeof APPLICATION_STATES)[number];

/** Terminal states — no outbound transitions are legal from these. */
export const TERMINAL_STATES: ReadonlySet<ApplicationState> = new Set([
  'DECLINED',
  'COMPLETED',
  'DEFAULTED',
]);
