/**
 * Role constants for the admin portal. Session/identity itself is handled by
 * Auth.js — see ../auth.ts and docs/decisions/0002-admin-oauth-jwt-sessions.md.
 * This file only defines the role vocabulary and which roles can see which
 * sections; it has no knowledge of how a session was established.
 */
export const ROLES = ['CEO', 'CreditAnalyst', 'Operations', 'Compliance', 'SuperAdmin'] as const;
export type Role = (typeof ROLES)[number];

/** Roles allowed to view the audit trail. */
export const COMPLIANCE_VIEW_ROLES: readonly Role[] = ['CEO', 'Compliance', 'SuperAdmin'];

/** Roles allowed to view the Sharia Compliance Query register (PRD A.3). */
export const SCQ_VIEW_ROLES: readonly Role[] = ['CEO', 'Compliance', 'SuperAdmin'];

/** Roles allowed to view the vehicle sourcing / purchase workflow (PRD B.5). */
export const OPERATIONS_VIEW_ROLES: readonly Role[] = ['CEO', 'Operations', 'SuperAdmin'];

/**
 * Roles allowed to manage the admin user directory (invite other admin
 * portal users). Deliberately its own role rather than folded into CEO —
 * CEO keeps its existing business-facing permissions; user management is a
 * distinct, narrower administrative capability.
 */
export const USER_MANAGEMENT_ROLES: readonly Role[] = ['SuperAdmin'];

export function canAccess(role: Role, allowedRoles: readonly Role[]): boolean {
  return allowedRoles.includes(role);
}
