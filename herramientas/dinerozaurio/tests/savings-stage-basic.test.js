'use strict';
const a=require('../finance/accounting-core.js'),assert=require('node:assert/strict');
const org={assignments:{g:{accountId:'r',folderId:'s'}}};
assert.equal(a.savingsStage('g',org,{},'2026-08'),'destination_defined');
console.log('savings-stage-basic ok');
