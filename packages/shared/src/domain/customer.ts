/**
 * Customer — a Markaba applicant/borrower.
 *
 * Phase 1: identity fields are placeholders for KYC-provider output. No real BVN,
 * liveness, or document data is ever stored here in this phase (CLAUDE.md §2.2).
 * `bvnRef` is a tokenised reference into the KYC provider's own record store — it
 * is never a raw BVN, and is unset until KYC verification produces one.
 */
export interface Customer {
  id: string;
  displayName: string;
  phone: string;
  /** Tokenised reference only — never a raw BVN (CLAUDE.md §2.2). Set once KYC verifies. */
  bvnRef?: string;
  languagePref: LanguagePref;
  segment: CustomerSegment;
  /** KYC provider status only — never a raw BVN or biometric payload. */
  kycStatus: KycStatus;
  /** Opaque reference into the KYC provider's own record store, not raw PII. */
  kycProviderReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type LanguagePref = 'en' | 'ha';

/** PRD A.1.2 — banking-access tier, not a religious classification. */
export type CustomerSegment = 'A_faith' | 'B_conventional' | 'C_informal';

export type KycStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED';

export interface Guarantor {
  id: string;
  applicationId: string;
  fullName: string;
  phoneNumber: string;
  /** Tokenised reference only — never a raw BVN (CLAUDE.md §2.2). */
  bvnRef?: string;
  relationshipToCustomer: string;
  kycStatus: KycStatus;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
