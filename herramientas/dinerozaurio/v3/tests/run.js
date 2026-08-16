import assert from 'node:assert/strict';
import { majorToMinor } from '../core/money.js';
import { generateOccurrences } from '../core/recurrence-engine.js';
import { resolveSalaryCyclePeriod } from '../core/funding-cycle-engine.js';
import { chooseStrongestEvidence, summarizeLedger } from '../core/ledger.js';
import { evaluateAffordability } from '../core/projection-engine.js';
import { detectMissingTransfers, expectedTransferRequirement } from '../core/funding-engine.js';
import { actualizeExpectedEvent, scoreReconciliation } from '../core/reconciliation-engine.js';
import { buildExpectedLedger } from '../core/expected-ledger-engine.js';
import { generateDebtEvents } from '../core/debt-engine.js';
import { resolveAccountState, assertAccountingInvariants } from '../core/accounting-engine.js';
import { evaluatePurchaseDecision, validateDecisionCommand } from '../core/decision-engine.js';

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

const eur = majorToMinor;

function recurrence(id, frequency, anchorDate, options = {}) {
  return { id, frequency, intervalValue: options.intervalValue || 1, anchorDate, endDate: options.endDate || null, calendarRule: options.calendarRule || 'fixed_day', dueDay: options.dueDay ?? Number(anchorDate.slice(8, 10)), leadDays: options.leadDays || 0 };
}

function moneyRule(id, name, amount, recurrenceId, startDate, accountId = 'bbva', extra = {}) {
  return { id, name, amountMinor: eur(amount), currency: 'EUR', recurrenceId, startDate, endDate: extra.endDate || null, accountId, bucketId: extra.bucketId || null, enabled: true, ...extra };
}

test('money uses integer cents', () => {
  assert.equal(eur(3093.70), 309370);
  assert.equal(eur(39.75), 3975);
});

test('biweekly recurrence crosses natural month boundaries without losing occurrences', () => {
  const rows = generateOccurrences({ frequency: 'interval_days', intervalValue: 14, anchorDate: '2026-08-18', leadDays: 2, calendarRule: 'anchor' }, { from: '2026-08-28', to: '2026-09-27' });
  assert.deepEqual(rows.map(row => row.scheduledAt), ['2026-08-30', '2026-09-13', '2026-09-27']);
});

test('salary paid at month end can explicitly fund the next labelled month', () => {
  const period = resolveSalaryCyclePeriod({ salaryEvent: { id: 'salary-aug', scheduledAt: '2026-08-28' }, nextSalaryEvent: { id: 'salary-sep', scheduledAt: '2026-09-28' }, fundingStrategy: 'funds_next_month' });
  assert.equal(period.labelMonth, '2026-09');
  assert.equal(period.start, '2026-08-28');
  assert.equal(period.end, '2026-09-27');
});

test('bank actual wins over user confirmation and forecast for the same logical event', () => {
  const base = { sourceType: 'expense_rule', sourceId: 'netflix', originalScheduledAt: '2026-09-20', scheduledAt: '2026-09-20', eventType: 'expense' };
  const resolved = chooseStrongestEvidence([
    { ...base, id: 'forecast', amountMinor: -1499, status: 'expected', evidenceLevel: 'forecast' },
    { ...base, id: 'user', amountMinor: -1499, status: 'confirmed', evidenceLevel: 'user_confirmed' },
    { ...base, id: 'bank', amountMinor: -1549, status: 'actual', evidenceLevel: 'bank_actual' }
  ]);
  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].id, 'bank');
  assert.equal(resolved[0].amountMinor, -1549);
});

test('ledger aggregate is explainable from exact events', () => {
  const summary = summarizeLedger([
    { id: 'salary', sourceType: 'income_rule', sourceId: 'salary', scheduledAt: '2026-08-28', eventType: 'income', amountMinor: 309370, status: 'expected', evidenceLevel: 'forecast' },
    { id: 'rent', sourceType: 'expense_rule', sourceId: 'rent', scheduledAt: '2026-09-01', eventType: 'expense', amountMinor: -114735, status: 'expected', evidenceLevel: 'forecast' }
  ], { from: '2026-08-28', to: '2026-09-27' });
  assert.equal(summary.netMinor, 194635);
  assert.equal(summary.events.length, 2);
});

