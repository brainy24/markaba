import Link from 'next/link';
import { notFound } from 'next/navigation';
import { canTransition } from '@markaba/shared';
import { auth } from '../../../../auth';
import { findApplicationById, MOCK_SCQS } from '../../../../lib/mock-data';
import { StatusBadge } from '../../../../components/StatusBadge';
import { approveApplication, declineApplication, referApplication } from './actions';

const CREDIT_DECISION_ROLES = new Set(['CreditAnalyst', 'CEO']);

function factorClass(contribution: number): string {
  return contribution >= 0 ? 'factor-contribution--positive' : 'factor-contribution--negative';
}

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const application = findApplicationById(params.id);
  if (!application) {
    notFound();
  }

  const session = await auth();
  const role = session?.user?.role;
  const displayName = session?.user?.name ?? session?.user?.email ?? 'Unknown';
  const canDecide = !!role && CREDIT_DECISION_ROLES.has(role);
  const canApprove = canTransition(application.state, 'APPROVED');
  const canDecline = canTransition(application.state, 'DECLINED');
  const canRefer = canTransition(application.state, 'REFERRED');
  const showActionBar = canDecide && (canApprove || canDecline || canRefer);

  const relatedScqs = MOCK_SCQS.filter((scq) => scq.relatedEntityId === application.id);

  const approveWithId = approveApplication.bind(null, application.id);
  const declineWithId = declineApplication.bind(null, application.id);
  const referWithId = referApplication.bind(null, application.id);

  return (
    <section>
      <Link href="/dashboard" className="link-muted">
        ← Back to queue
      </Link>

      <div className="card" style={{ marginTop: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">{application.id}</h1>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>
              {application.customerName} · {application.customerPhone}
            </p>
          </div>
          <StatusBadge state={application.state} />
        </div>
      </div>

      {showActionBar && (
        <div className="card">
          <p className="section-title">Decision</p>
          <div className="action-bar">
            {canApprove && (
              <form action={approveWithId}>
                <button type="submit" className="btn btn--approve">
                  Approve
                </button>
              </form>
            )}
            {canRefer && (
              <form action={referWithId}>
                <button type="submit" className="btn btn--refer">
                  Refer
                </button>
              </form>
            )}
            {canDecline && (
              <form action={declineWithId}>
                <button type="submit" className="btn btn--decline">
                  Decline
                </button>
              </form>
            )}
          </div>
          <p className="action-note">
            Signed in as {displayName} ({role}). This action is logged as the human-approval
            evidence for this decision (CLAUDE.md §2.3).
          </p>
        </div>
      )}

      <div className="detail-grid">
        <div className="card">
          <p className="section-title">Application</p>
          <div className="field-list">
            <div className="field-row">
              <span className="field-label">Product</span>
              <span className="field-value">{application.product}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Financed amount</span>
              <span className="field-value">
                ₦{application.financedAmount.toLocaleString('en-NG')}
              </span>
            </div>
            <div className="field-row">
              <span className="field-label">Down payment</span>
              <span className="field-value">{application.downPaymentPct}%</span>
            </div>
            <div className="field-row">
              <span className="field-label">Term</span>
              <span className="field-value">{application.termMonths} months</span>
            </div>
            <div className="field-row">
              <span className="field-label">Declared vehicle use</span>
              <span className="field-value">{application.declaredVehicleUse}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Submitted</span>
              <span className="field-value">{application.submittedAt}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <p className="section-title">Vehicle</p>
          <div className="field-list">
            <div className="field-row">
              <span className="field-label">Make / model</span>
              <span className="field-value">
                {application.vehicle.make} {application.vehicle.model}
              </span>
            </div>
            <div className="field-row">
              <span className="field-label">Year</span>
              <span className="field-value">{application.vehicle.year}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Guarantors</span>
              <span className="field-value">{application.guarantorCount}</span>
            </div>
          </div>
        </div>

        {application.openBankingSummary && (
          <div className="card">
            <p className="section-title">Open Banking summary (mock)</p>
            <div className="field-list">
              <div className="field-row">
                <span className="field-label">Monthly income</span>
                <span className="field-value">
                  ₦{application.openBankingSummary.monthlyIncomeNaira.toLocaleString('en-NG')}
                </span>
              </div>
              <div className="field-row">
                <span className="field-label">Average balance</span>
                <span className="field-value">
                  ₦{application.openBankingSummary.averageBalanceNaira.toLocaleString('en-NG')}
                </span>
              </div>
              <div className="field-row">
                <span className="field-label">Transactions (period)</span>
                <span className="field-value">
                  {application.openBankingSummary.transactionCount}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <p className="section-title">Markaba Credit Score (MCS) — recommendation only</p>
          {application.mcsRecommendation ? (
            <>
              <div className="field-row">
                <span className="field-label">Score</span>
                <span className="field-value">{application.mcsRecommendation.score} / 1000</span>
              </div>
              <div className="field-row">
                <span className="field-label">Recommendation</span>
                <span className="field-value">{application.mcsRecommendation.recommendation}</span>
              </div>
              <p className="section-title" style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
                Factor breakdown
              </p>
              {application.mcsRecommendation.explanation.map((factor) => (
                <div className="factor-row" key={factor.factor}>
                  <span>{factor.factor}</span>
                  <span className={factorClass(factor.contribution)}>
                    {factor.contribution >= 0 ? '+' : ''}
                    {factor.contribution}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <p className="action-note">Not yet scored — application hasn't reached UNDERWRITING.</p>
          )}
        </div>
      </div>

      {relatedScqs.length > 0 && (
        <div className="card">
          <p className="section-title">Sharia Compliance Queries</p>
          {relatedScqs.map((scq) => (
            <div key={scq.id} className="field-list" style={{ marginBottom: '0.5rem' }}>
              <div className="field-row">
                <span className="field-label">{scq.id}</span>
                <span className="badge badge--warning">{scq.status}</span>
              </div>
              <p className="action-note" style={{ marginTop: 0 }}>
                {scq.description}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <p className="section-title">State history</p>
        <div className="timeline">
          {application.stateHistory.map((entry, index) => (
            <div className="timeline-item" key={`${entry.state}-${index}`}>
              <span className="timeline-date">{entry.at}</span>
              <span>
                <StatusBadge state={entry.state} />{' '}
                <span className="timeline-actor">by {entry.actor}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
