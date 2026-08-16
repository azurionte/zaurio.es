import { addDays, assertIsoDay, isoMonth, monthEnd, monthStart, previousDay } from './dates.js';

export function resolveCalendarMonthPeriod(labelMonth) {
  if (!/^\d{4}-\d{2}$/.test(String(labelMonth || ''))) throw new TypeError('labelMonth must be YYYY-MM');
  return {
    id: `calendar:${labelMonth}`,
    mode: 'calendar_month',
    labelMonth,
    start: monthStart(labelMonth),
    end: monthEnd(labelMonth),
    fundingEventId: null,
    fundingStrategy: 'calendar_month'
  };
}

export function resolveSalaryCyclePeriod({ salaryEvent, nextSalaryEvent, fundingStrategy = 'funds_same_month', labelMonth = null }) {
  if (!salaryEvent?.scheduledAt) throw new TypeError('salaryEvent.scheduledAt is required');
  assertIsoDay(salaryEvent.scheduledAt, 'salaryEvent.scheduledAt');
  if (nextSalaryEvent?.scheduledAt) assertIsoDay(nextSalaryEvent.scheduledAt, 'nextSalaryEvent.scheduledAt');

  const start = salaryEvent.scheduledAt;
  const end = nextSalaryEvent?.scheduledAt ? previousDay(nextSalaryEvent.scheduledAt) : addDays(start, 30);
  const derivedLabel = labelMonth || (
    fundingStrategy === 'funds_next_month'
      ? isoMonth(addDays(monthEnd(isoMonth(start)), 1))
      : isoMonth(start)
  );

  return {
    id: `salary:${salaryEvent.id || start}`,
    mode: 'salary_cycle',
    labelMonth: derivedLabel,
    start,
    end,
    fundingEventId: salaryEvent.id || null,
    fundingStrategy
  };
}

export function resolvePeriod({ mode, labelMonth, salaryEvent, nextSalaryEvent, fundingStrategy }) {
  if (mode === 'calendar_month') return resolveCalendarMonthPeriod(labelMonth);
  if (mode === 'salary_cycle') {
    return resolveSalaryCyclePeriod({ salaryEvent, nextSalaryEvent, fundingStrategy, labelMonth });
  }
  throw new RangeError(`Unsupported period mode: ${mode}`);
}
