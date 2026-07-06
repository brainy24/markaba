import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COMPLIANCE_VIEW_ROLES, decodeSession, SESSION_COOKIE } from './lib/auth';

export function middleware(request: NextRequest) {
  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (
    request.nextUrl.pathname.startsWith('/dashboard/audit') &&
    !COMPLIANCE_VIEW_ROLES.includes(session.role)
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
