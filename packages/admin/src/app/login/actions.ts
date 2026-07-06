'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { encodeSession, isRole, SESSION_COOKIE } from '../../lib/auth';

/** Mock sign-in only — no password, no identity provider (CLAUDE.md §3). */
export async function mockSignIn(formData: FormData): Promise<void> {
  const name = String(formData.get('name') ?? '').trim() || 'Demo User';
  const role = String(formData.get('role') ?? '');

  if (!isRole(role)) {
    throw new Error(`Unknown mock role: ${role}`);
  }

  cookies().set(SESSION_COOKIE, encodeSession({ name, role }), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  redirect('/dashboard');
}
