const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function assertIsoDay(value, label = 'date') {
  if (!ISO_DAY.test(String(value || ''))) throw new TypeError(`${label} must be YYYY-MM-DD`);
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new TypeError(`${label} is not a valid calendar date`);
  }
  return value;
}

export function toDate(value) {
  assertIsoDay(value);
  return new Date(`${value}T12:00:00Z`);
}

export function isoDay(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new TypeError('Invalid Date');
  return date.toISOString().slice(0, 10);
}

export function addDays(day, delta) {
  const date = toDate(day);
  date.setUTCDate(date.getUTCDate() + Number(delta || 0));
  return isoDay(date);
}

export function addMonths(day, delta, preserveDay = true) {
  const source = toDate(day);
  const originalDay = source.getUTCDate();
  const target = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + Number(delta || 0), 1, 12));
  if (preserveDay) target.setUTCDate(Math.min(originalDay, daysInMonth(isoMonth(target))));
  return isoDay(target);
}

export function isoMonth(value) {
  if (value instanceof Date) return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
  assertIsoDay(value);
  return value.slice(0, 7);
}

export function daysInMonth(ym) {
  if (!/^\d{4}-\d{2}$/.test(String(ym || ''))) throw new TypeError('month must be YYYY-MM');
  const [year, month] = ym.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
}

export function monthStart(ym) {
  return `${ym}-01`;
}

export function monthEnd(ym) {
  return `${ym}-${String(daysInMonth(ym)).padStart(2, '0')}`;
}

export function fixedDay(ym, day) {
  const clamped = Math.min(daysInMonth(ym), Math.max(1, Number(day || 1)));
  return `${ym}-${String(clamped).padStart(2, '0')}`;
}

export function compareDays(a, b) {
  assertIsoDay(a, 'a');
  assertIsoDay(b, 'b');
  return a === b ? 0 : a < b ? -1 : 1;
}

export function inClosedRange(day, start, end) {
  assertIsoDay(day);
  assertIsoDay(start, 'start');
  assertIsoDay(end, 'end');
  return day >= start && day <= end;
}

export function daysBetween(a, b) {
  const diff = toDate(b).getTime() - toDate(a).getTime();
  return Math.round(diff / 86400000);
}

export function nextDay(day) {
  return addDays(day, 1);
}

export function previousDay(day) {
  return addDays(day, -1);
}
