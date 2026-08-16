# DineroZaurio v3 — Intelligent Financial Architecture

Status: PREPROD design authority

## 1. Purpose

DineroZaurio v3 is a clean rebuild of the financial domain. It replaces the legacy pattern of distributing financial calculations across UI, forecast, account, debt and compatibility modules.

Production remains read-only and untouched until explicit approval. PREPROD is the construction and validation environment. Existing production data will later be migrated into the v3 schema through a deterministic, auditable migration layer.

The product must answer one question consistently:

> What is financially true, what is expected, what is uncertain, and what changes if the user makes a decision?

Every number shown by the product must be explainable by the underlying events that produced it.

---

## 2. System laws

1. There is one financial source of mathematical truth.
2. Every financial consequence resolves to ledger events.
3. UI never performs financial arithmetic.
4. Persistence stores facts, rules and explicit decisions — never hidden business logic.
5. All monetary arithmetic uses integer minor units (cents for EUR).
6. Recurrences generate concrete dates, not monthly approximations.
7. Expected, confirmed and actual are different states.
8. Bank-confirmed transactions are the strongest available evidence of what actually happened.
9. Without bank sync, user confirmation is the strongest available evidence.
10. Unconfirmed expectations remain forecasts and must never masquerade as facts.
11. Internal transfers never change total wealth.
12. Balance observations describe reality; they do not invent missing transactions.
13. Forecast, Home, Calendar, Accounts, Health, MCP and AI consume the same financial truth.
14. Historical facts are corrected by explicit reconciliation/correction records, not silently overwritten.
15. Automated inference never silently replaces a fact.
16. AI never writes financial state directly; it proposes validated commands.
17. Every AI recommendation can be reconstructed from the ledger version, engine version and inputs used.
18. Affordability must inspect future dependencies, not only current cash.
19. If a number cannot be explained by a set of ledger events, DineroZaurio must not show it.
20. A planned transfer that has not occurred is a detectable operational shortfall, not an invisible assumption.

---

## 3. Truth hierarchy

DineroZaurio distinguishes four layers of truth.

### 3.1 Rule
A rule describes what normally should happen.

Example: Webel costs 39.75 EUR every 14 days.

### 3.2 Expected event
A deterministic projection generated from a rule.

Example: Webel expected on 2026-09-13 for 39.75 EUR.

### 3.3 Confirmed event
A user-confirmed occurrence when no stronger evidence is available.

Example: user confirms the Webel payment occurred on 2026-09-14 for 42.00 EUR.

### 3.4 Actual bank event
A booked bank transaction from a connected account.

Example: bank feed reports WEBEL APP, 2026-09-14, -42.00 EUR.

Evidence priority for actual history:

`bank actual > user confirmed > expected`

Expected events remain useful even after an actual transaction exists because the difference between expected and actual is valuable explanatory information.

---

## 4. Funding cycles and salary semantics

A user's financial period is not necessarily a calendar month.

DineroZaurio supports at least:

- `calendar_month`
- `salary_cycle`

A salary cycle also has explicit funding semantics:

- `funds_same_month`: salary received at the start of a month funds that same month.
- `funds_next_month`: salary received near the end of a month funds the following labelled month.

Example:

- Salary received: 2026-08-28
- Strategy: `funds_next_month`
- Financial label: September 2026
- Period: 2026-08-28 through 2026-09-27

The salary event does not change date. Only the financial period label and reporting window change.

The onboarding must explain this in human language and allow later reconfiguration.

Long-term, the internal model supports income-driven cycles even if the first UI only exposes calendar month, salary-at-start and salary-at-end presets.

---

## 5. Core architecture

```text
Financial Domain
      |
      v
Financial Core
  |-- Recurrence Engine
  |-- Debt Engine
  |-- Savings Engine
  |-- Funding Cycle Engine
      |
      v
Expected Ledger
      |
      +---------------- Bank Connectors --> Bank Transactions
      |                                      |
      +------------------------------ Reconciliation Engine
                                             |
                                             v
                                        Actual Ledger
                                             |
                     +-----------------------+----------------------+
                     |                                              |
                     v                                              v
              Accounting Engine                             Projection Engine
                     |                                              |
                     |                                              v
                     |                                       Scenario Engine
                     |                                              |
                     |                                              v
                     |                                       Decision Engine
                     |                                              |
                     +----------------------+-----------------------+
                                            |
                                            v
                                     Analytics Engine
                                            |
                                            v
                                      AI Orchestrator
                                            |
                                            v
                                           Chat

Audit Engine spans every state-changing layer.
```

These are responsibilities, not competing calculators. All monetary truth originates from the Financial Core and ledger.

---

## 6. Financial Domain

The domain defines stable concepts without DOM, Supabase or UI dependencies:

