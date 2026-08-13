# DineroZaurio Technical Guide

Status: production architecture reference

## 1. Purpose

DineroZaurio is a multi-user personal-finance application that combines budgeting, debt planning, savings goals, salary-cycle forecasting, account/folder organization, month-specific overrides, manual reconciliation and an OAuth-protected MCP integration.

The key design principle is that DineroZaurio must distinguish **financial events** from **money location**:

- a real expense reduces wealth;
- a transfer between the user's own accounts changes location but not wealth;
- a budget allocation reserves money but does not imply the money has been spent;
- an observed balance correction describes reality and must not silently create a transfer;
- a confirmed transfer must be idempotent and must never be counted twice.

This distinction is mandatory for Kutun or any future finance product derived from DineroZaurio.

## 2. Production components

### Web application

Path: `herramientas/dinerozaurio/`

Primary production page: `herramientas/dinerozaurio/index.html`.

The page contains the historical finance engine and UI. Additional feature modules currently enhance the dashboard. The final accounting authority is `accounting-invariants-hotfix.js`, whose runtime version is `current-accounting-1`.

`version.js` loads the UI enhancement chain deterministically and the accounting authority last. This prevents an older enhancement from becoming the final calculator after an asynchronous reload.

Important: the filenames `folder-mode-summary-v2.js`, `folder-mode-enhancements-v3.js`, `folder-mode-fixes-v4.js`, `ui-fixes-v5.js` and `account-balance-engine-v6.js` are historical filenames, not independent application releases. They should be treated as migration debt and progressively folded into responsibility-based modules.

### Supabase

Project ID: `adpjitccwwvlydrtvvqk`

Project URL: `https://adpjitccwwvlydrtvvqk.supabase.co`

Authentication is Supabase Auth. The web client uses the publishable client key. Never expose a service-role key to the browser or MCP client.

Core finance tables:

- `profiles`
- `plans`
- `income_items`
- `expense_items`
- `debt_items`
- `savings_goals`
- `month_adjustments`

All user-visible finance reads must remain subject to Row Level Security. The authenticated user's bearer token is the identity boundary.

### MCP Worker

Path: `integrations/dinerozaurio-mcp/`

Production endpoint: `https://dinerozaurio-mcp.dmnrobles.workers.dev/mcp`

Server name: `dinerozaurio-finance`.

Current Worker server version: `0.4.0`.

The Worker validates the user's Supabase bearer token through `/auth/v1/user`, then performs Supabase REST calls with the publishable key plus that user's bearer token. It must never use a shared service-role credential to bypass RLS.

The MCP is read-only at present.

## 3. Authentication and tenant isolation

DineroZaurio is a multi-user application. Every finance request must resolve data only for the authenticated user.

OAuth flow:

1. ChatGPT or another MCP client initiates OAuth.
2. Supabase Auth authenticates the user.
3. The MCP receives the user's bearer token.
4. The Worker validates the token with Supabase Auth.
5. Supabase REST queries run with the publishable key and that same user bearer.
6. RLS determines which rows are visible.

There is no shared API key that selects a specific user's finance data.

## 4. Core financial model

### Income and expenses

Items have an amount, periodicity and applicability window. The production system supports at least:

- weekly
- biweekly / every 14 days
- monthly
- bimonthly
- quarterly
- every four months
- yearly
- one-time
- custom month intervals

Calendar metadata can be encoded in an item name payload using the `__DZITEM__` prefix. The metadata includes display name, due-day rules, month shifts, confidence, notes, interval information, start date and charge lead days.

Weekly and biweekly values must be calculated from actual charge dates, not approximated as one or two charges every calendar month. A biweekly item can legitimately occur three times in one salary cycle or month.

### Debts

Debt metadata can be encoded with `__DZMETA__`.

Important debt concepts include:

- `settledMonth`
- `last_month`
- `remaining_installments`
- installment amount
- revolving payment
- payoff amount
- month override
- payment source

Canonical lifecycle rule:

> Once a debt is settled in month M, all months after M must return zero for that debt before any later custom override is considered.

A `paid` override is terminal. A later `custom/from_here` override must not resurrect the debt.

`last_month` is inclusive. `remaining_installments` is a fallback termination mechanism.

### Savings

A savings goal and the physical location of saved money are separate concepts.

The UI should represent three states:

1. savings amount planned;
2. destination account/folder selected;
3. user confirms that the physical transfer has actually occurred.

Choosing a destination does not mean the transfer happened.

## 5. Month adjustments

`month_adjustments` is the main exception/event layer. It stores month-specific financial state that cannot be represented safely by a single recurring item.

Examples include:

- income overrides;
- expense overrides;
- debt overrides;
- one-off expenses;
- calendar date corrections;
- actual charge confirmations;
- account/folder assignments;
- confirmed internal transfers;
- folder balance corrections;
- savings transfer confirmations.

