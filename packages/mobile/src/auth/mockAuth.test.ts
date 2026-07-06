import { getSession, isValidPhoneNumber, mockSignIn, mockSignOut } from './mockAuth';

describe('isValidPhoneNumber', () => {
  it('accepts well-formed phone numbers', () => {
    expect(isValidPhoneNumber('+2348000000001')).toBe(true);
    expect(isValidPhoneNumber('08000000001')).toBe(true);
  });

  it('rejects malformed input', () => {
    expect(isValidPhoneNumber('abc')).toBe(false);
    expect(isValidPhoneNumber('123')).toBe(false);
  });
});

describe('mockSignIn / getSession / mockSignOut', () => {
  afterEach(async () => {
    await mockSignOut();
  });

  it('persists a session on sign-in', async () => {
    const session = await mockSignIn('+2348000000001');
    expect(session.phoneNumber).toBe('+2348000000001');

    const stored = await getSession();
    expect(stored?.phoneNumber).toBe('+2348000000001');
  });

  it('rejects an invalid phone number', async () => {
    await expect(mockSignIn('abc')).rejects.toThrow(/valid phone number/);
  });

  it('clears the session on sign-out', async () => {
    await mockSignIn('+2348000000001');
    await mockSignOut();
    expect(await getSession()).toBeNull();
  });

  it('returns null when no session has been created', async () => {
    expect(await getSession()).toBeNull();
  });
});
