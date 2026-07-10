'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ApplicationState } from '@markaba/shared';
import { decodeSession, SESSION_COOKIE, type Role } from '../../../../lib/auth';
import { applyMockTransition } from '../../../../lib/mock-data';

/**
 * Only these roles may make a binding credit decision (PRD B.4 — Fatima the
 * Credit Analyst; CEO as a supervising override). Operations/Compliance cannot.
 */
const CREDIT_DECISION_ROLES: readonly Role[] = ['CreditAnalyst', 'CEO'];

/**
 * Phase 1 human-approval token (CLAUDE.md §2.3): the admin session is the human
 * checkpoint. `decodeSession` reads a server-verified, httpOnly cookie the
 * client cannot forge, so its mere existence — checked below before this is
 * ever called — is what makes this a real human action, not an autonomous one.
 * This string itself is a mock marker, not a cryptographic signature; a
 * production version needs a real signed-action token.
 */
function buildHumanApprovalToken(role: Role, name: string): string {
  return `mock-approval:${role}:${name}:${Date.now()}`;
}

async function decide(applicationId: string, to: ApplicationState): Promise<void> {
  const session = decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!session || !CREDIT_DECISION_ROLES.includes(session.role)) {
    throw new Error('Only a CreditAnalyst or CEO session may make a credit decision.');
  }

  const humanApprovalToken = buildHumanApprovalToken(session.role, session.name);
  applyMockTransition(applicationId, to, session.name, humanApprovalToken);
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
