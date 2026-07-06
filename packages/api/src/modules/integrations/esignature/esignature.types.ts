export type EnvelopeStatus = 'CREATED' | 'SENT' | 'SIGNED' | 'DECLINED';

export interface CreateEnvelopeInput {
  contractDraftId: string;
  signerName: string;
  signerContact: string;
}

export interface EnvelopeResult {
  envelopeId: string;
  status: EnvelopeStatus;
}

/**
 * Adapter interface for the e-signature provider (DocuSign/Zoho Sign in
 * production). Stub only — real use is downstream of Sharia contract generation,
 * which is not implemented yet (CLAUDE.md §2.1).
 */
export interface ESignatureProvider {
  createEnvelope(input: CreateEnvelopeInput): Promise<EnvelopeResult>;
  getEnvelopeStatus(envelopeId: string): Promise<EnvelopeResult>;
}

export const ESIGNATURE_PROVIDER = Symbol('ESIGNATURE_PROVIDER');
