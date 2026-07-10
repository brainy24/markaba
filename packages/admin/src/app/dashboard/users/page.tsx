import { prisma } from '../../../lib/prisma';
import { ROLES } from '../../../lib/auth';
import { createInvite } from './actions';

// Needs a live DB read every request — without this, Next.js attempts (and
// fails, harmlessly) to statically prerender this page at build time, which
// logs a scary-looking but non-fatal PrismaClientInitializationError.
export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const [users, invites] = await Promise.all([
    prisma.user.findMany({ where: { role: { not: null } }, orderBy: { email: 'asc' } }),
    prisma.adminInvite.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  return (
    <section>
      <h1 className="page-title">Admin Users</h1>
      <p className="page-subtitle">
        Invite staff by their Google or Microsoft work email. Only an invited email can sign
        in — this is real access control, not a directory. See
        docs/decisions/0002-admin-oauth-jwt-sessions.md.
      </p>

      <div className="card">
        <p className="section-title">Invite a user</p>
        <form action={createInvite} className="filter-bar">
          <input type="email" name="email" placeholder="work.email@company.com" required />
          <select name="role" defaultValue={ROLES[0]}>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn--approve">
            Invite
          </button>
        </form>
      </div>

      <div className="card">
        <p className="section-title">Active users</p>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.name ?? '—'}</td>
                <td>
                  <span className="badge">{user.role}</span>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={3} className="empty-row">
                  No one has signed in yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <p className="section-title">Pending invites</p>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Invited by</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((invite) => (
              <tr key={invite.id}>
                <td>{invite.email}</td>
                <td>
                  <span className="badge">{invite.role}</span>
                </td>
                <td>{invite.invitedBy}</td>
                <td>
                  {invite.consumedAt
                    ? `Consumed ${invite.consumedAt.toISOString().slice(0, 10)}`
                    : 'Pending'}
                </td>
              </tr>
            ))}
            {invites.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-row">
                  No invites yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
