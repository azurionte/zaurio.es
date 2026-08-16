import { assertMinor } from './money.js';
import { assertIsoDay } from './dates.js';

function normalizedText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenSimilarity(a, b) {
  const left = new Set(normalizedText(a).split(' ').filter(Boolean));
  const right = new Set(normalizedText(b).split(' ').filter(Boolean));
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter(token => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return intersection / union;
}

function dateDistanceDays(a, b) {
  assertIsoDay(a, 'date a');
  assertIsoDay(b, 'date b');
  return Math.abs(Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / 86400000));
}

export function scoreReconciliation({ expectedEvent, bankTransaction }) {
  const expectedAmount = Math.abs(assertMinor(expectedEvent.amountMinor, 'expectedEvent.amountMinor'));
  const actualAmount = Math.abs(assertMinor(bankTransaction.amountMinor, 'bankTransaction.amountMinor'));
  const amountDelta = Math.abs(expectedAmount - actualAmount);
  const amountScore = expectedAmount === 0 ? 0 : Math.max(0, 1 - amountDelta / Math.max(expectedAmount, 100));

  const expectedDay = expectedEvent.scheduledAt;
  const actualDay = String(bankTransaction.bookedAt || bankTransaction.valueAt || '').slice(0, 10);
  const distance = expectedDay && actualDay ? dateDistanceDays(expectedDay, actualDay) : 999;
  const dateScore = Math.max(0, 1 - distance / 7);

  const expectedText = expectedEvent.name || expectedEvent.metadata?.name || '';
  const actualText = `${bankTransaction.merchantName || ''} ${bankTransaction.description || ''}`;
  const merchantScore = tokenSimilarity(expectedText, actualText);

  const accountScore = !expectedEvent.accountId || !bankTransaction.accountId || expectedEvent.accountId === bankTransaction.accountId ? 1 : 0;

  const confidence = Math.max(0, Math.min(1,
    amountScore * 0.40 +
    dateScore * 0.25 +
    merchantScore * 0.25 +
    accountScore * 0.10
  ));

  return {
    confidence,
    signals: {
      amountScore,
      dateScore,
      merchantScore,
      accountScore,
      amountDeltaMinor: amountDelta,
      dateDistanceDays: distance
    }
  };
}

export function proposeMatches({ expectedEvents, bankTransactions, autoThreshold = 0.98, suggestThreshold = 0.75 }) {
  const proposals = [];
  const usedExpected = new Set();

  for (const transaction of bankTransactions || []) {
    const candidates = (expectedEvents || [])
      .filter(event => !usedExpected.has(event.id))
      .map(event => ({ event, score: scoreReconciliation({ expectedEvent: event, bankTransaction: transaction }) }))
      .sort((a, b) => b.score.confidence - a.score.confidence);

    const best = candidates[0];
    if (!best || best.score.confidence < suggestThreshold) {
      proposals.push({
        bankTransactionId: transaction.id,
        financialEventId: null,
        matchType: 'unplanned',
        confidence: best?.score.confidence || 0,
        status: 'suggested',
        evidence: best?.score.signals || {}
      });
      continue;
    }

    usedExpected.add(best.event.id);
    proposals.push({
      bankTransactionId: transaction.id,
      financialEventId: best.event.id,
      matchType: 'event',
      confidence: best.score.confidence,
      status: best.score.confidence >= autoThreshold ? 'auto_matched' : 'suggested',
      evidence: best.score.signals
    });
  }

  return proposals;
}

export function actualizeExpectedEvent({ expectedEvent, bankTransaction, reconciliationId }) {
  const bookedDay = String(bankTransaction.bookedAt || bankTransaction.valueAt || '').slice(0, 10);
  assertIsoDay(bookedDay, 'bank transaction date');
  return {
    ...expectedEvent,
    id: `actual:${bankTransaction.id}`,
    occurredAt: `${bookedDay}T12:00:00Z`,
    amountMinor: bankTransaction.amountMinor,
    status: 'actual',
    evidenceLevel: 'bank_actual',
    externalReference: bankTransaction.externalTransactionId || bankTransaction.id,
    metadata: {
      ...(expectedEvent.metadata || {}),
      reconciliationId,
      expectedAmountMinor: expectedEvent.amountMinor,
      expectedScheduledAt: expectedEvent.scheduledAt
    }
  };
}
