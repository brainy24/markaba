import { Injectable } from '@nestjs/common';
import type { CreateEnvelopeInput, ESignatureProvider, EnvelopeResult } from './esignature.types';

/**
 * Mock DocuSign/Zoho Sign adapter. Stub-level only — there is nothing
 * SSB-certified for a real user to sign yet, so this never leaves CREATED
 * (CLAUDE.md §2.1).
 */
@Injectable()
export class MockESignatureProvider implements ESignatureProvider {
  private readonly envelopes = new Map<string, EnvelopeResult>();

  async createEnvelope(input: CreateEnvelopeInput): Promise<EnvelopeResult> {
    const envelope: EnvelopeResult = {
      envelopeId: `mock-envelope-${input.contractDraftId}`,
      status: 'CREATED',
    };
    this.envelopes.set(envelope.envelopeId, envelope);
    return Promise.resolve(envelope);
  }

  async getEnvelopeStatus(envelopeId: string): Promise<EnvelopeResult> {
    const envelope = this.envelopes.get(envelopeId);
    if (!envelope) {
      throw new Error(`Unknown mock envelope: ${envelopeId}`);
    }
    return Promise.resolve(envelope);
  }
}
