# ADR 0001 — NDPA PII deletion path (Phase 1)

**Status:** Accepted (Phase 1 scope only) · **Date:** 2026-07-07

## Context

The Nigeria Data Protection Act (NDPA) requires a defined deletion path for customer
PII. PRD A.4 sets the policy: delete within 30 days of Ijarah completion, unless a
lawful retention basis applies (e.g. an open regulatory audit, an active SCQ, or an
unresolved dispute).

## Decision

Phase 1 ships the **policy and an accountable stub**, not an automated purge pipeline:

- `CustomersService.scheduleDeletion(customerId, actor)` audit-logs a
  `DELETION_SCHEDULED` event (capturing who requested it) and then throws
  `NotImplementedError` — the same pattern already used for Sharia-critical stubs
  (`packages/api/src/modules/sharia/sharia.service.ts`). This is a deliberate
  placeholder, not a bug: a real purge touches every table referencing the customer
  (`Application`, `Guarantor`, `AuditLog` redaction rules, integration-provider
  records) and needs its own design once there's real data to reason about.
- No cron job, no automated 30-day timer exists yet. Building one against mock/empty
  data would be untested by construction and would give false confidence.

## Consequence

Anyone calling `scheduleDeletion` today gets an auditable record that deletion was
requested and by whom, plus an explicit, loud failure rather than a silent no-op —
consistent with CLAUDE.md §2.5 ("when in doubt, stop and ask"). Building the real purge
pipeline is a follow-up ticket once Phase 1 has actual customer data and a named
engineering owner for it.
