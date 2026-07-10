# Markaba — Product Requirements Document (PRD)

> **Companion to `CLAUDE.md`, `architecture.md`, and `SPRINT-01.md`.** Those files
> reference "the PRD" throughout — this is that document. It is the source of truth for
> **what** to build and **why**; `architecture.md` is the source of truth for **how** the
> system is shaped; `CLAUDE.md` is the source of truth for **hard boundaries**. Claude
> Code should read all three before starting work, in that order: PRD → architecture →
> CLAUDE.md.

**Version:** 1.0 · **Status:** Draft for engineering · **Date:** July 2026
**Owner:** Product (Markaba) · **Confidential**

---

## 1. Product summary

**Markaba** (مركبة — "vehicle") is a Sharia-compliant vehicle-financing platform for
Nigeria's ~100M Muslim population. It originates and services **Ijarah Muntahia
Bittamleek** (lease-to-own) and **Murabaha** (cost-plus sale) vehicle finance, fully
digitally, for customers regardless of which bank they hold an account with — using the
CBN Open Banking framework (live since August 2025) for income verification and payment
collection instead of requiring a pre-existing Islamic bank relationship.

**This document specifies Phase 1**: a working origination-to-servicing flow sufficient
to finance the first ~50 vehicles (pilot cities: Kano, Abuja), prove the credit model,
and generate the cohort repayment data needed to unlock a Series A credit facility.
Later phases (Murabaha at scale, native mobile app, dealer/B2B portal, Sukuk
infrastructure, ML credit models) are described for context but are **not** in scope for
this build unless a section says otherwise.

### 1.1 Why this exists (problem statement)
Nigeria's vehicle finance market is dominated by conventional interest-bearing (riba)
bank loans. Muslim Nigerians must either violate their religious principles or forgo
vehicle ownership. The two existing Islamic banks (Jaiz Bank, TAJBank) only finance
customers who already hold a salary/business account with them — excluding the majority
of Muslim Nigerians who bank conventionally (GTBank, Access, Zenith, UBA). Markaba
removes that constraint by using Open Banking for income verification, making it
bank-agnostic at the point of entry.

### 1.2 Target segments
| Tier | Description | Priority |
|---|---|---|
| **A — Islamic-bank customers** | Already bank with Jaiz/TAJBank. KYC pre-done, income visible, collection via existing direct debit. | Launch — lowest friction |
| **B — Conventionally banked Muslims** | Bank with GTBank/Access/Zenith/UBA etc. Open Banking pulls income data; Islamic account opened in-app as optional upsell; direct debit via Open Banking SFI mandate. | Launch — the growth engine, largest segment |
| **C — Informal income earners** | Bolt/InDrive drivers, market traders, POS operators. Alternative credit scoring (gig earnings, POS history, community guarantors). | **Phase 2** — needs its own credit model |

### 1.3 Success metrics for Phase 1
- 50 vehicles financed across Kano + Abuja within 6 months.
- Digital, branch-free onboarding in **< 10 minutes** median (KYC + Open Banking
  consent + application submit).
- Zero Sharia compliance breaches; 100% of transactions pass SSB quarterly audit sample.
- Cohort repayment data of sufficient quality (labelled outcomes) to brief a Series A
  credit facility conversation.
- API p95 latency **< 2 seconds** under expected pilot load.

---

## 2. Product structure

### 2.1 Product 1 — Ijarah Muntahia Bittamleek (primary)
Lease-to-own. Markaba (or its SPV) purchases the vehicle, becomes legal owner, and
leases it to the customer at a fixed monthly rental. Ownership transfers at term end via
hiba (gift) or nominal sale.

| Term | Specification |
|---|---|
| Asset ownership during term | Markaba / Markaba SPV |
| Monthly payment | Fixed rental, disclosed upfront, no variable charges |
| Term options | 12 / 18 / 24 / 36 / 48 months |
| Down payment | Min 20% (consumer), 15% (commercial fleet) |
| Vehicle types | New (dealer partners) or used (Cars45/Autochek inspected) |
| Ownership transfer | Hiba or nominal sale, documented separately from the Ijarah agreement |
| Early settlement | Rental rebate at Markaba's discretion — **never** a contractual right (guaranteed discount on future debt is a Sharia issue) |
| Default/repossession | Markaba is owner — GPS-enabled recovery |

**Sharia principle (non-negotiable, enforced programmatically):** Markaba must purchase
and take ownership of the vehicle **before** signing the Ijarah agreement. This
purchase-before-lease sequence is Markaba's core IP and its core Sharia rule.

