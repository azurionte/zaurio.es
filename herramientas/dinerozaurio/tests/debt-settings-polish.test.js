'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const debt=fs.readFileSync(path.join(root,'ui','debt-settings-polish.js'),'utf8');
const bridge=fs.readFileSync(path.join(root,'ui','debt-settings-state-bridge.js'),'utf8');
const version=fs.readFileSync(path.join(root,'version.js'),'utf8');

assert.doesNotThrow(()=>new Function(debt),'debt settings module must parse');
assert.doesNotThrow(()=>new Function(bridge),'state bridge must parse');

for(const token of [
  'dzDebtManager','dzDebtCard','dzDebtPrimaryAction','dzDebtMore','dzDebtEditorSection',
  'activeDebts()','archivedDebts()','settledMonth','data-dz-restore-debt','Restaurar una archivada',
  'window.openCollectionManager','window.openDebtEditor','window.openDebtCreateFlow','window.organizationAssignableItems',
  'scrubArchivedDebtOptions',"mode!=='paid'"
]) assert.ok(debt.includes(token),token);

assert.ok(debt.includes('Cuando liquidas una deuda, pasa automáticamente al archivo.'),'manager should explain archive behavior');
assert.ok(debt.includes('Las deudas saldadas dejan de aparecer en tu configuración activa.'),'archive should explain active-list behavior');
assert.ok(debt.includes("filter(item=>!isArchived(item))"),'active manager must exclude archived debts');
assert.ok(debt.includes("filter(isArchived)"),'archive must use settled debts');
assert.ok(debt.includes("delete month.debtOverrides[id]"),'restoring must remove the paid override that would keep the debt settled');
assert.ok(debt.includes("filter(item=>!archived.has(item.id))"),'archived debts must not appear in account/folder assignment choices');
assert.equal(/DineroZaurioAccountingCore|resolveAccountState|accounting-core-2/.test(debt),false,'debt settings UI must not become a monetary authority');
assert.equal(/renderHomeDashboard\s*=/.test(debt),false,'debt settings UI must not install another Home renderer');
assert.ok(version.includes("'./ui/debt-settings-state-bridge.js?v="),'version loader must include state bridge');
assert.ok(version.includes("'./ui/debt-settings-polish.js?v="),'version loader must include debt settings polish');

console.log('debt-settings-polish ok');
