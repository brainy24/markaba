import { describe, expect, it } from 'vitest';
import { isProhibitedUse, PROHIBITED_VEHICLE_USES } from './prohibited-use';

describe('isProhibitedUse', () => {
  it('flags every entry in the denylist', () => {
    for (const use of PROHIBITED_VEHICLE_USES) {
      expect(isProhibitedUse(use)).toBe(true);
    }
  });

  it('is case- and whitespace-insensitive', () => {
    expect(isProhibitedUse('  Gambling_Operations  ')).toBe(true);
  });

  it('does not flag an ordinary declared use', () => {
    expect(isProhibitedUse('ride_hailing')).toBe(false);
    expect(isProhibitedUse('personal_commute')).toBe(false);
  });
});
