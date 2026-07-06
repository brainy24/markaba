import { MOCK_APPLICATIONS } from '../../lib/mock-data';

export default function ApplicationQueuePage() {
  return (
    <section>
      <h1 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Application Queue</h1>
      <p style={{ color: '#666', fontSize: '0.85rem', marginTop: 0 }}>
        Read-only this sprint — mock data. No approve/decline actions are wired yet.
      </p>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Finance type</th>
            <th>Requested (₦)</th>
            <th>State</th>
            <th>Submitted</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_APPLICATIONS.map((application) => (
            <tr key={application.id}>
              <td>{application.id}</td>
              <td>{application.customerName}</td>
              <td>{application.financeType}</td>
              <td>{application.requestedAmountNaira.toLocaleString('en-NG')}</td>
              <td>
                <span className="badge">{application.state}</span>
              </td>
              <td>{application.submittedAt}</td>
              {/*
                HUMAN-CHECKPOINT: approval actions require the human-approval
                token design (CLAUDE.md §2.3). Approve/Decline/Refer buttons go
                here in a later sprint — do not wire them without that design.
              */}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
