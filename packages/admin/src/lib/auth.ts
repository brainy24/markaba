/**
 * Mock auth only (CLAUDE.md §3 — "Auth screens (against mock auth)"). There is no
 * real password, no real identity provider, and no real session store here.
 * Do not wire this to a production identity system without a redesign.
 */
export const ROLES = ['CEO', 'CreditAnalyst', 'Operations', 'Compliance', 'SuperAdmin'] as const;
export type Role = (typeof ROLES)[number];

export interface Session {
  name: string;
  role: Role;
}

export const SESSION_COOKIE = 'markaba_mock_session';

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

// Plain JSON, not Buffer/base64 — this cookie must also decode inside Next.js
// middleware, which runs on the Edge runtime where Buffer is unavailable.
export function encodeSession(session: Session): string {
  return JSON.stringify(session);
}

export function decodeSession(raw: string | undefined): Session | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (!parsed.role || !parsed.name || !isRole(parsed.role)) return null;
    return { name: parsed.name, role: parsed.role };
  } catch {
    return null;
  }
}

/** Roles allowed to view the audit trail. */
export const COMPLIANCE_VIEW_ROLES: readonly Role[] = ['CEO', 'Compliance', 'SuperAdmin'];

/** Roles allowed to view the Sharia Compliance Query register (PRD A.3). */
export const SCQ_VIEW_ROLES: readonly Role[] = ['CEO', 'Compliance', 'SuperAdmin'];

/** Roles allowed to view the vehicle sourcing / purchase workflow (PRD B.5). */
export const OPERATIONS_VIEW_ROLES: readonly Role[] = ['CEO', 'Operations', 'SuperAdmin'];

/**
 * Roles allowed to manage the admin user directory (create profiles for other
 * admin portal users). Deliberately its own role rather than folded into CEO —
 * CEO keeps its existing business-facing permissions; user management is a
 * distinct, narrower administrative capability.
 */
export const USER_MANAGEMENT_ROLES: readonly Role[] = ['SuperAdmin'];

export function canAccess(role: Role, allowedRoles: readonly Role[]): boolean {
  return allowedRoles.includes(role);
}
