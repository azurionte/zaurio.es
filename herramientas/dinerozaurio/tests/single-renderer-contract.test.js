'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const version=fs.readFileSync(path.join(root,'version.js'),'utf8');
const ui=fs.readFileSync(path.join(root,'ui','accounts.js'),'utf8');
const summary=fs.readFileSync(path.join(root,'folder-mode-summary-v2.js'),'utf8');
const observed=fs.readFileSync(path.join(root,'ui','account-observed-adapter.js'),'utf8');

assert.match(version,/dz-accounting-loading/);
assert.match(version,/accounts-ui-7/);
assert.equal(/renderHomeDashboard\s*\(/.test(version),false,'version loader must not trigger a dashboard render');
const build=version.match(/build:\s*"(\d+)"/)?.[1];assert.ok(build,'runtime build');
assert.ok(version.includes(`accounting-core.js?v=${build}`));
assert.ok(version.includes(`accounts.js?v=${build}`));
assert.ok(version.includes(`account-observed-adapter.js?v=${build}`));

// accounts.js is now a bootstrap only: it must not install a second Home renderer.
assert.match(ui,/const V='accounts-ui-7'/);
assert.match(ui,/__DZ_VISUAL_STACK_INSTALLED__='5c029-canonical-1'/);
for(const file of ['folder-mode-summary-v2.js','folder-mode-enhancements-v3.js','folder-mode-fixes-v4.js','ui-fixes-v5.js','account-routing-current.js']){
  assert.equal(ui.split(file).length-1,1,`${file} must be loaded exactly once by the recovered stack`);
}
assert.equal(/renderHomeDashboard\s*=/.test(ui),false,'accounts bootstrap must not replace renderHomeDashboard');
assert.equal(/function\s+draw\s*\(/.test(ui),false,'accounts bootstrap must not contain an independent Home draw pipeline');
assert.equal(ui.includes('renderCanonicalHomeDashboard'),false);
for(const legacy of ['account-balance-engine-v6.js','accounting-invariants-hotfix.js','account-display-current.js']){
  assert.equal(ui.includes(legacy),false,`${legacy} must not be loaded as an alternate renderer`);
}

// The recovered visual shell is the Home rendering layer; later stack files enhance that pipeline.
assert.match(summary,/const base=renderHomeDashboard/);
assert.match(summary,/base\.apply\(this,args\)/);
assert.match(summary,/function draw\(\)/);
assert.match(summary,/resolveAccountState/);
assert.equal(summary.includes('renderCanonicalHomeDashboard'),false);

assert.match(observed,/canonical-account-ux-5c029-1/);
assert.equal(observed.includes('renderCanonicalHomeDashboard'),false);
assert.equal(observed.includes('account.actualBalance='),false);
console.log('baseline-renderer-gate-contract ok');
