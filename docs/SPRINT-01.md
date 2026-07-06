# Sprint 01 — Foundation & Non-Blocked Scaffold

**Sprint goal:** Stand up the Markaba monorepo and build the parts of the Phase 1 system
that do **not** depend on the Sharia Supervisory Board, CBN/OBR registration, or live
credentials. By the end of this sprint we have a running skeleton: a WhatsApp scaffold, a
customer/application data model and state machine, an app shell, an admin skeleton, and
mock integration adapters — all with audit logging and CI.

**Out of scope this sprint (blocked — see CLAUDE.md §4):** Sharia compliance engine,
contract generation, live open banking, real KYC/payments/GPS, ML models.

**Sequence:** work the tickets in order. Each lists acceptance criteria and any
human-checkpoint flags.

---

## S1-01 — Monorepo scaffold & tooling
**Points:** 5 · **Depends on:** none

Set up the monorepo per CLAUDE.md §6.

**Acceptance criteria**
- Monorepo initialised (npm/pnpm workspaces or Turborepo) with `packages/shared`,
  `packages/api`, `packages/mobile`, `packages/admin`.
- TypeScript strict mode configured across all packages.
- Shared lint + format config (ESLint + Prettier). `npm run lint` passes.
- `.env.example` created; `.env` git-ignored. No real values anywhere.
- `README.md` with local-setup instructions.
- Nothing references a real credential.

---

## S1-02 — Shared domain model & application state machine
**Points:** 8 · **Depends on:** S1-01

Define the core types in `packages/shared` — the single source of truth.

**Acceptance criteria**
- `Customer`, `Vehicle`, `Application`, `Guarantor` types defined in
  `packages/shared/src/domain`.
- Application-state enum implemented **as states only**:
  `SUBMITTED → KYC_PENDING → OPEN_BANKING_CONSENT → UNDERWRITING →
  APPROVED | REFERRED | DECLINED → VEHICLE_SOURCING → PURCHASE_CONFIRMED →
  CONTRACT_SIGNED → ACTIVE → COMPLETED | DEFAULTED`.
- A pure `canTransition(from, to)` function encodes legal transitions.
- **`PURCHASE_CONFIRMED → CONTRACT_SIGNED` is explicitly guarded** with a
  `// TODO: requires SSB certification — do not implement the contract-generation body`
  and throws `NotImplementedError` if invoked.
- Unit tests cover the transition table, including rejected illegal transitions.
- No Sharia-critical logic bodies implemented.

---

## S1-03 — Audit logging utility
**Points:** 3 · **Depends on:** S1-01

Build the audit utility early; everything else uses it.

**Acceptance criteria**
- `audit.log({ actor, action, entityId, entityType, metadata })` persists an immutable
  record (append-only table; no update/delete).
- Timestamped, with actor captured. Records cannot be mutated after write.
- Used by S1-02's state machine on every transition.
- Tests confirm append-only behaviour.

---

## S1-04 — Backend API skeleton (NestJS)
**Points:** 5 · **Depends on:** S1-02, S1-03

Stand up the API with module structure per CLAUDE.md §6.

**Acceptance criteria**
- NestJS app boots; health-check endpoint returns 200.
- Modules created (empty but wired): `customers`, `applications`, `whatsapp`,
  `integrations`, `credit`, `sharia`, `audit`.
- PostgreSQL connected via Prisma; `Customer` and `Application` migrations run against a
  **local** DB.
- Config/secrets read from env only; documented in `.env.example`.
- `sharia` module contains **interface + `NotImplementedError` stubs only**.

---

## S1-05 — Integration adapter interfaces + mock implementations
**Points:** 8 · **Depends on:** S1-04

Clean interfaces for every external service, with **mock** implementations only.

**Acceptance criteria**
- Interfaces defined: `KycProvider`, `OpenBankingProvider`, `PaymentProvider`,
  `TelematicsProvider`, `ESignatureProvider`.
