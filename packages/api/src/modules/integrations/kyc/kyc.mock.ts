import { Injectable } from '@nestjs/common';
import type { KycProvider, KycVerificationInput, KycVerificationResult } from './kyc.types';

/** Fake BVN used by every mock fixture in this phase — never a real one. */
export const FAKE_BVN = '00000000000';

/**
 * Mock Smile Identity adapter. Returns deterministic fake data — no network call,
 * no real biometric/BVN data ever touches this class (CLAUDE.md §2.2).
 */
@Injectable()
export class MockKycProvider implements KycProvider {
  async verifyIdentity(input: KycVerificationInput): Promise<KycVerificationResult> {
    const bvn = input.bvn ?? FAKE_BVN;
    const isWellFormed = /^\d{11}$/.test(bvn);
    return Promise.resolve({
      status: isWellFormed ? 'VERIFIED' : 'FAILED',
      providerReference: `mock-smile-identity-${Buffer.from(input.phone).toString('hex').slice(0, 12)}`,
      verifiedAt: new Date(),
    });
  }
}
