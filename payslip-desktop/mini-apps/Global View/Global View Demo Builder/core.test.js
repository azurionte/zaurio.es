"use strict";
// Self-contained automated checks for GlobalView Demo Builder. Fictional IDs only.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const C=require("./core.js");
const base=__dirname;
const p=C.auProfile();
assert.equal(p.code,"AU");
assert.equal(p.templates.P2001.fields.length,11);
assert.equal(p.templates.P2010.fields.length,23);
assert.equal(p.templates.P2001.fields[0].name,"ZHRKEY-PERNR");
assert.equal(p.templates.P2010.fields[3].name,"P2010-LGART");

const project=C.newProject(p,"AU example",2027,C.exampleEmployees(76));project.seed=835735;
const first=C.generate(project,p,true);
assert.ok(first.added>0);
const stableRows=project.events.map(e=>e.infotype+"|"+e.raw.join("\t")).sort();
const second=C.generate(project,p,true);
assert.equal(second.added,first.added);
assert.deepEqual(project.events.map(e=>e.infotype+"|"+e.raw.join("\t")).sort(),stableRows);
assert.equal(C.validateProject(project,p).filter(x=>x.severity==="error").length,0);
assert.ok(project.events.some(e=>e.infotype==="P2001"&&e.start.slice(4,6)!==e.end.slice(4,6)));

for(const type of ["P2001","P2010"]){
  const rows=project.events.filter(e=>e.infotype===type);
  const bytes=C.generateTxt(project,p,type,rows);
  assert.equal(bytes[0],0xff);
  assert.equal(bytes[1],0xfe);
  const parsed=C.parseTxt(bytes,type+".txt");
  assert.equal(parsed.rows.length,rows.length);
  assert.equal(parsed.field.length,2+p.templates[type].fields.length);
  const imported=C.newProject(p,"roundtrip",2027,[]);
  assert.equal(C.importParsed(imported,p,parsed),rows.length);
  assert.deepEqual(C.generateTxt(imported,p,type,imported.events),bytes,"TXT must survive roundtrip without altering bytes");
  assert.equal(C.importParsed(imported,p,parsed),0,"Repeated import must not duplicate identical rows");
}
const types=["P2001","P2010"];
const jan=C.batchEvents(project,types,1,1);
const feb=C.batchEvents(project,types,2,2);
const mar=C.batchEvents(project,types,3,3);
assert.equal(jan.length+feb.length+mar.length,C.batchEvents(project,types,1,3).length);
assert.equal(new Set(jan.concat(feb,mar).map(e=>e.id)).size,jan.length+feb.length+mar.length);
assert.ok(C.activeEvents(project,2).some(e=>e.start.slice(4,6)==="01"),"January absence should be visible in February where overlapping");

const zip=C.zipFiles([
 {name:"P2001.txt",data:C.generateTxt(project,p,"P2001",project.events.filter(e=>e.infotype==="P2001"))},
 {name:"P2010.txt",data:C.generateTxt(project,p,"P2010",project.events.filter(e=>e.infotype==="P2010"))}
]);
assert.equal(new DataView(zip.buffer).getUint32(0,true),0x04034b50);
assert.equal(new DataView(zip.buffer).getUint32(zip.length-22,true),0x06054b50);
assert.equal(new DataView(zip.buffer).getUint16(zip.length-12,true),2);

const newCountry=C.blankCountry("ZZ","Demo test","EUR");
newCountry.templates.P0015=C.newTemplate("P0015","One-time payments");
assert.equal(newCountry.templates.P0015.exportReady,false,"New countries cannot claim export compatibility without mapping");

const ui=fs.readFileSync(path.join(base,"index.html"),"utf8");
assert.ok(ui.includes('<script src="core.js"></script>')&&ui.includes('<script src="app.js"></script>'));
new Function(fs.readFileSync(path.join(base,"app.js"),"utf8"));
console.log("GlobalView Demo Builder v0.1: all synthetic core, export and UI syntax tests passed.");