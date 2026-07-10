# ADR 0002 — Admin portal auth: OAuth (Google/Microsoft) + JWT sessions + invite-gated sign-in

**Status:** Accepted · **Date:** 2026-07-10

## Context

The admin dashboard originally had no real authentication — a name/role
dropdown writing an unsigned mock cookie (CLAUDE.md §3, deliberate for Phase
1). The user asked for real authentication for the admin portal specifically
(not the customer-facing mobile app, which stays mock — real customer auth is
entangled with the still-blocked KYC/BVN work, CLAUDE.md §4).

## Decisions

**OAuth via Google/Microsoft, not email+password.** Staff sign in with their
existing company account; Markaba never stores or handles a password.
Removes an entire class of risk (credential storage, hashing, breach
liability, forgot-password/email-delivery infrastructure) for an internal
tool where staff already have a company identity provider.

**Auth.js (`next-auth` v5)**, not a hand-rolled OAuth flow. State/PKCE/token
verification are security-sensitive to get right; a maintained library is the
appropriate choice over custom code here.

**JWT sessions, not database sessions**, despite using the Prisma adapter for
user/invite storage. Middleware runs on the Edge runtime by default, and
Edge + Postgres driver compatibility is a real source of friction. A
self-contained, signed JWT is verifiable at the edge with zero DB calls per
request — the database is only touched at sign-in and token-refresh time
(Node.js runtime), which is exactly where role lookups happen anyway.

**Trade-off, accepted deliberately:** revoking a removed staff member isn't
instant — their JWT stays valid until it expires, since there's no
per-request revocation check. Mitigated with a short session lifetime (8h,
forcing daily re-auth). If instant revocation becomes a requirement, the
fix is switching to database sessions (session strategy: `'database'`) and
accepting the Edge-runtime complexity, or adding a lightweight revocation-list
check — not attempted now, since it's unneeded complexity until there's an
actual incident response requirement.

**Invite-gated sign-in**, replacing the mock user-directory feature built
earlier. A SuperAdmin creates an `AdminInvite {email, role}` row *before* the
person ever signs in. Auth.js's `signIn` callback (`packages/admin/src/auth.ts`)
rejects any authenticated Google/Microsoft account without a matching
invite or an already-provisioned role — a valid company account is necessary
but not sufficient to get into the admin portal. This is the actual
access-control mechanism; the old mock directory was record-keeping only.

**Separate Prisma schema for admin** (`packages/admin/prisma/schema.prisma`),
independent of `packages/api/prisma/schema.prisma`. Staff accounts are a
different bounded context from lending-domain data (different lifecycle,
different access pattern) — this also avoids coupling two Next.js/NestJS
apps' data layers together. Custom Prisma client output path
(`src/generated/prisma-client`) avoids both packages' `@prisma/client`
dependency colliding at a single hoisted `node_modules/@prisma/client` in
this npm-workspaces monorepo.

## Consequence

Anyone reachable from `AdminInvite`/`User.role` is real, DB-backed access
control — a materially different security posture from the mock cookie this
replaces. Not addressed by this change: instant revocation (see trade-off
above), and audit logging for invite creation still writes to the same
in-memory mock audit log as the applications workflow (flagged, not silently
decided, in the implementation plan — persisting that properly is separate,
larger work still blocked on `packages/api` having a live database).
