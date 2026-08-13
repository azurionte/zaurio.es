'use strict';
const a=require('../finance/accounting-core.js'),assert=require('node:assert/strict');
const org={salaryAccountId:'p',assignments:{x:{accountId:'r',folderId:'f'}}};
const before=a.assignmentFor({itemId:'x',date:new Date('2026-08-01')},org),after=a.assignmentFor({itemId:'x',date:new Date('2026-08-31')},org);assert.deepEqual(before,after);console.log('routing-date ok');
