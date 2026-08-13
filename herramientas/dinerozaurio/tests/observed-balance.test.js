'use strict';
const a=require('../finance/accounting-core.js'),assert=require('node:assert/strict');
const run=v=>a.resolveAccountState({organization:{salaryAccountId:'p',accounts:[{id:'p',folders:[]},{id:'r',folders:[{id:'f',actualBalance:v,balanceUpdatedAt:'2026-08-13'}]}],assignments:{}},periodYm:'2026-08',potentialNow:100,events:[],futureEvents:[],monthAdjustments:{}});
const before=run(20),after=run(16);assert.equal(before.total-after.total,4);assert.equal(before.primary.current,after.primary.current);console.log('observed-balance ok');
