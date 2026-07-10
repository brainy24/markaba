import type { ReactNode } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  COMPLIANCE_VIEW_ROLES,
  decodeSession,
  OPERATIONS_VIEW_ROLES,
  SCQ_VIEW_ROLES,
  SESSION_COOKIE,
} from '../../lib/auth';
import { mockSignOut } from './actions';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // Middleware already guarantees a session exists for every /dashboard/* route.
  const session = decodeSession(cookies().get(SESSION_COOKIE)?.value)!;

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
          {OPERATIONS_VIEW_ROLES.includes(session.role) && (
            <Link href="/dashboard/operations" className="nav-link">
              Operations
            </Link>
          )}
          {SCQ_VIEW_ROLES.includes(session.role) && (
            <Link href="/dashboard/compliance" className="nav-link">
              Compliance
            </Link>
          )}
          {COMPLIANCE_VIEW_ROLES.includes(session.role) && (
            <Link href="/dashboard/audit" className="nav-link">
              Audit
            </Link>
          )}
        </nav>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.85rem' }}>
          <span>
            {session.name} · <span className="badge">{session.role}</span>
          </span>
          <form action={mockSignOut}>
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
