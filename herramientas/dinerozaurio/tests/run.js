'use strict';
const fs=require('node:fs'),path=require('node:path');
const dir=__dirname;
const files=fs.readdirSync(dir).filter(name=>name.endsWith('.test.js')).sort();
for(const file of files)require(path.join(dir,file));
console.log(`DineroZaurio: ${files.length} test files passed`);
