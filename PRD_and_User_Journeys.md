# Markaba — PRD & User Journeys

> **Companion to `CLAUDE.md`, `architecture.md`, and `SPRINT-01.md`.** Read in this
> order: PRD & Journeys (this file, the **what** and **who**) → `architecture.md` (the
> **how**) → `CLAUDE.md` (the **hard boundaries**). This file merges the product
> requirements with the user journeys that motivate them, so Claude Code has one place
> to check "why does this entity/state/rule exist" while implementing.

**Version:** 1.0 · **Status:** Draft for engineering · **Date:** July 2026

---

# PART A — PRODUCT REQUIREMENTS

## A.1 Product summary

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

### A.1.1 Why this exists (problem statement)
Nigeria's vehicle finance market is dominated by conventional interest-bearing (riba)
bank loans. Muslim Nigerians must either violate their religious principles or forgo
vehicle ownership. The two existing Islamic banks (Jaiz Bank, TAJBank) only finance
customers who already hold a salary/business account with them — excluding the majority
of Muslim Nigerians who bank conventionally (GTBank, Access, Zenith, UBA). Markaba
removes that constraint by using Open Banking for income verification, making it
bank-agnostic at the point of entry.

### A.1.2 Target segments
| Tier | Description | Priority |
|---|---|---|
| **A — Islamic-bank customers** | Already bank with Jaiz/TAJBank. KYC pre-done, income visible, collection via existing direct debit. | Launch — lowest friction |
| **B — Conventionally banked Muslims** | Bank with GTBank/Access/Zenith/UBA etc. Open Banking pulls income data; Islamic account opened in-app as optional upsell; direct debit via Open Banking SFI mandate. | Launch — the growth engine, largest segment |
| **C — Informal income earners** | Bolt/InDrive drivers, market traders, POS operators. Alternative credit scoring (gig earnings, POS history, community guarantors). | **Phase 2** — needs its own credit model |

These tiers cross with two motivational segments — the faith-motivated buyer and the
commercial operator — used interchangeably in Part B's personas.

### A.1.3 Success metrics for Phase 1
- 50 vehicles financed across Kano + Abuja within 6 months.
- Digital, branch-free onboarding in **< 10 minutes** median (KYC + Open Banking
  consent + application submit).
- Zero Sharia compliance breaches; 100% of transactions pass SSB quarterly audit sample.
- Cohort repayment data of sufficient quality (labelled outcomes) to brief a Series A
  credit facility conversation.
- API p95 latency **< 2 seconds** under expected pilot load.

## A.2 Product structure

### A.2.1 Product 1 — Ijarah Muntahia Bittamleek (primary)
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
| Early settlement | Rental rebate at Markaba's discretion — **never** a contractual right |
| Default/repossession | Markaba is owner — GPS-enabled recovery |

**Sharia principle (non-negotiable, enforced programmatically):** Markaba must purchase
and take ownership of the vehicle **before** signing the Ijarah agreement.

Five-step Ijarah flow: (1) customer applies → (2) Markaba/SPV purchases the vehicle →
(3) Ijarah agreement signed → (4) customer takes possession, GPS tracker fitted → (5)
ownership transferred at term end.

### A.2.2 Product 2 — Murabaha (secondary, **Phase 2** for full build)
Cost-plus sale. Markaba purchases the vehicle and resells it to the customer at a
disclosed, fixed mark-up (never linked to time or an interest-rate benchmark), payable
in fixed instalments. Ownership transfers to the customer immediately. Higher default
risk than Ijarah. Min down payment 25%.

### A.2.3 Takaful bundle (mandatory ancillary)
Every financed vehicle carries motor Takaful (not conventional insurance), issued
automatically on activation via a NAICOM-licensed Takaful partner.

### A.2.4 Revenue model
Ijarah rental margin (15–20% annualised) · Murabaha mark-up · 1–1.5% processing fee ·
Takaful referral commission.

## A.3 Sharia governance (read before touching anything transaction-related)

