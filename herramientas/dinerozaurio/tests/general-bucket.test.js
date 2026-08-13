'use strict';
const a=require('../finance/accounting-core.js'),assert=require('node:assert/strict'),org=require('./base-org');
const m=a.resolveAccountState({organization:org,periodYm:'2026-08',asOf:new Date('2026-08-13T18:00:00+02:00'),potentialNow:8556.70,monthAdjustments:{'2026-08':{expenseOverrides:{__accountGeneralTransfers:{r:{amount:25.97,confirmedAt:'2026-08-13'}}}}},events:[{itemId:'g',name:'Glovo',amount:-7.99,date:new Date('2026-08-13T12:00:00+02:00'),type:'Gasto'}],futureEvents:[]});
assert.equal(m.secondary[0].general.current,17.98);assert.ok(m.splitDiff<0.01);console.log('general-bucket ok');
