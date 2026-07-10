import { signInWithGoogle, signInWithMicrosoft } from './actions';

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "That account isn't authorized for the Markaba admin portal yet. Ask a SuperAdmin to invite your work email.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorMessage = searchParams.error
    ? (ERROR_MESSAGES[searchParams.error] ?? 'Sign-in failed. Please try again.')
    : null;

  return (
    <main style={{ maxWidth: 380, margin: '4rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: '1.4rem' }}>Markaba Admin</h1>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Sign in with your Markaba work account. Only pre-invited emails can access the admin
        portal.
      </p>

      {errorMessage && (
        <p
          role="alert"
          style={{
            color: '#a02020',
            background: '#fdecec',
            padding: '0.6rem 0.8rem',
            borderRadius: 6,
            fontSize: '0.85rem',
          }}
        >
          {errorMessage}
        </p>
      )}

      <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1.5rem' }}>
        <form action={signInWithGoogle}>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.6rem',
              background: '#3a3fb5',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Sign in with Google
          </button>
        </form>
        <form action={signInWithMicrosoft}>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.6rem',
              background: 'white',
              color: '#1a1a1a',
              border: '1px solid #d0d0d6',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Sign in with Microsoft
          </button>
        </form>
      </div>
    </main>
  );
}
