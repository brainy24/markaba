import { ROLES } from '../../lib/auth';
import { mockSignIn } from './actions';

export default function LoginPage() {
  return (
    <main style={{ maxWidth: 380, margin: '4rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: '1.4rem' }}>Markaba Admin</h1>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Mock sign-in for Phase 1 — pick a role, no password required.
      </p>
      <form action={mockSignIn} style={{ display: 'grid', gap: '0.75rem', marginTop: '1.5rem' }}>
        <label>
          Name
          <input
            name="name"
            defaultValue="Demo User"
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </label>
        <label>
          Role
          <select
            name="role"
            defaultValue={ROLES[0]}
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          style={{
            padding: '0.6rem',
            background: '#3a3fb5',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
