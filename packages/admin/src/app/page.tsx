import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { decodeSession, SESSION_COOKIE } from '../lib/auth';

export default function RootPage() {
  const session = decodeSession(cookies().get(SESSION_COOKIE)?.value);
  redirect(session ? '/dashboard' : '/login');
}
