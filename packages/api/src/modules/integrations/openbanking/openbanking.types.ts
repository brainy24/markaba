export type ConsentStatus = 'PENDING' | 'GRANTED' | 'REVOKED';
export type MandateStatus = 'PENDING' | 'ACTIVE' | 'CANCELLED';

export interface ConsentResult {
  consentId: string;
  status: ConsentStatus;
}

export interface IncomeSummary {
  monthlyIncomeNaira: number;
  averageBalanceNaira: number;
  transactionCount: number;
}

export interface DebitMandateInput {
  customerId: string;
  amountNaira: number;
}

export interface DebitMandateResult {
  mandateId: string;
  status: MandateStatus;
}

/**
 * Adapter interface for the open-banking provider (Mono/Okra in production).
 * Real debit mandates and live income data are blocked until CBN OBR + NIFI NBFC
 * registration (CLAUDE.md §2.4) — this interface is built against a mock only.
 */
export interface OpenBankingProvider {
  initiateConsent(customerId: string): Promise<ConsentResult>;
  getIncomeSummary(consentId: string): Promise<IncomeSummary>;
  createDebitMandate(input: DebitMandateInput): Promise<DebitMandateResult>;
}

export const OPEN_BANKING_PROVIDER = Symbol('OPEN_BANKING_PROVIDER');
