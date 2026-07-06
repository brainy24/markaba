import { MockESignatureProvider } from './esignature.mock';

describe('MockESignatureProvider', () => {
  it('creates an envelope in CREATED status', async () => {
    const provider = new MockESignatureProvider();
    const envelope = await provider.createEnvelope({
      contractDraftId: 'draft-1',
      signerName: 'Amina Yusuf',
      signerContact: '+2348000000001',
    });
    expect(envelope.status).toBe('CREATED');
  });

  it('returns the status of a known envelope', async () => {
    const provider = new MockESignatureProvider();
    const created = await provider.createEnvelope({
      contractDraftId: 'draft-1',
      signerName: 'Amina Yusuf',
      signerContact: '+2348000000001',
    });
    const fetched = await provider.getEnvelopeStatus(created.envelopeId);
    expect(fetched).toEqual(created);
  });

  it('throws for an unknown envelope id', async () => {
    const provider = new MockESignatureProvider();
    await expect(provider.getEnvelopeStatus('does-not-exist')).rejects.toThrow(
      /Unknown mock envelope/,
    );
  });
});
