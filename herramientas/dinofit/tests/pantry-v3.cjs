'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const foods=[
 {id:'coffee',name:'Café en cápsulas',unit:'ud',factor:1,kcal:200,min:0,max:200,category:'drinks'},
 {id:'cheese',name:'Queso light',unit:'ud',factor:25,kcal:267,min:267,max:267,category:'dairy'},
 {id:'activia-cereales',name:'Activia cereales',unit:'ud',factor:115,kcal:49,min:49,max:49,category:'dairy'},
 {id:'chicken',name:'Pechuga de pollo',unit:'g',factor:1,kcal:110,min:100,max:120,category:'proteins'},
 {id:'saute-chicken',name:'Verduras',unit:'g',factor:1,kcal:101,min:80,max:101,category:'veg'}
];
const RECIPES=[{id:'mixed-chicken',name:'Pechuga y verduras',group:'mixed',parts:[['chicken',145],['saute-chicken',112.5]]},
 {id:'chicken',name:'Solo pechuga',group:'plain',parts:[['chicken',150]]}];
const state={foods,logs:[],pantry:{version:1,inventory:{},shopping:[],batches:[]}};
let seq=0; const ctx=vm.createContext({
 state,RECIPES,console,Math,Date,Intl,Set,Map,JSON,Array,Object,Number,String,structuredClone,
 food:id=>foods.find(x=>x.id===id),pantryGroup:f=>f.category,
 pantryBalance:()=>null,pantryAction:()=>false,pantryCards:()=>'',currentPantry:()=>'',
 quickFoods:()=>'',pantryQty:(n,u)=>n+' '+u,htmlSafe:s=>String(s),
 locale:(n,d=0)=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d}),
 uid:()=> 'test-'+(++seq),isoToday:()=> '2026-11-23',
 dateValid:d=>/^\d{4}-\d{2}-\d{2}$/.test(d),
 makePart:(id,qty)=>({foodId:id,qty,kcal:qty*(foods.find(x=>x.id===id)?.kcal||0)/100}),
 inferFoodMeal:()=> 'Comida',changed:()=>{},render:()=>{},renderModal:()=>{},closeModal:()=>{},
 openPantryConsume:()=>{},toast:()=>{},document:{addEventListener(){},querySelector(){return null}},
 confirm:()=>true,asNum:x=>Number(x),$:()=>null,pantryQuery:'',pantryBatchHtml:()=>'',activeView:'pantry'
});
for(const file of ['app-pantry-v2.js','app-pantry-v3.js']){
 const content=fs.readFileSync(path.join(root,file),'utf8');
 new vm.Script(content,{filename:file});vm.runInContext(content,ctx,{filename:file});
}
const p=ctx.DinoPantry,v3=ctx.DinoPantryV3;
assert.deepEqual([...v3.formats('coffee').sizes],[10,20]);
assert.deepEqual([...v3.formats('cheese').sizes],[12,13]);
assert.deepEqual([...v3.formats('activia-cereales').sizes],[4,8]);
assert.equal(p.stock('coffee').known,false);
v3.buyPack('coffee',10);
assert.equal(p.stock('coffee').qty,10);
assert.equal(state.pantry.v2.stock.coffee.partial,true,'unknown original stock is not fabricated');
v3.buyPack('coffee',20);
assert.equal(p.stock('coffee').qty,30);
p.eatUnit('coffee');assert.equal(p.stock('coffee').qty,29,'subtract one capsule');
state.logs.pop();assert.equal(p.stock('coffee').qty,30,'revert consumption');
v3.buyPack('cheese',13);assert.equal(p.stock('cheese').qty,13);
p.eatUnit('cheese');assert.equal(p.stock('cheese').qty,12,'subtract one slice');
state.logs.pop();
v3.buyPack('activia-cereales',4);assert.equal(p.stock('activia-cereales').qty,4);
p.eatUnit('activia-cereales');assert.equal(p.stock('activia-cereales').qty,3,'subtract one yogurt');
state.logs.pop();
p.recount('chicken',619,5);p.recount('saute-chicken',650);
const made=p.makeTuppers({date:'2026-11-23',count:1,title:'Pollo y verduras',recipeId:'custom',ingredients:[{foodId:'chicken',qty:247.6,pieces:2},{foodId:'saute-chicken',qty:100}],prepared:true});
assert.equal(made.length,1);assert.equal(p.stock('chicken').pieces,3);
assert.equal(p.stock('chicken').qty,371.4);
p.eatTupper(made[0].id);assert.equal(p.stock('chicken').qty,371.4,'no double debit');
const html=ctx.currentPantry();
assert.equal((html.match(/role="tab"/g)||[]).length,3,'exactly three tabs');
assert.equal((html.match(/role="tabpanel"/g)||[]).length,1,'one active section');
assert.ok(html.includes('data-size="10"')&&html.includes('data-size="20"'));
assert.ok(html.includes('pantry3-big')&&!html.includes('Pechuga de pollo'));
v3.setTab('raw');const raw=ctx.currentPantry();
assert.ok(raw.includes('Pechuga de pollo')&&!raw.includes('Café en cápsulas'));
v3.setTab('tuppers');const tuppers=ctx.currentPantry();
assert.ok(tuppers.includes('Tuppers')&&!tuppers.includes('Queso light'));
assert.ok(Array.isArray(state.pantry.batches),'legacy batches preserved');
console.log('PASS Pantry v3: tabs, quick package sizes, units, legacy stock, individual tuppers');