The SSB (min. 3 independent scholars, ≥2 Mufti-level, ≥1 Islamic-finance specialist, ≥1
Nigeria-based) certifies every product structure and contract template before first
transaction, and audits a random 10% sample quarterly. **No commercial consideration
overrides a Sharia compliance requirement.**

Four non-negotiable rules the platform must enforce, not just document:
1. **Purchase before lease** — no Ijarah contract may generate until a verified vehicle
   purchase receipt is recorded. Enforced programmatically; cannot be bypassed by any
   role, including admins.
2. **No riba clauses** — no contract may contain interest, late-payment interest, or any
   charge linked to time/money. Late fees, if any, must be structured as charitable
   donations, not Markaba income.
3. **Full disclosure** — total mark-up/rental must be fully disclosed before signing.
4. **Prohibited-use screening** — vehicles may not be financed for a declared
   impermissible use. A vehicle-use field is mandatory on every application.

**Escalation path:** flagged issue → Sharia Compliance Query (SCQ) → Head of Compliance
review within 24h → SSB Chair within 48h if needed → SSB ruling within 5 (initial) / 15
(full) business days. The SCQ record must exist as a real data entity even while the
compliance logic behind it is stubbed — see A.6 and `CLAUDE.md` §2.1.

**Engineering consequence:** contract-generation logic, the compliance rules engine
bodies, and hiba/ownership-transfer logic are **out of scope for this repo** until
SSB-certified templates exist. Phase 1 builds the *interfaces*, the *state machine
guarantee* (cannot reach `CONTRACT_SIGNED` before `PURCHASE_CONFIRMED`), and the *SCQ
data model* — not the rulings themselves.

## A.4 Regulatory context
- **CBN NIFI framework** — NBFC registration basis.
- **CBN Open Banking Registry (OBR)** — live since August 2025; standardised RESTful
  APIs (OAuth 2.0, TLS) for income verification and direct-debit mandates at any bank.
  Phase 1 builds against a mock; live mode requires OBR registration.
- **NDPA** — defined PII deletion path (30 days post-Ijarah-completion unless a lawful
  retention basis applies); raw BVNs never stored, only tokenised references.

## A.5 User journeys — see Part B
Part B walks each persona through the full journey. Section A.5 here is intentionally
short: read Part B before implementing any origination, underwriting, or servicing
story, since the acceptance criteria in the backlog assume the journey context below.

## A.6 Core data model (Phase 1)

Canonical shape lives in `packages/shared/src/domain` per `architecture.md` §3.

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
  state (see A.7), mcsRecommendation (from Phase 1 stub scorer),
  guarantorId?, declaredVehicleUse, createdAt, updatedAt

Guarantor
  id, bvnRef (tokenised), relationshipToCustomer, confirmedAt?

ShariaComplianceQuery (SCQ)         ← required by EP-005 (US-023–US-026); add to
                                       packages/shared/src/domain alongside the above
  id, raisedBy (actor), relatedEntityType, relatedEntityId, description,
  status ('OPEN' | 'HEAD_OF_COMPLIANCE_REVIEWED' | 'SSB_REVIEWING' | 'RULED'),
  raisedAt, headOfComplianceReviewedAt?, ssbRuledAt?, rulingSummary?

AuditRecord (append-only)
  id, actor, action, entityType, entityId, metadata, timestamp
```

**Vehicle-use screening field:** `Application.declaredVehicleUse` is captured on every
application and checked against an SSB-maintained prohibited-use list. In Phase 1,
implement the **field, storage, and admin-configurable list** — the matching logic
itself is a deterministic denylist lookup, not Sharia-interpretive judgment, so it is
**not** blocked by `CLAUDE.md` §2.1. Route any match to an SCQ, not an auto-decline with
no human trace.

## A.7 Application state machine

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
- `PURCHASE_CONFIRMED → CONTRACT_SIGNED` is the purchase-before-lease Sharia lock. Body
  throws `NotImplementedError` with `// TODO: requires SSB certification`. The
  *ordering guarantee* is enforced by the transition table now; contract generation is
  deferred.
