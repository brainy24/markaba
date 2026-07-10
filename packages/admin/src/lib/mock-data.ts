import type { ApplicationState, CreditScoreResult, ShariaComplianceQuery } from '@markaba/shared';
import {
  applyTransition,
  isBindingCreditDecision,
  MissingHumanApprovalError,
} from '@markaba/shared';
import type { Role } from './auth';

/**
 * Self-contained, in-memory mock store (CLAUDE.md §3 — "read-only mock data").
 * No real customer PII. There is no local Postgres in this dev environment, so
 * this store — not the live `@markaba/api` — is what the admin dashboard's
 * Approve/Decline/Refer action (see applications/[id]/actions.ts) actually
 * mutates. It resets on every dev-server restart. State transitions go through
 * the real `applyTransition` from `@markaba/shared`, so the legality rules are
 * identical to the live API's — only persistence differs.
 */
export interface MockVehicle {
  make: string;
  model: string;
  year: number;
  /** Set once Operations records a verified purchase (PRD A.2.1, A.3 rule 1). */
  purchaseReceiptRef?: string;
  /** Set once a GPS tracker is fitted at possession (mock Initrack adapter). */
  gpsImei?: string;
}

export interface MockStateHistoryEntry {
  state: ApplicationState;
  at: string;
  actor: string;
}

export interface MockOpenBankingSummary {
  monthlyIncomeNaira: number;
  averageBalanceNaira: number;
  transactionCount: number;
}

export interface MockApplicationRow {
  id: string;
  customerName: string;
  customerPhone: string;
  product: 'IJARAH' | 'MURABAHA';
  financedAmount: number;
  downPaymentPct: number;
  termMonths: number;
  declaredVehicleUse: string;
  state: ApplicationState;
  submittedAt: string;
  vehicle: MockVehicle;
  guarantorCount: number;
  stateHistory: MockStateHistoryEntry[];
  /** Unset until UNDERWRITING scores it — see credit.service.ts (S1-07/S2-05). */
  mcsRecommendation?: CreditScoreResult;
  openBankingSummary?: MockOpenBankingSummary;
}

