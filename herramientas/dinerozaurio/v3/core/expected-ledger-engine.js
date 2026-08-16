import { generateOccurrences } from './recurrence-engine.js';
import { assertMinor } from './money.js';
import { assertIsoDay, inClosedRange } from './dates.js';

function ruleMap(recurrences = []) {
  return new Map(recurrences.map(rule => [rule.id, rule]));
}

function recurrenceFor(item, recurrences) {
  if (item.recurrenceId && recurrences.has(item.recurrenceId)) return recurrences.get(item.recurrenceId);
  return {
    frequency: 'one_time',
    intervalValue: 1,
    anchorDate: item.startDate,
    endDate: item.endDate || null,
    calendarRule: 'anchor',
    dueDay: null,
    leadDays: 0
  };
}

function normalizeRecurrence(rule) {
  return {
    frequency: rule.frequency,
    intervalValue: Number(rule.intervalValue || 1),
    anchorDate: rule.anchorDate,
    endDate: rule.endDate || null,
    calendarRule: rule.calendarRule || 'anchor',
    dueDay: rule.dueDay == null ? null : Number(rule.dueDay),
    leadDays: Number(rule.leadDays || 0)
  };
}

function applyOverride(event, overrides) {
  const override = (overrides || []).find(row =>
    row.sourceType === event.sourceType &&
    row.sourceId === event.sourceId &&
    row.originalScheduledAt === event.originalScheduledAt
  );
  if (!override) return event;
  if (override.overrideType === 'skip') return { ...event, status: 'skipped', metadata: { ...event.metadata, overrideId: override.id } };
  const next = { ...event, metadata: { ...event.metadata, overrideId: override.id } };
  if (override.newScheduledAt) next.scheduledAt = override.newScheduledAt;
  if (override.newAmountMinor != null) {
    const abs = Math.abs(assertMinor(Number(override.newAmountMinor), 'override.newAmountMinor'));
    next.amountMinor = event.amountMinor < 0 ? -abs : abs;
  }
  return next;
}

function buildRuleEvents({ items, recurrences, overrides, from, to, sourceType, eventType, sign }) {
  const result = [];
  for (const item of items || []) {
    if (item.enabled === false) continue;
    if (item.startDate && item.startDate > to) continue;
    if (item.endDate && item.endDate < from) continue;
    const recurrence = recurrenceFor(item, recurrences);
    const occurrences = generateOccurrences(normalizeRecurrence(recurrence), { from, to });
    for (const occurrence of occurrences) {
      const amount = Math.abs(assertMinor(Number(item.amountMinor), `${sourceType}.amountMinor`));
      const base = {
        id: `expected:${sourceType}:${item.id}:${occurrence.scheduledAt}`,
        sourceType,
        sourceId: item.id,
        eventType,
        name: item.name,
        originalScheduledAt: occurrence.scheduledAt,
        scheduledAt: occurrence.scheduledAt,
        serviceDate: occurrence.serviceDate,
        occurredAt: null,
        amountMinor: sign * amount,
        currency: item.currency || 'EUR',
        accountId: item.accountId || null,
        bucketId: item.bucketId || null,
        status: 'expected',
        evidenceLevel: 'forecast',
        metadata: { category: item.category || null }
      };
      const event = applyOverride(base, overrides);
      const day = event.scheduledAt;
      if (event.status !== 'skipped' && day && inClosedRange(day, from, to)) result.push(event);
    }
  }
  return result;
}

export function buildExpectedLedger({
  from,
  to,
  incomeRules = [],
  expenseRules = [],
  savingsGoals = [],
  recurrenceRules = [],
  debtEvents = [],
  transferEvents = [],
  eventOverrides = []
}) {
  assertIsoDay(from, 'from');
  assertIsoDay(to, 'to');
  const recurrences = ruleMap(recurrenceRules);
  const incomeEvents = buildRuleEvents({ items: incomeRules, recurrences, overrides: eventOverrides, from, to, sourceType: 'income_rule', eventType: 'income', sign: 1 });
  const expenseEvents = buildRuleEvents({ items: expenseRules, recurrences, overrides: eventOverrides, from, to, sourceType: 'expense_rule', eventType: 'expense', sign: -1 });
  const savingItems = savingsGoals.filter(goal => goal.status !== 'paused').map(goal => ({ ...goal, amountMinor: goal.contributionMinor }));
  const savingEvents = buildRuleEvents({ items: savingItems, recurrences, overrides: eventOverrides, from, to, sourceType: 'savings_goal', eventType: 'saving_reservation', sign: -1 });
  return [...incomeEvents, ...expenseEvents, ...savingEvents, ...(debtEvents || []), ...(transferEvents || [])]
    .filter(event => {
      const day = String(event.occurredAt || event.scheduledAt || '').slice(0, 10);
      return day && inClosedRange(day, from, to);
    })
    .sort((a, b) => String(a.occurredAt || a.scheduledAt).localeCompare(String(b.occurredAt || b.scheduledAt)) || String(a.id).localeCompare(String(b.id)));
}