test('affordability checks future minimum balance, not only cash today', () => {
  const result = evaluateAffordability({ openingBalanceMinor: 30000, from: '2026-09-01', to: '2026-09-30', purchaseAmountMinor: 18000, purchaseDate: '2026-09-02', safetyFloorMinor: 0, events: [
    { id: 'future', sourceType: 'expense_rule', sourceId: 'trip', scheduledAt: '2026-09-18', eventType: 'expense', amountMinor: -20000, status: 'expected', evidenceLevel: 'forecast' }
  ] });
  assert.equal(result.affordable, false);
  assert.equal(result.minimumAfterMinor, -8000);
});

test('missing expected transfer is detected when secondary account was not funded', () => {
  const requirement = expectedTransferRequirement({
    rule: { id: 'fund-revolut', fromAccountId: 'bbva', toAccountId: 'revolut', amountStrategy: 'fund_upcoming_obligations' },
    triggerEvent: { scheduledAt: '2026-08-28', amountMinor: 309370 },
    destinationAccountBalanceMinor: 2000,
    windowEnd: '2026-09-27',
    upcomingEvents: [
      { accountId: 'revolut', scheduledAt: '2026-09-13', amountMinor: -3975 },
      { accountId: 'revolut', scheduledAt: '2026-09-20', amountMinor: -1499 }
    ]
  });
  assert.equal(requirement.amountMinor, 3474);
  const missing = detectMissingTransfers({ expectedTransfers: [requirement], actualTransfers: [], asOf: '2026-08-30' });
  assert.equal(missing.length, 1);
});

test('reconciliation preserves expected value while bank actual becomes truth', () => {
  const expected = { id: 'exp-netflix', sourceType: 'expense_rule', sourceId: 'netflix', eventType: 'expense', scheduledAt: '2026-09-20', amountMinor: -1499, status: 'expected', evidenceLevel: 'forecast', name: 'Netflix' };
  const bank = { id: 'bank-netflix', externalTransactionId: 'provider-123', bookedAt: '2026-09-21T08:00:00Z', amountMinor: -1549, merchantName: 'NETFLIX.COM', description: 'Netflix subscription' };
  const score = scoreReconciliation({ expectedEvent: expected, bankTransaction: bank });
  assert.ok(score.confidence > 0.75);
  const actual = actualizeExpectedEvent({ expectedEvent: expected, bankTransaction: bank, reconciliationId: 'match-1' });
  assert.equal(actual.amountMinor, -1549);
  assert.equal(actual.metadata.expectedAmountMinor, -1499);
  assert.equal(actual.evidenceLevel, 'bank_actual');
});

test('one occurrence can be edited without changing its recurring rule', () => {
  const rules = [recurrence('webel-r', 'interval_days', '2026-08-18', { intervalValue: 14, calendarRule: 'anchor', leadDays: 2 })];
  const events = buildExpectedLedger({
    from: '2026-08-28', to: '2026-09-27', recurrenceRules: rules,
    expenseRules: [moneyRule('webel', 'Webel', 39.75, 'webel-r', '2026-08-18')],
    eventOverrides: [{ id: 'override-one', sourceType: 'expense_rule', sourceId: 'webel', originalScheduledAt: '2026-09-13', overrideType: 'change', newScheduledAt: '2026-09-14', newAmountMinor: 4200 }]
  });
  assert.deepEqual(events.map(row => [row.scheduledAt, row.amountMinor]), [['2026-08-30', -3975], ['2026-09-14', -4200], ['2026-09-27', -3975]]);
});

