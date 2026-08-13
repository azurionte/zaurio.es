'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ui=fs.readFileSync(path.join(__dirname,'..','ui','accounts.js'),'utf8');
for(const token of ['resolveAccountState','dzUniversalAdd','openDebtEditor','openGoalEditor','__personalLoans','__DINEROZAURIO_ACCOUNT_DIAGNOSTICS__','Confirmar transferencia','savingsStage','Registrar devolución'])assert.ok(ui.includes(token),token);
assert.match(ui,/openSimpleEditor=function\(kind,item\).*route\(item,kind,'saveSimpleBtn'\)/s);
assert.equal(/readMoney|textContent\.replace|parseFloat\([^\n]*textContent/.test(ui),false);
console.log('ui-contract ok');
