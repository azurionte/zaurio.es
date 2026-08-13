'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ui=fs.readFileSync(path.join(__dirname,'..','ui','accounts.js'),'utf8');
for(const token of ['Me han prestado dinero','He prestado dinero','direction:dir','data-direction','repayment_received','repayment_made','Debo a','me debe']) assert.ok(ui.includes(token),token);
console.log('personal-loans-semantics ok');
