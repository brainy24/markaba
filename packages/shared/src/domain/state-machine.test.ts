import { describe, expect, it } from 'vitest';
import { APPLICATION_STATES, type ApplicationState } from './application';
import { applyTransition, canTransition, legalNextStates, NotImplementedError } from './state-machine';

describe('canTransition', () => {
  it('allows the documented happy-path sequence', () => {
    expect(canTransition('SUBMITTED', 'KYC_PENDING')).toBe(true);
    expect(canTransition('KYC_PENDING', 'OPEN_BANKING_CONSENT')).toBe(true);
    expect(canTransition('OPEN_BANKING_CONSENT', 'UNDERWRITING')).toBe(true);
    expect(canTransition('UNDERWRITING', 'APPROVED')).toBe(true);
    expect(canTransition('APPROVED', 'VEHICLE_SOURCING')).toBe(true);
    expect(canTransition('VEHICLE_SOURCING', 'PURCHASE_CONFIRMED')).toBe(true);
    expect(canTransition('PURCHASE_CONFIRMED', 'CONTRACT_SIGNED')).toBe(true);
    expect(canTransition('CONTRACT_SIGNED', 'ACTIVE')).toBe(true);
    expect(canTransition('ACTIVE', 'COMPLETED')).toBe(true);
    expect(canTransition('ACTIVE', 'DEFAULTED')).toBe(true);
  });

  it('allows underwriting referral loop and declines', () => {
    expect(canTransition('UNDERWRITING', 'REFERRED')).toBe(true);
    expect(canTransition('REFERRED', 'UNDERWRITING')).toBe(true);
    expect(canTransition('REFERRED', 'DECLINED')).toBe(true);
    expect(canTransition('UNDERWRITING', 'DECLINED')).toBe(true);
    expect(canTransition('KYC_PENDING', 'DECLINED')).toBe(true);
    expect(canTransition('OPEN_BANKING_CONSENT', 'DECLINED')).toBe(true);
  });

  it('rejects illegal transitions', () => {
    expect(canTransition('SUBMITTED', 'ACTIVE')).toBe(false);
    expect(canTransition('SUBMITTED', 'DECLINED')).toBe(false);
    expect(canTransition('APPROVED', 'CONTRACT_SIGNED')).toBe(false);
    expect(canTransition('VEHICLE_SOURCING', 'CONTRACT_SIGNED')).toBe(false);
    expect(canTransition('KYC_PENDING', 'SUBMITTED')).toBe(false);
  });

  it('rejects any outbound transition from terminal states', () => {
    for (const terminal of ['DECLINED', 'COMPLETED', 'DEFAULTED'] as const) {
      for (const to of APPLICATION_STATES) {
        expect(canTransition(terminal, to)).toBe(false);
      }
    }
  });

  it('has no dangling states — every state appears in the transition table', () => {
    for (const state of APPLICATION_STATES) {
      expect(() => legalNextStates(state)).not.toThrow();
    }
  });
});

describe('applyTransition', () => {
  it('returns the destination state for a legal, implemented transition', () => {
    expect(applyTransition('SUBMITTED', 'KYC_PENDING')).toBe('KYC_PENDING');
    expect(applyTransition('ACTIVE', 'COMPLETED')).toBe('COMPLETED');
  });

  it('throws a plain Error for an illegal transition', () => {
    expect(() => applyTransition('SUBMITTED', 'ACTIVE')).toThrow(
      /Illegal application state transition/,
    );
  });

  it('throws NotImplementedError for PURCHASE_CONFIRMED -> CONTRACT_SIGNED', () => {
    expect(() => applyTransition('PURCHASE_CONFIRMED', 'CONTRACT_SIGNED')).toThrow(
      NotImplementedError,
    );
  });

  it('does not implement any other Sharia-critical body silently', () => {
    // Every other legal transition should NOT throw NotImplementedError.
    const nonGated: Array<[ApplicationState, ApplicationState]> = [
      ['SUBMITTED', 'KYC_PENDING'],
      ['KYC_PENDING', 'OPEN_BANKING_CONSENT'],
      ['OPEN_BANKING_CONSENT', 'UNDERWRITING'],
      ['UNDERWRITING', 'APPROVED'],
      ['APPROVED', 'VEHICLE_SOURCING'],
      ['VEHICLE_SOURCING', 'PURCHASE_CONFIRMED'],
      ['CONTRACT_SIGNED', 'ACTIVE'],
      ['ACTIVE', 'COMPLETED'],
    ];
    for (const [from, to] of nonGated) {
      expect(() => applyTransition(from, to)).not.toThrow();
    }
  });
});
