'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '../../lib/auth';

export async function mockSignOut(): Promise<void> {
  // Must match the `path` the cookie was set with in login/actions.ts, or the
  // delete silently no-ops and the original cookie keeps the session alive.
  cookies().delete({ name: SESSION_COOKIE, path: '/' });
  redirect('/login');
}
