# CLAUDE.md — Markaba Engineering Spec

> This file is read first by Claude Code. It defines what Markaba is, how we build it,
> and — most importantly — the hard boundaries that must never be crossed without a
> named human sign-off. Read the **Golden Rules** section before writing any code.

---

## 1. What we are building

**Markaba** (مركبة) is a Sharia-compliant vehicle-financing platform for Nigeria. It
originates and services **Ijarah** (lease-to-own) and **Murabaha** (cost-plus sale)
vehicle finance, fully digitally, for customers who bank anywhere — using the CBN Open
Banking framework for income verification and payment collection.

This repo is the **Phase 1 build**. Phase 1's goal is *proof, not scale*: a working
origination-to-servicing flow good enough to finance the first ~50 vehicles, prove the
credit model, and generate the cohort repayment data that unlocks a Series A credit
facility.

---

## 2. GOLDEN RULES — read before writing any code

Markaba is a **regulated lender handling identity data, bank credentials, and money**,
built on **religious compliance** as its core promise. These rules are non-negotiable.
When a task touches any of them, **stop and flag for human sign-off — do not proceed.**

### 2.1 Sharia-critical logic is gated on the SSB
- The **purchase-before-lease sequence lock** (no Ijarah contract may generate until a
  verified vehicle purchase receipt is recorded) is the core IP and the core Sharia
  rule. It must be built **with** the Sharia Supervisory Board, against **SSB-certified
  contract templates that do not yet exist**.
- **Do not** implement contract-generation logic, the compliance rules engine, or
  ownership-transfer (hiba) logic in this repo yet. Scaffold the *interfaces* and
  *state machine* only; leave the Sharia-critical bodies as `TODO: requires SSB
  certification` stubs that throw `NotImplementedError`.

### 2.2 Never handle real credentials or PII in this phase
- **No real BVNs, no real bank credentials, no live open-banking tokens, no production
  API keys** in code, tests, fixtures, or commits.
- Use **fake/sandbox data only**. Every external integration (Smile Identity, Mono/Okra,
  Paystack, Initrack) is built against its **sandbox** with **placeholder keys read from
  environment variables** — never hardcoded.
- If a task would require a real credential to proceed, **stop and flag it**.

### 2.3 No credit decisions or money movement in code without a human checkpoint
- Credit approval, disbursement of funds, and collections escalation are **human-
  accountable actions**. Code may *prepare* and *queue* them; it must never *execute* a
  binding approval or a real payment autonomously.
- Any function that would move money or issue a binding decision must require an explicit
  `humanApproval` token/parameter and log the accountable actor.

### 2.4 Regulatory interfaces are stubs until we are registered
- CBN **Open Banking Registry (OBR)** participation and **NIFI NBFC** registration gate
  what we may legally do with open-banking data and debit mandates.
- Build open-banking income-check and debit-mandate flows against a **local mock/sandbox
  adapter** behind a clean interface. Do **not** wire to any live CBN/bank endpoint.

### 2.5 When in doubt, stop and ask
- If a task is ambiguous about whether it crosses a Golden Rule, **do not guess**.
  Leave a `// HUMAN-CHECKPOINT:` comment describing the concern and stop.

---

## 3. What is IN SCOPE for Phase 1 right now

These do **not** depend on the SSB or regulatory approvals and are safe to build:

- Monorepo scaffold, tooling, CI, environment/secrets structure.
- **Customer + Application data models** and the application **state machine**
  (states only — no Sharia-critical transitions executed).
- **WhatsApp application scaffold**: webhook receiver, message router, a menu/flow
  skeleton (education Q&A, "start application", status check) — **no credit logic**.
- **App shell** (React Native): navigation, auth screens (against mock auth), a
  placeholder dashboard.
- **Admin dashboard skeleton** (Next.js): application queue view, role-based route
  guards, read-only mock data.
- **Integration adapter interfaces** (Smile Identity, Mono/Okra, Paystack, Initrack)
  with **mock implementations** only.
- Observability/logging scaffold and an audit-log utility (used everywhere later).

## 4. What is OUT OF SCOPE / BLOCKED (do not build yet)

- Sharia compliance rules engine bodies and contract generation → **needs SSB**.
- Live open-banking calls and real debit mandates → **needs OBR/NIFI registration**.
- Real KYC (real BVN/liveness), real payments, real GPS provisioning → **needs
  credentials + engineering ownership**.
