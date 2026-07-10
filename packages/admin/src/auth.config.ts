import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

/**
 * Edge-safe subset of the Auth.js config — no Prisma adapter, no database
 * access, importable from middleware.ts (Edge runtime) without dragging
 * Prisma's native query engine into that bundle. `auth.ts` (Node.js
 * runtime — the API route handler, Server Components/Actions) spreads this
 * and adds the Prisma adapter + DB-touching callbacks on top.
 */
export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_ENTRA_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_ENTRA_CLIENT_SECRET,
      issuer: process.env.MICROSOFT_ENTRA_TENANT_ID
        ? `https://login.microsoftonline.com/${process.env.MICROSOFT_ENTRA_TENANT_ID}/v2.0`
        : undefined,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  // JWT, not database sessions — see docs/decisions/0002-admin-oauth-jwt-sessions.md.
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 },
  pages: { signIn: '/login' },
} satisfies NextAuthConfig;
