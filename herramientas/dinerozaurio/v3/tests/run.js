import assert from 'node:assert/strict';
import { majorToMinor } from '../core/money.js';
import { generateOccurrences } from '../core/recurrence-engine.js';
import { resolveSalaryCyclePeriod } from '../core/funding-cycle-engine.js';
import { chooseStrongestEvidence, summarizeLedger } from '../core/ledger.js';
import { evaluateAffordability } from '../core/projection-engine.js';
import { detectMissingTransfers, expectedTransferRequirement } from '../core/funding-engine.js';
import { actualizeExpectedEvent, scoreReconciliation } from '../core/reconciliation-engine.js';

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

test('money uses integer cents', () => {
  assert.equal(majorToMinor(3093.70), 309370);
  assert.equal(majorToMinor(39.75), 3975);
});

test('biweekly recurrence crosses natural month boundaries without losing occurrences', () => {
  const rows = generateOccurrences({
    frequency: 'interval_days',
    intervalValue: 14,
    anchorDate: '2026-08-18',
    leadDays: 2,
    calendarRule: 'anchor'
  }, { from: '2026-08-28', to: '2026-09-27' });
  assert.deepEqual(rows.map(row => row.scheduledAt), ['2026-08-30', '2026-09-13', '2026-09-27']);
});

test('salary paid at month end can explicitly fund the next labelled month', () => {
  const period = resolveSalaryCyclePeriod({
    salaryEvent: { id: 'salary-aug', scheduledAt: '2026-08-28' },
    nextSalaryEvent: { id: 'salary-sep', scheduledAt: '2026-09-28' },
    fundingStrategy: 'funds_next_month'
  });
  assert.equal(period.labelMonth, '2026-09');
  assert.equal(period.start, '2026-08-28');
  assert.equal(period.end, '2026-09-27');
});

test('bank actual wins over user confirmation and forecast for the same logical event', () => {
  const base = {
    sourceType: 'expense_rule',
    sourceId: 'netflix',
    originalScheduledAt: '2026-09-20',
    scheduledAt: '2026-09-20',
    eventType: 'expense'
  };
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
  const result = evaluateAffordability({
    openingBalanceMinor: 30000,
    from: '2026-09-01',
    to: '2026-09-30',
    purchaseAmountMinor: 18000,
    purchaseDate: '2026-09-02',
    safetyFloorMinor: 0,
    events: [
      { id: 'future', sourceType: 'expense_rule', sourceId: 'trip', scheduledAt: '2026-09-18', eventType: 'expense', amountMinor: -20000, status: 'expected', evidenceLevel: 'forecast' }
    ]
  });
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
  const expected = {
    id: 'exp-netflix',
    sourceType: 'expense_rule',
    sourceId: 'netflix',
    eventType: 'expense',
    scheduledAt: '2026-09-20',
    amountMinor: -1499,
    status: 'expected',
    evidenceLevel: 'forecast',
    name: 'Netflix'
  };
  const bank = {
    id: 'bank-netflix',
    externalTransactionId: 'provider-123',
    bookedAt: '2026-09-21T08:00:00Z',
    amountMinor: -1549,
    merchantName: 'NETFLIX.COM',
    description: 'Netflix subscription'
  };
  const score = scoreReconciliation({ expectedEvent: expected, bankTransaction: bank });
  assert.ok(score.confidence > 0.75);
  const actual = actualizeExpectedEvent({ expectedEvent: expected, bankTransaction: bank, reconciliationId: 'match-1' });
  assert.equal(actual.amountMinor, -1549);
  assert.equal(actual.metadata.expectedAmountMinor, -1499);
  assert.equal(actual.evidenceLevel, 'bank_actual');
});

console.log('\nDineroZaurio v3 core regression suite passed.');