- Every transition writes an `AuditRecord`.

### A.7.1 Credit scoring (Phase 1 stub)
Markaba Credit Score (MCS), 0–1000, rule-based placeholder — not the real model.
Thresholds: ≥750 recommend approve, 600–749 recommend approve-with-conditions, 500–599
recommend refer to analyst, ≤499 recommend decline. It **only recommends** — a human
makes the binding decision. Output includes a factor → contribution explanation object
even in the stub; explainability is a day-one design constraint (see A.9), not
retrofitted later.

## A.8 Integration adapters (all mocked in Phase 1)

| Capability | Decision | Provider | Phase 1 status |
|---|---|---|---|
| KYC / identity (BVN + NIN + liveness) | Buy | Smile Identity | Sandbox adapter, mock data |
| Open Banking (income, mandates) | Buy (interim) | Mono / Okra | Mock adapter |
| Payments / direct debit | Buy | Paystack (+ NIBSS fallback) | Sandbox adapter, mock data |
| GPS telematics | Buy/partner | Initrack / Tracker NG | Mock adapter |
| E-signature | Buy | DocuSign / Zoho Sign | Stub only |
| Vehicle inspection data | Buy | Cars45 / Autochek | Not integrated Phase 1 |

Provider selection is env-driven (`PROVIDER_MODE=mock`); live mode is **not
implemented** and must throw a clear error with a `// HUMAN-CHECKPOINT:` comment on the
branch. See `architecture.md` §5 for the interface shape.

## A.9 AI & Intelligence strategy

**Governing principle:** an AI decision that cannot be explained is a liability. No AI
system issues a binding credit approval, a Sharia ruling, or a collections escalation
without a defined point of human accountability. Models rank, flag, predict, and
explain — humans decide.

| Capability | Phase | Priority | Notes |
|---|---|---|---|
| Conversational AI agent (WhatsApp, Hausa + English) | **Phase 1 scaffold** (static FAQ) → Phase 2 (free-generation agent, EP-015) | High | Retrieval grounded in approved static content only; never invents a Sharia position; escalates unknowns to a human; never issues credit/pricing decisions. |
| Explainable credit scoring (XAI) | Phase 1 stub → Phase 2 ML | Critical | Every score decomposes into ranked contributing factors from day one. Prohibited inputs: ethnicity, religion, tribe, gender, political affiliation. |
| Behavioural early-warning model | Phase 2 | High | Out of scope for this repo. |
| Document & vision intelligence | Phase 2 | Medium | A human confirms before any vehicle purchase — must never auto-authorize. Out of scope for this repo. |
| Alternative-data scoring (Tier C) | Phase 2 | High | Requires Phase 1 labelled repayment data first. Out of scope for this repo. |
| AI-assisted Sharia compliance review | Phase 2 | Medium | Assists, never rules — routes through the SCQ mechanism. Out of scope for this repo. |

## A.10 Non-functional requirements
- **Performance:** API p95 < 2 seconds under expected pilot load.
- **Testing:** ≥80% unit-test coverage on new code; integration tests against mock
  adapters only; illegal state transitions covered explicitly.
- **Accessibility:** screen-reader compatible for any app UI.
- **Localisation:** English + Hausa; Phase 1 ships one real language and one stubbed
  placeholder per `SPRINT-01.md` S1-08.
- **Security:** no real credentials/PII anywhere in code, tests, fixtures, commits;
  secrets only via `.env` (git-ignored); CI secret-scan blocks real keys/BVNs.
- **Audit:** every state transition and decision-adjacent action calls the audit utility
  with `{ actor, action, timestamp, entityId }`. Append-only, immutable.
- **Human accountability:** any function that would move money or issue a binding
  decision requires an explicit `humanApproval` token/parameter and logs the accountable
  actor. Code prepares and queues binding actions; it never executes them autonomously.

