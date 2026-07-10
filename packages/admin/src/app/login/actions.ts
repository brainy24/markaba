'use server';

import { signIn } from '../../auth';

export async function signInWithGoogle(): Promise<void> {
  await signIn('google', { redirectTo: '/dashboard' });
}

export async function signInWithMicrosoft(): Promise<void> {
  await signIn('microsoft-entra-id', { redirectTo: '/dashboard' });
}
