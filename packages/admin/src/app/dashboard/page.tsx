import Link from 'next/link';
import {
  ApplicationSortKey,
  filterApplications,
  MOCK_APPLICATIONS,
  SortDirection,
  sortApplications,
} from '../../lib/mock-data';
import { StatusBadge } from '../../components/StatusBadge';

const SORT_KEYS: readonly ApplicationSortKey[] = [
  'id',
  'customerName',
  'financedAmount',
  'submittedAt',
];

const COLUMN_LABELS: Record<ApplicationSortKey, string> = {
  id: 'ID',
  customerName: 'Customer',
  financedAmount: 'Financed (₦)',
  submittedAt: 'Submitted',
};

function isSortKey(value: string | undefined): value is ApplicationSortKey {
  return !!value && (SORT_KEYS as readonly string[]).includes(value);
}

interface QueueSearchParams {
  q?: string;
  state?: string;
  product?: string;
  sort?: string;
  dir?: string;
}

export default function ApplicationQueuePage({
  searchParams,
}: {
  searchParams: QueueSearchParams;
}) {
  const sortKey = isSortKey(searchParams.sort) ? searchParams.sort : 'submittedAt';
  const direction: SortDirection = searchParams.dir === 'asc' ? 'asc' : 'desc';

  const filtered = filterApplications(MOCK_APPLICATIONS, {
    q: searchParams.q,
    state: searchParams.state,
    product: searchParams.product,
  });
  const rows = sortApplications(filtered, sortKey, direction);

  const states = [...new Set(MOCK_APPLICATIONS.map((a) => a.state))].sort();

  const summary = [
    { label: 'Total applications', value: MOCK_APPLICATIONS.length },
    {
      label: 'Financed this queue',
      value: `₦${filtered.reduce((sum, a) => sum + a.financedAmount, 0).toLocaleString('en-NG')}`,
    },
    {
      label: 'Awaiting a decision',
      value: MOCK_APPLICATIONS.filter((a) => a.state === 'UNDERWRITING').length,
    },
    { label: 'Referred', value: MOCK_APPLICATIONS.filter((a) => a.state === 'REFERRED').length },
  ];

  function sortLink(key: ApplicationSortKey) {
    const nextDir: SortDirection = sortKey === key && direction === 'asc' ? 'desc' : 'asc';
    const params = new URLSearchParams({
      ...(searchParams.q ? { q: searchParams.q } : {}),
      ...(searchParams.state ? { state: searchParams.state } : {}),
      ...(searchParams.product ? { product: searchParams.product } : {}),
      sort: key,
      dir: nextDir,
    });
    return `/dashboard?${params.toString()}`;
  }

  return (
    <section>
      <h1 className="page-title">Application Queue</h1>
      <p className="page-subtitle">
        Read-only queue — mock data. Open an application to review and decide.
      </p>

      <div className="stat-grid">
        {summary.map((item) => (
          <div className="card stat-card" key={item.label}>
            <span className="stat-label">{item.label}</span>
            <span className="stat-value">{item.value}</span>
          </div>
        ))}
      </div>

      <form method="get" className="filter-bar card">
        <input
          type="search"
          name="q"
          placeholder="Search by ID or customer name"
          defaultValue={searchParams.q ?? ''}
        />
        <select name="state" defaultValue={searchParams.state ?? ''}>
          <option value="">All states</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        <select name="product" defaultValue={searchParams.product ?? ''}>
          <option value="">All products</option>
          <option value="IJARAH">IJARAH</option>
          <option value="MURABAHA">MURABAHA</option>
        </select>
        <button type="submit">Filter</button>
        {(searchParams.q || searchParams.state || searchParams.product) && (
          <Link href="/dashboard" className="link-muted">
            Clear
          </Link>
        )}
      </form>

      <div className="card">
        <table>
          <thead>
            <tr>
              {SORT_KEYS.map((key) => (
                <th key={key}>
                  <Link href={sortLink(key)} className="th-link">
                    {COLUMN_LABELS[key]}
                    {sortKey === key ? (direction === 'asc' ? ' ▲' : ' ▼') : ''}
                  </Link>
                </th>
              ))}
              <th>Product</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((application) => (
              <tr key={application.id}>
                <td>
                  <Link href={`/dashboard/applications/${application.id}`} className="row-link">
                    {application.id}
                  </Link>
                </td>
                <td>{application.customerName}</td>
                <td>{application.financedAmount.toLocaleString('en-NG')}</td>
                <td>{application.submittedAt}</td>
                <td>{application.product}</td>
                <td>
                  <StatusBadge state={application.state} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">
                  No applications match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
