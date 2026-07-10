export type KycVerificationStatus = 'VERIFIED' | 'FAILED' | 'PENDING';

export interface KycVerificationInput {
  displayName: string;
  phone: string;
  /** Sandbox-only. Never a real BVN in this phase (CLAUDE.md §2.2). */
  bvn?: string;
}

export interface KycVerificationResult {
  status: KycVerificationStatus;
  providerReference: string;
  verifiedAt?: Date;
}

/** Adapter interface for the KYC provider (Smile Identity in production). */
export interface KycProvider {
  verifyIdentity(input: KycVerificationInput): Promise<KycVerificationResult>;
}

export const KYC_PROVIDER = Symbol('KYC_PROVIDER');
