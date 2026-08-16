import { assertMinor, sumMinor } from './money.js';
import { assertIsoDay, inClosedRange } from './dates.js';

const EVIDENCE_WEIGHT = Object.freeze({
  forecast: 10,
  user_confirmed: 20,
  system_reconciled: 30,
  bank_actual: 40
});

function eventDay(event) {
  if (event.occurredAt) return String(event.occurredAt).slice(0, 10);
  return event.scheduledAt || null;
}

function logicalKey(event) {
  return [event.sourceType || '', event.sourceId || '', event.originalScheduledAt || event.scheduledAt || '', event.eventType || ''].join('|');
}

export function evidenceWeight(level) {
  return EVIDENCE_WEIGHT[level] || 0;
}

export function chooseStrongestEvidence(events) {
  const groups = new Map();
  for (const event of events || []) {
    const key = logicalKey(event);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(event);
  }

  const resolved = [];
  for (const candidates of groups.values()) {
    candidates.sort((a, b) => {
      const weight = evidenceWeight(b.evidenceLevel) - evidenceWeight(a.evidenceLevel);
      if (weight) return weight;
      const aActual = a.status === 'actual' ? 1 : 0;
      const bActual = b.status === 'actual' ? 1 : 0;
      if (aActual !== bActual) return bActual - aActual;
      return String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''));
    });
    const chosen = candidates.find(event => !['skipped', 'superseded'].includes(event.status));
    if (chosen) resolved.push(chosen);
  }

  return resolved.sort((a, b) => String(eventDay(a) || '').localeCompare(String(eventDay(b) || '')));
}

export function queryLedger(events, { from, to, strongestEvidence = true } = {}) {
  assertIsoDay(from, 'from');
  assertIsoDay(to, 'to');
  const source = strongestEvidence ? chooseStrongestEvidence(events) : [...(events || [])];
  return source.filter(event => {
    const day = eventDay(event);
    return day && inClosedRange(day, from, to);
  });
}

export function summarizeLedger(events, range) {
  const rows = queryLedger(events, range);
  const byType = new Map();
  for (const event of rows) {
    assertMinor(event.amountMinor, 'event.amountMinor');
    byType.set(event.eventType, (byType.get(event.eventType) || 0) + event.amountMinor);
  }
  const netMinor = sumMinor(rows.map(event => event.amountMinor));
  return {
    from: range.from,
    to: range.to,
    netMinor,
    totalsByType: Object.fromEntries(byType),
    events: rows
  };
}

export function explainAggregate(events, range) {
  const summary = summarizeLedger(events, range);
  return {
    ...summary,
    explanation: summary.events.map(event => ({
      id: event.id,
      date: eventDay(event),
      sourceType: event.sourceType,
      sourceId: event.sourceId,
      eventType: event.eventType,
      amountMinor: event.amountMinor,
      status: event.status,
      evidenceLevel: event.evidenceLevel
    }))
  };
}
