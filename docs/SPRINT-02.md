# Sprint 02 — PRD alignment: domain model, SCQ, vehicle workflow, admin build-out

**Sprint goal:** Reconcile Sprint 01's scaffold with `PRD.md` / `PRD_and_User_Journeys.md`
— align the domain model to the PRD's canonical field names, add the
`ShariaComplianceQuery` (SCQ) entity and the Operations Lead's vehicle-purchase workflow,
and build out the admin dashboard so the three internal personas (Credit Analyst,
Operations Lead, Compliance/SSB-adjacent) can actually do their jobs, including a real
human-approval-gated Approve/Decline/Refer action.

**Out of scope this sprint (blocked — see CLAUDE.md §4):** contract generation, hiba/
ownership-transfer logic, live Open Banking/KYC/payments/GPS, ML credit model. The
prohibited-vehicle-use denylist check (S2-03) and the SCQ workflow (S2-02) are explicitly
**not** blocked — see PRD A.6 and A.3.

**Environment constraint:** no local Postgres is available in this dev environment (no
admin rights, no Docker). API-side Prisma-backed code is built and unit-tested against a
mocked `PrismaService`, but not run end-to-end. The admin dashboard keeps its own
self-contained in-memory mock store so the Approve/Decline flow can be demoed end-to-end
without a database — see plan Context for detail.

**Sequence:** work the tickets in order.

---

## S2-01 — Domain model rename to PRD canonical shape

**Depends on:** none

Rename across `packages/shared/src/domain/*`, `packages/api/prisma/schema.prisma`, and
every API module referencing the old names.

**Acceptance criteria**

- `Customer`: `displayName`, `phone`, `bvnRef` (tokenised), `languagePref`, `segment`.
- `Vehicle`: adds `mileage`, `inspectionGrade`, `marketValuation`, `gpsImei`.
- `Application`: `product`, `financedAmount`, `downPaymentPct`, `termMonths`,
  `mcsRecommendation` (JSON), `declaredVehicleUse`.
- `Guarantor`: `bvnRef`, `relationshipToCustomer`, `confirmedAt?`.
- No compatibility aliases left behind. `packages/shared` and `packages/api` test suites
  pass after the rename.

## S2-02 — `ShariaComplianceQuery` entity + manual workflow

**Depends on:** S2-01

**Acceptance criteria**

- `packages/shared/src/domain/sharia-compliance-query.ts`: type, status enum, pure
  `canTransitionScq(from, to)`.
- `packages/api/src/modules/scq/`: `ScqService.raise()` / `advanceStatus()`, audit-logged,
  no automated ruling logic. Prisma model added. Registered in `AppModule`.

## S2-03 — Vehicle-use screening

**Depends on:** S2-01, S2-02

**Acceptance criteria**

- `declaredVehicleUse` captured on every application.
- `packages/shared/src/domain/prohibited-use.ts`: denylist + `isProhibitedUse()`.
- A match raises an SCQ via `ScqService.raise()` instead of auto-declining.

## S2-04 — Vehicle module (Operations Lead workflow)

**Depends on:** S2-01

**Acceptance criteria**

- `packages/api/src/modules/vehicles/`: `create()`, `recordPurchase()`,
  `recordGpsFitment()` (using the existing mock `TelematicsProvider`), controller,
  registered in `AppModule`.

## S2-05 — Persist MCS result onto the application

**Depends on:** S2-01

**Acceptance criteria**

- `ApplicationsService.recordCreditScore()` persists the full `CreditScoreResult` onto
  `mcsRecommendation` and audit-logs `MCS_SCORED`.

## S2-06 — Admin: application detail page

**Depends on:** S2-01, S2-05

**Acceptance criteria**

- `dashboard/applications/[id]/page.tsx` renders full application/vehicle/guarantor
  detail, state-history timeline, MCS explanation, mock Open Banking summary, SCQ flags.
- No more dead link from the queue.

## S2-07 — Admin: real Approve/Decline/Refer action

**Depends on:** S2-06

**Acceptance criteria**

- In-memory mutable mock store + `applyMockTransition()` using the real
  `@markaba/shared` `applyTransition`.
- Server actions gated to `CreditAnalyst`/`CEO` sessions; human-approval token built from
  the server-verified session, documented as a Phase-1 mock (not cryptographic).
- Buttons only render for legal states (`UNDERWRITING`/`REFERRED`).
- Equivalent added to the real API (`transition` gains `humanApprovalToken`, throws
  `MissingHumanApprovalError` if absent for a binding decision; new `POST
/applications/:id/transition`), unit-tested only (no live DB).

## S2-08 — Admin: audit log page

**Depends on:** S2-02, S2-05, S2-07

**Acceptance criteria**

- `dashboard/audit/page.tsx` renders `MOCK_AUDIT_LOG` with search/filter, including the
  new SCQ/MCS/approval-action entries.

## S2-09 — Admin: role-specific views

**Depends on:** S2-04, S2-02

**Acceptance criteria**

- Operations view: `APPROVED` applications needing sourcing + purchase-receipt form.
- Compliance view: SCQ register with SLA-age tracking.
- Role-gated nav, following the existing `COMPLIANCE_VIEW_ROLES` pattern.

## S2-10 — NDPA PII deletion path (lightweight)

**Depends on:** none

**Acceptance criteria**

- ADR at `docs/decisions/0001-ndpa-deletion-policy.md`.
- `CustomersService.scheduleDeletion()` stub, audit-logged, throws `NotImplementedError`
  for the actual purge.

---

## Definition of Done (every ticket)

See `CLAUDE.md` §8. In short: tests pass, ≥80% coverage on new code, no real
credentials/PII, no autonomous Sharia-critical or unaccountable money-moving logic,
audit logging on every state/status transition, `.env.example` updated if needed.