The five-step Ijarah flow:
1. Customer applies via WhatsApp (Phase 1) or app.
2. Markaba/SPV purchases the vehicle — becomes legal owner before any agreement signed.
3. Ijarah agreement signed — rental, term, end-of-term purchase price all fixed and
   disclosed.
4. Customer takes possession — GPS tracker fitted as standard.
5. Ownership transferred at term end via hiba or nominal sale.

### 2.2 Product 2 — Murabaha (secondary, **Phase 2** for full build)
Cost-plus sale. Markaba purchases the vehicle and resells it to the customer at a
disclosed, fixed mark-up (never linked to time or an interest-rate benchmark), payable
in fixed instalments. Ownership transfers to the customer immediately. Higher default
risk than Ijarah (customer is legal owner from day one — recovery requires legal
process). Min down payment 25%.

### 2.3 Takaful bundle (mandatory ancillary)
Every financed vehicle carries motor Takaful (not conventional insurance), issued
automatically on activation via a NAICOM-licensed Takaful partner. Premium collected as
part of the monthly rental or a separate debit; Takaful partner pays Markaba a referral
commission.

### 2.4 Revenue model
- Ijarah rental margin — primary revenue, 15–20% annualised yield on financed amount.
- Murabaha mark-up — fixed, disclosed, on cost price.
- Processing fee — 1–1.5% of financed amount, one-time.
- Takaful referral commission.

---

## 3. Sharia governance (read before touching anything transaction-related)

The Sharia Supervisory Board (SSB) — minimum 3 independent scholars, at least 2
Mufti-level, at least 1 Islamic-finance specialist, at least 1 Nigeria-based — certifies
every product structure and contract template before first transaction, and audits a
random 10% sample of completed transactions quarterly. **No commercial consideration
overrides a Sharia compliance requirement.**

Four non-negotiable rules the platform must enforce, not just document:
1. **Purchase before lease** — no Ijarah contract may generate until a verified vehicle
   purchase receipt is recorded. Enforced programmatically; cannot be bypassed by any
   role, including admins.
2. **No riba clauses** — no contract may contain interest, late-payment interest, or any
   charge linked to time/money. Late fees, if any, must be structured as charitable
   donations, not Markaba income.
3. **Full disclosure** — total Murabaha mark-up or Ijarah rental must be fully disclosed
   before signing. No hidden charges.
4. **Prohibited-use screening** — vehicles may not be financed for a declared use that is
   itself haram. A vehicle-use field is mandatory on every application.

**Escalation path:** any flagged issue → Sharia Compliance Query (SCQ) → Head of
Compliance review within 24h → SSB Chair within 48h if needed → SSB ruling within 5
(initial) / 15 (full) business days. This escalation path, and the SCQ record itself,
must exist as a real data entity even while the compliance logic behind it is stubbed —
see §6 and `CLAUDE.md` §2.1.

**Engineering consequence:** per `CLAUDE.md`, contract-generation logic, the compliance
rules engine bodies, and hiba/ownership-transfer logic are **out of scope for this repo**
until SSB-certified templates exist. Phase 1 builds the *interfaces*, the *state machine
guarantee* (cannot reach `CONTRACT_SIGNED` before `PURCHASE_CONFIRMED`), and the *SCQ data
model* — not the rulings themselves.

---

## 4. Regulatory context

- **CBN NIFI framework** — Non-Interest Financial Institutions regulatory scaffolding;
  Markaba registers as an NBFC under this framework.
- **CBN Open Banking Registry (OBR)** — went live August 2025. Standardised RESTful APIs
  (OAuth 2.0, TLS) let Markaba verify income and originate direct-debit mandates for
  customers at *any* bank, without an existing Islamic-bank relationship. Markaba must be
  an OBR-registered participant to call these live; Phase 1 builds against a mock.
- **NDPA** (Nigeria Data Protection Act) — customer PII has a defined deletion path
  (delete within 30 days of Ijarah completion unless a lawful retention basis applies).
  Raw BVNs are never stored — only tokenised references.

---

## 5. User journeys (Phase 1 scope)

Primary channel is **WhatsApp**; a native app shell and admin web dashboard exist as
scaffolds only in Phase 1.

1. **Discovery** — customer finds Markaba via WhatsApp Business number (Phase 1) or
   landing page (Phase 2). Trust signals: SSB scholar names/qualifications, sample
   Sharia certificate, sample contract terms, Jaiz Bank partnership badge.
