'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const text=fs.readFileSync(path.join(__dirname,'..','version.js'),'utf8');
assert.match(text,/finance\/accounting-core\.js/);assert.match(text,/ui\/accounts\.js/);
for(const old of ['folder-mode-summary-v2','folder-mode-enhancements-v3','folder-mode-fixes-v4','ui-fixes-v5','account-balance-engine-v6','accounting-invariants-hotfix','account-display-current','account-routing-current'])assert.equal(text.includes(old),false);
console.log('runtime-contract ok');
