export const DEFAULT_CURRENCY = 'EUR';

export function assertMinor(value, label = 'amount_minor') {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`${label} must be a safe integer minor-unit amount`);
  }
  return value;
}

export function majorToMinor(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError('Money value must be finite');
  const minor = Math.round((number + Number.EPSILON) * 100);
  return assertMinor(minor);
}

export function minorToMajor(value) {
  assertMinor(value);
  return value / 100;
}

export function addMinor(...values) {
  return values.reduce((sum, value) => sum + assertMinor(value), 0);
}

export function sumMinor(values) {
  return values.reduce((sum, value) => sum + assertMinor(value), 0);
}

export function negateMinor(value) {
  return -assertMinor(value);
}

export function absMinor(value) {
  return Math.abs(assertMinor(value));
}

export function clampMinor(value, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
  assertMinor(value);
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) throw new TypeError('Bounds must be safe integers');
  return Math.min(max, Math.max(min, value));
}

export function formatMinor(value, currency = DEFAULT_CURRENCY, locale = 'es-ES') {
  assertMinor(value);
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value / 100);
}
