'use strict';
const a=require('../finance/accounting-core.js'),assert=require('node:assert/strict');
const org={salaryAccountId:'p',accounts:[{id:'p',folders:[]},{id:'r',folders:[{id:'f',actualBalance:null}]}],assignments:{}};
const adj={'2026-08':{expenseOverrides:{__folderTransfers:{'r|f':{amount:10,confirmedAt:'2026-08-13'}}}}};
const m=a.resolveAccountState({organization:org,periodYm:'2026-08',potentialNow:100,events:[],futureEvents:[],monthAdjustments:adj});
assert.equal(m.total,100);assert.equal(m.secondary[0].current,10);assert.equal(m.primary.current,90);console.log('folder-transfer-domain ok');
