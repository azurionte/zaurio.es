import { assertMinor } from './money.js';
import { assertIsoDay, inClosedRange } from './dates.js';

export function expectedTransferRequirement({
  rule,
  triggerEvent,
  upcomingEvents,
  destinationAccountBalanceMinor = 0,
  windowEnd
}) {
  if (!rule?.fromAccountId || !rule?.toAccountId) throw new TypeError('Transfer rule requires source and destination accounts');
  assertMinor(destinationAccountBalanceMinor, 'destinationAccountBalanceMinor');
  assertIsoDay(triggerEvent.scheduledAt, 'triggerEvent.scheduledAt');
  assertIsoDay(windowEnd, 'windowEnd');

  let amountMinor = 0;
  if (rule.amountStrategy === 'fixed') {
    amountMinor = assertMinor(rule.amountMinor || 0, 'rule.amountMinor');
  } else if (rule.amountStrategy === 'percentage') {
    const incomeMinor = Math.max(0, assertMinor(triggerEvent.amountMinor || 0, 'triggerEvent.amountMinor'));
    const percentage = Number(rule.percentage || 0);
    amountMinor = Math.round(incomeMinor * percentage);
  } else if (rule.amountStrategy === 'fund_upcoming_obligations') {
    const obligations = (upcomingEvents || []).filter(event =>
      event.accountId === rule.toAccountId &&
      event.amountMinor < 0 &&
      inClosedRange(event.scheduledAt, triggerEvent.scheduledAt, windowEnd)
    );
    const requiredMinor = obligations.reduce((sum, event) => sum + Math.abs(assertMinor(event.amountMinor)), 0);
    amountMinor = Math.max(0, requiredMinor - destinationAccountBalanceMinor);
  } else {
    throw new RangeError(`Unsupported amount strategy: ${rule.amountStrategy}`);
  }

  return {
    transferRuleId: rule.id || null,
    fromAccountId: rule.fromAccountId,
    fromBucketId: rule.fromBucketId || null,
    toAccountId: rule.toAccountId,
    toBucketId: rule.toBucketId || null,
    amountMinor,
    expectedAt: triggerEvent.scheduledAt,
    reason: rule.amountStrategy
  };
}

export function detectMissingTransfers({ expectedTransfers, actualTransfers, asOf }) {
  assertIsoDay(asOf, 'asOf');
  const actual = actualTransfers || [];
  return (expectedTransfers || []).filter(expected => {
    if (expected.amountMinor <= 0 || expected.expectedAt > asOf) return false;
    return !actual.some(observed => {
      if (!['actual', 'confirmed'].includes(observed.status)) return false;
      if (observed.fromAccountId !== expected.fromAccountId || observed.toAccountId !== expected.toAccountId) return false;
      const amountClose = Math.abs(assertMinor(observed.amountMinor) - assertMinor(expected.amountMinor)) <= 1;
      const observedDay = String(observed.occurredAt || observed.expectedAt || '').slice(0, 10);
      return amountClose && observedDay && Math.abs(dayDistance(observedDay, expected.expectedAt)) <= 3;
    });
  });
}

export function explainFundingRisk({ missingTransfers, upcomingEvents, asOf }) {
  assertIsoDay(asOf, 'asOf');
  return (missingTransfers || []).map(transfer => {
    const affected = (upcomingEvents || [])
      .filter(event => event.accountId === transfer.toAccountId && event.amountMinor < 0 && event.scheduledAt >= asOf)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    return {
      ...transfer,
      affectedEvents: affected,
      firstRiskDate: affected[0]?.scheduledAt || null,
      affectedTotalMinor: affected.reduce((sum, event) => sum + Math.abs(assertMinor(event.amountMinor)), 0)
    };
  });
}

function dayDistance(a, b) {
  return Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / 86400000);
}