2. **Rental calculator** — customer inputs vehicle price, down payment, term; sees fixed
   monthly rental, total cost, annualised yield (NIFI-disclosed), and the Ijarah
   structure label.
3. **Application** — customer starts an application via WhatsApp; BVN captured
   (tokenised), liveness check, Open Banking consent for income verification.
4. **Underwriting** — income visible via bank statements (Open Banking) or existing
   direct-debit history (Tier A). Phase 1 credit decision is a rule-based
   recommendation only — see §7.6.
5. **Vehicle sourcing** — customer selects a vehicle (new from dealer partner, or used
   via Cars45/Autochek inspection).
6. **Purchase → contract → possession** — the five-step Ijarah flow in §2.1. GPS tracker
   fitted at possession.
7. **Servicing** — fixed monthly rental collected via direct debit/mandate; GPS-based
   asset monitoring; collections workflow on missed payments.
8. **Term end** — ownership transfer via hiba/nominal sale (Sharia-gated, stubbed in
   Phase 1).

Referral incentive: ₦5,000 rental credit on activation (do not build payout logic in
Phase 1 beyond a data field — no money movement, per Golden Rule 2.3).

---

## 6. Core data model (Phase 1)

This is the canonical shape; the actual source of truth lives in
`packages/shared/src/domain` per `architecture.md` §3. Restated here with product
rationale:

```
Customer
  id, bvnRef (tokenised — never raw BVN), displayName, phone,
  languagePref ('en' | 'ha'), segment ('A_faith' | 'B_conventional' | 'C_informal'),
  createdAt

Vehicle
  id, make, model, year, mileage, inspectionGrade, marketValuation,
  purchaseReceiptRef (null until PURCHASE_CONFIRMED), gpsImei (null until fitted)

Application
  id, customerId, vehicleId, product ('IJARAH' | 'MURABAHA'),
  financedAmount, downPaymentPct, termMonths,
  state (see §7), mcsRecommendation (from Phase 1 stub scorer),
  guarantorId?, declaredVehicleUse, createdAt, updatedAt

Guarantor
  id, bvnRef (tokenised), relationshipToCustomer, confirmedAt?

ShariaComplianceQuery (SCQ)         ← new in this PRD, not yet in architecture.md
  id, raisedBy (actor), relatedEntityType, relatedEntityId, description,
  status ('OPEN' | 'HEAD_OF_COMPLIANCE_REVIEWED' | 'SSB_REVIEWING' | 'RULED'),
  raisedAt, headOfComplianceReviewedAt?, ssbRuledAt?, rulingSummary?

AuditRecord (append-only)
  id, actor, action, entityType, entityId, metadata, timestamp
```

**Add `ShariaComplianceQuery` to `packages/shared/src/domain`** — it does not currently
appear in `architecture.md` but is required by Product Backlog EP-005 (US-023–US-026)
and by the Sharia Compliance Policy's escalation protocol (§3 above). It should be
scaffolded as a real, persisted entity in Phase 1 even though nothing yet writes an
automated ruling into it — Head of Compliance / SSB actions on it are manual, logged
via the audit utility.

