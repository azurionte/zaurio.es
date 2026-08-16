# DineroZaurio v3 Technical Guide — PREPROD

Status: current PREPROD architecture reference.

The detailed architecture authority is:

`herramientas/dinerozaurio/v3/ARCHITECTURE.md`

Implementation/cutover status is:

`herramientas/dinerozaurio/v3/IMPLEMENTATION_STATUS.md`

## Runtime

PREPROD root `herramientas/dinerozaurio/index.html` redirects to the clean v3 runtime under `herramientas/dinerozaurio/v3/`.

The previous embedded financial engine, folder-mode layers, account hotfixes, `finance/` legacy engine, `js/` legacy runtime and legacy tests have been removed from the PREPROD branch. Git history is the archive.

## Financial authority

DineroZaurio v3 uses one Financial Core. UI and MCP consume it; neither implements a separate financial calculator.

Core laws:

- money arithmetic uses integer minor units;
- recurrences generate concrete dated occurrences;
- salary funding semantics are explicit;
- all aggregates are explainable from ledger events;
- evidence order is `bank_actual > user_confirmed > forecast`;
- internal transfers move money but never create/destroy wealth;
- unknown/stale bank balances are not invented;
- optional-purchase decisions consider future obligations and missing account funding;
- AI may propose typed commands but may not silently mutate financial truth.

## Data

PREPROD uses the isolated Supabase project and normalized `dz3_*` tables. Existing user financial information was migrated from PROD into v3 with migration traceability. PROD remains read-only and unchanged until explicit approval.

Generated future occurrences are derived from rules. Confirmations, actuals, observations, overrides, reconciliation and audit history are persisted.

## Bank readiness

The v3 schema/core supports provider-neutral bank accounts, transactions, balance truth, categorization and expected-vs-actual reconciliation. A live Open Banking provider and credentials are an external dependency, not a missing finance-engine capability.

## AI readiness

The deterministic Scenario/Decision layers are implemented below the conversational model. A future LLM orchestrator must use typed read tools and confirmation-gated mutation proposals. Financial decisions are never delegated to free-form LLM arithmetic.

## MCP

PREPROD MCP source is under `integrations/dinerozaurio-mcp/` and imports the v3 Financial Core. It authenticates with the user's Supabase OAuth bearer token and relies on RLS. It does not use legacy `plans/income_items/expense_items/month_adjustments` calculations.

## Production policy

Nothing in this PREPROD reconstruction authorizes a PROD write or cutover. PROD changes require explicit user approval after PREPROD validation.
