import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  COMPLIANCE_VIEW_ROLES,
  decodeSession,
  OPERATIONS_VIEW_ROLES,
  SCQ_VIEW_ROLES,
  SESSION_COOKIE,
  USER_MANAGEMENT_ROLES,
} from './lib/auth';

export function middleware(request: NextRequest) {
  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const { pathname } = request.nextUrl;
  const roleGates: Array<[string, readonly string[]]> = [
    ['/dashboard/audit', COMPLIANCE_VIEW_ROLES],
    ['/dashboard/compliance', SCQ_VIEW_ROLES],
    ['/dashboard/operations', OPERATIONS_VIEW_ROLES],
    ['/dashboard/users', USER_MANAGEMENT_ROLES],
  ];

  for (const [prefix, allowedRoles] of roleGates) {
    if (pathname.startsWith(prefix) && !allowedRoles.includes(session.role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
