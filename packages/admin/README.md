# @markaba/admin

Internal admin dashboard (Next.js App Router). See
[`docs/decisions/0002-admin-oauth-jwt-sessions.md`](../../docs/decisions/0002-admin-oauth-jwt-sessions.md)
for why auth is built the way it is.

## Real authentication setup (one-time, per environment)

Staff sign in with their Google or Microsoft work account — never a password.
A valid account is necessary but not sufficient: only a pre-invited email can
actually get in (see `src/lib/invites.ts`). Before any of that works, someone
has to provision the following. None of this can be done on your behalf — it
involves creating third-party accounts and a database.

1. **Provision a Postgres database** for this app specifically (separate
   from `packages/api`'s database — see the ADR for why). Plain Neon
   project at [neon.tech](https://neon.tech) (free tier) — no
   platform-specific DB product, just a connection string → `ADMIN_DATABASE_URL`.

2. **Google OAuth app**: [Google Cloud Console](https://console.cloud.google.com/)
   → APIs & Services → OAuth consent screen (internal or external, your
   call) → Credentials → Create Credentials → OAuth client ID → Web
   application. Authorized redirect URIs:
   - `http://localhost:3001/api/auth/callback/google` (local dev)
   - `https://<your-vercel-domain>/api/auth/callback/google` (production)

   → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

3. **Microsoft Entra app**: [Entra admin center](https://entra.microsoft.com/)
   → App registrations → New registration. Redirect URIs (Web platform):
   - `http://localhost:3001/api/auth/callback/microsoft-entra-id`
   - `https://<your-vercel-domain>/api/auth/callback/microsoft-entra-id`

   → `MICROSOFT_ENTRA_CLIENT_ID`, `MICROSOFT_ENTRA_CLIENT_SECRET`,
   `MICROSOFT_ENTRA_TENANT_ID` (from the app's Overview page).

   Only using one provider? Leave the other's env vars unset — Auth.js just
   won't offer that sign-in button; nothing else breaks.

4. **Session secret**: `openssl rand -base64 32` → `NEXTAUTH_SECRET`.

5. Put all of the above into `packages/admin/.env.local` (git-ignored —
   never commit real values; see `.env.example` at the repo root for the
   full list of placeholder keys) **and** as Vercel project environment
   variables (Settings → Environment Variables) — the build needs them too,
   not just local dev.

6. **Seed the first SuperAdmin.** Someone has to be SuperAdmin before anyone
   can invite anyone else. Set `INITIAL_SUPERADMIN_EMAIL` in
   `packages/admin/.env.local` to a real work email, then:

   ```
   npx prisma migrate deploy --schema packages/admin/prisma/schema.prisma
   npm run prisma:seed --workspace=@markaba/admin
   ```

   That email can now sign in with Google or Microsoft and will land as
   SuperAdmin. From the "Users" page they can invite everyone else.

## Local development

```
npm run prisma:generate --workspace=@markaba/admin   # after any schema.prisma change
npm run dev --workspace=@markaba/admin                # http://localhost:3001
```