test('fixed installment debt still schedules payments when principal balance is unknown', () => {
  const events = generateDebtEvents({
    debt: { id: 'short', name: 'Préstamo corto', debtType: 'fixed_loan', currentBalanceMinor: 0, currency: 'EUR', status: 'active', balanceKnown: false },
    schedule: { paymentAmountMinor: eur(372.32), remainingInstallments: 2, enabled: true },
    recurrenceRule: recurrence('short-r', 'monthly', '2026-08-05'),
    from: '2026-08-28', to: '2026-09-27'
  });
  assert.equal(events.length, 1);
  assert.equal(events[0].scheduledAt, '2026-09-05');
  assert.equal(events[0].amountMinor, -37232);
});

test('internal transfer changes distribution but not total wealth', () => {
  const state = resolveAccountState({
    accounts: [{ id: 'bbva', name: 'BBVA', isPrimary: true }, { id: 'revolut', name: 'Revolut' }], buckets: [], events: [
      { id: 'salary', sourceType: 'income_rule', sourceId: 'salary', eventType: 'income', scheduledAt: '2026-08-28', amountMinor: 100000, accountId: 'bbva', status: 'actual', evidenceLevel: 'user_confirmed' }
    ], transfers: [{ id: 't1', fromAccountId: 'bbva', toAccountId: 'revolut', amountMinor: 30000, occurredAt: '2026-08-28T18:00:00Z', status: 'confirmed' }], observations: [], from: '2026-08-28', asOf: '2026-08-28'
  });
  assertAccountingInvariants(state);
  assert.equal(state.totalWealthMinor, 100000);
  assert.equal(state.accounts.find(row => row.id === 'bbva').totalMinor, 70000);
  assert.equal(state.accounts.find(row => row.id === 'revolut').totalMinor, 30000);
});

