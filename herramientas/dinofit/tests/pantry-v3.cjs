'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const foods=[
 {id:'coffee',name:'Café en cápsulas',unit:'ud',factor:1,kcal:200,min:0,max:200,category:'drinks'},
 {id:'cheese',name:'Queso light',unit:'ud',factor:25,kcal:267,min:267,max:267,category:'dairy'},
 {id:'activia-cereales',name:'Activia cereales',unit:'ud',factor:115,kcal:49,min:49,max:49,category:'dairy'},
 {id:'chicken',name:'Pechuga de pollo',unit:'g',factor:1,kcal:110,min:100,max:120,category:'proteins'},
 {id:'beef',name:'Filetes de ternera',unit:'g',factor:1,kcal:160,min:150,max:180,category:'proteins'},
 {id:'saute-chicken',name:'Salteado de verduras',unit:'g',factor:1,kcal:101,min:80,max:101,category:'veg'},
 {id:'garlic',name:'Ajo troceado congelado',unit:'g',factor:1,kcal:149,min:140,max:160,category:'veg'},
 {id:'oil',name:'Aceite de oliva',unit:'g',factor:1,kcal:900,min:900,max:900,category:'other'},
 {id:'curry',name:'Curry',unit:'g',factor:1,kcal:325,min:325,max:325,category:'other'},
 {id:'burger-chicken',name:'Burger de pollo',unit:'ud',factor:90,kcal:148,min:148,max:148,category:'proteins'},
];
const RECIPES=[{id:'mixed-chicken',name:'Pechuga y verduras',group:'mixed',parts:[['chicken',145],['saute-chicken',112.5]]},
 {id:'chicken',name:'Solo pechuga',group:'plain',parts:[['chicken',150]]}];
const state={foods,logs:[],pantry:{version:1,inventory:{},shopping:[],batches:[]}};
let seq=0,mockCount=8;const ctx=vm.createContext({
 state,RECIPES,console,Math,Date,Intl,Set,Map,JSON,Array,Object,Number,String,structuredClone,
 food:id=>foods.find(x=>x.id===id),pantryGroup:f=>f.category,
 pantryBalance:()=>null,pantryAction:()=>false,pantryCards:()=>'',currentPantry:()=>'',
 quickFoods:()=>'',pantryQty:(n,u)=>n+' '+u,htmlSafe:s=>String(s),
 locale:(n,d=0)=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d}),
 uid:()=> 'test-'+(++seq),isoToday:()=> '2026-11-23',dateValid:d=>/^\d{4}-\d{2}-\d{2}$/.test(d),
 makePart:(id,qty)=>({foodId:id,qty,kcal:qty*(foods.find(x=>x.id===id)?.kcal||0)/100}),
 inferFoodMeal:()=> 'Comida',changed:()=>{},render:()=>{},renderModal:()=>{},closeModal:()=>{},
 openPantryConsume:()=>{},toast:()=>{},document:{addEventListener(){},querySelector(){return null}},
 confirm:()=>true,asNum:x=>Number(x),$:s=>s.includes('name="count"')?{value:String(mockCount)}:null,
 pantryQuery:'',pantryBatchHtml:()=>'',activeView:'pantry'
});
for(const file of ['app-pantry-v2.js','app-pantry-v3.js']){
 const content=fs.readFileSync(path.join(root,file),'utf8');
 new vm.Script(content,{filename:file});vm.runInContext(content,ctx,{filename:file});
}
const p=ctx.DinoPantry,v3=ctx.DinoPantryV3;
assert.deepEqual([...v3.formats('coffee').sizes],[10,20]);
assert.deepEqual([...v3.formats('cheese').sizes],[12,13]);
assert.deepEqual([...v3.formats('activia-cereales').sizes],[4,8]);
assert.equal(v3.formats('oil').name,'botella','olive oil is not a tray');
assert.equal(v3.formats('garlic').name,'bolsa congelada','frozen garlic is not a tray');
assert.equal(v3.formats('curry').name,'bote','spices are not a tray');
assert.equal(v3.formats('chicken').name,'bandeja');
assert.equal(p.stock('coffee').known,false);
v3.buyPack('coffee',10);
assert.equal(p.stock('coffee').qty,10);
assert.equal(state.pantry.v2.stock.coffee.partial,true,'never invent prior stock');
v3.buyPack('coffee',20);
assert.equal(p.stock('coffee').qty,30);
assert.equal(state.pantry.v2.purchases.at(-1).packSize,20,'package size retained for kitchen');
p.eatUnit('coffee');assert.equal(p.stock('coffee').qty,29,'debit one capsule');
state.logs.pop();assert.equal(p.stock('coffee').qty,30,'revert consumption');
v3.buyPack('cheese',13);p.eatUnit('cheese');assert.equal(p.stock('cheese').qty,12,'debit one slice');
state.logs.pop();
v3.buyPack('activia-cereales',4);p.eatUnit('activia-cereales');assert.equal(p.stock('activia-cereales').qty,3,'debit one yogurt');
state.logs.pop();
v3.buyPack('garlic',250);assert.equal(p.stock('garlic').qty,250,'bag increments grams');
const consumeView=ctx.currentPantry();
assert.equal((consumeView.match(/role="tab"/g)||[]).length,3,'three pantry tabs');
assert.equal((consumeView.match(/role="tabpanel"/g)||[]).length,1,'one panel at a time');
assert.ok(consumeView.includes('pantry3-tile-emoji'),'visual quick stock cards');
assert.ok(consumeView.includes('data-action="pantry3-open"'),'tap card to buy');
assert.ok(!consumeView.includes('data-action="pantry2-eat"'),'no consume buttons in inventory');
assert.ok(!consumeView.includes('data-action="pantry3-buy-quick"'),'no purchase buttons on every tile');
v3.setTab('raw');const rawView=ctx.currentPantry();
assert.ok(rawView.includes('Ajo troceado congelado')&&!rawView.includes('Café en cápsulas'));
v3.setTab('tuppers');const tupperView=ctx.currentPantry();
assert.ok(!tupperView.includes('data-action="pantry2-eat-tupper"'),'no consuming from pantry tuppers');
v3.buyPack('saute-chicken',400);
const row={dataset:{row:'0'},store:{'[data-basic-ing]':{value:'saute-chicken'},'[data-basic-qty]':{value:''},'[data-basic-pcs]':{value:''},'.pantry3-ing-total':{textContent:''}},
 querySelector(s){return this.store[s]||null},querySelectorAll(){return [{dataset:{fraction:'0.25'},classList:{toggle(){}}},{dataset:{fraction:'0.5'},classList:{toggle(){}}},{dataset:{fraction:'1'},classList:{toggle(){}}}]}};
