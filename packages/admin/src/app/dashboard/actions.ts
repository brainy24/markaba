'use server';

import { signOut } from '../../auth';

export async function adminSignOut(): Promise<void> {
  await signOut({ redirectTo: '/login' });
}
