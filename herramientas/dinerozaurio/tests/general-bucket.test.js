'use strict';
const a=require('../finance/accounting-core.js'),assert=require('node:assert/strict'),org=require('./base-org');
const adjustments={'2026-08':{expenseOverrides:{__accountGeneralTransfers:{r:{amount:25.97,confirmedAt:'2026-08-13'}}}}};
adjustments['2026-08'].expenseOverrides.__folderTransfers={'r|c':{amount:22,confirmedAt:'2026-08-13'}};
const events=[{itemId:'g',amount:-7.99,date:new Date('2026-08-13T12:00:00+02:00'),type:'Gasto'}];
const futureEvents=[{itemId:'n',amount:-14.99,date:new Date('2026-08-20T12:00:00+02:00'),type:'Gasto'},{itemId:'q',amount:-2.99,date:new Date('2026-08-21T12:00:00+02:00'),type:'Gasto'}];
const m=a.resolveAccountState({organization:org,periodYm:'2026-08',asOf:new Date('2026-08-13T18:00:00+02:00'),potentialNow:8556.70,monthAdjustments:adjustments,events,futureEvents});
assert.equal(m.secondary[0].general.current,17.98);assert.equal(m.secondary[0].current,150.62);assert.equal(m.secondary[0].projected,132.64);assert.equal(m.primary.current,8516.72);assert.equal(m.total,8667.34);assert.ok(m.splitDiff<0.01);module.exports=m;console.log('general-bucket ok');
