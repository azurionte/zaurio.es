'use strict';
const a=require('../finance/accounting-core.js'),assert=require('node:assert/strict');
const run=(balance,transfer=0)=>a.resolveAccountState({organization:{salaryAccountId:'p',accounts:[{id:'p',folders:[]},{id:'r',folders:[{id:'f',actualBalance:balance,balanceUpdatedAt:'2026-08-13'}]}],assignments:{}},periodYm:'2026-08',potentialNow:100,events:[],futureEvents:[],monthAdjustments:transfer?{'2026-08':{expenseOverrides:{__folderTransfers:{'r|f':{amount:transfer,confirmedAt:'2026-08-13'}}}}}:{}});
const full=run(22,22),used=run(18,22);assert.equal(full.total,100);assert.equal(full.primary.current,78);assert.equal(used.total,96);assert.equal(used.primary.current,78);assert.equal(used.secondary[0].current,18);
const ocio=run(2.92,0);assert.equal(ocio.total,102.92);assert.equal(ocio.primary.current,100);assert.ok(ocio.splitDiff<0.01);console.log('observed-balance ok');