export const MOCK_APPLICATIONS: MockApplicationRow[] = [
  {
    id: 'APP-1001',
    customerName: 'Amina Yusuf',
    customerPhone: '+234 803 000 1001',
    product: 'IJARAH',
    financedAmount: 4_200_000,
    downPaymentPct: 20,
    termMonths: 36,
    declaredVehicleUse: 'personal_commute',
    state: 'UNDERWRITING',
    submittedAt: '2026-06-28',
    vehicle: { make: 'Toyota', model: 'Corolla', year: 2021 },
    guarantorCount: 1,
    stateHistory: [
      { state: 'SUBMITTED', at: '2026-06-28', actor: 'whatsapp-bot' },
      { state: 'KYC_PENDING', at: '2026-06-28', actor: 'whatsapp-bot' },
      { state: 'OPEN_BANKING_CONSENT', at: '2026-06-29', actor: 'system' },
      { state: 'UNDERWRITING', at: '2026-06-30', actor: 'system' },
    ],
    mcsRecommendation: {
      score: 640,
      recommendation: 'RECOMMEND_REFER',
      explanation: [
        { factor: 'kycStatus:VERIFIED', contribution: 150 },
        { factor: 'affordabilityRatio', contribution: -40 },
        { factor: 'existingDebtToIncome', contribution: -20 },
      ],
    },
    openBankingSummary: {
      monthlyIncomeNaira: 380_000,
      averageBalanceNaira: 145_000,
      transactionCount: 58,
    },
  },
  {
    id: 'APP-1002',
    customerName: 'Chidi Okafor',
    customerPhone: '+234 803 000 1002',
    product: 'MURABAHA',
    financedAmount: 3_100_000,
    downPaymentPct: 25,
    termMonths: 24,
    declaredVehicleUse: 'ride_hailing',
    state: 'KYC_PENDING',
    submittedAt: '2026-06-30',
    vehicle: { make: 'Honda', model: 'Civic', year: 2020 },
    guarantorCount: 0,
    stateHistory: [
      { state: 'SUBMITTED', at: '2026-06-30', actor: 'whatsapp-bot' },
      { state: 'KYC_PENDING', at: '2026-06-30', actor: 'whatsapp-bot' },
    ],
  },
  {
    id: 'APP-1003',
    customerName: 'Fatima Bello',
    customerPhone: '+234 803 000 1003',
    product: 'IJARAH',
    financedAmount: 5_000_000,
    downPaymentPct: 20,
    termMonths: 48,
    declaredVehicleUse: 'personal_commute',
    state: 'APPROVED',
    submittedAt: '2026-07-01',
    vehicle: { make: 'Toyota', model: 'Camry', year: 2022 },
    guarantorCount: 2,
    stateHistory: [
      { state: 'SUBMITTED', at: '2026-06-25', actor: 'whatsapp-bot' },
      { state: 'KYC_PENDING', at: '2026-06-25', actor: 'whatsapp-bot' },
      { state: 'OPEN_BANKING_CONSENT', at: '2026-06-26', actor: 'system' },
      { state: 'UNDERWRITING', at: '2026-06-27', actor: 'system' },
      { state: 'APPROVED', at: '2026-07-01', actor: 'credit-analyst-1' },
    ],
    mcsRecommendation: {
      score: 780,
      recommendation: 'RECOMMEND_APPROVE',
      explanation: [
        { factor: 'kycStatus:VERIFIED', contribution: 150 },
        { factor: 'affordabilityRatio', contribution: 110 },
        { factor: 'existingDebtToIncome', contribution: -10 },
      ],
    },
    openBankingSummary: {
      monthlyIncomeNaira: 520_000,
      averageBalanceNaira: 260_000,
      transactionCount: 71,
    },
  },
  {
    id: 'APP-1004',
    customerName: 'Tunde Adebayo',
    customerPhone: '+234 803 000 1004',
    product: 'IJARAH',
    financedAmount: 2_800_000,
    downPaymentPct: 20,
    termMonths: 24,
    declaredVehicleUse: 'business_delivery',
    state: 'REFERRED',
    submittedAt: '2026-07-02',
    vehicle: { make: 'Kia', model: 'Rio', year: 2019 },
    guarantorCount: 1,
    stateHistory: [
      { state: 'SUBMITTED', at: '2026-06-29', actor: 'whatsapp-bot' },
      { state: 'KYC_PENDING', at: '2026-06-29', actor: 'whatsapp-bot' },
      { state: 'OPEN_BANKING_CONSENT', at: '2026-06-30', actor: 'system' },
      { state: 'UNDERWRITING', at: '2026-07-01', actor: 'system' },
      { state: 'REFERRED', at: '2026-07-02', actor: 'credit-analyst-2' },
    ],
    mcsRecommendation: {
      score: 615,
      recommendation: 'RECOMMEND_REFER',
      explanation: [
        { factor: 'kycStatus:PENDING', contribution: 0 },
        { factor: 'affordabilityRatio', contribution: 60 },
        { factor: 'existingDebtToIncome', contribution: -45 },
      ],
    },
    openBankingSummary: {
      monthlyIncomeNaira: 240_000,
      averageBalanceNaira: 62_000,
      transactionCount: 33,
    },
  },
  {
    id: 'APP-1005',
    customerName: 'Ngozi Eze',
    customerPhone: '+234 803 000 1005',
    product: 'MURABAHA',
    financedAmount: 3_600_000,
    downPaymentPct: 25,
    termMonths: 36,
    declaredVehicleUse: 'ride_hailing',
    state: 'VEHICLE_SOURCING',
    submittedAt: '2026-07-03',
    vehicle: { make: 'Toyota', model: 'RAV4', year: 2021 },
    guarantorCount: 1,
    stateHistory: [
      { state: 'SUBMITTED', at: '2026-06-20', actor: 'whatsapp-bot' },
      { state: 'KYC_PENDING', at: '2026-06-20', actor: 'whatsapp-bot' },
      { state: 'OPEN_BANKING_CONSENT', at: '2026-06-21', actor: 'system' },
      { state: 'UNDERWRITING', at: '2026-06-22', actor: 'system' },
      { state: 'APPROVED', at: '2026-06-24', actor: 'credit-analyst-1' },
      { state: 'VEHICLE_SOURCING', at: '2026-07-03', actor: 'operations-1' },
    ],
    mcsRecommendation: {
      score: 810,
      recommendation: 'RECOMMEND_APPROVE',
      explanation: [
        { factor: 'kycStatus:VERIFIED', contribution: 150 },
        { factor: 'affordabilityRatio', contribution: 150 },
        { factor: 'existingDebtToIncome', contribution: -10 },
      ],
    },
    openBankingSummary: {
      monthlyIncomeNaira: 610_000,
      averageBalanceNaira: 310_000,
      transactionCount: 64,
    },
  },
];

