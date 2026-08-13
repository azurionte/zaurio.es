'use strict';
const a=require('../finance/accounting-core.js'),assert=require('node:assert/strict');
const o={salaryAccountId:'p',accounts:[{id:'p',folders:[]},{id:'r',folders:[]}],assignments:{}};
const m=a.resolveAccountState({organization:o,periodYm:'2026-08',potentialNow:100,events:[],futureEvents:[],monthAdjustments:{'2026-08':{expenseOverrides:{__accountGeneralTransfers:{r:{amount:25.97,confirmedAt:'2026-08-13'}}}}}});
assert.equal(m.total,100);assert.equal(m.secondary[0].current,25.97);assert.equal(m.primary.current,74.03);assert.ok(m.splitDiff<0.01);console.log('general-transfer ok');
