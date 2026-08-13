const assert = require('node:assert/strict');
function split(total, secondary){return {total:Number(total.toFixed(2)),primary:Number((total-secondary).toFixed(2)),secondary:Number(secondary.toFixed(2))};}
const baseline=split(8700.75,184.03);assert.deepEqual(baseline,{total:8700.75,primary:8516.72,secondary:184.03});
const glovo=split(8700.75-7.99,184.03-7.99);assert.deepEqual(glovo,{total:8692.76,primary:8516.72,secondary:176.04});
const afterFood=split(8700.75-25.42,184.03-25.42);assert.deepEqual(afterFood,{total:8675.33,primary:8516.72,secondary:158.61});
const combined=split(8700.75-25.42-7.99,184.03-25.42-7.99);assert.deepEqual(combined,{total:8667.34,primary:8516.72,secondary:150.62});
const cooperTransfer=split(8700.75,184.03);assert.equal(cooperTransfer.total,8700.75);
const cooperObserved=split(8696.75,180.03);assert.equal(cooperObserved.primary,8516.72);assert.equal(cooperObserved.total,8696.75);
const ocioObserved=split(8703.67,186.95);assert.equal(ocioObserved.primary,8516.72);assert.equal(ocioObserved.total,8703.67);
const projected=Number((150.62-14.99-2.99).toFixed(2));assert.equal(projected,132.64);
assert.ok(Math.abs(combined.total-(combined.primary+combined.secondary))<0.01);
console.log('DineroZaurio account-routing regression fixtures passed');
