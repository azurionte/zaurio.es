'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const ui=fs.readFileSync(path.join(root,'ui','configuration-modal-polish.js'),'utf8');
const version=fs.readFileSync(path.join(root,'version.js'),'utf8');

assert.doesNotThrow(()=>new Function(ui),'configuration modal polish must parse');
for(const token of [
  "const VERSION='configuration-modal-polish-1'",
  'dzConfigModal','dzConfigKicker','dzConfigActions','dzConfigPrimary','dzConfigDanger',
  'CONFIG_TITLE','MutationObserver','childList:true','requestAnimationFrame',
  "card.classList.contains('dzDebtEditorModal')","card.classList.contains('dzDebtManager')"
]) assert.ok(ui.includes(token),token);
assert.match(version,/\.\/ui\/configuration-modal-polish\.js\?v=\d+/,'version loader must include configuration modal polish');
assert.equal(/DineroZaurioAccountingCore|resolveAccountState|accounting-core-2/.test(ui),false,'configuration polish must not become a monetary authority');
assert.equal(/renderHomeDashboard\s*=/.test(ui),false,'configuration polish must not install a Home renderer');
assert.equal(/attributes:true/.test(ui),false,'configuration polish observer must not watch broad attribute churn');
console.log('configuration-modal-polish ok');