- ML credit model and behavioural early-warning model → **Phase 2**; Phase 1 credit is a
  documented rule-based stub returning a mock score.

---

## 5. Tech stack (from the PRD — do not change without discussion)

| Layer | Choice |
|---|---|
| Mobile app | **React Native** (TypeScript) |
| Web portals (dealer, admin, B2B) | **Next.js** (TypeScript) |
| Backend API | **Node.js** (TypeScript) — NestJS preferred for structure |
| Datastore | **PostgreSQL** (via an ORM — Prisma preferred) |
| Messaging | **WhatsApp Business API** (primary Phase 1 UX) |
| USSD / SMS | **Africa's Talking** (adapter, mock in Phase 1) |
| KYC / identity | **Smile Identity** (adapter, sandbox only) |
| Open banking | **Mono / Okra** (adapter, mock only) |
| Payments | **Paystack** (adapter, sandbox only) |
| GPS telematics | **Initrack / Tracker NG** (adapter, mock only) |
| E-signature | **DocuSign / Zoho Sign** (adapter, stub only) |

Language & framework choices are set by the PRD. If you believe a change is warranted,
raise it as a `// PROPOSAL:` comment — do not switch silently.

---

## 6. Suggested repo structure

```
markaba/
├── CLAUDE.md                 ← this file
├── README.md
├── docs/
│   ├── SPRINT-01.md          ← first sprint tickets
│   ├── architecture.md
│   └── decisions/            ← ADRs (architecture decision records)
├── packages/
│   ├── shared/               ← shared TS types, the domain model, enums
│   │   └── src/domain/       ← Customer, Application, Vehicle, states
│   ├── api/                  ← Node/NestJS backend
│   │   ├── src/modules/
│   │   │   ├── customers/
│   │   │   ├── applications/ ← state machine lives here
│   │   │   ├── whatsapp/     ← webhook + router
│   │   │   ├── integrations/ ← adapter interfaces + MOCK impls
│   │   │   │   ├── kyc/           (Smile Identity — mock)
│   │   │   │   ├── openbanking/   (Mono/Okra — mock)
│   │   │   │   ├── payments/      (Paystack — mock)
│   │   │   │   └── telematics/    (Initrack — mock)
│   │   │   ├── credit/       ← rule-based STUB scorer (Phase 1)
│   │   │   ├── sharia/       ← interfaces + NotImplemented stubs ONLY
│   │   │   └── audit/        ← audit-log utility (use everywhere)
│   ├── mobile/               ← React Native app shell
│   └── admin/                ← Next.js admin dashboard skeleton
├── .env.example              ← every secret named here, NO real values
└── .github/workflows/        ← CI
```

Create this structure incrementally, per the sprint tickets — do not scaffold the
Sharia or live-integration internals.

---

## 7. Conventions

- **Language:** TypeScript everywhere. Strict mode on.
- **Types first:** the shared domain model (`packages/shared`) is the single source of
  truth. Define `Customer`, `Application`, `Vehicle`, and the application-state enum
  there before building against them.
- **Secrets:** never commit secrets. Everything goes through `.env`, and every key is
  documented in `.env.example` with a placeholder value.
- **Tests:** every non-trivial module ships with tests. Target ≥80% coverage on new
  code. Integration tests run against **mock** adapters only.
- **Audit logging:** any state transition or decision-adjacent action calls the audit
  utility with `{ actor, action, timestamp, entityId }`. This is a compliance
  foundation — build it early and use it consistently.
- **Commits:** conventional commits (`feat:`, `fix:`, `chore:`, `docs:`). Small,
  reviewable commits. Never commit a Golden-Rule violation.
- **Comments that stop you:** `// HUMAN-CHECKPOINT:` (needs sign-off before proceeding),
  `// TODO: requires SSB certification`, `// PROPOSAL:` (suggested change to the plan).

---

## 8. Definition of Done (per ticket)

- Acceptance criteria met.
- Tests written and passing; new code ≥80% covered.
- No real credentials, BVNs, or PII anywhere in code, tests, or fixtures.
- No Sharia-critical or money-moving logic executed autonomously.
- Audit logging added for any state transition.
- `.env.example` updated if a new secret is referenced.
- A human has reviewed anything carrying a `// HUMAN-CHECKPOINT:` flag.

---

## 9. First task

Start with **`docs/SPRINT-01.md`**, ticket **S1-01** (monorepo scaffold), and work down
in order. Do not skip ahead to blocked work. If a ticket seems to require a Golden-Rule
crossing, stop and flag it.
