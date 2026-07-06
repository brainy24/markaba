import { describe, expect, it } from 'vitest';
import {
  canAccess,
  COMPLIANCE_VIEW_ROLES,
  decodeSession,
  encodeSession,
  isRole,
  ROLES,
} from './auth';

describe('isRole', () => {
  it('accepts every known role', () => {
    for (const role of ROLES) {
      expect(isRole(role)).toBe(true);
    }
  });

  it('rejects an unknown role', () => {
    expect(isRole('SuperAdmin')).toBe(false);
  });
});

describe('encodeSession / decodeSession', () => {
  it('round-trips a session', () => {
    const session = { name: 'Amina', role: 'CreditAnalyst' as const };
    expect(decodeSession(encodeSession(session))).toEqual(session);
  });

  it('returns null for an undefined cookie', () => {
    expect(decodeSession(undefined)).toBeNull();
  });

  it('returns null for a malformed cookie', () => {
    expect(decodeSession('not-json')).toBeNull();
  });

  it('returns null for a well-formed cookie with an invalid role', () => {
    expect(decodeSession(JSON.stringify({ name: 'X', role: 'SuperAdmin' }))).toBeNull();
  });
});

describe('canAccess', () => {
  it('allows CEO and Compliance to view the compliance section', () => {
    expect(canAccess('CEO', COMPLIANCE_VIEW_ROLES)).toBe(true);
    expect(canAccess('Compliance', COMPLIANCE_VIEW_ROLES)).toBe(true);
  });

  it('denies Operations and CreditAnalyst from the compliance section', () => {
    expect(canAccess('Operations', COMPLIANCE_VIEW_ROLES)).toBe(false);
    expect(canAccess('CreditAnalyst', COMPLIANCE_VIEW_ROLES)).toBe(false);
  });
});
