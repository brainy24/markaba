import { MockKycProvider, FAKE_BVN } from './kyc.mock';

describe('MockKycProvider', () => {
  const provider = new MockKycProvider();

  it('verifies a well-formed fake BVN', async () => {
    const result = await provider.verifyIdentity({
      fullName: 'Amina Yusuf',
      phoneNumber: '+2348000000001',
      bvn: FAKE_BVN,
    });
    expect(result.status).toBe('VERIFIED');
    expect(result.providerReference).toMatch(/^mock-smile-identity-/);
    expect(result.verifiedAt).toBeInstanceOf(Date);
  });

  it('fails a malformed BVN', async () => {
    const result = await provider.verifyIdentity({
      fullName: 'Amina Yusuf',
      phoneNumber: '+2348000000001',
      bvn: '123',
    });
    expect(result.status).toBe('FAILED');
  });

  it('defaults to the fake BVN when none is supplied', async () => {
    const result = await provider.verifyIdentity({
      fullName: 'Amina Yusuf',
      phoneNumber: '+2348000000001',
    });
    expect(result.status).toBe('VERIFIED');
  });
});