export function findApplicationById(id: string): MockApplicationRow | undefined {
  return MOCK_APPLICATIONS.find((application) => application.id === id);
}

export interface ApplicationFilters {
  q?: string;
  state?: string;
  product?: string;
}

export function filterApplications(
  applications: readonly MockApplicationRow[],
  filters: ApplicationFilters,
): MockApplicationRow[] {
  const q = filters.q?.trim().toLowerCase();
  return applications.filter((application) => {
    if (q && !`${application.id} ${application.customerName}`.toLowerCase().includes(q)) {
      return false;
    }
    if (filters.state && application.state !== filters.state) return false;
    if (filters.product && application.product !== filters.product) return false;
    return true;
  });
}

export type ApplicationSortKey = 'id' | 'customerName' | 'financedAmount' | 'submittedAt';
export type SortDirection = 'asc' | 'desc';

export function sortApplications(
  applications: readonly MockApplicationRow[],
  sortKey: ApplicationSortKey,
  direction: SortDirection,
): MockApplicationRow[] {
  const sorted = [...applications].sort((a, b) => {
    const left = a[sortKey];
    const right = b[sortKey];
    if (typeof left === 'number' && typeof right === 'number') return left - right;
    return String(left).localeCompare(String(right));
  });
  return direction === 'desc' ? sorted.reverse() : sorted;
}

/** Aggregate audit trail — seeded from history, then appended to live by `applyMockTransition`. */
export interface MockAuditEntry {
  id: string;
  actor: string;
  action: string;
  entityType: 'Application' | 'AdminProfile';
  entityId: string;
  detail: string;
  at: string;
}

export const MOCK_AUDIT_LOG: MockAuditEntry[] = MOCK_APPLICATIONS.flatMap((application) =>
  application.stateHistory.map((entry, index) => ({
    id: `${application.id}-${index}`,
    actor: entry.actor,
    action: index === 0 ? 'APPLICATION_CREATED' : 'APPLICATION_STATE_TRANSITION',
    entityType: 'Application' as const,
    entityId: application.id,
    detail:
      index === 0
        ? `Created in ${entry.state}`
        : `${application.stateHistory[index - 1]?.state} → ${entry.state}`,
    at: entry.at,
  })),
).sort((a, b) => b.at.localeCompare(a.at));

export interface AuditFilters {
  q?: string;
  action?: string;
}

export function filterAuditLog(
  entries: readonly MockAuditEntry[],
  filters: AuditFilters,
): MockAuditEntry[] {
  const q = filters.q?.trim().toLowerCase();
  return entries.filter((entry) => {
    if (q && !`${entry.entityId} ${entry.actor} ${entry.detail}`.toLowerCase().includes(q)) {
      return false;
    }
    if (filters.action && entry.action !== filters.action) return false;
    return true;
  });
}

/**
 * Applies a real, legal state transition to the in-memory mock store, using the
 * same `@markaba/shared` logic the live API uses — so a mock approval and a real
 * one follow identical rules. Throws (propagates `NotImplementedError` for the
 * SSB-gated transition, or a plain Error for an illegal one) exactly like the API.
 *
 * A binding credit decision (approve/decline out of UNDERWRITING/REFERRED)
 * additionally requires `humanApprovalToken` — this mirrors
 * `ApplicationsService.transition` in `@markaba/api` exactly (CLAUDE.md §2.3),
 * so the requirement is enforced by this function's own signature, not just by
 * caller discipline. See applications/[id]/actions.ts for how the token is
 * derived from a server-verified admin session.
 */
export function applyMockTransition(
  id: string,
  to: ApplicationState,
  approvedBy: string,
  humanApprovalToken?: string,
): MockApplicationRow {
  const application = findApplicationById(id);
  if (!application) {
    throw new Error(`Unknown application ${id}`);
  }

  const from = application.state;
  const nextState = applyTransition(from, to);

  if (isBindingCreditDecision(from, nextState) && !humanApprovalToken) {
    throw new MissingHumanApprovalError(
      `Transitioning ${id} from ${from} to ${nextState} is a binding credit decision ` +
        'and requires a humanApprovalToken (CLAUDE.md §2.3).',
    );
  }

  const at = new Date().toISOString().slice(0, 10);

  application.state = nextState;
  application.stateHistory.push({ state: nextState, at, actor: approvedBy });

  MOCK_AUDIT_LOG.unshift({
    id: `${id}-${application.stateHistory.length - 1}`,
    actor: approvedBy,
    action: 'APPLICATION_STATE_TRANSITION',
    entityType: 'Application',
    entityId: id,
    detail: `${from} → ${nextState}`,
    at,
  });

  return application;
}

