'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '../../../auth';
import { ROLES, USER_MANAGEMENT_ROLES, type Role } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { MOCK_AUDIT_LOG } from '../../../lib/mock-data';

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

async function requireSuperAdminActor(): Promise<string> {
  const session = await auth();
  const role = session?.user.role;
  if (!role || !USER_MANAGEMENT_ROLES.includes(role)) {
    throw new Error('Only a SuperAdmin session may manage the admin user directory.');
  }
  return session!.user.name ?? session!.user.email ?? 'unknown';
}

/**
 * Invites another admin portal user by their work email. This is the real
 * access-control mechanism, not record-keeping: only an email with a
 * matching, unconsumed invite (or an already-provisioned role) may sign in
 * at all — see lib/invites.ts and docs/decisions/0002-admin-oauth-jwt-sessions.md.
 * Does not change the role of someone who has already signed in once (their
 * User.role is authoritative from then on) — this only provisions new users.
 */
export async function createInvite(formData: FormData): Promise<void> {
  const invitedBy = await requireSuperAdminActor();

  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const role = String(formData.get('role') ?? '');

  if (!email) {
    throw new Error('An email is required to invite an admin user.');
  }
  if (!isRole(role)) {
    throw new Error(`Unknown role: ${role}`);
  }

  await prisma.adminInvite.upsert({
    where: { email },
    create: { email, role, invitedBy },
    update: { role, invitedBy },
  });

  // Invite creation is real access control now, but the audit trail for it
  // still writes to the same in-memory mock log as the applications
  // workflow — persisting it properly is separate, larger work still
  // blocked on a live DB for packages/api (flagged in the auth plan rather
  // than decided silently).
  const at = new Date().toISOString().slice(0, 10);
  MOCK_AUDIT_LOG.unshift({
    id: `invite-${email}-${Date.now()}`,
    actor: invitedBy,
    action: 'ADMIN_PROFILE_CREATED',
    entityType: 'AdminProfile',
    entityId: email,
    detail: `Invited ${email} as ${role}`,
    at,
  });

  revalidatePath('/dashboard/users');
}
