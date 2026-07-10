import Link from 'next/link';
import { MOCK_APPLICATIONS } from '../../../lib/mock-data';
import { StatusBadge } from '../../../components/StatusBadge';
import { confirmPurchase, startSourcing } from './actions';

export default function OperationsPage() {
  const sourcing = MOCK_APPLICATIONS.filter(
    (application) => application.state === 'APPROVED' || application.state === 'VEHICLE_SOURCING',
  );

  return (
    <section>
      <h1 className="page-title">Vehicle Sourcing &amp; Purchase</h1>
      <p className="page-subtitle">
        Operations Lead workflow (PRD B.5) — source a vehicle for each approved application, then
        record the verified purchase receipt before it can move to contract signing. The
        purchase-before-lease sequence itself is enforced by the state machine, not this page.
      </p>

      {sourcing.length === 0 && (
        <div className="card">
          <p className="action-note">
            No applications currently need sourcing or purchase confirmation.
          </p>
        </div>
      )}

      {sourcing.map((application) => (
        <div className="card" key={application.id}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div>
              <p className="section-title" style={{ marginBottom: '0.2rem' }}>
                <Link href={`/dashboard/applications/${application.id}`} className="row-link">
                  {application.id}
                </Link>{' '}
                — {application.customerName}
              </p>
              <p className="action-note" style={{ marginTop: 0 }}>
                {application.vehicle.make} {application.vehicle.model} ({application.vehicle.year})
                · {application.product}
              </p>
            </div>
            <StatusBadge state={application.state} />
          </div>

          {application.state === 'APPROVED' && (
            <form
              action={startSourcing.bind(null, application.id)}
              style={{ marginTop: '0.75rem' }}
            >
              <button type="submit" className="btn">
                Start sourcing
              </button>
            </form>
          )}

          {application.state === 'VEHICLE_SOURCING' && (
            <form
              action={confirmPurchase.bind(null, application.id)}
              className="filter-bar"
              style={{ marginTop: '0.75rem' }}
            >
              <input
                type="text"
                name="purchaseReceiptRef"
                placeholder="Purchase receipt reference"
                required
              />
              <button type="submit" className="btn btn--approve">
                Confirm purchase
              </button>
            </form>
          )}

          {application.vehicle.purchaseReceiptRef && (
            <p className="action-note">Receipt on file: {application.vehicle.purchaseReceiptRef}</p>
          )}
        </div>
      ))}
    </section>
  );
}
