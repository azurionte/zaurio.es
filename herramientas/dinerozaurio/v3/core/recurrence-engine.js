import { addDays, addMonths, assertIsoDay, compareDays, fixedDay, inClosedRange, isoMonth, monthEnd, monthStart } from './dates.js';

function normalizeRule(rule) {
  if (!rule || typeof rule !== 'object') throw new TypeError('recurrence rule is required');
  assertIsoDay(rule.anchorDate, 'anchorDate');
  const frequency = rule.frequency || 'one_time';
  const intervalValue = Math.max(1, Number(rule.intervalValue || 1));
  if (!Number.isInteger(intervalValue)) throw new TypeError('intervalValue must be an integer');
  if (rule.endDate) assertIsoDay(rule.endDate, 'endDate');
  return {
    frequency,
    intervalValue,
    anchorDate: rule.anchorDate,
    endDate: rule.endDate || null,
    calendarRule: rule.calendarRule || 'anchor',
    dueDay: rule.dueDay == null ? null : Number(rule.dueDay),
    leadDays: Number(rule.leadDays || 0)
  };
}

function chargeDateFromServiceDate(serviceDate, rule) {
  return addDays(serviceDate, -rule.leadDays);
}

function serviceDateForMonth(ym, rule) {
  if (rule.calendarRule === 'first_day') return monthStart(ym);
  if (rule.calendarRule === 'last_day') return monthEnd(ym);
  if (rule.calendarRule === 'fixed_day') return fixedDay(ym, rule.dueDay || Number(rule.anchorDate.slice(8, 10)));
  return fixedDay(ym, Number(rule.anchorDate.slice(8, 10)));
}

function intervalDayOccurrences(rule, from, to) {
  const step = rule.frequency === 'weekly' ? 7 : rule.intervalValue;
  let serviceDate = rule.anchorDate;
  let chargeDate = chargeDateFromServiceDate(serviceDate, rule);
  let guard = 0;

  while (compareDays(chargeDate, from) < 0 && guard < 20000) {
    serviceDate = addDays(serviceDate, step);
    chargeDate = chargeDateFromServiceDate(serviceDate, rule);
    guard += 1;
  }

  const result = [];
  while (compareDays(chargeDate, to) <= 0 && guard < 40000) {
    if ((!rule.endDate || compareDays(serviceDate, rule.endDate) <= 0) && inClosedRange(chargeDate, from, to)) {
      result.push({ scheduledAt: chargeDate, serviceDate });
    }
    serviceDate = addDays(serviceDate, step);
    chargeDate = chargeDateFromServiceDate(serviceDate, rule);
    guard += 1;
  }
  return result;
}

function monthlyOccurrences(rule, from, to) {
  const result = [];
  const anchorMonth = isoMonth(rule.anchorDate);
  let cursorService = serviceDateForMonth(anchorMonth, rule);
  let cursorMonth = isoMonth(cursorService);
  let guard = 0;
  const monthStep = rule.frequency === 'yearly' ? 12 : rule.intervalValue;

  while (compareDays(chargeDateFromServiceDate(cursorService, rule), from) < 0 && guard < 2400) {
    cursorService = serviceDateForMonth(isoMonth(addMonths(`${cursorMonth}-01`, monthStep, false)), rule);
    cursorMonth = isoMonth(cursorService);
    guard += 1;
  }

  while (compareDays(chargeDateFromServiceDate(cursorService, rule), to) <= 0 && guard < 4800) {
    const scheduledAt = chargeDateFromServiceDate(cursorService, rule);
    if ((!rule.endDate || compareDays(cursorService, rule.endDate) <= 0) && inClosedRange(scheduledAt, from, to)) {
      result.push({ scheduledAt, serviceDate: cursorService });
    }
    cursorService = serviceDateForMonth(isoMonth(addMonths(`${cursorMonth}-01`, monthStep, false)), rule);
    cursorMonth = isoMonth(cursorService);
    guard += 1;
  }
  return result;
}

export function generateOccurrences(inputRule, { from, to }) {
  assertIsoDay(from, 'from');
  assertIsoDay(to, 'to');
  if (compareDays(from, to) > 0) throw new RangeError('from must not be after to');
  const rule = normalizeRule(inputRule);

  if (rule.frequency === 'one_time') {
    const scheduledAt = chargeDateFromServiceDate(rule.anchorDate, rule);
    return inClosedRange(scheduledAt, from, to) ? [{ scheduledAt, serviceDate: rule.anchorDate }] : [];
  }

  if (rule.frequency === 'daily') {
    return intervalDayOccurrences({ ...rule, frequency: 'interval_days', intervalValue: 1 }, from, to);
  }

  if (rule.frequency === 'weekly') {
    return intervalDayOccurrences({ ...rule, intervalValue: 7 }, from, to);
  }

  if (rule.frequency === 'interval_days') {
    return intervalDayOccurrences(rule, from, to);
  }

  if (rule.frequency === 'monthly') {
    return monthlyOccurrences({ ...rule, intervalValue: 1 }, from, to);
  }

  if (rule.frequency === 'interval_months') {
    return monthlyOccurrences(rule, from, to);
  }

  if (rule.frequency === 'yearly') {
    return monthlyOccurrences({ ...rule, intervalValue: 12 }, from, to);
  }

  throw new RangeError(`Unsupported recurrence frequency: ${rule.frequency}`);
}
