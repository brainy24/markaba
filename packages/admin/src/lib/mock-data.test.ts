import { describe, expect, it } from 'vitest';
import { MissingHumanApprovalError, NotImplementedError } from '@markaba/shared';
import {
  applyMockTransition,
  filterApplications,
  filterAuditLog,
  findApplicationById,
  MOCK_APPLICATIONS,
  MOCK_AUDIT_LOG,
  MOCK_SCQS,
  recordVehiclePurchase,
  sortApplications,
} from './mock-data';

describe('findApplicationById', () => {
  it('finds a known application', () => {
    expect(findApplicationById('APP-1001')?.customerName).toBe('Amina Yusuf');
  });

  it('returns undefined for an unknown id', () => {
    expect(findApplicationById('nope')).toBeUndefined();
  });
});

describe('filterApplications', () => {
  it('matches by id or customer name, case-insensitively', () => {
    expect(filterApplications(MOCK_APPLICATIONS, { q: 'amina' })).toHaveLength(1);
    expect(filterApplications(MOCK_APPLICATIONS, { q: 'APP-1002' })).toHaveLength(1);
    expect(filterApplications(MOCK_APPLICATIONS, { q: 'nobody' })).toHaveLength(0);
  });

  it('filters by state and finance product', () => {
    expect(filterApplications(MOCK_APPLICATIONS, { state: 'APPROVED' })).toHaveLength(1);
    expect(filterApplications(MOCK_APPLICATIONS, { product: 'MURABAHA' })).toHaveLength(2);
  });

  it('returns everything when no filters are set', () => {
    expect(filterApplications(MOCK_APPLICATIONS, {})).toHaveLength(MOCK_APPLICATIONS.length);
  });
});