- Money
- Currency
- Account
- Bucket
- IncomeRule
- ExpenseRule
- Debt
- DebtSchedule
- SavingsGoal
- RecurrenceRule
- FundingPolicy
- FinancialEvent
- Transfer
- BalanceObservation
- BankTransaction
- Reconciliation
- Scenario
- Decision
- AuditEntry

---

## 7. Financial Core

### 7.1 Money

All monetary values are integer minor units.

`3093.70 EUR -> 309370 cents`

Floating-point sums are forbidden in financial calculations.

### 7.2 Date Engine

One date implementation owns:

- day arithmetic
- month boundaries
- leap years
- first/last day rules
- recurrence anchors
- timezone-aware date interpretation
- deterministic period boundaries

### 7.3 Recurrence Engine

Supported recurrence classes include:

- one time
- weekly
- every N days
- monthly
- every N months
- yearly
- fixed day
- first day
- last day
- service-date / charge-lead relationship

A recurrence always produces concrete occurrences.

### 7.4 Debt Engine

Supports:

- fixed loans
- installment purchases
- pay-end-month cards
- revolving debt
- interest
- remaining principal
- remaining installments
- final installment
- payoff amount
- payoff fee
- partial/extra payment
- skipped payment
- custom payment
- settlement
- balance correction

The Debt Engine produces ledger events; it does not render UI.

### 7.5 Savings Engine

Savings intent and physical movement are separate.

A savings contribution can generate a planned reservation. Moving the money between accounts is represented separately as an internal transfer.

### 7.6 Funding Cycle Engine

Resolves reporting windows and their funding source.

It never changes transaction dates. It only decides which dated events belong to a labelled financial period.

---

## 8. Canonical Ledger

The ledger is the central read model for financial truth.

A normalized event includes:

```text
id
plan_id
source_type
source_id
event_type
scheduled_at
occurred_at
amount_minor
currency
account_id
bucket_id
status
evidence_level
metadata
```

Typical event types:

- income
- expense
- debt_payment
- saving_reservation
- transfer_out
- transfer_in
- adjustment

Typical statuses:

- expected
- confirmed
- actual
- skipped
- superseded

The ledger query API must support arbitrary date ranges. Every aggregate is the sum of ledger events in the requested window.

---

## 9. Accounting Engine

The Accounting Engine answers where money physically is.

Responsibilities:

- account balance
- bucket balance
- unallocated/free balance
- internal transfers
- observed balances
- reconciliation adjustments
- projected account funding

Core invariants:

`total wealth = sum(account balances)`

`account balance = free balance + sum(bucket balances)`

Internal transfers affect distribution but never total wealth.

---

## 10. Planned transfers and operational funding

DineroZaurio must understand that configuration can imply a required transfer.

Example:

- salary lands in BBVA
- future subscriptions are configured against Revolut
- 250 EUR should therefore be moved from BBVA to Revolut after salary day

The system may generate an expected operational transfer requirement.

If bank sync is available and no matching transfer occurs, DineroZaurio must show:

- expected transfer
- observed account balances
- missing amount
- affected future charges
- risk date

It must not pretend the secondary account is funded.

Without bank sync, the system asks for confirmation or a balance observation only when the missing information matters.

---

## 11. Projection Engine

The projection model is:

`confirmed/actual history + expected future`

Past dates use the strongest evidence available. Future dates use expected events.

Projection outputs include:

- income
- expenses
- debt
- savings
- net cash flow
- opening balance
- closing balance
- minimum projected balance
- committed future cash
- safe-to-spend amount

Horizons can include:

- next salary
- 30 days
- 90 days
- 6 months
- 12 months

---

## 12. Scenario Engine

Scenarios simulate hypothetical changes without modifying canonical state.

Examples:

- buy a 180 EUR lamp today
- add a 600 EUR trip in three months
- increase savings by 100 EUR/month
- prepay a debt

A scenario returns the before/after effect on future balances, obligations and risk.

---

## 13. Decision Engine

The Decision Engine is deterministic and sits below AI.

Example query:

`canAfford(amount, date, horizon)`

Example output:

```text
affordable_now
safe_spendable_minor
minimum_projected_balance_minor
risk_level
dependencies[]
blocking_events[]
scenario_delta
```

The engine must consider future commitments. Current cash alone is insufficient.

---

## 14. AI Orchestrator

The AI is a conversational layer over structured financial APIs.

It can:

- explain balances
- explain expected vs actual differences
- answer affordability questions
- inspect future dependencies
- propose configuration changes
- propose reconciliations
- propose recurring rules
- propose debt actions

The AI cannot mutate tables directly.

It submits typed commands such as:

- `ProposeExpenseRuleChange`
- `ProposeOccurrenceOverride`
- `ProposeTransfer`
- `ProposeReconciliation`
- `ProposeSavingsChange`

Commands are validated by the application layer and require the appropriate user confirmation before persistence.

Every AI evaluation records engine version, ledger version, input snapshot, result and resulting user-approved action.

