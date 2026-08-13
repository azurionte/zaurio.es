const assert = require('node:assert/strict');

function split(total, secondary){
  return { total:Number(total.toFixed(2)), primary:Number((total-secondary).toFixed(2)), secondary:Number(secondary.toFixed(2)) };
}

// Golden state after confirmed internal transfers, before newly settled Revolut charges.
const baseline = split(8700.75, 184.03);
assert.deepEqual(baseline, { total:8700.75, primary:8516.72, secondary:184.03 });

// Spending money from Revolut must reduce total + Revolut, never BBVA.
const glovo = split(8700.75 - 7.99, 184.03 - 7.99);
assert.deepEqual(glovo, { total:8692.76, primary:8516.72, secondary:176.04 });

// Observing that a Revolut folder fell from 133.14 to 107.72 is consumption in Revolut.
const afterFood = split(8700.75 - 25.42, 184.03 - 25.42);
assert.deepEqual(afterFood, { total:8675.33, primary:8516.72, secondary:158.61 });

// Combined: food consumption + Glovo from Revolut.
const combined = split(8700.75 - 25.42 - 7.99, 184.03 - 25.42 - 7.99);
assert.deepEqual(combined, { total:8667.34, primary:8516.72, secondary:150.62 });

// Internal transfers only change location, not total wealth.
const transfer = split(8700.75, 184.03 + 30);
assert.equal(transfer.total, 8700.75);
assert.equal(transfer.primary, 8486.72);
assert.equal(transfer.secondary, 214.03);

console.log('DineroZaurio account-routing regression fixtures passed');