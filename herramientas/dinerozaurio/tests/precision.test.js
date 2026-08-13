'use strict';
const a=require('../finance/accounting-core.js');
const assert=require('node:assert/strict');
assert.equal(a.toCents(0.1+0.2),30);
assert.equal(a.round2(17.979999999),17.98);
assert.equal(a.fromCents(13264),132.64);
console.log('precision ok');