## A.11 Definition of Done (product-level; engineering DoD is `CLAUDE.md` §8)
- All acceptance criteria pass in QA/staging.
- Unit coverage ≥80% for new code; integration tests pass against mock adapters.
- Any transaction-creating story passes the Sharia-compliance state-machine guard.
- NDPA data-handling requirements met for anything touching PII.
- English and Hausa copy reviewed for customer-facing stories (or flagged placeholder).
- API responses < 2s at p95 under expected load.
- Sharia-critical stories (EP-005) additionally require **SSB Chair written approval
  before production deployment** — and per `CLAUDE.md`, must not be implemented at all
  in this repo until that certification exists.

## A.12 Phase roadmap (context — Phase 1 only is in scope for this repo)

| Phase | Timeframe | Scope |
|---|---|---|
| **Phase 1** | Months 0–6 | Ijarah only. 50 vehicles, Kano + Abuja. WhatsApp primary channel. Manual-acceptable operations. This document's engineering scope. |
| **Phase 2** | Months 7–18 | Murabaha module, native mobile app, dealer/B2B portal, ML credit model (XAI), behavioural early-warning model, document/vision intelligence, Tier C alternative-data scoring, Lagos expansion. |
| **Phase 3** | Months 19–36 | B2B API / white-label engine, Sukuk infrastructure, West Africa expansion. |

Full epic/story breakdown: `Markaba_Product_Backlog.docx` (EP-001–EP-014, 72 stories),
`Markaba_Backlog_AI_Addendum.docx` (EP-015–EP-020, 13 stories). `SPRINT-01.md` derives
the first actionable sprint from the Phase 1 subset, filtered through `CLAUDE.md` §2.

## A.13 Explicit non-goals for this repository right now
- Sharia compliance rules-engine **bodies** and contract generation — needs SSB
  certification of templates.
- Live Open Banking calls and real debit mandates — needs OBR/NIFI registration.
- Real KYC, real payments, real GPS provisioning — needs live credentials and a named
  engineering owner.
- ML credit model and behavioural early-warning model — Phase 2, needs Phase 1
  portfolio data to train on responsibly.
- Conversational AI agent's free-generation layer, document/vision intelligence,
  alternative-data scoring, AI-assisted compliance review — all Phase 2.

---

# PART B — PERSONAS & USER JOURNEYS

## B.0 Why these personas

Markaba's segmentation crosses two motivational segments (faith-motivated buyer,
commercial operator) with three banking-access tiers (A/B/C — see A.1.2). This part
turns that matrix into six personas — three customer-facing, three internal — and walks
each through its full journey. The three internal personas (Credit Analyst, Operations
Lead, SSB Scholar) matter as much as the customer ones: Phase 1 is deliberately
human-in-the-loop, so their workflows are what the admin dashboard and backlog stories
(EP-004, EP-005, EP-009, EP-010) are actually specifying.

| # | Persona | Type | Segment / Tier | Phase |
|---|---|---|---|---|
| 1 | Amina Bello | Customer | Faith-Motivated Buyer × Tier B (conventionally banked) | Phase 1 — primary launch persona |
| 2 | Malam Sani Ibrahim | Customer | Faith-Motivated Buyer × Tier A (existing Islamic bank customer) | Phase 1 — lowest-friction persona |
| 3 | Chidi Okonkwo | Customer | Commercial Operator × Tier C (informal / gig income) | Phase 2 — alternative credit scoring required |
| 4 | Fatima Abdullahi | Internal | Credit Analyst | Phase 1 |
| 5 | Yusuf Garba | Internal | Operations Lead | Phase 1 |
| 6 | Sheikh Muhammad Al-Amin | Internal / Board | SSB Scholar | Phase 1 |

---

## B.1 Persona 1 — Amina Bello, The Faith-Motivated Buyer (Tier B)

