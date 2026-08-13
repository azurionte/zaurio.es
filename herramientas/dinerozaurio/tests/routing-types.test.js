'use strict';
const a=require('../finance/accounting-core.js'),assert=require('node:assert/strict');
const org={salaryAccountId:'p',assignments:{x:{accountId:'r',folderId:'f'}}};
for(const type of ['Gasto','Deuda','Ingreso','Ahorro'])assert.deepEqual(a.assignmentFor({itemId:'x',type},org),{accountId:'r',folderId:'f'});
console.log('routing-types ok');
