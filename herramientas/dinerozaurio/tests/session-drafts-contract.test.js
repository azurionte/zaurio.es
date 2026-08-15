'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const draft=fs.readFileSync(path.join(root,'session-drafts.js'),'utf8');
const version=fs.readFileSync(path.join(root,'version.js'),'utf8');

for(const token of [
  "const TABLE='dinerozaurio_temporary_drafts'",
  "snapshotPersistableState()",
  "buildStateChanges()",
  "upsert(payload,{onConflict:'user_id,plan_id'})",
  "Hay datos sin guardar de tu última sesión",
  "Descartar",
  "Revisar",
  "openSaveModal",
  "assignPersistableState(savedBaseline)",
  "visibilitychange",
  "pagehide",
  ".dzAppBrand",
  ".tab[data-tab=\"home\"]"
]) assert.ok(draft.includes(token),token);

assert.ok(version.includes("'./session-drafts.js?v=1408261040'"),'draft recovery must load from the existing bootstrap');
assert.equal(/DineroZaurioAccountingCore|resolveAccountState|accounting-core-2/.test(draft),false,'draft layer must not become a monetary authority');
assert.equal(/renderHomeDashboard\s*=/.test(draft),false,'draft layer must not install a renderer');
assert.equal(/beforeunload/.test(draft),false,'draft recovery must not confuse normal SPA navigation with session loss');
assert.match(draft,/window\.updateSaveUi=wrapped/,'draft writes follow the same pending-change contract as the Save menu');
assert.match(draft,/if\(!recoveryChecked\|\|recoveryPromptOpen\|\|!ready\(\)\)return/,'draft writes must not race startup recovery');
console.log('session-drafts-contract ok');
