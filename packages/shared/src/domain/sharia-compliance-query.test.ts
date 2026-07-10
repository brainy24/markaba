import { describe, expect, it } from 'vitest';
import { canTransitionScq, SCQ_STATUSES } from './sharia-compliance-query';

describe('canTransitionScq', () => {
  it('allows the linear escalation sequence', () => {
    expect(canTransitionScq('OPEN', 'HEAD_OF_COMPLIANCE_REVIEWED')).toBe(true);
    expect(canTransitionScq('HEAD_OF_COMPLIANCE_REVIEWED', 'SSB_REVIEWING')).toBe(true);
    expect(canTransitionScq('SSB_REVIEWING', 'RULED')).toBe(true);
  });

  it('rejects skipping a stage', () => {
    expect(canTransitionScq('OPEN', 'SSB_REVIEWING')).toBe(false);
    expect(canTransitionScq('OPEN', 'RULED')).toBe(false);
  });

  it('rejects moving backwards', () => {
    expect(canTransitionScq('SSB_REVIEWING', 'OPEN')).toBe(false);
    expect(canTransitionScq('RULED', 'SSB_REVIEWING')).toBe(false);
  });

  it('allows no outbound transition once RULED', () => {
    for (const status of SCQ_STATUSES) {
      expect(canTransitionScq('RULED', status)).toBe(false);
    }
  });
});
