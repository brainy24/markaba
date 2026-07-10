import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import authConfig from './auth.config';
import {
  COMPLIANCE_VIEW_ROLES,
  OPERATIONS_VIEW_ROLES,
  SCQ_VIEW_ROLES,
  USER_MANAGEMENT_ROLES,
  type Role,
} from './lib/auth';

// Uses the Edge-safe auth.config.ts directly, not the full auth.ts (which
// imports the Prisma adapter) — see docs/decisions/0002-admin-oauth-jwt-sessions.md.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const role = req.auth?.user?.role;

  if (!role) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  const { pathname } = req.nextUrl;
  const roleGates: Array<[string, readonly Role[]]> = [
    ['/dashboard/audit', COMPLIANCE_VIEW_ROLES],
    ['/dashboard/compliance', SCQ_VIEW_ROLES],
    ['/dashboard/operations', OPERATIONS_VIEW_ROLES],
    ['/dashboard/users', USER_MANAGEMENT_ROLES],
  ];

  for (const [prefix, allowedRoles] of roleGates) {
    if (pathname.startsWith(prefix) && !allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