**Vehicle-use screening field:** `Application.declaredVehicleUse` must be captured on
every application and checked against an SSB-maintained prohibited-use list. In Phase 1,
implement the **field, storage, and admin-configurable list** — the matching logic itself
can be a simple deterministic string/enum match (this is not Sharia-interpretive judgment,
it's a documented denylist lookup, so it is **not** blocked by CLAUDE.md §2.1). Route any
match to an SCQ, not an auto-decline with no human trace.

---

## 7. Application state machine

States only in Phase 1 — no Sharia-critical transition bodies executed. This is the spine
of the origination module.

```
SUBMITTED
   → KYC_PENDING
   → OPEN_BANKING_CONSENT
   → UNDERWRITING
   → APPROVED | REFERRED | DECLINED
APPROVED
   → VEHICLE_SOURCING
   → PURCHASE_CONFIRMED        ← requires verified purchase receipt (mock in Phase 1)
   → CONTRACT_SIGNED           ← ⛔ SSB-GATED: NotImplementedError in Phase 1
   → ACTIVE
   → COMPLETED | DEFAULTED
```

- `canTransition(from, to)` is a pure function with an explicit legal-transition table;
  illegal transitions throw.
- `PURCHASE_CONFIRMED → CONTRACT_SIGNED` is the purchase-before-lease Sharia lock. In
  Phase 1 its body throws `NotImplementedError` with a
  `// TODO: requires SSB certification` comment. The *ordering guarantee* is enforced by
  the transition table now; contract generation is deferred.
- Every transition writes an `AuditRecord`.

### 7.1 Credit scoring (Phase 1 stub)
The **Markaba Credit Score (MCS)**, 0–1000, is a rule-based placeholder in Phase 1 — not
the real model. Thresholds: ≥750 auto-recommend approve, 600–749 recommend
approve-with-conditions, 500–599 recommend refer to analyst, ≤499 recommend decline. It
**only recommends** — a human makes the binding decision (Golden Rule 2.3). Output
includes a factor → contribution explanation object even in the stub, because
explainability is a day-one design constraint (see §9), not something retrofitted in
Phase 2.

---

## 8. Integration adapters (all mocked in Phase 1)

Every external dependency sits behind a clean interface so a live implementation can be
dropped in later without a core-platform rewrite. Build vs. buy rationale:

| Capability | Decision | Provider | Phase 1 status |
|---|---|---|---|
| KYC / identity (BVN + NIN + liveness) | Buy — proven at scale in Nigeria | Smile Identity | Sandbox adapter, mock data |
| Open Banking (income, mandates) | Buy (interim), build to CBN OBR spec long-term | Mono / Okra | Mock adapter |
| Payments / direct debit | Buy — do not build payment rails | Paystack (+ NIBSS fallback) | Sandbox adapter, mock data |
| GPS telematics | Buy/partner — existing hardware + SIM logistics | Initrack / Tracker NG | Mock adapter |
| E-signature | Buy | DocuSign / Zoho Sign | Stub only |
| Vehicle inspection data | Buy — external marketplace data | Cars45 / Autochek | Not integrated in Phase 1 (used by Phase 2 AI document-intelligence stories) |

Provider selection is env-driven (`PROVIDER_MODE=mock`); live mode is **not implemented**
and must throw a clear error with a `// HUMAN-CHECKPOINT:` comment on the branch. See
`architecture.md` §5 for the interface shape.

---

## 9. AI & Intelligence strategy

**Governing principle:** for a Sharia-compliant, CBN-regulated lender, an AI decision
that cannot be explained is a liability, not an asset. No AI system issues a binding
credit approval, a Sharia ruling, or a collections escalation without a defined point of
human accountability. Models rank, flag, predict, and explain — humans decide.

| Capability | Phase | Priority | Notes for engineering |
|---|---|---|---|
| **Conversational AI agent** (WhatsApp, Hausa + English) | **Phase 1** | High | Educates on product ("how is this different from a loan?"), guides the application conversationally, explains signed-contract terms in plain language. Retrieval grounded in an **approved, static knowledge base** only — the agent must never invent a Sharia position or quote its own ruling. Hard boundary: never issues credit or pricing decisions; escalates unknowns to a human. All conversations logged; a sample reviewed for accuracy/tone. In Phase 1's WhatsApp scaffold (S1-06), the FAQ layer is explicitly **static SSB-approved content**, not a free-generation LLM — the conversational-agent epic (EP-015) is a later layering on top of that scaffold, not part of Sprint 1. |
| **Explainable credit scoring (XAI)** | Phase 1 stub → Phase 2 ML | Critical | Every score must decompose into a ranked list of contributing factors (SHAP-style) from day one — this is a compliance requirement (SSB auditability, CBN fair-lending, customer decline feedback), not optional sophistication. Prohibited inputs: ethnicity, religion, tribe, gender, political affiliation — never ingested, quarterly disparity-tested once real data exists. |
| **Behavioural early-warning model** | Phase 2 | High | Predicts elevated default risk weeks ahead from Open Banking signals; drives risk-ranked collections outreach. Never an automated adverse action. Out of scope for this repo. |
| **Document & vision intelligence** | Phase 2 | Medium | Extracts vehicle condition/valuation from Cars45/Autochek inspection data and reads title/registration documents. A human confirms before any vehicle purchase — this must never be allowed to auto-authorize a purchase, which would itself be a Sharia-critical action. Out of scope for this repo. |
| **Alternative-data scoring (Tier C)** | Phase 2 | High | Gig-earnings/POS-based scoring for informal earners. Requires Phase 1 labelled repayment data first. Out of scope for this repo. |
| **AI-assisted Sharia compliance review** | Phase 2 | Medium | LLM surfaces ambiguous contract language / transaction anomalies for SSB attention. **Assists, never rules** — every flag routes to a human SSB scholar via the SCQ mechanism in §6. Out of scope for this repo. |

---

## 10. Non-functional requirements

- **Performance:** API p95 < 2 seconds under expected pilot load.
- **Testing:** ≥80% unit-test coverage on new code; integration tests run against mock
  adapters only; illegal state transitions covered explicitly.
- **Accessibility:** screen-reader compatible for any app UI.
- **Localisation:** English + Hausa for all customer-facing copy; Phase 1 ships one real
  language and one stubbed placeholder per `SPRINT-01.md` S1-08 — do not block on full
  Hausa translation to progress the shell.
- **Security:** no real credentials/PII anywhere in code, tests, fixtures, or commits;
  secrets only via `.env` (git-ignored), documented with placeholders in `.env.example`;
  CI secret-scan blocks anything resembling a real key or BVN.
- **Audit:** every state transition and every decision-adjacent action calls the audit
  utility with `{ actor, action, timestamp, entityId }`. Append-only, immutable. This is
  the SSB and CBN evidence trail.
- **Human accountability:** any function that would move money or issue a binding
  decision requires an explicit `humanApproval` token/parameter and logs the accountable
  actor. Code prepares and queues binding actions; it never executes them autonomously.

---

## 11. Definition of Done (per story, product-level — engineering DoD is in `CLAUDE.md` §8)

- All acceptance criteria pass in the QA/staging environment.
- Unit coverage ≥80% for new code; integration tests pass against mock adapters.
- Any transaction-creating story passes the Sharia-compliance-module check (i.e. does not
  bypass the state-machine guard in §7).
- NDPA data-handling requirements met for anything touching PII.
- English and Hausa copy reviewed for customer-facing stories (or explicitly flagged as
  placeholder per §10).
- API responses < 2s at p95 under expected load.
- Sharia-critical stories (Product Backlog EP-005) additionally require **SSB Chair
  written approval before production deployment** — and, per `CLAUDE.md`, must not be
  implemented at all in this repo until that certification exists. Treat "SSB Chair
  approval required" as a hard blocker flag, not a checklist item to satisfy internally.

---

## 12. Phase roadmap (context — Phase 1 only is in scope for this repo)

| Phase | Timeframe | Scope |
|---|---|---|
| **Phase 1** | Months 0–6 | Ijarah only. 50 vehicles, Kano + Abuja. WhatsApp primary channel. Manual-acceptable operations. This PRD's engineering scope. |
| **Phase 2** | Months 7–18 | Murabaha module, native mobile app, dealer/B2B portal, ML credit model (XAI), behavioural early-warning model, document/vision intelligence, Tier C alternative-data scoring, Lagos expansion. |
| **Phase 3** | Months 19–36 | B2B API / white-label engine, Sukuk infrastructure, West Africa expansion. |

Full epic/story breakdown for all phases lives in `Markaba_Product_Backlog.docx`
(EP-001–EP-014, 72 stories) and `Markaba_Backlog_AI_Addendum.docx`
(EP-015–EP-020, 13 stories). `SPRINT-01.md` derives the first actionable sprint from the
Phase 1 subset of that backlog, filtered through the Golden Rules in `CLAUDE.md` §2.

---

## 13. Explicit non-goals for this repository right now

Restated from `CLAUDE.md` §4 for completeness — do not build these until the named
gate clears:

- Sharia compliance rules-engine **bodies** and contract generation — needs SSB
  certification of templates.
- Live Open Banking calls and real debit mandates — needs OBR/NIFI registration.
- Real KYC (real BVN/liveness), real payments, real GPS provisioning — needs live
  credentials and a named engineering owner.
- ML credit model and behavioural early-warning model — Phase 2, needs Phase 1 portfolio
  data to train on responsibly.
- Conversational AI agent's free-generation layer, document/vision intelligence,
  alternative-data scoring, AI-assisted compliance review — all Phase 2 per §9.

---

## 14. Source documents

This PRD synthesizes: `Markaba_Business_Overview.docx`, `Markaba_Product_Document.docx`,
`Markaba_AI_Strategy_Section.docx`, `Markaba_Product_Backlog.docx`,
`Markaba_Backlog_AI_Addendum.docx`, `Markaba_Sharia_Compliance_Policy.docx`,
`Markaba_Team_Section.docx`, `Markaba_Partnership_Proposal.docx`,
`Markaba_User_Flow_Journey.html`, `Markaba_Financial_Model_v2.xlsx`, and the existing
engineering docs `CLAUDE.md`, `architecture.md`, `SPRINT-01.md`. Where a source document
conflicts with `CLAUDE.md`'s Golden Rules, the Golden Rules win.
