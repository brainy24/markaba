import { describe, expect, it } from 'vitest';
import { toneForState } from './status';

describe('toneForState', () => {
  it('maps known states to their expected tone', () => {
    expect(toneForState('APPROVED')).toBe('positive');
    expect(toneForState('DECLINED')).toBe('negative');
    expect(toneForState('REFERRED')).toBe('warning');
    expect(toneForState('UNDERWRITING')).toBe('progress');
    expect(toneForState('SUBMITTED')).toBe('neutral');
  });

  it('falls back to neutral for an unknown state', () => {
    expect(toneForState('SOMETHING_NEW')).toBe('neutral');
  });
});
