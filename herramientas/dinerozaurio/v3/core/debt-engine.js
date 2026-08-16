import { assertMinor } from './money.js';
import { addDays, assertIsoDay, inClosedRange } from './dates.js';
import { generateOccurrences } from './recurrence-engine.js';

function paymentAmountFor(debt, schedule, occurrenceIndex) {
  const scheduled = Math.abs(assertMinor(Number(schedule.paymentAmountMinor || 0), 'schedule.paymentAmountMinor'));
  const balance = Math.max(0, assertMinor(Number(debt.currentBalanceMinor || 0), 'debt.currentBalanceMinor'));
  if (schedule.remainingInstallments != null && occurrenceIndex >= Number(schedule.remainingInstallments)) return 0;
  if (balance <= 0) return 0;
  return Math.min(scheduled, balance);
}

function adjustmentFor(adjustments, debtId, day) {
  return (adjustments || []).filter(row => row.debtId === debtId && row.effectiveDate === day).at(-1) || null;
}

export function generateDebtEvents({ debt, schedule, recurrenceRule, adjustments = [], from, to }) {
  assertIsoDay(from, 'from');
  assertIsoDay(to, 'to');
  if (!debt || !schedule) throw new TypeError('debt and schedule are required');
  if (debt.status === 'settled' || schedule.enabled === false) return [];

  const occurrences = generateOccurrences(recurrenceRule, { from, to });
  let balance = Math.max(0, assertMinor(Number(debt.currentBalanceMinor || 0), 'debt.currentBalanceMinor'));
  const rate = Math.max(0, Number(debt.annualInterestRate || 0));
  const monthlyRate = rate / 100 / 12;
  const result = [];

  occurrences.forEach((occurrence, index) => {
    if (balance <= 0) return;
    const adjustment = adjustmentFor(adjustments, debt.id, occurrence.scheduledAt);
    if (adjustment?.adjustmentType === 'skip_payment') return;

    let payment = paymentAmountFor({ ...debt, currentBalanceMinor: balance }, schedule, index);
    if (adjustment?.adjustmentType === 'custom_payment' && adjustment.amountMinor != null) payment = Math.min(balance, Math.abs(assertMinor(Number(adjustment.amountMinor))));
    if (adjustment?.adjustmentType === 'extra_payment' && adjustment.amountMinor != null) payment = Math.min(balance, payment + Math.abs(assertMinor(Number(adjustment.amountMinor))));
    if (adjustment?.adjustmentType === 'payoff') {
      const feePct = Math.max(0, Number(schedule.payoffFeePercent || 0));
      payment = Math.min(Number.MAX_SAFE_INTEGER, balance + Math.round(balance * feePct / 100));
    }

    let interestMinor = 0;
    if (debt.debtType === 'revolving' && monthlyRate > 0) interestMinor = Math.round(balance * monthlyRate);
    const principalMinor = Math.max(0, Math.min(balance, payment - interestMinor));
    const actualPayment = Math.max(0, Math.min(payment, balance + interestMinor));

    result.push({
      id: `expected:debt:${debt.id}:${occurrence.scheduledAt}`,
      sourceType: 'debt',
      sourceId: debt.id,
      eventType: 'debt_payment',
      name: debt.name,
      originalScheduledAt: occurrence.scheduledAt,
      scheduledAt: occurrence.scheduledAt,
      serviceDate: occurrence.serviceDate,
      occurredAt: null,
      amountMinor: -actualPayment,
      currency: debt.currency || 'EUR',
      accountId: debt.paymentAccountId || null,
      bucketId: null,
      status: 'expected',
      evidenceLevel: 'forecast',
      metadata: {
        interestMinor,
        principalMinor,
        balanceBeforeMinor: balance,
        balanceAfterMinor: Math.max(0, balance - principalMinor),
        adjustmentId: adjustment?.id || null
      }
    });
    balance = Math.max(0, balance - principalMinor);
  });

  return result.filter(event => inClosedRange(event.scheduledAt, from, to));
}

export function payoffQuote({ debt, schedule }) {
  const balanceMinor = Math.max(0, assertMinor(Number(debt.currentBalanceMinor || 0), 'debt.currentBalanceMinor'));
  const feePercent = Math.max(0, Number(schedule?.payoffFeePercent || 0));
  const feeMinor = Math.round(balanceMinor * feePercent / 100);
  return { balanceMinor, feeMinor, totalMinor: balanceMinor + feeMinor };
}

export function applyConfirmedDebtPayment({ debt, actualPaymentMinor, interestMinor = 0 }) {
  const paid = Math.abs(assertMinor(Number(actualPaymentMinor), 'actualPaymentMinor'));
  const interest = Math.max(0, assertMinor(Number(interestMinor), 'interestMinor'));
  const principal = Math.max(0, paid - interest);
  return {
    ...debt,
    currentBalanceMinor: Math.max(0, Number(debt.currentBalanceMinor || 0) - principal),
    status: Math.max(0, Number(debt.currentBalanceMinor || 0) - principal) === 0 ? 'settled' : debt.status
  };
}