**Profile:** 34, marketing manager, Abuja. ₦380,000/month salaried, GTBank (no prior
Islamic-bank relationship). Moderate tech comfort (daily WhatsApp/Instagram user, never
used a lending app). Decision driver: religious compliance first, non-negotiable —
price/speed matter only once compliance is trusted. Goal: finance a Toyota Corolla
without touching an interest-bearing product, without a branch visit, and without it
feeling like "halal" is a label on a normal loan. Biggest fear: Markaba is
"halal-washing" and she finds out too late.

| Stage | What happens | Channel / system | Design implication |
|---|---|---|---|
| 1. Awareness | Referred via mosque WhatsApp group by an existing customer. | WhatsApp (peer referral) | Referral trust > any ad. See PRD §8.1 referral incentive. |
| 2. Trust verification | Reads SSB scholar names/qualifications, sample Sharia certificate, sample Ijarah terms before sharing anything personal. | WhatsApp Business | No independent verification path exists today — opportunity to link scholar credentials. |
| 3. Rental calculator | Enters price/down payment/term; sees fixed monthly rental, total cost, Ijarah structure label. | WhatsApp calculator flow | No hidden variable-rate fine print — matches Sharia rule 3 (full disclosure). |
| 4. Application start | BVN (tokenised), liveness check, mandatory `declaredVehicleUse` field. | WhatsApp → Smile Identity adapter (mock in Phase 1) | Maps to `SUBMITTED → KYC_PENDING` in A.7. |
| 5. Open Banking consent | Authorises 6–12 months GTBank transaction pull via OAuth. | Open Banking adapter (mock) | Maps to `KYC_PENDING → OPEN_BANKING_CONSENT`. Highest-hesitation step — copy should state this replaces the old salary-account requirement. |
| 6. Underwriting wait | Rule-based MCS stub produces a recommendation; status updates sent, not silence. | MCS stub (A.7.1) → Credit Analyst (Persona 4) | Target: < 48h to decision (A.1.3). |
| 7. Approval & vehicle selection | Approved with conditions; browses inspected used vehicles. | WhatsApp catalogue, Cars45/Autochek data (not integrated Phase 1 — manual) | `APPROVED → VEHICLE_SOURCING`. |
| 8. Purchase → contract signing | Markaba purchases and becomes legal owner first; only then is the Ijarah agreement generated for e-signature. | Ops purchase workflow → e-signature (stub) | `VEHICLE_SOURCING → PURCHASE_CONFIRMED → CONTRACT_SIGNED` — the SSB-gated transition, `NotImplementedError` in Phase 1. This is the platform's core trust moment; must not go live before certified templates exist. |
| 9. Possession & GPS fitting | GPS tracker fitted as standard, disclosed as an ownership-protection condition, not surveillance. | Field ops / Initrack adapter (mock) | `gpsImei` populated on the Vehicle record. |
| 10. Servicing | Fixed monthly rental via direct debit mandate; Takaful certificate issued alongside contract. | Open Banking SFI mandate → Paystack/NIBSS (mock) | `CONTRACT_SIGNED → ACTIVE`. |
| 11. Term end | Ownership transfers via hiba or nominal sale, documented separately from the Ijarah agreement. | Contract engine (SSB-gated) | `ACTIVE → COMPLETED`. Strongest word-of-mouth trigger — loops back to Stage 1 for the next Amina. |

---

## B.2 Persona 2 — Malam Sani Ibrahim, The Islamic-Bank Customer (Tier A)

