'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { decodeSession, isRole, SESSION_COOKIE, USER_MANAGEMENT_ROLES } from '../../../lib/auth';
import { createAdminProfile } from '../../../lib/mock-data';

function requireSuperAdminSession() {
  const session = decodeSession(cookies().get(SESSION_COOKIE)?.value);
  if (!session || !USER_MANAGEMENT_ROLES.includes(session.role)) {
    throw new Error('Only a SuperAdmin session may manage the admin user directory.');
  }
  return session;
}

/**
 * Creates a directory entry for another admin portal user. This is
 * record-keeping, not access control — Phase 1 login remains a mock role
 * picker with no real identity provider (CLAUDE.md §3, lib/auth.ts).
 */
export async function createProfile(formData: FormData): Promise<void> {
  const session = requireSuperAdminSession();

  const name = String(formData.get('name') ?? '').trim();
  const role = String(formData.get('role') ?? '');

  if (!name) {
    throw new Error('A name is required to create an admin profile.');
  }
  if (!isRole(role)) {
    throw new Error(`Unknown role: ${role}`);
  }

  createAdminProfile(name, role, session.name);
  revalidatePath('/dashboard/users');
}
