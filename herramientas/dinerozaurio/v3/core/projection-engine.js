import { queryLedger } from './ledger.js';
import { assertMinor } from './money.js';
import { assertIsoDay } from './dates.js';

export function buildBalanceTimeline({ openingBalanceMinor, events, from, to }) {
  assertMinor(openingBalanceMinor, 'openingBalanceMinor');
  assertIsoDay(from, 'from');
  assertIsoDay(to, 'to');
  const rows = queryLedger(events, { from, to });
  let balanceMinor = openingBalanceMinor;
  let minimumBalanceMinor = openingBalanceMinor;
  const timeline = rows.map(event => {
    balanceMinor += assertMinor(event.amountMinor, 'event.amountMinor');
    minimumBalanceMinor = Math.min(minimumBalanceMinor, balanceMinor);
    return {
      eventId: event.id,
      date: String(event.occurredAt || event.scheduledAt).slice(0, 10),
      amountMinor: event.amountMinor,
      balanceMinor,
      eventType: event.eventType,
      sourceType: event.sourceType,
      sourceId: event.sourceId,
      evidenceLevel: event.evidenceLevel,
      status: event.status
    };
  });
  return {
    openingBalanceMinor,
    closingBalanceMinor: balanceMinor,
    minimumBalanceMinor,
    timeline
  };
}

export function simulateScenario({ openingBalanceMinor, events, from, to, hypotheticalEvents = [] }) {
  const before = buildBalanceTimeline({ openingBalanceMinor, events, from, to });
  const after = buildBalanceTimeline({ openingBalanceMinor, events: [...events, ...hypotheticalEvents], from, to });
  return {
    before,
    after,
    deltaClosingMinor: after.closingBalanceMinor - before.closingBalanceMinor,
    deltaMinimumMinor: after.minimumBalanceMinor - before.minimumBalanceMinor
  };
}

export function evaluateAffordability({ openingBalanceMinor, events, from, to, purchaseAmountMinor, purchaseDate, safetyFloorMinor = 0 }) {
  assertMinor(purchaseAmountMinor, 'purchaseAmountMinor');
  assertMinor(safetyFloorMinor, 'safetyFloorMinor');
  assertIsoDay(purchaseDate, 'purchaseDate');
  if (purchaseAmountMinor < 0) throw new RangeError('purchaseAmountMinor must be positive');

  const hypothetical = {
    id: `scenario:purchase:${purchaseDate}:${purchaseAmountMinor}`,
    sourceType: 'scenario',
    sourceId: null,
    eventType: 'expense',
    scheduledAt: purchaseDate,
    occurredAt: null,
    amountMinor: -purchaseAmountMinor,
    status: 'expected',
    evidenceLevel: 'forecast'
  };

  const scenario = simulateScenario({ openingBalanceMinor, events, from, to, hypotheticalEvents: [hypothetical] });
  const affordable = scenario.after.minimumBalanceMinor >= safetyFloorMinor;
  const safeSpendableMinor = Math.max(0, scenario.before.minimumBalanceMinor - safetyFloorMinor);
  const dependencies = scenario.before.timeline.filter(row => row.date >= purchaseDate && row.amountMinor < 0);

  return {
    affordable,
    purchaseAmountMinor,
    safetyFloorMinor,
    safeSpendableMinor,
    minimumBeforeMinor: scenario.before.minimumBalanceMinor,
    minimumAfterMinor: scenario.after.minimumBalanceMinor,
    closingBeforeMinor: scenario.before.closingBalanceMinor,
    closingAfterMinor: scenario.after.closingBalanceMinor,
    dependencies,
    riskLevel: affordable ? (scenario.after.minimumBalanceMinor <= safetyFloorMinor + Math.max(5000, purchaseAmountMinor / 2) ? 'medium' : 'low') : 'high'
  };
}
