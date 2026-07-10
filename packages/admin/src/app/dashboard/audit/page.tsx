import Link from 'next/link';
import { filterAuditLog, MOCK_AUDIT_LOG } from '../../../lib/mock-data';

interface AuditSearchParams {
  q?: string;
  action?: string;
}

export default function AuditPage({ searchParams }: { searchParams: AuditSearchParams }) {
  const rows = filterAuditLog(MOCK_AUDIT_LOG, { q: searchParams.q, action: searchParams.action });
  const actions = [...new Set(MOCK_AUDIT_LOG.map((entry) => entry.action))].sort();

  return (
    <section>
      <h1 className="page-title">Audit Log</h1>
      <p className="page-subtitle">
        Append-only, immutable evidence trail (CLAUDE.md §7) — every state transition and
        decision-adjacent action. Compliance / CEO view.
      </p>

      <form method="get" className="filter-bar card">
        <input
          type="search"
          name="q"
          placeholder="Search by entity, actor, or detail"
          defaultValue={searchParams.q ?? ''}
        />
        <select name="action" defaultValue={searchParams.action ?? ''}>
          <option value="">All actions</option>
          {actions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
        <button type="submit">Filter</button>
        {(searchParams.q || searchParams.action) && (
          <Link href="/dashboard/audit" className="link-muted">
            Clear
          </Link>
        )}
      </form>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.at}</td>
                <td>{entry.actor}</td>
                <td>
                  <span className="badge">{entry.action}</span>
                </td>
                <td>
                  <Link href={`/dashboard/applications/${entry.entityId}`} className="row-link">
                    {entry.entityId}
                  </Link>
                </td>
                <td>{entry.detail}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-row">
                  No audit entries match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