---

## 15. Bank synchronization

Bank connectors import external accounts and transactions without rewriting provider facts.

A bank transaction stores:

- provider transaction id
- account
- booking date
- value date
- amount
- currency
- merchant
- description
- provider category
- provider payload metadata

Bank facts are preserved independently from DineroZaurio interpretation.

---

## 16. Reconciliation Engine

The Reconciliation Engine matches expected events to bank transactions using explainable signals:

- amount similarity
- date distance
- merchant similarity
- account compatibility
- recurrence history
- user history
- category history

A proposed match has confidence and evidence.

Possible statuses:

- suggested
- auto_matched
- user_confirmed
- rejected

High-confidence automatic reconciliation is allowed only above a calibrated threshold and must remain auditable.

When expected and actual differ, both values remain visible.

Example:

Expected Netflix: 14.99 EUR
Actual bank charge: 15.49 EUR

DineroZaurio can later infer that the recurring price may have changed, but must request or earn sufficient confirmation before modifying the underlying rule.

---

## 17. Categorization Engine

Categorization can use:

- bank category
- merchant
- description
- user-defined rules
- previous confirmed categorization
- statistical/AI inference

Each categorization records source and confidence.

Sources include:

- bank_provider
- deterministic_rule
- history
- ai
- user

User-confirmed categorization is stronger than inferred categorization.

---

## 18. Balance observations

A balance observation is a point-in-time fact such as:

`Revolut balance at 2026-09-05 10:30 = 312.47 EUR`

If bank sync exists, synchronized balances/transactions should normally provide stronger evidence.

Without bank sync, observations allow the model to reconcile reality without inventing transactions.

---

## 19. Audit Engine

Every meaningful mutation is auditable.

Actors:

- user
- system
- ai
- bank_sync
- migration

Examples:

- rule created/edited
- occurrence overridden
- bank match accepted/rejected
- AI proposal accepted
- balance observation entered
- transfer confirmed
- debt corrected
- migration performed

Audit records include before, after, actor, reason, correlation id and timestamp.

---

## 20. Explainability API

Every displayed aggregate must support an explanation query.

Examples:

- Why is September net -162.92 EUR?
- Why is Revolut underfunded?
- Why did my bank balance differ from forecast?
- Why is this purchase unsafe?

The API returns the exact contributing events and calculations.

---

## 21. Supabase v3 design principles

PREPROD receives a new schema of v3 tables. Legacy tables are not the target model.

The new schema stores:

- plan/funding policy
- accounts/buckets
- recurrence rules
- income/expense rules
- debts/schedules/adjustments
- savings goals
- explicit event overrides
- confirmed financial events
- transfers
- balance observations
- bank connections/accounts/transactions
- reconciliation matches
- categorization assignments
- AI decision traces
- audit records

Generated infinite future occurrences are not persisted. Rules generate future expected events on demand. Confirmations, exceptions and actuals are persisted.

---

## 22. Migration policy

Production legacy data remains the source for v3 migration.

Migration pipeline:

```text
PROD legacy reader
  -> normalized migration DTOs
  -> v3 domain validation
  -> PREPROD v3 tables
  -> cross-system reconciliation report
```

Migration records retain legacy table/id references for traceability during validation.

The existing user must not be required to re-enter consolidated financial information.

No production write occurs during development or migration rehearsal.

---

## 23. Validation before production

Before any production cutover, PREPROD must pass:

- deterministic recurrence tests
- salary-at-start tests
- salary-at-end tests
- arbitrary salary day tests
- month/leap-year boundaries
- weekly/every-N-days recurrence
- one-off occurrence overrides
- debt lifecycle tests
- revolving tests
- payoff tests
- savings tests
- account/bucket invariants
- internal transfer invariants
- missing planned transfer detection
- bank reconciliation tests
- expected-vs-actual tests
- scenario tests
- affordability/future dependency tests
- audit trace tests
- migration parity tests against PROD

The migration comparison must identify differences by concrete event, not only aggregate amount.

---

## 24. Repository policy

v3 code is developed as a clean runtime under `herramientas/dinerozaurio/v3/`.

Legacy code remains only while required to keep PREPROD usable during construction. Once v3 reaches functional parity and the new runtime is selected, legacy runtime files are deleted rather than retained as dormant compatibility layers. Git history is the archive.

No new v3 feature may depend on a legacy calculation helper.

---

## 25. Product readiness additions

Professional product requirements included from the start:

- multi-user RLS isolation
- currency field on monetary entities
- timezone-aware dates
- idempotent bank imports
- deterministic engine versioning
- traceable migration ids
- explicit confidence/evidence states
- command validation for AI writes
- explainability for every aggregate
- no silent fallback between expected and actual
- observability/diagnostic ids for reconciliation and decision flows
- privacy boundary between user financial data and external AI providers

This document is the architectural authority for DineroZaurio v3 PREPROD.