/**
 * Records a verified vehicle purchase and moves the application to
 * PURCHASE_CONFIRMED in one step — mirrors `VehiclesService.recordPurchase` in
 * `@markaba/api` (evidence-recording, not a credit decision, so no
 * humanApprovalToken is required; only legal from VEHICLE_SOURCING).
 */
export function recordVehiclePurchase(
  id: string,
  purchaseReceiptRef: string,
  actor: string,
): MockApplicationRow {
  const application = applyMockTransition(id, 'PURCHASE_CONFIRMED', actor);
  application.vehicle.purchaseReceiptRef = purchaseReceiptRef;
  return application;
}

/**
 * SCQ register mock data (PRD A.3, A.6). Independent of the application mock
 * store above — an SCQ can relate to any entity, not just applications.
 */
export const MOCK_SCQS: ShariaComplianceQuery[] = [
  {
    id: 'SCQ-2001',
    raisedBy: 'whatsapp-bot',
    relatedEntityType: 'Application',
    relatedEntityId: 'APP-1002',
    description: 'Declared vehicle use flagged for manual review during intake screening.',
    status: 'OPEN',
    raisedAt: new Date('2026-06-30T09:15:00Z'),
  },
  {
    id: 'SCQ-2000',
    raisedBy: 'compliance-1',
    relatedEntityType: 'Application',
    relatedEntityId: 'APP-1003',
    description:
      'Early-settlement rebate wording queried for riba risk ahead of contract templates.',
    status: 'RULED',
    raisedAt: new Date('2026-06-20T11:00:00Z'),
    headOfComplianceReviewedAt: new Date('2026-06-20T16:30:00Z'),
    ssbRuledAt: new Date('2026-06-24T10:00:00Z'),
    rulingSummary:
      'Rebate must remain discretionary, non-contractual — approved with that wording.',
  },
];

/**
 * Admin portal user directory. Mock/in-memory like everything else in this
 * file — Phase 1 auth has no real identity provider (CLAUDE.md §3), so this is
 * a record-keeping directory a SuperAdmin manages, not an access-control list:
 * the login screen still lets anyone pick any role from the dropdown, same as
 * before this feature existed. See lib/auth.ts USER_MANAGEMENT_ROLES.
 */
export interface MockAdminProfile {
  id: string;
  name: string;
  role: Role;
  createdAt: string;
  createdBy: string;
}

export const MOCK_ADMIN_PROFILES: MockAdminProfile[] = [
  {
    id: 'ADMIN-1',
    name: 'Founding Admin',
    role: 'SuperAdmin',
    createdAt: '2026-06-01',
    createdBy: 'system',
  },
  {
    id: 'ADMIN-2',
    name: 'Fatima Abdullahi',
    role: 'CreditAnalyst',
    createdAt: '2026-06-02',
    createdBy: 'Founding Admin',
  },
  {
    id: 'ADMIN-3',
    name: 'Yusuf Garba',
    role: 'Operations',
    createdAt: '2026-06-02',
    createdBy: 'Founding Admin',
  },
];

/**
 * Creates a new admin profile and audit-logs it. Only callable after the
 * caller has verified the acting session is SuperAdmin — see
 * dashboard/users/actions.ts, which is the sole caller.
 */
export function createAdminProfile(name: string, role: Role, createdBy: string): MockAdminProfile {
  const profile: MockAdminProfile = {
    id: `ADMIN-${MOCK_ADMIN_PROFILES.length + 1}`,
    name,
    role,
    createdAt: new Date().toISOString().slice(0, 10),
    createdBy,
  };
  MOCK_ADMIN_PROFILES.push(profile);

  MOCK_AUDIT_LOG.unshift({
    id: `${profile.id}-created`,
    actor: createdBy,
    action: 'ADMIN_PROFILE_CREATED',
    entityType: 'AdminProfile',
    entityId: profile.id,
    detail: `Created ${profile.name} as ${profile.role}`,
    at: profile.createdAt,
  });

  return profile;
}
