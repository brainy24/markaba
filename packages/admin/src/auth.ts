import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { PrismaClient as DefaultPrismaClient } from '@prisma/client';
import authConfig from './auth.config';
import { prisma } from './lib/prisma';
import { consumeInvite, resolveSignIn } from './lib/invites';

// PrismaAdapter's type signature hard-imports PrismaClient from the default
// `@prisma/client` location, but our schema generates to a custom output
// path (see prisma/schema.prisma) to avoid colliding with packages/api's
// own client at the same hoisted node_modules location. The two are
// structurally identical at runtime (same generator, same shape) — this
// assertion is only needed to satisfy the adapter's narrower type.
const adapterPrisma = prisma as unknown as DefaultPrismaClient;

/**
 * Full config (Node.js runtime only — the API route handler, Server
 * Components/Actions). Adds the Prisma adapter and DB-touching callbacks on
 * top of the Edge-safe `auth.config.ts`, which `middleware.ts` uses directly
 * instead of this file so Prisma's native query engine never gets bundled
 * for the Edge runtime. See docs/decisions/0002-admin-oauth-jwt-sessions.md.
 *
 * Real staff authentication (replaces the old mock name/role-dropdown
 * login). Staff sign in with their existing Google or Microsoft work
 * account — Markaba never stores or sees a password. A valid account is
 * necessary but not sufficient: signIn() below rejects anyone without a
 * provisioned role or a matching AdminInvite. See lib/invites.ts.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(adapterPrisma),
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const resolution = await resolveSignIn(prisma, user.email);
      return resolution.allowed;
    },
    async jwt({ token, user }) {
      // `user` is only present on the initial sign-in, not on token refresh.
      if (user?.email) {
        const resolution = await resolveSignIn(prisma, user.email);
        if (resolution.allowed && resolution.role) {
          if (!resolution.alreadyProvisioned) {
            await consumeInvite(prisma, user.email, resolution.role);
          }
          token.role = resolution.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    },
  },
});
