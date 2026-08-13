'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ui=fs.readFileSync(path.join(__dirname,'..','folder-mode-enhancements-v3.js'),'utf8');
for(const token of ['dzUniversalMenu','expense','income','debt','goal','personal']) assert.ok(ui.includes(token),token);
assert.ok(ui.includes('data-dz-add'));
assert.equal(/prompt\(/.test(ui),false);
console.log('universal-add ok');
