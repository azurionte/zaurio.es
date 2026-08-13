'use strict';
const assert=require('node:assert/strict');
const model=require('./general-bucket.test.js');
assert.equal(model.secondary[0].general.label,'Saldo libre');
assert.equal(model.secondary[0].general.projected,0);
console.log('free-balance-projection ok');