**Profile:** 52, textile trader, Kano. ~₦450,000/month variable business income,
long-standing Jaiz Bank customer (already KYC'd, income visible on file). Low-to-moderate
tech comfort — WhatsApp mostly via his son, prefers a phone call to a form. Decision
driver: trust in the existing Jaiz Bank relationship; wants minimal new paperwork. Goal:
replace an ageing delivery van without repeating KYC his bank already holds. Biggest
fear: being asked to re-prove things Jaiz Bank already has on file.

Sani's journey is materially shorter than Amina's front end — Tier A is Markaba's
lowest-friction, highest-priority segment (A.1.2). Design goal: do not make him repeat
work Jaiz Bank has already done.

| Stage | What happens | Channel / system | Design implication |
|---|---|---|---|
| 1. Awareness | Told directly by his Jaiz Bank relationship officer, positioned as co-branded. | In-branch referral → WhatsApp handoff | High baseline trust transfers from the bank. |
| 2. Application start | Identity confirmed via existing Jaiz Bank KYC record, not a fresh Smile Identity flow; declares commercial vehicle use. | WhatsApp → co-origination path | Skips the standalone `KYC_PENDING` friction Amina goes through. |
| 3. Underwriting | Income/repayment-capacity check runs directly against existing bank history — no new Open Banking consent screen. | Existing bank data feed → Credit Analyst | Should be genuinely invisible to him — showing an Open Banking consent screen here reads as "the product doesn't know who I am." |
| 4. Vehicle sourcing (commercial) | Selects a commercial-use vehicle under the 15% commercial down payment terms. | WhatsApp catalogue, dealer partner | Flow must recognise "business use" early — `downPaymentPct` differs by use case per A.2.1. |
| 5. Purchase → contract | Identical purchase-before-lease sequence as every customer, regardless of tier. | Ops purchase workflow → e-signature (stub) | Confirms Rule 1 (A.3) applies uniformly — no tier-based shortcuts on the Sharia-critical step. |
| 6. Collection setup | Direct debit mandate on his existing Jaiz Bank account — no new bank relationship needed. | Existing direct debit rails | Lowest-friction collection path in the product; a useful benchmark for how smooth Tier B should eventually feel. |
| 7. Servicing & term end | Rental collected automatically; ownership transfers at term end. | Existing bank rails → contract engine (SSB-gated) | Low-touch preference — light messaging cadence, not chatty check-ins. |

---

## B.3 Persona 3 — Chidi Okonkwo, The Commercial Operator (Tier C, Phase 2)

**Profile:** 27, full-time Bolt/InDrive driver, Abuja. ₦150,000–250,000/month, variable,
paid via gig-platform disbursements and mobile money — no payslip. High tech comfort.
Decision driver: speed and accessibility first; halal compliance is a strong plus, not
the primary hook. Goal: replace his vehicle fast, no collateral, using real but
non-payslip earnings as proof of capacity. Biggest fear: declined because his income
"doesn't look like" a salary despite being reliable.

> **This persona is explicitly Phase 2.** Tier C is out of scope for the Phase 1 build
> (A.1.2, A.13) — it needs an alternative credit-scoring model trained on Phase 1
> labelled repayment data (Backlog EP-019, US-082). Documented now so the Phase 1 data
> model and state machine don't need reshaping later — not so it gets built early.

| Stage | What happens | Channel / system | Design implication |
|---|---|---|---|
| 1. Awareness | Sees a driver-community post: "Get on the road in 48 hours. No collateral. No riba." | Driver community channels | Message-market fit differs from Amina's — speed/access lead, faith confirms rather than hooks. |
| 2. Application start | Declares income source as gig-platform driving, not salaried employment. | WhatsApp / app | Product must route "informal income" applicants to a distinct path immediately. |
| 3. Alternative data consent | Consents to Bolt/InDrive disbursement history, POS settlement data, mobile-money inflows, plus a community guarantor if required. | Open Banking + gig-platform data (Phase 2 build, EP-019) | Core mechanic of EP-019 — needs its own model, not a variant of the Phase 1 rule-based stub. |
| 4. Alternative-data underwriting | Tier-C-specific score produced with conservative exposure limits during the model's learning phase. | Tier C ML scorer (Phase 2) → human review | Explainability applies equally (EP-019 acceptance criteria) — a Tier C decline needs the same plain-language reasons as any other. |
| 5. Vehicle selection | Chooses a ride-hailing-eligible vehicle class. | WhatsApp catalogue | Speed target here should be tighter than the general 48h underwriting target. |
| 6. Purchase → contract → GPS | Same purchase-before-lease sequence and GPS fitment as every customer — no shortcuts on Sharia-critical steps. | Ops workflow → e-signature (stub) → Initrack (mock) | GPS-enabled collateral is explicitly what makes Tier C exposure manageable at all (Product Document §4.1). |
| 7. Servicing | Pays fixed monthly rental; income variability means some months are tighter. | Payment rails (mock) → Collections | Sharia Rule 2 (no time-linked penalty charges) protects him structurally — late fees, if any, are donations, not punitive interest. |

---

## B.4 Persona 4 — Fatima Abdullahi, Credit Analyst (Internal)

**Role:** Credit Analyst, part of the Head of Credit & Risk's team. Tools: admin
dashboard application queue, MCS explanation view, Open Banking data view. Primary
responsibility: manual review of borderline/referred applications; portfolio
monitoring. Needs a factor-by-factor explanation for every score, not a bare number, so
she can make and defend a human decision.

| Stage | What happens | System | Design implication |
|---|---|---|---|
| 1. Queue triage | Opens admin dashboard queue; applications grouped by state, urgent ones surfaced first. | Admin dashboard (Next.js) | Phase 1 admin dashboard is read-only for approve/decline actions (SPRINT-01 S1-09) — her workflow is partly outside the tool until that ships. |
| 2. Review a referred application | Opens an application flagged `REFERRED` (MCS 500–599); reviews the explanation object alongside raw Open Banking data. | MCS stub output, Open Banking view | Exactly why the Phase 1 stub scorer must output an explanation object even as a placeholder (A.7.1, SPRINT-01 S1-07). |
| 3. Cross-checks | Manually checks income stability, existing obligations, `declaredVehicleUse` flags. | Open Banking transaction view, Application record | Later phases: surface the specific transaction patterns (salary timing, balance-to-rental ratio) the credit engine weighs. |
| 4. Decision & human-approval token | Approves, approves-with-conditions, or declines. System prepares/queues the decision; her explicit human-approval action executes it — never autonomous. | Admin dashboard action (future sprint) / manual today | Golden Rule 2.3 (`CLAUDE.md`) — every approval logs the accountable actor. |
| 5. Decline feedback | Ensures declined customers get 2–3 plain-language reasons, not a bare rejection. | WhatsApp decline message | Full XAI-based decline feedback is Phase 2 (EP-016, US-078); Phase 1 needs a documented manual equivalent. |
| 6. Portfolio monitoring | Reviews cohort-level repayment performance for concentration risk. | Portfolio & Collections view | Her Phase 1 manual judgement is the seed dataset for Phase 2's ML model. |

---

## B.5 Persona 5 — Yusuf Garba, Operations Lead (Internal)

**Role:** Vehicle sourcing, GPS logistics, dealer coordination, KYC processing. Tools:
admin dashboard, dealer/inspection partner data, Initrack coordination. Primary
responsibility: executing the purchase-before-lease sequence correctly and on time for
every vehicle. Needs a workflow that will not let anyone skip ahead to contract
generation before a purchase receipt is properly recorded.

| Stage | What happens | System | Design implication |
|---|---|---|---|
| 1. Vehicle sourcing | Receives an `APPROVED` application; sources a matching vehicle (dealer partner or Cars45/Autochek-inspected used). | Admin dashboard, dealer partner channel | Phase 2 vision intelligence (EP-018) would auto-extract inspection data; Phase 1 is manual entry. |
| 2. Vehicle record creation | Creates the `Vehicle` record; `purchaseReceiptRef` and `gpsImei` remain null. | Admin dashboard / API | The null fields are a deliberate gate per the data model (A.6), not a gap to fill casually. |
| 3. Purchase execution | Purchases the vehicle on Markaba/SPV's behalf, becomes legal owner; uploads receipt, logs purchase date and title reference. | Admin dashboard → state machine | Rule 1 (A.3) made operational — the `PURCHASE_CONFIRMED → CONTRACT_SIGNED` transition is guarded and un-skippable by design. |
| 4. State transition to `PURCHASE_CONFIRMED` | Confirms status once receipt, date, and title reference are recorded. | State machine, audit log | Any bypass attempt, by any role including admins, is logged and would raise an SCQ (Backlog US-023). |
| 5. GPS fitment | Coordinates fitting a tracker before/at customer possession; records `gpsImei`. | Initrack adapter (mock) | Real operational bottleneck at pilot scale (50 vehicles, 2 cities) — worth watching for throughput. |
| 6. Handoff to servicing | Confirms customer possession; application moves to `ACTIVE`. | State machine, audit log | Every step here writes to the audit log (`architecture.md` §6) — the SSB's quarterly audit evidence trail. |

---

## B.6 Persona 6 — Sheikh Muhammad Al-Amin, SSB Scholar (Internal / Board)

**Role:** One of ≥3 SSB scholars; Mufti-level, Islamic banking/finance expertise,
Nigeria-based (Sharia Compliance Policy §2.1). No financial interest in Markaba or its
partners; fixed retainer, never performance-linked. Primary responsibility: pre-launch
product certification, contract template approval, quarterly transaction audit, fatwa
issuance, escalation authority to halt a product. Needs a complete, tamper-evident
evidence trail per transaction.

| Stage | What happens | System | Design implication |
|---|---|---|---|
| 1. Pre-launch certification | Reviews and certifies Ijarah/Murabaha structures and contract templates before first live transaction. | Contract template review (offline) | Exactly why `CLAUDE.md` §2.1 blocks contract-generation logic in this repo — there's nothing yet to build against. |
| 2. Ongoing SCQ escalation | Receives an SCQ escalated from the Head of Compliance within 48h of it being raised. | Compliance portal / `ShariaComplianceQuery` | The SCQ entity (A.6) exists so this has a real, auditable home from day one, even while rulings stay manual. |
| 3. Initial and full ruling | Issues an initial ruling within 5 business days, full ruling within 15 for complex matters. | Compliance register | Ruling SLAs (Sharia Compliance Policy §2.3) — the product should track SCQ age against these even before automation exists. |
| 4. Quarterly audit pack review | Receives a random 10% sample of completed transactions: contract, purchase receipt, payment history, GPS fitment confirmation, ownership transfer document. | Automated audit pack (Backlog US-025) | Only trustworthy if the audit log is genuinely append-only and complete (`architecture.md` §6). |
| 5. Findings & remediation | Logs findings within 14 days; a critical finding triggers an immediate SCQ and operational review. | Compliance register, SCQ | Compliance Breach Response (Sharia Compliance Policy §9): halt → customer notification within 5 business days → SSB ruling within 15 → remediation → system fix and re-test before reactivation. |
| 6. Annual reporting | Contributes to the SSB's public-facing annual Sharia compliance report. | Board presentation | Also one of Markaba's strongest trust assets for customer acquisition. |

---

## B.7 Cross-persona design implications for engineering

- The purchase-before-lease sequence (Yusuf's steps 3–4) is the moment every customer
  persona's trust ultimately rests on — build the state-machine guard as strictly as
  described in A.7; there is no acceptable degraded mode for this transition.
- Tier A (Sani) and Tier B (Amina) need visibly different onboarding lengths in the
  UI/flow logic, not the same flow with some fields silently pre-filled.
- Tier C (Chidi) is genuinely Phase 2, but the Phase 1 `Application`/`Customer` schema
  should not need reshaping to accommodate him later — worth a design review of A.6
  before the schema is finalized.
- Fatima (credit defensibility) and Sheikh Al-Amin (Sharia certification) both depend on
  the same underlying capability: explainable, auditable decisions. Build the
  explanation object (A.7.1) and the audit log (`architecture.md` §6) well once; it
  serves both.
- Every internal persona's journey ends at the same place: a write to the append-only
  audit log. Treat it as the product's most cross-cutting piece of infrastructure, not
  an afterthought bolted onto each feature.
