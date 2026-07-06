/**
 * Customer — a Markaba applicant/borrower.
 *
 * Phase 1: identity fields are placeholders for KYC-provider output. No real BVN,
 * liveness, or document data is ever stored here in this phase (CLAUDE.md §2.2).
 */
export interface Customer {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  /** KYC provider status only — never a raw BVN or biometric payload. */
  kycStatus: KycStatus;
  /** Opaque reference into the KYC provider's own record store, not raw PII. */
  kycProviderReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type KycStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED';

export interface Guarantor {
  id: string;
  applicationId: string;
  fullName: string;
  phoneNumber: string;
  relationshipToApplicant: string;
  kycStatus: KycStatus;
  createdAt: Date;
  updatedAt: Date;
}
