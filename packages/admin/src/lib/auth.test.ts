import { describe, expect, it } from 'vitest';
import {
  canAccess,
  COMPLIANCE_VIEW_ROLES,
  OPERATIONS_VIEW_ROLES,
  ROLES,
  SCQ_VIEW_ROLES,
  USER_MANAGEMENT_ROLES,
} from './auth';

describe('ROLES', () => {
  it('includes every role the app gates on', () => {
    expect(ROLES).toEqual(['CEO', 'CreditAnalyst', 'Operations', 'Compliance', 'SuperAdmin']);
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

  it('allows CEO and Compliance to view the SCQ register', () => {
    expect(canAccess('CEO', SCQ_VIEW_ROLES)).toBe(true);
    expect(canAccess('Compliance', SCQ_VIEW_ROLES)).toBe(true);
    expect(canAccess('Operations', SCQ_VIEW_ROLES)).toBe(false);
  });

  it('allows CEO and Operations to view the vehicle workflow', () => {
    expect(canAccess('CEO', OPERATIONS_VIEW_ROLES)).toBe(true);
    expect(canAccess('Operations', OPERATIONS_VIEW_ROLES)).toBe(true);
    expect(canAccess('Compliance', OPERATIONS_VIEW_ROLES)).toBe(false);
  });

  it('allows SuperAdmin to view every cross-cutting section', () => {
    expect(canAccess('SuperAdmin', COMPLIANCE_VIEW_ROLES)).toBe(true);
    expect(canAccess('SuperAdmin', SCQ_VIEW_ROLES)).toBe(true);
    expect(canAccess('SuperAdmin', OPERATIONS_VIEW_ROLES)).toBe(true);
  });

  it('restricts user management to SuperAdmin only', () => {
    expect(canAccess('SuperAdmin', USER_MANAGEMENT_ROLES)).toBe(true);
    expect(canAccess('CEO', USER_MANAGEMENT_ROLES)).toBe(false);
    expect(canAccess('Compliance', USER_MANAGEMENT_ROLES)).toBe(false);
  });
});
