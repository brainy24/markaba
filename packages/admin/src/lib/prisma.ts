import { PrismaClient } from '../generated/prisma-client';

/**
 * Singleton PrismaClient for the admin portal's own auth schema (staff
 * accounts, invites) — entirely separate from packages/api's lending-domain
 * database. See prisma/schema.prisma for why.
 *
 * Next.js dev mode reloads modules on every request; without caching on
 * globalThis this would open a new DB connection pool per request and
 * exhaust Postgres connection limits (standard Next.js + Prisma pattern).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
