# DineroZaurio v3 — Implementation status

Last updated: 2026-08-16
Environment: PREPROD only
Production policy: read-only reference. No v3 write has been made to PROD.

## Current state

DineroZaurio v3 is now an independent runtime under `/herramientas/dinerozaurio/v3/`. It does not import financial calculation helpers from the legacy application.

The architecture authority is `ARCHITECTURE.md`.

### Implemented financial engines

- integer-minor-unit Money engine
- deterministic Date engine
- Recurrence engine
- Funding Cycle engine
- Expected Ledger engine
- effective-dated Rule Version engine
- Debt engine
- Evidence-resolution Ledger
- Accounting engine
- Current Position engine
- Projection / Scenario engine
- Decision engine
- Analytics engine
- Funding / missing-transfer engine
- Reconciliation engine
- Audit engine

### Implemented application/data layers

- Supabase v3 repository
- period financial service
- provider-agnostic bank synchronization service
- bank provider adapter contract
- safe AI tool/command contract
- traceable AI orchestrator
- standalone v3 web runtime

## Truth model

Evidence strength:

`bank actual > user confirmed > expected forecast`

Expected data is retained even after actual data is known so discrepancies remain explainable.

A current account balance is not considered known merely because DineroZaurio can model cash flows. `account_total` observations or future bank-synchronized balance truth are required before the Decision Engine can declare an optional purchase safe.

## Funding-cycle model

Migrated user configuration:

- mode: `salary_cycle`
- funding strategy: `funds_next_month`
- current effective salary day: 28
- September 2026 period: 2026-08-28 through 2026-09-27

Funding-relative budget rules such as food/ocio can anchor to the salary event rather than a natural calendar month.

## Golden September regression

The v3 migrated-user golden test asserts:

- salary: 3,093.70 EUR
- expenses: 2,599.77 EUR
- debt: 656.85 EUR
- savings: 0 EUR
- net: **-162.92 EUR**
- Webel occurrences: 30 Aug, 13 Sep, 27 Sep

This is calculated from rules/events; `-162.92` is not inserted into the engine as a target value.

## PREPROD v3 schema

All v3 tables have RLS enabled and an ownership policy.

Current migrated data counts:

- plans: 1
- accounts: 2
- account buckets: 5
- recurrence rules: 26
- income rules: 1
- expense rules: 20 (19 PROD rules + one future housing event extracted from legacy month-adjustment JSON)
- debts: 11
- active debts: 3
- debt schedules: 3
- debt adjustments: 2
- savings goals: 2
- effective rule versions: 1
- confirmed/historical financial events: 24
- confirmed internal transfers: 2
- balance observations: 3
- migration trace links: 42

## Migrated account structure

- BBVA · 8061 — primary current account
- Revolut · Débito — secondary current account

Revolut buckets:

- Comida
- Cooper
- Ocio y caprichos
- Ahorro mudanza 2028
- Viaje Madrid

The legacy `wallet` label is not used as a v3 accounting type; Revolut is represented as a secondary current account.

## Migrated truth and history

The migration preserves:

- recurring income/expense rules
- salary funding semantics
- account/bucket routing
- active and settled debts
- debt settlement/payoff history where available
- first/last/custom debt installments
- savings goals
- one-off historical reconciliation events
- confirmed recurring occurrences
- internal transfers
- observed bucket balances
- future one-off housing plan
- future rent amount change through an effective-dated rule version

Where the legacy source did not contain an exact historical date, v3 metadata explicitly records that the migrated date was inferred rather than pretending it was known.

## Account-position limitation inherited from legacy data

PROD does not contain a confirmed total balance for either BBVA or Revolut. It contains only some bucket observations.

Therefore the migration intentionally does **not** invent current account totals.

Until bank synchronization is connected, the v3 UI asks the user to confirm current account totals before a purchase decision can be declared safe. Once a bank provider supplies real balances/transactions, the same Current Position engine uses those stronger facts.

## Bank integration readiness

Implemented:

- bank connection/account/transaction schema
- idempotent external transaction identifiers
- provider adapter interface
- normalized account/transaction contract
- account balance import as `account_total` truth
- reconciliation scoring
- expected-to-actual conversion
- expected-vs-actual preservation
- audit coverage

External dependency still required for live bank synchronization:

- a selected Open Banking provider and its credentials/API integration.

No provider-specific credentials are hard-coded into DineroZaurio.

## AI readiness

Implemented:

- typed read-only financial tools
- typed mutation proposals
- deterministic Decision Engine
- scenario/purchase evaluation
- current-position requirement
- future dependency analysis
- missing-transfer risk analysis
- decision session/request/evaluation/action tables
- tool/engine/ledger traceability
- mutation commands requiring user confirmation

External dependency still required for conversational natural-language AI:

- selection/configuration of the LLM/provider/backend that will turn chat text into the typed v3 tool calls.

Financial decisions themselves remain deterministic and are not delegated to the LLM.

## Audit/security

- RLS enabled on every `dz3_*` table.
- every `dz3_*` table currently has an ownership policy.
- financial mutations are audit-triggered.
- bank/reconciliation/categorization/AI trace tables are also audit-triggered.
- bank connection/account/transaction external identifiers have uniqueness constraints for idempotent synchronization.
- one-off occurrence overrides have a unique occurrence constraint.

## Runtime

Standalone v3 runtime:

`/herramientas/dinerozaurio/v3/`

Deployed path expected on PREPROD:

`/v3/`

Features currently exposed:

- authenticated PREPROD data loading
- salary-cycle periods
- period totals
- explainable movement ledger
- evidence labels (expected / confirmed / bank)
- future occurrence date/amount editing
- manual confirmation of occurrences
- account/bucket view
- manual account-total truth confirmation while bank sync is absent
- missing secondary-account funding warnings
- six-period forecast
- deterministic “Can I buy it?” scenario analysis

## Legacy deletion / cutover gate

Legacy code has **not yet been deleted intentionally**.

Deletion is the final PREPROD cutover step, not a fallback architecture. v3 does not depend on it.

Before deletion:

1. v3 CI must pass with the migrated golden regression.
2. latest Cloudflare PREPROD deployment must succeed.
3. `/v3/` must load from PREPROD.
4. authenticated user runtime must be exercised once against migrated data.
5. user must confirm the migrated financial setup and provide/confirm current real account totals, because PROD does not contain them.

After that gate, the PREPROD root can be switched to v3 and all obsolete legacy runtime files can be deleted. Git history remains the archive.

## PROD cutover

There is no automatic PROD promotion.

PROD remains unchanged until explicit user authorization after PREPROD is accepted as correct.
