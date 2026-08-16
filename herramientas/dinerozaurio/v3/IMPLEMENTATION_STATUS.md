# DineroZaurio v3 — Implementation status

Last updated: 2026-08-16
Environment: PREPROD only
Production policy: read-only reference. No v3 write has been made to PROD.

## Current state

**PREPROD has been cut over to DineroZaurio v3.**

The root `herramientas/dinerozaurio/index.html` now redirects to the independent v3 runtime under `/herramientas/dinerozaurio/v3/`.

The user authenticated against migrated PREPROD data and visually validated the September 2026 salary-cycle result in the v3 runtime:

- income: 3,093.70 EUR
- expenses: 2,599.77 EUR
- debt: 656.85 EUR
- savings: 0 EUR
- net: **-162.92 EUR**
- period: 2026-08-28 through 2026-09-27

The legacy PREPROD finance runtime, compatibility/account hotfix layers, legacy `finance/`, legacy `js/`, legacy DineroZaurio tests and legacy CI workflow have been removed. Git history is the archive.

The architecture authority is `ARCHITECTURE.md`.

## Implemented financial engines

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

## Implemented application/data layers

- Supabase v3 repository
- period financial service
- provider-agnostic bank synchronization service
- bank provider adapter contract
- safe AI tool/command contract
- traceable AI orchestrator
- standalone v3 web runtime
- PREPROD MCP adapter using the same v3 Financial Core

## Truth model

Evidence strength:

`bank actual > user confirmed > expected forecast`

Expected data is retained after actual data is known so discrepancies remain explainable.

A current account balance is not considered known merely because DineroZaurio can model cash flows. A sufficiently fresh `account_total` observation or bank-synchronized balance truth is required before the Decision Engine may declare an optional purchase safe.

## Funding-cycle model

Migrated configuration:

- mode: `salary_cycle`
- funding strategy: `funds_next_month`
- current effective salary day: 28
- September 2026 period: 2026-08-28 through 2026-09-27

Funding-relative rules can anchor to salary events rather than natural calendar months.

## Golden September regression

The migrated-user golden test independently asserts:

- salary: 3,093.70 EUR
- expenses: 2,599.77 EUR
- debt: 656.85 EUR
- savings: 0 EUR
- net: **-162.92 EUR**
- Webel occurrences: 30 Aug, 13 Sep, 27 Sep

The total is derived from rules/events; `-162.92` is not used as an engine input.

## PREPROD v3 schema and migrated data

All v3 tables have RLS enabled and ownership policies. Audit triggers cover financial mutations and the bank/reconciliation/AI trace domain.

Migrated state includes:

- 1 plan
- 2 accounts
- 5 account buckets
- recurrence rules
- 1 salary/income rule
- 20 expense rules (19 legacy PROD rules plus the future housing event extracted during migration)
- 11 debts, 3 active
- debt schedules and adjustments
- 2 savings goals
- effective-dated rule versions
- confirmed/historical financial events
- confirmed internal transfers
- balance observations
- legacy-to-v3 migration trace links

## Migrated account structure

- BBVA · 8061 — primary current account
- Revolut · Débito — secondary current account

Revolut buckets:

- Comida
- Cooper
- Ocio y caprichos
- Ahorro mudanza 2028
- Viaje Madrid

The old `wallet` implementation label is not a v3 accounting type.

## Migrated truth and history

The migration preserves:

- recurring income/expense rules
- salary funding semantics
- account/bucket routing
- active and settled debts
- debt settlement/payoff history where available
- first/last/custom debt installments
- savings goals
- historical reconciliation events
- confirmed recurring occurrences
- internal transfers
- observed bucket balances
- future one-off housing plan
- future rent amount change through an effective-dated rule version

Where the legacy source did not contain an exact historical fact, migration metadata records that limitation instead of pretending certainty.

## Current-position limitation inherited from PROD

PROD does not contain a confirmed current **total** balance for either BBVA or Revolut; it contains only some bucket observations.

V3 intentionally does not invent these totals.

Until bank synchronization is connected, the UI can ask the user to confirm current account totals. Once a bank provider supplies sufficiently fresh real balances/transactions, the same Current Position engine promotes those stronger facts automatically.

This does not affect the validated September forecast; it affects questions whose correctness depends on current physical cash, such as optional purchase safety or whether a secondary account was actually funded.

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
- missing/partial funding detection
- audit coverage

External dependency for live synchronization:

- selection of an Open Banking provider and provider credentials/API integration.

No provider-specific privileged credentials are hard-coded into DineroZaurio.

## AI readiness

Implemented:

- typed read-only financial tools
- typed mutation proposals
- deterministic Decision Engine
- scenario/purchase evaluation
- current-position freshness requirement
- future dependency analysis
- missing-transfer risk analysis
- decision session/request/evaluation/action tables
- tool/engine/ledger traceability
- mutation commands requiring user confirmation

External dependency for conversational natural-language AI:

- selection/configuration of the LLM/provider/backend that turns chat text into the typed v3 tool calls.

Financial decisions themselves remain deterministic and are not delegated to the LLM.

## MCP

The PREPROD MCP source under `integrations/dinerozaurio-mcp/` has been rebuilt for v3.

It:

- authenticates the user through Supabase OAuth bearer identity;
- reads only `dz3_*` state under RLS;
- imports the same v3 `financial-service.js` used by the web runtime;
- exposes period, timeline, current-position and deterministic purchase-evaluation tools;
- contains no legacy month-adjustment calculator or folder-mode compatibility logic.

Deploying/testing that separate PREPROD MCP Worker is an external integration step; the web runtime does not depend on it.

## Runtime features exposed

- authenticated PREPROD data loading
- salary-cycle periods
- period totals
- explainable movement ledger
- evidence labels (expected / confirmed / bank)
- future occurrence date/amount editing
- manual occurrence confirmation
- account/bucket view
- manual fresh account-total confirmation while bank sync is absent
- missing secondary-account funding warnings
- six-period forecast
- deterministic “Can I buy it?” scenario analysis
- configuration/onboarding for salary funding semantics and financial rules

## PREPROD cutover status

Completed:

1. v3 schema created in isolated PREPROD.
2. PROD data mapped into v3 without PROD writes.
3. migrated golden regression passes.
4. authenticated `/v3/` runtime loads migrated data.
5. user visually validated the September financial result.
6. PREPROD root switched to v3.
7. obsolete legacy DineroZaurio runtime/tests/CI removed from PREPROD.
8. stale DineroZaurio technical/infrastructure docs updated to v3.
9. PREPROD MCP source rewritten to use v3 Financial Core.

Still external/interactive:

- current physical BBVA/Revolut account totals must come from user confirmation or future bank sync when a current-position-dependent decision is requested;
- a live Open Banking provider is required for automatic banking truth;
- an LLM/backend is required for conversational chat;
- the separate PREPROD MCP Worker needs deployment/OAuth testing if it is to be used before PROD cutover.

## PROD cutover

There is no automatic PROD promotion.

**PROD remains unchanged until explicit user authorization after PREPROD is accepted as correct.**