describe('sortApplications', () => {
  it('sorts numerically ascending and descending', () => {
    const asc = sortApplications(MOCK_APPLICATIONS, 'financedAmount', 'asc');
    expect(asc[0]?.financedAmount).toBeLessThanOrEqual(asc[asc.length - 1]!.financedAmount);

    const desc = sortApplications(MOCK_APPLICATIONS, 'financedAmount', 'desc');
    expect(desc[0]?.financedAmount).toBeGreaterThanOrEqual(desc[desc.length - 1]!.financedAmount);
  });

  it('sorts alphabetically by customer name', () => {
    const sorted = sortApplications(MOCK_APPLICATIONS, 'customerName', 'asc');
    const names = sorted.map((a) => a.customerName);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('does not mutate the input array', () => {
    const copy = [...MOCK_APPLICATIONS];
    sortApplications(MOCK_APPLICATIONS, 'id', 'desc');
    expect(MOCK_APPLICATIONS).toEqual(copy);
  });
});

describe('MOCK_AUDIT_LOG', () => {
  it('derives one entry per state-history row, newest first', () => {
    const total = MOCK_APPLICATIONS.reduce((sum, a) => sum + a.stateHistory.length, 0);
    expect(MOCK_AUDIT_LOG).toHaveLength(total);
    const dates = MOCK_AUDIT_LOG.map((e) => e.at);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('marks only the first transition per application as APPLICATION_CREATED', () => {
    const created = MOCK_AUDIT_LOG.filter((e) => e.action === 'APPLICATION_CREATED');
    expect(created).toHaveLength(MOCK_APPLICATIONS.length);
  });
});

describe('filterAuditLog', () => {
  it('filters by free text across entity id, actor, and detail', () => {
    expect(filterAuditLog(MOCK_AUDIT_LOG, { q: 'APP-1003' }).length).toBeGreaterThan(0);
    expect(filterAuditLog(MOCK_AUDIT_LOG, { q: 'nonexistent-actor-xyz' })).toHaveLength(0);
  });

  it('filters by action', () => {
    const created = filterAuditLog(MOCK_AUDIT_LOG, { action: 'APPLICATION_CREATED' });
    expect(created.every((e) => e.action === 'APPLICATION_CREATED')).toBe(true);
  });
});

describe('applyMockTransition', () => {
  it('applies a legal transition, updates state history, and prepends an audit entry', () => {
    const before = MOCK_AUDIT_LOG.length;
    const updated = applyMockTransition('APP-1002', 'OPEN_BANKING_CONSENT', 'credit-analyst-1');

    expect(updated.state).toBe('OPEN_BANKING_CONSENT');
    expect(updated.stateHistory.at(-1)).toMatchObject({
      state: 'OPEN_BANKING_CONSENT',
      actor: 'credit-analyst-1',
    });
    expect(MOCK_AUDIT_LOG).toHaveLength(before + 1);
    expect(MOCK_AUDIT_LOG[0]).toMatchObject({
      entityId: 'APP-1002',
      actor: 'credit-analyst-1',
      action: 'APPLICATION_STATE_TRANSITION',
    });
  });

  it('throws for an illegal transition and does not mutate state', () => {
    const before = findApplicationById('APP-1003')!.state;
    expect(() => applyMockTransition('APP-1003', 'SUBMITTED', 'someone')).toThrow(
      /Illegal application state transition/,
    );
    expect(findApplicationById('APP-1003')!.state).toBe(before);
  });

  it('propagates NotImplementedError for the SSB-gated transition, using the real shared logic', () => {
    const application = findApplicationById('APP-1005')!;
    application.state = 'PURCHASE_CONFIRMED';
    expect(() => applyMockTransition('APP-1005', 'CONTRACT_SIGNED', 'system')).toThrow(
      NotImplementedError,
    );
  });

  it('throws for an unknown application id', () => {
    expect(() => applyMockTransition('nope', 'KYC_PENDING', 'someone')).toThrow(
      /Unknown application/,
    );
  });

  it('refuses a binding credit decision (approve) without a humanApprovalToken', () => {
    const application = findApplicationById('APP-1001')!;
    application.state = 'UNDERWRITING';
    expect(() => applyMockTransition('APP-1001', 'APPROVED', 'credit-analyst-1')).toThrow(
      MissingHumanApprovalError,
    );
  });

  it('applies a binding credit decision when a humanApprovalToken is supplied', () => {
    const application = findApplicationById('APP-1001')!;
    application.state = 'UNDERWRITING';
    const updated = applyMockTransition(
      'APP-1001',
      'APPROVED',
      'credit-analyst-1',
      'mock-approval:CreditAnalyst:credit-analyst-1:123',
    );
    expect(updated.state).toBe('APPROVED');
  });
});

describe('MOCK_SCQS', () => {
  it('includes at least one OPEN and one RULED entry for the compliance register', () => {
    expect(MOCK_SCQS.some((scq) => scq.status === 'OPEN')).toBe(true);
    expect(MOCK_SCQS.some((scq) => scq.status === 'RULED')).toBe(true);
  });
});

describe('recordVehiclePurchase', () => {
  it('records the receipt ref and moves the application to PURCHASE_CONFIRMED', () => {
    const application = findApplicationById('APP-1005')!;
    application.state = 'VEHICLE_SOURCING';

    const updated = recordVehiclePurchase('APP-1005', 'receipt-ref-001', 'operations-1');

    expect(updated.state).toBe('PURCHASE_CONFIRMED');
    expect(updated.vehicle.purchaseReceiptRef).toBe('receipt-ref-001');
  });

  it('does not require a humanApprovalToken — this is evidence-recording, not a credit decision', () => {
    const application = findApplicationById('APP-1005')!;
    application.state = 'VEHICLE_SOURCING';
    expect(() =>
      recordVehiclePurchase('APP-1005', 'receipt-ref-002', 'operations-1'),
    ).not.toThrow();
  });

  it('rejects recording a purchase for an application not in VEHICLE_SOURCING', () => {
    const application = findApplicationById('APP-1003')!;
    application.state = 'APPROVED';
    expect(() => recordVehiclePurchase('APP-1003', 'receipt-ref-003', 'operations-1')).toThrow(
      /Illegal application state transition/,
    );
  });
});