Important special keys currently used inside `expense_overrides` include:

- `__oneOffExpenses`
- `__moneyOrganization`
- `__folderTransfers`
- `__folderBalanceCorrections`
- `__accountGeneralTransfers`
- `__accountGeneralBalances`
- `__savingsTransferConfirmations`
- `__personalLoans`
- `__uiChangeLog`

These keys are effectively an embedded document model. For Kutun, they should become normalized tables or typed JSON contracts with migrations and schema validation rather than accumulating as undocumented free-form keys.

## 6. Account and folder accounting

The account/folder layer answers a different question from the budget engine:

> Where is the money physically located right now?

Current concepts:

- one salary/current account, e.g. BBVA;
- secondary accounts, e.g. Revolut;
- folders inside a secondary account;
- general/unfoldered balance;
- assignments from expenses/goals to an account/folder;
- confirmed internal transfers;
- observed balances.

### Non-negotiable invariants

1. **Account split invariant**

   `total money today = sum(all account balances today)`

2. **Internal transfer invariant**

   A transfer from BBVA to Revolut changes account balances but changes total wealth by exactly `0`.

3. **Observed balance invariant**

   An observed balance correction changes total wealth only for the unexplained portion that was not already represented by a known internal transfer.

4. **Folder consumption invariant**

   If 200 EUR were transferred to a folder and its observed balance is now 133.14 EUR, the 66.86 EUR difference is consumption from that folder. It must not be returned to BBVA.

5. **Future-event invariant**

   Future income and future charges do not affect `saldo estimado hoy` before their effective date.

6. **Reservation invariant**

   A budget allocation or savings reservation is not automatically a real bank transfer and is not automatically spending.

7. **Idempotency invariant**

   Confirming the same transfer twice must not duplicate the amount. Future implementations should store stable transaction IDs or idempotency keys.

The current browser authority exposes `window.__DINEROZAURIO_ACCOUNT_DIAGNOSTICS__`. A non-zero `splitDiff` above cent-level tolerance is a defect and should be surfaced to monitoring.

## 7. Current MCP tools

The MCP Worker exposes these read-only tools:

### `get_financial_overview`

Input: optional `month` (`YYYY-MM`).

Returns month totals, plan metadata, counts and the current month's adjustment.

Use for quick totals.

### `get_month_snapshot`

Input: required `month`.

Returns the fully resolved month, including the exact income, expense, debt and savings items that compose the totals, one-off variations, reasons and excluded settled debts.

Use for explainability and detailed month analysis.

### `get_financial_timeline`

Inputs: `from_month`, `to_month`.

Returns resolved month totals and notable temporary variations across a range. Maximum range is 60 months.

### `explain_financial_change`

Inputs: `from_month`, `to_month`.

Compares two resolved snapshots and returns the drivers of the margin change.

### `get_incomes`

Lists recurring income items for the active plan.

### `get_expenses`

Lists recurring expense items for the active plan.

### `get_debts`

Lists debt and card obligations.

### `get_savings_goals`

Lists savings goals.

### `get_month_adjustments`

Optionally accepts a month and returns adjustment data.

## 8. MCP transport contract

The Worker implements JSON-RPC 2.0 over HTTP POST `/mcp`.

Supported protocol operations include:

- `initialize`
- `ping`
- `tools/list`
- `tools/call`
- initialization/cancellation notifications

OAuth protected-resource metadata is exposed through:

- `/.well-known/oauth-protected-resource`
- `/.well-known/oauth-protected-resource/mcp`

A health endpoint is available at `/health`.

Tool results are returned as MCP text content containing JSON.

## 9. Forecasting and explainability

A resolved month should be calculated once and then consumed by UI, MCP and future Kutun services. Consumers should not independently reconstruct finance semantics from raw tables.

Recommended canonical functions for the future engine:

- `resolveIncomeForPeriod(period)`
- `resolveExpenseForPeriod(period)`
- `resolveDebtForPeriod(period)`
- `resolveSavingsForPeriod(period)`
- `resolveAccountLocations(asOf)`
- `buildMonthSnapshot(period)`
- `buildTimeline(from, to)`
- `explainChange(from, to)`
- `reconcileObservedBalance(observation)`

The result should carry both amounts and reasons, e.g. `biweekly_third_occurrence`, `one_time_scheduled`, `settled_before_period`, `custom_override_from_here`, or `internal_transfer_confirmed`.

This allows the product itself to explain a negative month without requiring an LLM.

## 10. Recommended Kutun architecture without an AI dependency

The finance gem in Kutun should not depend on an AI for calculations or explanations. AI can be an optional conversational layer over deterministic services.

Recommended layers:

### Finance domain engine

Pure deterministic functions. No DOM, no Supabase calls and no UI concerns.

