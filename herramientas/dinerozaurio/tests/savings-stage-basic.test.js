'use strict';
const a=require('../finance/accounting-core.js'),assert=require('node:assert/strict');
const empty={assignments:{}};assert.equal(a.savingsStage('g',empty,{},'2026-08'),'planned');
const org={assignments:{g:{accountId:'r',folderId:'s'}}};assert.equal(a.savingsStage('g',org,{},'2026-08'),'destination_defined');
const adj={'2026-08':{expenseOverrides:{__savingsTransferConfirmations:{g:{moved:true}}}}};assert.equal(a.savingsStage('g',org,adj,'2026-08'),'movement_confirmed');
console.log('savings-stage-basic ok');