v3.portion(row,0.5);
assert.equal(+row.store['[data-basic-qty]'].value,25,'half a 400g bag split across 8 tuppers = 25g each');
assert.ok(row.store['.pantry3-ing-total'].textContent.includes('200'),'show total consumed by batch');
mockCount=14;v3.portion(row,0.5);assert.equal(+row.store['[data-basic-qty]'].value,14.285,'14 portions must not round above half pack');
p.recount('chicken',619,5);
const made=p.makeTuppers({date:'2026-11-23',count:2,title:'Pollo y verduras',recipeId:'custom',ingredients:[{foodId:'chicken',qty:150,pieces:1},{foodId:'saute-chicken',qty:25}],prepared:true});
assert.equal(made.length,2);assert.equal(p.stock('chicken').pieces,3);assert.equal(p.stock('chicken').qty,319);
p.eatTupper(made[0].id);assert.equal(p.stock('chicken').qty,319,'no double debit');
assert.equal(p.available().length,1);assert.match(ctx.currentPantry(),/≈ 190 kcal\/tupper/,'Tupper tile shows nutrition estimate for remaining portion');assert.ok(Array.isArray(state.pantry.batches),'legacy preserved');

// A counted product at zero is still shown as a tile, but must no longer inflate the badge.
state.logs=[];
state.pantry.v2={version:2,stock:{},purchases:[],tuppers:[],history:[]};
p.recount('chicken',429,6);
for(const id of ['beef','saute-chicken','garlic','oil','burger-chicken'])p.recount(id,0);
p.recount('activia-cereales',1);
p.recount('cheese',0);
p.purchase('coffee',4); // A received purchase with no baseline is still unknown.
p.recount('curry',0);
state.logs.push({id:'overdrawn-curry',date:'2026-11-23',parts:[{foodId:'curry',qty:1}]});
assert.equal(p.stock('curry').qty,-1);
assert.equal(p.stock('coffee').known,false);
assert.equal(p.stock('coffee').received,4);
p.makeTuppers({recipeId:'chicken',prepared:false});
const counted=p.makeTuppers({recipeId:'chicken',count:2,ingredients:[{foodId:'chicken',qty:100,pieces:1}]});
p.eatTupper(counted[0].id);
p.recount('chicken',429,6); // The remaining tray is separate from the prepared portions.
assert.equal(p.stock('chicken').pieces,6);
const badge=(view,id)=>Number(view.match(new RegExp('data-action="pantry3-tab" data-id="'+id+'">[^]*?<small>([0-9]+)</small>'))?.[1]);
v3.setTab('raw');
const exactRawView=ctx.currentPantry();
assert.equal(badge(exactRawView,'raw'),1,'Crudos counts one product, not six pieces or counted empty products');
assert.equal(badge(exactRawView,'consumables'),1,'Consumibles excludes zero and unknown balances');
assert.equal(badge(exactRawView,'tuppers'),1,'Tuppers counts prepared unconsumed units only');
assert.match(exactRawView,/data-action="pantry3-open" data-id="garlic" aria-label="Abrir Ajo troceado congelado, 0 g"/,'counted empty products remain in the catalog');
v3.setTab('consumables');
const exactConsumablesView=ctx.currentPantry();
assert.match(exactConsumablesView,/data-action="pantry3-open" data-id="coffee" aria-label="Abrir Café en cápsulas, sin inventario"/,'unverified products remain in the catalog');
console.log('PASS pantry: compact cards, correct packaging, unit consumption, half-bag portions, reversible inventory');
