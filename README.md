# Markaba (مركبة)

Sharia-compliant vehicle-financing platform for Nigeria — Phase 1 monorepo.

Read [`CLAUDE.md`](./CLAUDE.md) first. It defines the Golden Rules this codebase
must never cross without human sign-off (no live Sharia contract logic, no real
credentials/BVNs/PII, no autonomous money movement, no live open-banking calls).
See [`docs/SPRINT-01.md`](./docs/SPRINT-01.md) for the current sprint's tickets.

## Repo layout

```
packages/
  shared/   # domain types + application state machine (single source of truth)
  api/      # NestJS backend — modules, integrations (mock), credit stub, audit
  admin/    # Next.js internal admin dashboard (read-only skeleton)
  mobile/   # React Native app shell (mock auth, EN/HA i18n stub)
```

## Prerequisites

- Node.js ≥ 20 and npm ≥ 10
- PostgreSQL running locally (for `@markaba/api`) — see below
- For `@markaba/mobile`: a full React Native environment (Xcode + iOS Simulator,
  or Android Studio + an Android emulator) if you want to actually run the app on
  a simulator. Everything else (typecheck, lint, unit/component tests) works
  without either.

## Local setup

```bash
npm install
cp .env.example .env   # fill in local/sandbox values only — see CLAUDE.md §2.2
npm run build --workspace=@markaba/shared
npm run prisma:generate --workspace=@markaba/api
```

### Database

`@markaba/api` expects a local PostgreSQL instance reachable at `DATABASE_URL`
(see `.env.example`). Once one is running:

```bash
npm run prisma:migrate --workspace=@markaba/api
```

### Running things

```bash
npm run start:dev --workspace=@markaba/api     # NestJS API on :3000
npm run dev --workspace=@markaba/admin         # Next.js admin on :3001
npm run start --workspace=@markaba/mobile      # Metro bundler for the RN app shell
```

### Quality gates (same as CI)

```bash
npm run lint
npm run typecheck
npm run test:coverage
bash scripts/secret-scan.sh
```

## Golden rules (short version — see CLAUDE.md for the full text)

1. Sharia-critical logic (contract generation, compliance rules, ownership
   transfer) is scaffolded as interfaces/`NotImplementedError` stubs only, gated
   on the Sharia Supervisory Board.
2. No real BVNs, bank credentials, live open-banking tokens, or production API
   keys — anywhere, ever, in this repo. Mock/sandbox data only.
3. No code may autonomously issue a binding credit decision or move real money.
4. Live CBN Open Banking / NIFI NBFC integrations are blocked until registration;
   every external integration runs against a mock adapter, selected via
   `PROVIDER_MODE=mock`.

If you hit a `// HUMAN-CHECKPOINT:` comment, stop and get a human sign-off before
proceeding past it.
