'use strict';
const a=require('../finance/accounting-core.js');
const assert=require('node:assert/strict');
assert.ok(a.ORDER.transfer<a.ORDER.event);
assert.ok(a.ORDER.event<a.ORDER.observed);
console.log('order ok');
