import type { ReactNode } from 'react';
import Link from 'next/link';
import { auth } from '../../auth';
import {
  COMPLIANCE_VIEW_ROLES,
  OPERATIONS_VIEW_ROLES,
  SCQ_VIEW_ROLES,
  USER_MANAGEMENT_ROLES,
} from '../../lib/auth';
import { adminSignOut } from './actions';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Middleware already guarantees a session with a role exists for every
  // /dashboard/* route — see middleware.ts.
  const session = await auth();
  const role = session!.user.role!;

  return (
    <div>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.9rem 1.5rem',
          background: 'white',
          borderBottom: '1px solid #e2e2e6',
        }}
      >
        <nav style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <strong>Markaba Admin</strong>
          <Link href="/dashboard" className="nav-link">
            Applications
          </Link>
          {OPERATIONS_VIEW_ROLES.includes(role) && (
            <Link href="/dashboard/operations" className="nav-link">
              Operations
            </Link>
          )}
          {SCQ_VIEW_ROLES.includes(role) && (
            <Link href="/dashboard/compliance" className="nav-link">
              Compliance
            </Link>
          )}
          {COMPLIANCE_VIEW_ROLES.includes(role) && (
            <Link href="/dashboard/audit" className="nav-link">
              Audit
            </Link>
          )}
          {USER_MANAGEMENT_ROLES.includes(role) && (
            <Link href="/dashboard/users" className="nav-link">
              Users
            </Link>
          )}
        </nav>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.85rem' }}>
          <span>
            {session!.user.name ?? session!.user.email} · <span className="badge">{role}</span>
          </span>
          <form action={adminSignOut}>
            <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main style={{ padding: '1.5rem' }}>{children}</main>
    </div>
  );
}