test('September 2026 golden salary cycle resolves to -162.92 EUR without hardcoding total', () => {
  const recurrenceRules = [
    recurrence('salary-r', 'monthly', '2026-08-28'),
    recurrence('after-salary-r', 'monthly', '2026-08-28'),
    recurrence('webel-r', 'interval_days', '2026-08-18', { intervalValue: 14, calendarRule: 'anchor', leadDays: 2 }),
    recurrence('chatgpt-r', 'monthly', '2026-08-29'), recurrence('rent-r', 'monthly', '2026-08-01'),
    recurrence('water-r', 'interval_months', '2026-09-03', { intervalValue: 2 }), recurrence('kivet-r', 'monthly', '2026-08-03'),
    recurrence('spotify-r', 'monthly', '2026-08-09'), recurrence('vodafone-r', 'monthly', '2026-08-10'),
    recurrence('cooper-r', 'monthly', '2026-08-12'), recurrence('glovo-r', 'monthly', '2026-08-13'),
    recurrence('madrid-r', 'one_time', '2026-09-18'), recurrence('grindr-r', 'monthly', '2026-08-20'),
    recurrence('netflix-r', 'monthly', '2026-08-20'), recurrence('google-r', 'monthly', '2026-08-21'),
    recurrence('consolidation-r', 'monthly', '2026-08-31', { calendarRule: 'last_day', dueDay: 31 }),
    recurrence('short-r', 'monthly', '2026-08-05'), recurrence('iphone-r', 'monthly', '2026-08-05')
  ];
  const incomeRules = [moneyRule('salary', 'Sueldo neto', 3093.70, 'salary-r', '2026-08-28', 'bbva', { isSalary: true })];
  const expenseRules = [
    moneyRule('food', 'Comida', 350, 'after-salary-r', '2026-08-28', 'revolut'),
    moneyRule('electricity', 'Iberdrola reserva', 221, 'after-salary-r', '2026-08-28'),
    moneyRule('fun', 'Ocio', 100, 'after-salary-r', '2026-08-28', 'revolut'),
    moneyRule('chatgpt', 'ChatGPT Business', 52, 'chatgpt-r', '2026-08-29'),
    moneyRule('webel', 'Webel', 39.75, 'webel-r', '2026-08-18'),
    moneyRule('rent', 'Alquiler', 1147.35, 'rent-r', '2026-08-01'),
    moneyRule('water', 'Aigües', 46.08, 'water-r', '2026-09-03'),
    moneyRule('kivet', 'Kivet', 26, 'kivet-r', '2026-08-03'),
    moneyRule('spotify', 'Spotify', 20.99, 'spotify-r', '2026-08-09'),
    moneyRule('vodafone', 'Vodafone', 129.14, 'vodafone-r', '2026-08-10'),
    moneyRule('cooper', 'Bolsa comida Cooper', 22, 'cooper-r', '2026-08-12', 'revolut'),
    moneyRule('glovo', 'Glovo', 7.99, 'glovo-r', '2026-08-13', 'revolut'),
    moneyRule('madrid', 'Viaje Madrid', 300, 'madrid-r', '2026-09-18', 'revolut'),
    moneyRule('grindr', 'Grindr', 39.99, 'grindr-r', '2026-08-20'),
    moneyRule('netflix', 'Netflix', 14.99, 'netflix-r', '2026-08-20', 'revolut'),
    moneyRule('google', 'Google One', 2.99, 'google-r', '2026-08-21', 'revolut')
  ];
  const debtCommon = { currency: 'EUR', status: 'active', paymentAccountId: 'bbva', balanceKnown: false };
  const consolidation = generateDebtEvents({ debt: { ...debtCommon, id: 'consolidation', name: 'Consolidación', debtType: 'fixed_loan', currentBalanceMinor: eur(30000), balanceKnown: true }, schedule: { paymentAmountMinor: eur(505.04), remainingInstallments: 84, enabled: true }, recurrenceRule: recurrenceRules.find(row => row.id === 'consolidation-r'), adjustments: [{ id: 'first', debtId: 'consolidation', effectiveDate: '2026-08-31', adjustmentType: 'custom_payment', amountMinor: eur(223.32) }], from: '2026-08-28', to: '2026-09-27' });
  const short = generateDebtEvents({ debt: { ...debtCommon, id: 'short', name: 'Cetelem corto', debtType: 'fixed_loan', currentBalanceMinor: 0 }, schedule: { paymentAmountMinor: eur(372.32), remainingInstallments: 2, enabled: true }, recurrenceRule: recurrenceRules.find(row => row.id === 'short-r'), from: '2026-08-28', to: '2026-09-27' });
  const iphone = generateDebtEvents({ debt: { ...debtCommon, id: 'iphone', name: 'iPhone', debtType: 'fixed_loan', currentBalanceMinor: 0 }, schedule: { paymentAmountMinor: eur(61.21), remainingInstallments: 3, enabled: true }, recurrenceRule: recurrenceRules.find(row => row.id === 'iphone-r'), from: '2026-08-28', to: '2026-09-27' });
  const ledger = buildExpectedLedger({ from: '2026-08-28', to: '2026-09-27', incomeRules, expenseRules, recurrenceRules, debtEvents: [...consolidation, ...short, ...iphone] });
  const summary = summarizeLedger(ledger, { from: '2026-08-28', to: '2026-09-27' });
  assert.equal(summary.totalsByType.income, eur(3093.70));
  assert.equal(summary.totalsByType.expense, -eur(2599.77));
  assert.equal(summary.totalsByType.debt_payment, -eur(656.85));
  assert.equal(summary.netMinor, -eur(162.92));
  assert.equal(ledger.filter(row => row.sourceId === 'webel').length, 3);
});

test('decision engine treats unresolved account funding as a blocker', () => {
  const decision = evaluatePurchaseDecision({ openingBalanceMinor: 50000, events: [], from: '2026-09-01', to: '2026-09-30', amountMinor: 1000, purchaseDate: '2026-09-02', missingFundingRisks: [{ amountMinor: 10000, toAccountId: 'revolut', firstRiskDate: '2026-09-05', affectedEvents: [] }] });
  assert.equal(decision.financiallyAffordable, true);
  assert.equal(decision.operationallySafe, false);
  assert.equal(decision.affordable, false);
  assert.equal(validateDecisionCommand({ type: 'propose_transfer', payload: { amountMinor: 10000 } }).validated, true);
});

console.log('\nDineroZaurio v3 core regression suite passed.');