Input: typed finance state.

Output: typed snapshots, timelines, account balances, warnings and explanation drivers.

### Persistence layer

Supabase repositories responsible only for loading and writing domain entities.

### Reconciliation service

Owns observed balances, bank-import matching, transfer pairing, discrepancy detection and user confirmations.

### Explanation service

Converts deterministic reason codes into human-readable messages. No LLM required.

Example:

`BIWEEKLY_EXTRA_OCCURRENCE` + `{name, count:3, usualCount:2, impact:39.75}`

becomes:

`Limpieza Webel aparece 3 veces en este periodo en lugar de las 2 habituales, por lo que aumenta el gasto previsto en 39,75 EUR.`

### API layer

Expose stable versioned endpoints such as:

- `GET /v1/finance/months/:month`
- `GET /v1/finance/timeline`
- `GET /v1/accounts/current`
- `POST /v1/reconciliation/observations`
- `POST /v1/transfers/confirm`
- `GET /v1/explanations/months/:month`

The MCP should become an adapter over these services rather than containing its own finance engine.

## 11. Professionalization work still recommended

The following items are high priority before scaling to larger balances or more users:

### A. One finance engine

Move month/debt/periodicity/account calculations into a shared domain module. UI and MCP should call the same code or the same backend API.

### B. Replace historical UI patch chain

The current `v2` through `v6` filenames should be folded into responsibility-based modules such as:

- `ui/summary.js`
- `ui/accounts.js`
- `ui/quick-actions.js`
- `ui/health.js`
- `ui/settings.js`
- `domain/accounting.js`

Only one release manifest should be loaded in production.

### C. Automated regression tests

At minimum, tests must cover:

- internal transfer leaves total unchanged;
- folder transfer is not counted twice;
- folder consumption reduces total by the consumed difference;
- pre-existing observed money increases known wealth without reducing another account;
- future income is excluded from today's balance;
- future charge is excluded from today's balance;
- biweekly items can occur three times;
- settled debt never returns after settlement;
- `last_month` is inclusive;
- savings destination and savings transfer confirmation are separate states;
- total equals the sum of all accounts after every operation.

Production deploys should fail if these tests fail.

### D. Typed schemas and migrations

Define JSON Schema or TypeScript types for every persisted metadata object. Add explicit migration version fields.

### E. Immutable audit log

For financially meaningful writes, create append-only audit events containing:

- actor/user ID;
- timestamp;
- entity;
- operation;
- before state;
- after state;
- source (`user`, `bank_import`, `system`, `api`);
- correlation/idempotency ID.

A UI-level undo log is useful but should not be the authoritative financial audit log.

### F. Reconciliation state machine

Use explicit states such as:

- `planned`
- `awaiting_transfer`
- `confirmed`
- `observed`
- `matched`
- `disputed`

Do not infer these states from the existence of an amount.

### G. Observability

Log accounting invariant failures, unexpected negative balances, duplicate transfer IDs and snapshot mismatches. Add error reporting before bank synchronization is introduced.

### H. Backup and recovery

Define recovery procedures for accidental edits and data migrations. Financial records should not depend solely on browser state or a reversible UI action.

## 12. Safety rules for future development

- Never solve a mathematical discrepancy by silently writing a balancing number.
- Never convert an observation into a transfer without explicit user confirmation.
- Never treat a transfer between owned accounts as income or expense.
- Never let the UI and API maintain separate definitions of debt activity.
- Never use service-role access in a user-facing finance endpoint unless the operation is deliberately privileged and separately authorized.
- Never deploy calculation changes without regression fixtures.
- Never delete historical reconciliation information merely because the current month no longer needs it.

## 13. Current reference fixture

A production reconciliation case established on 13 August 2026 is useful as a regression fixture:

- total across accounts: `8700.75 EUR`
- primary account: `8516.72 EUR`
- Revolut: `184.03 EUR`

The secondary balance at that point was composed of known folder/general amounts including Food, Cooper, a small pre-existing leisure balance and a confirmed internal transfer for upcoming Revolut charges.

The exact user's private fixture should remain in private test data. Public/generalized tests should use synthetic values with the same relationships.

## 14. Definition of done for the Kutun finance gem

The finance gem is ready to be reused in Kutun when:

1. UI, API and MCP resolve months through the same deterministic domain engine.
2. Account totals satisfy accounting invariants automatically.
3. Every calculated amount can return a machine-readable reason.
4. Every financially meaningful write is auditable.
5. Transfers are idempotent.
6. Reconciliation is explicit rather than inferred.
7. Regression tests protect known edge cases.
8. Multi-user RLS isolation is verified.
9. No LLM is required for calculation or explanation.
10. AI, when enabled, consumes resolved semantic data instead of interpreting raw database rows.
