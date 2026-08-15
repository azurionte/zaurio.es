'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const wizard=fs.readFileSync(path.join(root,'ui','debt-editor-wizard.js'),'utf8');
const version=fs.readFileSync(path.join(root,'version.js'),'utf8');

assert.doesNotThrow(()=>new Function(wizard),'debt editor wizard must parse');
for(const token of [
  'debt-editor-wizard-1','dzDebtWizardModal','dzDebtWizardNav','dzDebtWizardStep',
  'Identidad','Cobro','Condiciones','Paso ${current+1} de ${STEP_META.length}',
  'dzDebtWizardBack','dzDebtWizardNext','dzDebtWizardSave','aria-current',
  "current<STEP_META.length-1"
]) assert.ok(wizard.includes(token),token);
assert.equal(/DineroZaurioAccountingCore|resolveAccountState|accounting-core-2/.test(wizard),false,'wizard must not become a monetary authority');
assert.equal(/renderHomeDashboard\s*=/.test(wizard),false,'wizard must not install a Home renderer');
assert.match(version,/\.\/ui\/debt-editor-wizard\.js\?v=\d+/,'version loader must include debt editor wizard');
console.log('debt-editor-wizard ok');
