import { assertMinor } from './money.js';
import { assertIsoDay, inClosedRange } from './dates.js';
import { generateOccurrences } from './recurrence-engine.js';

function isBalanceDriven(debt) {
  return debt.debtType === 'revolving' || debt.balanceKnown === true || debt.metadata?.balanceKnown === true;
}

function paymentAmountFor(debt, schedule, occurrenceIndex, balanceMinor) {
  const scheduled = Math.abs(assertMinor(Number(schedule.paymentAmountMinor || 0), 'schedule.paymentAmountMinor'));
  if (schedule.remainingInstallments != null && occurrenceIndex >= Number(schedule.remainingInstallments)) return 0;
  if (isBalanceDriven(debt)) {
    if (balanceMinor <= 0) return 0;
    return Math.min(scheduled, balanceMinor);
  }
  return scheduled;
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
  const balanceDriven = isBalanceDriven(debt);
  const rate = Math.max(0, Number(debt.annualInterestRate || 0));
  const monthlyRate = rate / 100 / 12;
  const result = [];

  occurrences.forEach((occurrence, index) => {
    if (balanceDriven && balance <= 0) return;
    const adjustment = adjustmentFor(adjustments, debt.id, occurrence.scheduledAt);
    if (adjustment?.adjustmentType === 'skip_payment') return;

    let payment = paymentAmountFor(debt, schedule, index, balance);
    if (adjustment?.adjustmentType === 'custom_payment' && adjustment.amountMinor != null) {
      const custom = Math.abs(assertMinor(Number(adjustment.amountMinor)));
      payment = balanceDriven ? Math.min(balance, custom) : custom;
    }
    if (adjustment?.adjustmentType === 'extra_payment' && adjustment.amountMinor != null) {
      const extra = Math.abs(assertMinor(Number(adjustment.amountMinor)));
      payment = balanceDriven ? Math.min(balance, payment + extra) : payment + extra;
    }
    if (adjustment?.adjustmentType === 'payoff') {
      const feePct = Math.max(0, Number(schedule.payoffFeePercent || 0));
      if (!balanceDriven) throw new Error('Cannot calculate payoff for a debt without a known balance');
      payment = balance + Math.round(balance * feePct / 100);
    }
    if (payment <= 0) return;

    let interestMinor = 0;
    if (debt.debtType === 'revolving' && monthlyRate > 0) interestMinor = Math.round(balance * monthlyRate);
    const principalMinor = balanceDriven ? Math.max(0, Math.min(balance, payment - interestMinor)) : null;
    const actualPayment = balanceDriven ? Math.max(0, Math.min(payment, balance + interestMinor)) : payment;
    const balanceAfterMinor = balanceDriven ? Math.max(0, balance - principalMinor) : null;

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
        balanceKnown: balanceDriven,
        balanceBeforeMinor: balanceDriven ? balance : null,
        balanceAfterMinor,
        adjustmentId: adjustment?.id || null
      }
    });
    if (balanceDriven) balance = balanceAfterMinor;
  });

  return result.filter(event => inClosedRange(event.scheduledAt, from, to));
}

export function payoffQuote({ debt, schedule }) {
  if (!isBalanceDriven(debt)) throw new Error('Cannot calculate payoff for a debt without a known balance');
  const balanceMinor = Math.max(0, assertMinor(Number(debt.currentBalanceMinor || 0), 'debt.currentBalanceMinor'));
  const feePercent = Math.max(0, Number(schedule?.payoffFeePercent || 0));
  const feeMinor = Math.round(balanceMinor * feePercent / 100);
  return { balanceMinor, feeMinor, totalMinor: balanceMinor + feeMinor };
}

export function applyConfirmedDebtPayment({ debt, actualPaymentMinor, interestMinor = 0 }) {
  if (!isBalanceDriven(debt)) return debt;
  const paid = Math.abs(assertMinor(Number(actualPaymentMinor), 'actualPaymentMinor'));
  const interest = Math.max(0, assertMinor(Number(interestMinor), 'interestMinor'));
  const principal = Math.max(0, paid - interest);
  const nextBalance = Math.max(0, Number(debt.currentBalanceMinor || 0) - principal);
  return { ...debt, currentBalanceMinor: nextBalance, status: nextBalance === 0 ? 'settled' : debt.status };
}
