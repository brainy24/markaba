import { MOCK_ADMIN_PROFILES } from '../../../lib/mock-data';
import { ROLES } from '../../../lib/auth';
import { createProfile } from './actions';

export default function UsersPage() {
  const profiles = [...MOCK_ADMIN_PROFILES].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <section>
      <h1 className="page-title">Admin Users</h1>
      <p className="page-subtitle">
        Directory of admin portal users and their roles. SuperAdmin only. This is
        record-keeping, not access control — sign-in remains a mock role picker in Phase 1
        (no real identity provider yet).
      </p>

      <div className="card">
        <p className="section-title">Create a profile</p>
        <form action={createProfile} className="filter-bar">
          <input type="text" name="name" placeholder="Full name" required />
          <select name="role" defaultValue={ROLES[0]}>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn--approve">
            Create
          </button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Created</th>
              <th>Created by</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td>{profile.name}</td>
                <td>
                  <span className="badge">{profile.role}</span>
                </td>
                <td>{profile.createdAt}</td>
                <td>{profile.createdBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