- Mock implementations return realistic **fake** data (fake BVNs like `00000000000`,
  fake transactions, fake mandate IDs).
- Provider selection is env-driven (`PROVIDER_MODE=mock`); **live mode is not
  implemented** and throws with a clear message.
- `// HUMAN-CHECKPOINT: live provider wiring requires credentials + registration` on each
  live-mode branch.
- Tests run entirely against mocks.

---

## S1-06 — WhatsApp application scaffold
**Points:** 8 · **Depends on:** S1-04

Webhook receiver and a conversational flow skeleton — **no credit logic, no PII to real
services.**

**Acceptance criteria**
- Webhook endpoint receives and verifies inbound WhatsApp messages (signature check).
- Message router dispatches to handlers: `education` (static SSB-style FAQ answers from a
  local content file), `start_application`, `check_status`.
- `start_application` creates an `Application` in `SUBMITTED` (via the state machine +
  audit log) using **mock** data — it does **not** call any real KYC/open-banking service.
- `education` answers are served from an **approved static content file**, not generated
  freely — leave a `// TODO: SSB-approved copy` marker on the content file.
- No credit decision, no Sharia ruling, no real personal data leaves the system.
- Tests cover routing and the create-application path.

---

## S1-07 — Rule-based credit scorer STUB
**Points:** 3 · **Depends on:** S1-04

A placeholder Phase 1 scorer — documented as a stub, not the real model.

**Acceptance criteria**
- `credit.score(application)` returns a deterministic **mock** Markaba Credit Score
  (0–1000) from mock inputs, with a written explanation object (factor → contribution).
- Thresholds encoded (≥750 / 600–749 / 500–599 / ≤499) but the function **only
  recommends** — it never approves. Output is a recommendation + explanation, consumed by
  a human.
- File header comment: `// STUB — Phase 1 rule-based placeholder. Real model = Phase 2,
  see PRD §7.7. Never issues a binding decision.`
- Tests cover threshold banding and explanation output.

---

## S1-08 — App shell (React Native)
**Points:** 5 · **Depends on:** S1-02

Navigable mobile shell against mock auth — no real onboarding.

**Acceptance criteria**
- App boots on iOS and Android simulators.
- Navigation: onboarding placeholder → mock login → dashboard placeholder.
- Auth runs against a **mock** auth service (no real BVN/liveness).
- Dashboard reads mock application data via the API.
- English + Hausa language toggle stubbed (copy files, one real + one placeholder).

---

## S1-09 — Admin dashboard skeleton (Next.js)
**Points:** 5 · **Depends on:** S1-04

Internal read-only skeleton with role-based route guards.

**Acceptance criteria**
- Next.js app boots; login against mock auth.
- Role-based route guards for roles: `CEO`, `CreditAnalyst`, `Operations`,
  `Compliance` (mock roles).
- Application-queue view lists mock applications with status.
- Read-only this sprint — **no approve/decline actions wired** (those are human-
  checkpoint actions for a later sprint).
- `// HUMAN-CHECKPOINT: approval actions require the human-approval token design` marker
  where the action buttons will later go.

---

## S1-10 — CI pipeline
**Points:** 3 · **Depends on:** S1-01

**Acceptance criteria**
- GitHub Actions: install, lint, typecheck, test on every PR.
- Pipeline fails on lint/type/test errors.
- A **secret-scan** step fails the build if anything resembling a real key/BVN is
  committed.
- Coverage reported; PR blocked if new code is under the threshold.

---

## Sprint total
**53 points across 10 tickets.** All non-blocked. At the end you have a running skeleton
ready for the regulated/Sharia work to be layered in **once the SSB is constituted and
OBR/NIFI registration is underway.**

## Definition of Done (every ticket)
See CLAUDE.md §8. In short: tests pass, ≥80% coverage on new code, **no real
credentials/PII**, no autonomous Sharia or money-moving logic, audit logging on
transitions, `.env.example` updated, and any `// HUMAN-CHECKPOINT:` reviewed by a person.
