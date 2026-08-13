# DineroZaurio 2.9 architecture

## Runtime

`version.js` is the only runtime loader. The consolidated runtime loads, in order:

1. `finance/accounting-core.js`
2. `ui/accounts.js`

Legacy `folder-mode-*`, `ui-fixes-v5`, `account-balance-engine-v6`, `accounting-invariants-hotfix`, `account-display-current` and `account-routing-current` files are historical only and are not production dependencies.

## Accounting core

`finance/accounting-core.js` is the authority for physical account routing and account/bucket balances. It owns cent rounding, routing lookup, internal-transfer interpretation, effective accounting order, live general balances, observed-folder reconciliation, projections, total/account split invariants, diagnostics, weekly/biweekly date generation, settled-debt lifecycle helpers and savings lifecycle state.

Money is converted through `toCents()` / `fromCents()` and critical sums are performed in integer cents. `round2()` is the single public cent-rounding helper.

### Effective accounting order

Current calendar events may only have a date, while transfer/observation records can have timestamps. Until event timestamps are migrated, same-day operations use a deterministic accounting order:

`period_open < transfer < event < observed`

This means a confirmed transfer on a day funds that day's charge, and an observed balance on that day is treated as the physical truth after same-day charges. The abstraction is exposed by `effectiveAt()` and `compareEffective()` so a future timestamp migration can replace the ordering policy without UI hacks.

### Disponible sin carpeta

The general bucket is a live balance, not historical transfer volume:

`observed/pre-existing balance + confirmed internal transfers + settled routed flows`

Expenses/debts are negative flows; routed income is positive. Projection adds only future routed flows for that same account/general bucket.

### Observed folders

An observed folder balance is physical truth at its observation point. Events at or before that effective point are not reapplied. Transfers after the observation remain internal movements and change distribution only. Reconciliation adjusts total wealth only for the difference between the observed physical balance and the modelled balance up to the observation.

### Invariants

- Internal transfers never change total wealth.
- `abs(total - (primary + sum(secondary))) < 0.01`.
- Account/folder assignment is keyed by item id and is independent of calendar date.
- Observations may change total wealth; transfers may not.
- A settled debt is inactive after its settled month.
- Weekly/biweekly recurrence uses concrete calendar dates rather than monthly approximations.

## UI adapter

`ui/accounts.js` adapts domain state to the existing application UI. It must not parse money from DOM text or rebuild account balances. It consumes `resolveAccountState()` and renders its values.

The module also owns UI-side persistence actions: account/folder selection in income/expense/debt/savings editors, observed balance entry, confirmation of an already-performed internal transfer, savings movement confirmation, universal add menu, personal-loan presentation and contextual future-charge editing. Persistence actions mutate state and call the existing `touchState()` / `persistAndRefresh()` pipeline; monetary interpretation remains in the core.

Only one canonical wrapper is installed around `renderHomeDashboard`; the former wrapper chain is not loaded.

## Supabase persistence

The browser continues to use the existing Supabase authenticated session. Money organization is serialized inside the start/current month's `expense_overrides.__moneyOrganization`. Its `assignments` map remains the durable item-id -> `{accountId, folderId}` routing source until an explicit schema migration is designed.

On load/sync, `__moneyOrganization` is normalized and restored into `state.moneyOrganization`. The consolidated account modules do not change the Supabase schema.

Special accounting records currently remain in month adjustment `expenseOverrides`:

- `__accountGeneralTransfers`
- `__folderTransfers`
- `__accountGeneralBalances`
- `__savingsTransferConfirmations`
- `__personalLoans`

## Forecast, debt, savings and recurrence

The existing application forecast/calendar engine in `index.html` remains responsible for producing dated financial events and month snapshots. The accounting core consumes those events for physical routing. Debt settlement and weekly/biweekly recurrence have regression helpers in the core and tests to protect compatibility with the base engine.

Savings use three routing states: `planned`, `destination_defined`, and `movement_confirmed`. Defining a destination does not itself move money.

## Diagnostics

`resolveAccountState()` returns a non-mutating `diagnostics` object containing total wealth, each account and bucket, settled/future routed charges, internal transfers, observed adjustment and invariant difference. The UI exposes the latest snapshot as `window.__DINEROZAURIO_ACCOUNT_DIAGNOSTICS__` for development inspection only.

## MCP and authentication

The separate Cloudflare Worker under `integrations/dinerozaurio-mcp/` is read-only. It uses a server-side Supabase service-role credential and a separate MCP bearer token. It does not use the browser's authenticated session and does not expose write tools.

Browser login/authentication remains a Supabase Auth concern. The current MCP endpoint does **not** implement OAuth; its client authentication is bearer-token based. Any future MCP OAuth work should be treated as a separate security change, not coupled to account routing.

## Tests and CI

Run locally from the repository root:

```bash
node herramientas/dinerozaurio/tests/run.js
```

GitHub Actions runs the same suite and syntax-checks the two canonical modules via `.github/workflows/dz-tests.yml`.
