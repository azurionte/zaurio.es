'use strict';
const a=require('../finance/accounting-core.js'),assert=require('node:assert/strict');
const debt={settledMonth:'2026-08'};
assert.equal(a.debtActiveForMonth(debt,'2026-08'),true);
assert.equal(a.debtActiveForMonth(debt,'2026-09'),false);
console.log('debt-lifecycle ok');
