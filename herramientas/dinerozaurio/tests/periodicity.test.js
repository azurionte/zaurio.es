'use strict';
const a=require('../finance/accounting-core.js'),assert=require('node:assert/strict');
const weekly=a.recurringDatesForMonth({periodicity:'weekly',startDate:'2026-08-03',chargeLeadDays:0},'2026-08');
const biweekly=a.recurringDatesForMonth({periodicity:'biweekly',startDate:'2026-08-03',chargeLeadDays:0},'2026-08');
assert.equal(weekly.length,5);assert.equal(biweekly.length,3);assert.equal(weekly[4],'2026-08-31');console.log('periodicity ok');
