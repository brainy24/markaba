'use server';

import { redirect } from 'next/navigation';
import type { ApplicationState } from '@markaba/shared';
import { auth } from '../../../../auth';
import type { Role } from '../../../../lib/auth';
import { applyMockTransition } from '../../../../lib/mock-data';

/**
 * Only these roles may make a binding credit decision (PRD B.4 — Fatima the
 * Credit Analyst; CEO as a supervising override). Operations/Compliance cannot.
 */
const CREDIT_DECISION_ROLES: readonly Role[] = ['CreditAnalyst', 'CEO'];

/**
 * Human-approval token (CLAUDE.md §2.3): the authenticated Auth.js session is
 * the human checkpoint — `auth()` reads a signed, server-verified JWT the
 * client cannot forge, so its mere existence — checked below before this is
 * ever called — is what makes this a real human action, not an autonomous
 * one. This string itself is a marker for the audit trail, not a
 * cryptographic signature of the decision; the session token is what's
 * actually cryptographically verified.
 */
function buildHumanApprovalToken(role: Role, actor: string): string {
  return `oauth-approval:${role}:${actor}:${Date.now()}`;
}

async function decide(applicationId: string, to: ApplicationState): Promise<void> {
  const session = await auth();
  const role = session?.user.role;
  if (!role || !CREDIT_DECISION_ROLES.includes(role)) {
    throw new Error('Only a CreditAnalyst or CEO session may make a credit decision.');
  }

  const actor = session!.user.name ?? session!.user.email ?? 'unknown';
  const humanApprovalToken = buildHumanApprovalToken(role, actor);
  applyMockTransition(applicationId, to, actor, humanApprovalToken);
  redirect(`/dashboard/applications/${applicationId}`);
}

export async function approveApplication(applicationId: string): Promise<void> {
  await decide(applicationId, 'APPROVED');
}

export async function declineApplication(applicationId: string): Promise<void> {
  await decide(applicationId, 'DECLINED');
}

export async function referApplication(applicationId: string): Promise<void> {
  await decide(applicationId, 'REFERRED');
}
