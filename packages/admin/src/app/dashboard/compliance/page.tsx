import Link from 'next/link';
import { MOCK_SCQS } from '../../../lib/mock-data';

/** SLA targets from PRD A.3 — initial ruling within 5 business days, full within 15. */
const INITIAL_RULING_SLA_DAYS = 5;
const FULL_RULING_SLA_DAYS = 15;

function ageInDays(raisedAt: Date): number {
  return Math.floor((Date.now() - raisedAt.getTime()) / (1000 * 60 * 60 * 24));
}

export default function CompliancePage() {
  const scqs = [...MOCK_SCQS].sort((a, b) => b.raisedAt.getTime() - a.raisedAt.getTime());

  return (
    <section>
      <h1 className="page-title">Sharia Compliance Query Register</h1>
      <p className="page-subtitle">
        Escalation path per PRD A.3 — Head of Compliance review within 24h, SSB Chair within 48h,
        initial ruling within {INITIAL_RULING_SLA_DAYS} business days, full ruling within{' '}
        {FULL_RULING_SLA_DAYS}. Rulings are entered by the SSB out of band — this register only
        tracks and ages the query; it never rules on anything (CLAUDE.md §2.1).
      </p>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Entity</th>
              <th>Status</th>
              <th>Age</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {scqs.map((scq) => {
              const age = ageInDays(scq.raisedAt);
              const overdue = scq.status !== 'RULED' && age > INITIAL_RULING_SLA_DAYS;
              return (
                <tr key={scq.id}>
                  <td>{scq.id}</td>
                  <td>
                    {scq.relatedEntityType === 'Application' ? (
                      <Link
                        href={`/dashboard/applications/${scq.relatedEntityId}`}
                        className="row-link"
                      >
                        {scq.relatedEntityId}
                      </Link>
                    ) : (
                      scq.relatedEntityId
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge badge--${scq.status === 'RULED' ? 'positive' : 'warning'}`}
                    >
                      {scq.status}
                    </span>
                  </td>
                  <td>
                    {age}d
                    {overdue && (
                      <span className="badge badge--negative" style={{ marginLeft: '0.4rem' }}>
                        overdue
                      </span>
                    )}
                  </td>
                  <td>
                    {scq.description}
                    {scq.rulingSummary && (
                      <p className="action-note" style={{ marginTop: '0.3rem', marginBottom: 0 }}>
                        Ruling: {scq.rulingSummary}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
            {scqs.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-row">
                  No Sharia Compliance Queries on record.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
