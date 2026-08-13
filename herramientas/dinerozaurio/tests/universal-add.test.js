'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ui=fs.readFileSync(path.join(__dirname,'..','ui','accounts.js'),'utf8');
for(const token of ['dzUniversalMenu','data-add="expense"','data-add="income"','data-add="debt"','data-add="goal"','data-add="personal"']) assert.ok(ui.includes(token),token);
assert.equal(/prompt\(/.test(ui),false);
console.log('universal-add ok');
