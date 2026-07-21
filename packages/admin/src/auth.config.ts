import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

/**
 * Auth.js validates every registered provider's config at request time —
 * an OAuth provider registered with an undefined clientId/clientSecret/issuer
 * fails validation and surfaces as a generic `?error=Configuration`, even
 * when the customer is signing in with a *different* provider entirely. Only
 * register Microsoft Entra ID once its env vars are actually set, so
 * deployments that only use Google don't need Microsoft placeholders just to
 * pass validation.
 */
const providers: NextAuthConfig['providers'] = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
];

if (
  process.env.MICROSOFT_ENTRA_CLIENT_ID &&
  process.env.MICROSOFT_ENTRA_CLIENT_SECRET &&
  process.env.MICROSOFT_ENTRA_TENANT_ID
) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_ENTRA_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_ENTRA_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.MICROSOFT_ENTRA_TENANT_ID}/v2.0`,
    }),
  );
}

/**
 * Edge-safe subset of the Auth.js config — no Prisma adapter, no database
 * access, importable from middleware.ts (Edge runtime) without dragging
 * Prisma's native query engine into that bundle. `auth.ts` (Node.js
 * runtime — the API route handler, Server Components/Actions) spreads this
 * and adds the Prisma adapter + DB-touching callbacks on top.
 */
export default {
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  // JWT, not database sessions — see docs/decisions/0002-admin-oauth-jwt-sessions.md.
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 },
  pages: { signIn: '/login' },
  callbacks: {
    // Pure token -> session shaping, no DB access — belongs here (not just
    // auth.ts) so middleware.ts's own lightweight NextAuth(authConfig)
    // instance also populates session.user.role when decoding the JWT.
    // Without this here, middleware read a session shaped by Auth.js's
    // default callback (no `role` field at all), not a missing-user crash
    // as it first looked — a real gap, not just a missing null-check.
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
