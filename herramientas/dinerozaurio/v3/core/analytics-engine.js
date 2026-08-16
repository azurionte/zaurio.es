import { summarizeLedger } from './ledger.js';

export function analyzePeriod({ events, from, to }) {
  const summary = summarizeLedger(events, { from, to });
  const incomeMinor = Math.max(0, summary.totalsByType.income || 0);
  const expenseMinor = Math.abs(Math.min(0, summary.totalsByType.expense || 0));
  const debtMinor = Math.abs(Math.min(0, summary.totalsByType.debt_payment || 0));
  const savingsMinor = Math.abs(Math.min(0, summary.totalsByType.saving_reservation || 0));
  const outflowMinor = expenseMinor + debtMinor + savingsMinor;
  return {
    from,
    to,
    incomeMinor,
    expenseMinor,
    debtMinor,
    savingsMinor,
    outflowMinor,
    netMinor: summary.netMinor,
    debtToIncomeRatio: incomeMinor > 0 ? debtMinor / incomeMinor : null,
    savingsToIncomeRatio: incomeMinor > 0 ? savingsMinor / incomeMinor : null,
    expenseToIncomeRatio: incomeMinor > 0 ? expenseMinor / incomeMinor : null,
    eventCount: summary.events.length,
    events: summary.events
  };
}

export function buildHealthSignals({ periods }) {
  const rows = periods || [];
  const negative = rows.filter(row => row.netMinor < 0);
  const lowMargin = rows.filter(row => row.incomeMinor > 0 && row.netMinor >= 0 && row.netMinor / row.incomeMinor < 0.1);
  const heavyDebt = rows.filter(row => row.debtToIncomeRatio != null && row.debtToIncomeRatio >= 0.25);
  return {
    positivePeriods: rows.length - negative.length,
    totalPeriods: rows.length,
    signals: [
      ...negative.map(row => ({ type: 'negative_period', severity: 'high', from: row.from, to: row.to, amountMinor: row.netMinor })),
      ...lowMargin.map(row => ({ type: 'low_margin', severity: 'medium', from: row.from, to: row.to, amountMinor: row.netMinor })),
      ...heavyDebt.map(row => ({ type: 'debt_weight', severity: 'medium', from: row.from, to: row.to, ratio: row.debtToIncomeRatio }))
    ]
  };
}
