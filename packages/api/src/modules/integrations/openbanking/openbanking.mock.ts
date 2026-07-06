import { Injectable } from '@nestjs/common';
import type {
  ConsentResult,
  DebitMandateInput,
  DebitMandateResult,
  IncomeSummary,
  OpenBankingProvider,
} from './openbanking.types';

/** Mock Mono/Okra adapter. Fake transactions and mandate IDs only (CLAUDE.md §2.2/§2.4). */
@Injectable()
export class MockOpenBankingProvider implements OpenBankingProvider {
  async initiateConsent(customerId: string): Promise<ConsentResult> {
    return Promise.resolve({
      consentId: `mock-consent-${customerId}`,
      status: 'GRANTED',
    });
  }

  async getIncomeSummary(_consentId: string): Promise<IncomeSummary> {
    return Promise.resolve({
      monthlyIncomeNaira: 350_000,
      averageBalanceNaira: 120_000,
      transactionCount: 42,
    });
  }

  async createDebitMandate(input: DebitMandateInput): Promise<DebitMandateResult> {
    return Promise.resolve({
      mandateId: `mock-mandate-${input.customerId}-${input.amountNaira}`,
      status: 'PENDING',
    });
  }
}
