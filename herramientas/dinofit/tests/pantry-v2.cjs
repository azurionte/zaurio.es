const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html'),css=read('app.css');
const scripts=['app.js','app-pantry.js','app-ui.js','app-events.js','app-pantry-v2.js'];
const catalog=(html.match(/<script id="catalog-data" type="application\/json">([\s\S]*?)<\/script>/)||[])[1];
assert.ok(catalog,'inline food catalogue required');
assert.ok(css.includes('.pantry2-zone{'),'v2 CSS loaded');
assert.ok(html.includes('app-pantry-v2.js'),'v2 script wired');
assert.ok(read('worker.mjs').includes("import pantryV2 from './app-pantry-v2.js'"),'worker serves v2');
for(const script of scripts){assert.ok(html.includes('/dinofit/'+script),'script used '+script);new vm.Script(read(script),{filename:script})}
const elements=new Map();
function el(key){if(!elements.has(key))elements.set(key,{_value:'',innerHTML:'',textContent:key==='#catalog-data'?catalog:'',hidden:false,dataset:{},classList:{toggle(){},add(){},remove(){}},addEventListener(){},getAttribute(key){return this.attrs?.[key]??null},setAttribute(key,value){(this.attrs??={})[key]=String(value)},removeAttribute(key){delete this.attrs?.[key]},querySelector(){return null},get value(){return this._value},set value(v){this._value=String(v)}});return elements.get(key)}
const ctx=vm.createContext({document:{readyState:'loading',querySelector:el,querySelectorAll(){return []},addEventListener(){},body:{appendChild(){}}},window:{addEventListener(){},location:{hash:''}},location:{origin:'https://herramientas.zaurio.es',pathname:'/dinofit/',search:''},history:{replaceState(){}},sessionStorage:{getItem(){return null},setItem(){}},Intl,Date,Math,JSON,String,Number,Array,Object,Set,Map,Blob,TextDecoder,Uint8Array,FormData:class {constructor(form){this.values=form.values}get(key){return this.values[key]??null}},console,crypto:require('node:crypto').webcrypto,structuredClone,setTimeout:()=>1,clearTimeout(){}});
for(const script of scripts)vm.runInContext(read(script),ctx,{filename:script});
const run=src=>vm.runInContext(src,ctx);
run('state=defaultDocument({user_metadata:{full_name:"Test user"}});account={id:"test-user"};selectedDate="2026-11-23";activeView="pantry";');
assert.equal(run('pantryBalance("activia-cereales")'),null,'legacy stock is unknown');
assert.equal(run('DinoPantry.stock("activia-cereales").known'),false);
for(const section of ['Consumibles','Crudos','Tuppers'])assert.ok(run('currentPantry()').includes(section),section+' visible');
assert.equal(run('state.logs.length'),0,'render does not add meals');
run('DinoPantry.recount("activia-cereales",2,null,null,4)');
run('DinoPantry.purchase("activia-cereales",6)');
assert.equal(run('DinoPantry.stock("activia-cereales").qty'),8);
run('state.logs.push({id:"morning",date:"2026-11-23",meal:"Desayuno",title:"Activia",parts:[makePart("activia-cereales",1)]})');
assert.equal(run('DinoPantry.stock("activia-cereales").qty'),7,'diary decrements stock');
run('state.logs=state.logs.filter(x=>x.id!=="morning")');
assert.equal(run('DinoPantry.stock("activia-cereales").qty'),8,'deleting diary entry restores stock');
run('DinoPantry.recount("chicken",619,5)');
run('DinoPantry.recount("saute-chicken",1000)');
run('DinoPantry.makeTuppers({recipeId:"custom",count:1,title:"Pollo con verduras",date:"2026-11-23",ingredients:[{foodId:"chicken",qty:247.6,pieces:2},{foodId:"saute-chicken",qty:100}],prepared:true})');
assert.equal(run('DinoPantry.stock("chicken").qty'),371.4);
assert.equal(run('DinoPantry.stock("chicken").pieces'),3);
assert.equal(run('DinoPantry.available().length'),1);
run('DinoPantry.eatTupper(DinoPantry.available()[0].id)');
assert.equal(run('DinoPantry.available().length'),0);
assert.equal(run('DinoPantry.stock("chicken").qty'),371.4,'eating does not double-debit raw');
assert.ok(run('state.logs.at(-1).pantryTupperId'));
run('state.logs.pop()');
assert.equal(run('DinoPantry.available().length'),1,'deleting log restores tupper');
run('DinoPantry.deleteTupper(DinoPantry.available()[0].id)');
assert.equal(run('DinoPantry.stock("chicken").qty'),619,'deleting tupper returns ingredients');
run('DinoPantry.makeTuppers({recipeId:"chicken",count:2,prepared:false,date:"2026-11-23"})');
assert.equal(run('DinoPantry.stock("chicken").qty'),619,'planning does not use stock');
run('DinoPantry.prepare(DinoPantry.data().tuppers[0].id)');
assert.equal(run('DinoPantry.stock("chicken").qty'),469);
const merged=run('state.pantry');
assert.ok(merged.inventory&&Array.isArray(merged.batches),'legacy pantry preserved');
assert.equal(run('validateState(state)'),true,'document valid for persistence');

{
 const savedState=run('structuredClone(state)');
 ctx.priorCompraTestState=savedState;
 run("state=defaultDocument({user_metadata:{full_name:'Compra test'}})");
 try{
  run("DinoPantry.recount('burger-chicken',2,2,180);DinoPantry.recount('flan',0,0,0);DinoPantry.purchase('flan',1)");
  run(`var freshOrder={id:'mercado-123',purchased:true,inventoryReceived:false,items:[
   {id:'raw-1',name:'Burger de pollo',productId:'2622',qty:1,inventory:{foodId:'burger-chicken',qty:6,pieces:6,grams:540}},
   {id:'raw-2',name:'Burger de pollo',productId:'2622',qty:1,inventory:{foodId:'burger-chicken',qty:6,pieces:6,grams:540}},
   {id:'dairy',name:'Flan',qty:2,inventory:{foodId:'flan',qty:4,pieces:4,grams:400}},
   {id:'unlinked',name:'Bolsas de basura',qty:1}
  ]}`);
  assert.equal(run('syncDinoCompraInventory(freshOrder).posted'),0,'confirmed order is not received stock');
  assert.equal(run('DinoPantry.stock("burger-chicken").qty'),2);
  assert.equal(run('DinoPantry.stock("flan").qty'),1);
  run('freshOrder.inventoryReceived=true;freshOrder.inventoryReceivedAt="2026-11-28T09:00:00Z"');
  assert.equal(run('syncDinoCompraInventory(freshOrder).posted'),2);
  assert.equal(run('syncDinoCompraInventory(freshOrder).skipped'),1,'unrelated goods not added');
  assert.equal(run('syncDinoCompraInventory(freshOrder).posted'),0,'same purchase twice is idempotent');
  assert.equal(run('DinoPantry.stock("burger-chicken").qty'),14);
  assert.equal(run('DinoPantry.stock("burger-chicken").grams'),1260);
  assert.equal(run('DinoPantry.stock("flan").qty'),9);
  assert.equal(run('DinoPantry.data().purchases.length'),3,'two order lines of one food share a stable receipt plus the other food and manual receipt');
  assert.equal(run('DinoPantry.data().purchases[1].at'),'2026-11-28T09:00:00.000Z');
  assert.equal(run('DinoPantry.data().purchases[1].sourceItemIds.join(",")'),'raw-1,raw-2');
  assert.throws(()=>run('DinoPantry.undoPurchase(DinoPantry.data().purchases[1].id)'),/desde la sección Compra/);
  assert.equal(run('freshOrder.items.shift();syncDinoCompraInventory(freshOrder).posted'),1,'editing a line replaces its contribution rather than adding more stock');
  assert.equal(run('DinoPantry.stock("burger-chicken").qty'),8);
  run('state.logs.push({id:"used",date:"2026-11-28",parts:[makePart("flan",4)]})');
  assert.throws(()=>run('syncDinoCompraInventory({...freshOrder,purchased:false})'),/Ya se han usado existencias/);
  assert.equal(run('DinoPantry.stock("burger-chicken").qty'),8,'unsafe correction does not partially withdraw other goods');
  assert.equal(run('state.logs.length'),1,'correction does not remove consumption diary');
  assert.equal(run('state.logs.pop();syncDinoCompraInventory({...freshOrder,purchased:false}).withdrawn'),2);
  assert.equal(run('DinoPantry.stock("burger-chicken").qty'),2);
  assert.equal(run('DinoPantry.stock("flan").qty'),1,'manual receipt stays');
  assert.equal(run('syncDinoCompraInventory(freshOrder).posted'),2);
  assert.equal(run('DinoPantry.data().purchases.length'),3,'receive again reactivates existing receipt ids');
  run("DinoPantry.recount('flan',9)");
  assert.throws(()=>run('syncDinoCompraInventory({...freshOrder,items:[]})'),/incluida en un recuento/);
  assert.equal(run('DinoPantry.stock("flan").qty'),9);
  assert.equal(run('suggestDinoCompraInventory({name:"Burger de pollo"})'),null,'unverified ambiguous format is not guessed');
  assert.equal(run('suggestDinoCompraInventory({name:"Burger de pollo",productId:"2622"}).qty'),6);
  assert.equal(run('suggestDinoCompraInventory({name:"Refresco Coca-Cola zero azúcar",productId:"27449"}).qty'),4000);
  assert.equal(run('suggestDinoCompraInventory({name:"Filetes pechuga de pollo",productId:"2787"})'),null,'variable-weight poultry has no assumed mass');
  run(`var maize={name:'Maíz dulce Hacendado',productId:'16712',qty:1};
   maize.inventory=suggestDinoCompraInventory(maize);
   var secondOrder={id:'mercado-124',purchased:true,inventoryReceived:false,items:[maize]}`);
  assert.equal(run('food("mercadona-16712")'),undefined);
  assert.equal(run('syncDinoCompraInventory(secondOrder).posted'),0);
  assert.equal(run('food("mercadona-16712")'),undefined,'an ordered but not received pack does not create a catalog item');
  assert.equal(run('syncDinoCompraInventory({...secondOrder,inventoryReceived:true}).linked'),1);
  assert.equal(run('food("mercadona-16712").unit'),'g');
  assert.equal(run('DinoPantry.stock("mercadona-16712").received'),420,'raw maize uses verified drained weight without assuming prior stock');
  assert.equal(run('DinoPantry.stock("mercadona-16712").known'),false);
  assert.equal(run('syncDinoCompraInventory({...secondOrder,inventoryReceived:true}).posted'),0);
  assert.equal(run('state.foods.filter(f=>f.id==="mercadona-16712").length'),1);
  run('state.logs.push({id:"maize-used",date:"2099-11-28",parts:[makePart("mercadona-16712",100)]})');
  assert.throws(()=>run('syncDinoCompraInventory({...secondOrder,purchased:false})'),/consumos.+posteriores/,'uncounted stock with subsequent use cannot be silently reversed');
  assert.equal(run('DinoPantry.stock("mercadona-16712").received'),420);
  run(`var bif={name:'Bífidus con nueces y cereales probióticos Hacendado 0% MG',productId:'21329',qty:1};
   state.foods.push({id:'custom-bifidus',name:bif.name,unit:'ud',factor:125,kcal:56.8,min:56.8,max:56.8,category:'dairy'});
   bif.inventory={foodId:'mercadona-21329',qty:4,pieces:4,grams:500};
   syncDinoCompraInventory({id:'mercado-125',purchased:true,inventoryReceived:true,items:[bif]})`);
  assert.equal(run('food("mercadona-21329")'),undefined,'reuse an equivalent user-created product');
  assert.equal(run('DinoPantry.stock("custom-bifidus").received'),4,'consumable receipt counts individual pots');
  assert.equal(run('getDinoCompraInventoryOptions().some(f=>f.foodId==="custom-bifidus")'),true);
  assert.equal(run('validateState(state)'),true);
 }finally{run('state=priorCompraTestState');delete ctx.priorCompraTestState}
}

async function checkDiary(){
 const click=dataset=>ctx.actionHandler({target:{closest:()=>({dataset})}});
 run(`activeView='today';selectCalendarDay('2026-11-23',false);
  state.pantry.v2.tuppers=[];
  state.logs.push({id:'existing-snack',date:selectedDate,meal:'Merienda',title:'Tentempié anotado',parts:[{foodId:'activia-cereales',qty:1,kcal:88}]});
  DinoPantry.recount('chicken',619,12);
  DinoPantry.recount('activia-cereales',1);
  DinoPantry.recount('cheese',0);
  const normal=DinoPantry.makeTuppers({recipeId:'mixed-chicken',title:'Pollo con verduras',ingredients:[{foodId:'chicken',qty:100,pieces:2},{foodId:'saute-chicken',qty:20}],date:selectedDate})[0];
  const duplicate=DinoPantry.makeTuppers({recipeId:'mixed-chicken',title:'Pollo con verduras',ingredients:[{foodId:'saute-chicken',qty:20},{foodId:'chicken',qty:100,pieces:2}],date:selectedDate})[0];
  const large=DinoPantry.makeTuppers({recipeId:'mixed-chicken',title:'Pollo con verduras',ingredients:[{foodId:'chicken',qty:100,pieces:4},{foodId:'saute-chicken',qty:20}],date:selectedDate})[0];
  const different=DinoPantry.makeTuppers({recipeId:'mixed-beef',title:'Ternera con verduras',ingredients:[{foodId:'beef',qty:100},{foodId:'saute-chicken',qty:20}],date:selectedDate})[0];
  DinoPantry.makeTuppers({recipeId:'chicken',title:'Aún planificado',prepared:false,date:selectedDate});
  DinoPantry.makeTuppers({recipeId:'chicken',title:'Preparación posterior',ingredients:[{foodId:'chicken',qty:10}],date:'2026-11-24'});`);
 const content=()=>el('#content').innerHTML;
 const cardCount=()=>[...content().matchAll(/data-action="pantry2-eat-tupper"/g)].length;
 const hasRecipe=id=>content().includes('data-recipe="'+id+'"');
 const logTupper=id=>click({action:'pantry2-eat-tupper',date:'2026-11-23',id});
 await click({action:'dashboard-tab',tab:'nutrition'});
 let view=content();
 assert.match(view,/<div class="nutrition-total"><strong>88<\/strong>/,'opening kcal preserves existing calories');
 assert.doesNotMatch(view,/Tuppers disponibles|Aún planificado|Preparación posterior/,'no standalone list, planned or later meals');
 assert.match(view,/¿Qué has comido\?[\s\S]*?data-action="pantry2-eat-tupper"/,'actual quick choices appear inside the existing section');
 assert.equal(cardCount(),3,'identical preparations collapse; other recipes and different piece counts remain distinct');
 assert.match(view,/<strong>Pollo con verduras · 2 filetes · 100 g<\/strong><small class="quick-availability">2 disponibles<\/small>/);
 assert.match(view,/<strong>Pollo con verduras · 4 filetes · 100 g<\/strong><small class="quick-availability">1 disponible<\/small>/);
 assert.equal(run('state.logs.length'),1,'opening the kcal view never records a meal');
 assert.equal(hasRecipe('activia'),true);
 assert.match(view,/<span class="quick-kcal">≈ 56 kcal<\/span>/,'stocked Activia shows kcal for one yogurt');
 for(const id of ['cheese','flan','yopro','cola','coffee','mixed-chicken'])assert.equal(hasRecipe(id),false,id+' not stocked');
 const before=run('DinoPantry.stock("chicken").qty');
 const normal=run('normal.id'),duplicate=run('duplicate.id');
 await logTupper(normal);
 assert.equal(cardCount(),3,'same type stays visible while a portion remains');
 assert.equal(run('state.logs.at(-1).pantryTupperId'),normal);
 assert.equal(run('state.logs.at(-1).date'),'2026-11-23');
 assert.match(content().split('<div class="food-record-grid"')[1].split('<div class="nutrition-foot"')[0],/<h3>Pollo con verduras<\/h3>/,'consumed tupper appears in the existing diary by name');
 assert.match(content(),/<div class="nutrition-total"><strong>218<\/strong>/,'the existing calories and consumed portion are counted');
 await logTupper(normal);
 assert.equal(run('state.logs.length'),2,'stale double tap cannot log the same portion twice');
 await logTupper(duplicate);
 assert.equal(cardCount(),2,'type disappears after its last portion');
 assert.equal(run('DinoPantry.stock("chicken").qty'),before,'cooked food never debits raw stock twice');
 run(`DinoPantry.makeTuppers({recipeId:'mixed-chicken',title:'Pollo con verduras',ingredients:[{foodId:'chicken',qty:100,pieces:2},{foodId:'saute-chicken',qty:20}],date:selectedDate});render()`);
 assert.equal(cardCount(),3,'preparing another matching portion restores its shortcut');

 const refresh=changes=>run(changes+';render()');
 const use=(recipe,parts)=>run(`saveFoodForm({dataset:{recipeId:'${recipe}'},values:{date:'2026-11-23'},querySelectorAll:()=>${JSON.stringify(parts.map(([foodId,value])=>({value,dataset:{foodId}})))}})`);
 assert.throws(()=>use('activia',[['activia-cereales',2]]),/No hay existencias/,'cannot record more than stock through the quick form');
 use('activia',[['activia-cereales',1]]);
 assert.equal(hasRecipe('activia'),false,'last yogurt removes its shortcut');
 refresh(`DinoPantry.purchase('activia-cereales',1);DinoPantry.recount('coffee',1)`);
 assert.equal(hasRecipe('activia'),true,'restock restores shortcut');
 assert.equal(hasRecipe('coffee'),false,'unknown milk blocks composite coffee even with capsule');
 refresh(`DinoPantry.recount('milk',119.999)`);
 assert.equal(hasRecipe('coffee'),false,'insufficient milk blocks coffee');
 refresh(`DinoPantry.recount('milk',120);DinoPantry.recount('coffee',0)`);
 assert.equal(hasRecipe('coffee'),false,'milk alone does not offer coffee');
 refresh(`DinoPantry.purchase('coffee',1)`);
 assert.equal(hasRecipe('coffee'),true,'both stocked ingredients unlock exactly one serving');
 assert.match(content(),/<span class="quick-kcal">≈ 44 kcal<\/span>/,'coffee estimate includes the capsule and milk');
 use('coffee',[['coffee',1],['milk',120]]);
 assert.equal(run('DinoPantry.stock("milk").qty'),0);
 assert.equal(run('DinoPantry.stock("coffee").qty'),0);
 assert.equal(hasRecipe('coffee'),false,'consuming composite empties both ingredients and removes button');
 const old=run('state.logs.at(-1).id');
 run('formEntryId='+JSON.stringify(old));
 use('coffee',[['coffee',1],['milk',120]]);
 assert.equal(run('state.logs.at(-1).id'),old,'editing saved items is not blocked by zero current stock');
 // Cacaolat is a private, user-added catalogue item, not shipped with the defaults.
 run('formEntryId=null');
 assert.equal(hasRecipe('cacaolat'),false,'no Cacaolat recipe on accounts without the product');
 refresh(`state.foods.push({id:'cacaolat-0',name:'Cacaolat 0% sin azúcares añadidos',
  category:'drinks',unit:'ml',factor:1,kcal:53,min:53,max:53});DinoPantry.recount('cacaolat-0',199)`);
 assert.equal(hasRecipe('cacaolat'),false,'less than a full glass does not offer a shortcut');
 refresh(`DinoPantry.recount('cacaolat-0',400)`);
 const drinks=content().split('food-group-drinks')[1];
 assert.match(drinks,/<h3>Bebidas<\/h3>[\s\S]*?data-recipe="cacaolat"[\s\S]*?≈ 106 kcal[\s\S]*?Vaso de Cacaolat 0% · 200 ml<\/strong>/);
 const beforeGlass=run('state.logs.length');
 const openGlass=()=>click({action:'add-food',recipe:'cacaolat'});
 const plus=()=>click({action:'cacaolat-more'});
 const minus=()=>click({action:'cacaolat-less'});
 const drink=()=>click({action:'cacaolat-drink'});
 const amount=()=>el('#cacaolat-amount').textContent;
 await openGlass();
 assert.equal(amount(),'200 ml','modal starts at 200 ml');
 assert.match(el('#modalMount').innerHTML,/<button[^>]*data-action="cacaolat-drink"[\s\S]*?<svg[\s\S]*?class="cacaolat-amount">200 ml<\/span><\/button>/,'the illustrated glass is the actionable button and contains the amount');
 assert.doesNotMatch(el('#modalMount').innerHTML,/type="submit"|Guardar comida/,'no separate submit');
 await minus();assert.equal(amount(),'150 ml');
 await plus();await plus();assert.equal(amount(),'250 ml');
 assert.match(el('#cacaolat-summary').textContent,/250 ml · 133 kcal/);
 assert.equal(run('state.logs.length'),beforeGlass,'opening and adjusting do not log');
 assert.equal(run('DinoPantry.stock("cacaolat-0").qty'),400,'opening and adjusting do not debit stock');
 run("keyHandler({key:'Escape'})");
 assert.equal(el('#modalMount').hidden,true,'Escape dismisses');
 await drink();assert.equal(run('state.logs.length'),beforeGlass,'dismissed pour cannot be saved');
 await openGlass();assert.equal(amount(),'200 ml','reopening resets the default');
 for(let i=0;i<5;i++)await plus();
 assert.equal(amount(),'400 ml','maximum respects stock');
 assert.equal(el('#cacaolat-more').getAttribute('aria-disabled'),'true');
 for(let i=0;i<8;i++)await minus();
 assert.equal(amount(),'50 ml','minus never selects zero');
 assert.equal(el('#cacaolat-less').getAttribute('aria-disabled'),'true');
 await plus();await plus();await plus();
 await Promise.all([drink(),drink()]);
 assert.equal(run('state.logs.length'),beforeGlass+1,'rapid double tap only records one glass');
 assert.equal(run('DinoPantry.stock("cacaolat-0").qty'),200,'saving one glass debits 200 ml once');
 assert.equal(run('logTotal(state.logs.at(-1).parts)'),106);
 assert.equal(hasRecipe('cacaolat'),true,'exactly one glass of stock keeps the shortcut');
 await openGlass();assert.equal(el('#cacaolat-more').getAttribute('aria-disabled'),'true');
 await minus();await drink();
 assert.equal(run('DinoPantry.stock("cacaolat-0").qty'),50,'saving a 150 ml glass debits selected amount');
 assert.equal(run('state.logs.at(-1).parts[0].qty'),150);
 assert.equal(hasRecipe('cacaolat'),false,'less than a default glass removes the shortcut');
 refresh(`DinoPantry.recount('burger-chicken',4);
  const burger=DinoPantry.makeTuppers({recipeId:'mixed-chickenburgers',title:'2 hamburguesas de pollo + verduras',ingredients:[{foodId:'burger-chicken',qty:2},{foodId:'saute-chicken',qty:20}],date:selectedDate})[0];
  DinoPantry.makeTuppers({recipeId:'mixed-chickenburgers',title:'2 hamburguesas de pollo + verduras',ingredients:[{foodId:'burger-chicken',qty:2},{foodId:'saute-chicken',qty:40}],date:selectedDate})`);
 const burgerId=run('burger.id');
 const card=content().split('data-id="'+burgerId+'"')[1].split('</button>')[0];
 assert.match(card,/<span class="quick-kcal">≈ 287 kcal<\/span>/,'per-tupper calories include both burgers and the vegetables');
 assert.match(card,/<span class="quick-copy"><strong>2 hamburguesas de pollo \+ verduras<\/strong><small class="quick-availability">1 disponible<\/small><\/span>/,'show the complete food name once and only availability below');
 console.log('PASS DinoFit pantry: diary, stock-only shortcuts, grouping, depletion, restock and compatible edits');
}

async function checkCompraPersistence(){
 ctx.previousReceiptRuntime=run('({state,db,dirty,conflict,saveError,revision,changeCount,activeView})');
 ctx.remotePurchaseDocument={revision:10,document:run('defaultDocument({user_metadata:{full_name:"Concurrent receipt"}})'),writes:0};
 try{
  run(`state=structuredClone(remotePurchaseDocument.document);revision=10;dirty=false;conflict=false;saveError='';activeView='pantry';
   var stalePurchaseDocument=structuredClone(state);
   var serverOrder={id:'mercado-concurrent',purchased:true,inventoryReceived:true,items:[
    {id:'order-item',qty:1,inventory:{foodId:'flan',qty:4,pieces:4,grams:400}}
   ]};
   db={from(table){return {update(payload){let requiredRevision,owner; const q={
    eq(key,value){if(key==='revision')requiredRevision=value;if(key==='user_id')owner=value;return q},
    async select(){if(table!=='dinofit_documents'||owner!==account.id)throw Error('wrong document');
     remotePurchaseDocument.writes++;
     if(requiredRevision!==remotePurchaseDocument.revision)return {data:[]};
     remotePurchaseDocument.document=structuredClone(payload.document);remotePurchaseDocument.revision++;
     return {data:[{revision:remotePurchaseDocument.revision}]} }
   };return q}}}};
   syncDinoCompraInventory(serverOrder);
   syncDinoCompraInventory(serverOrder);changed();`);
  assert.deepEqual(Array.from(await run('Promise.all([persistNow(),persistNow()])')),[true,true],'rapid double save shares a revision-checked request');
  assert.equal(ctx.remotePurchaseDocument.writes,1);
  assert.equal(ctx.remotePurchaseDocument.document.pantry.v2.purchases.length,1);
  const initialReceiptId=ctx.remotePurchaseDocument.document.pantry.v2.purchases[0].id;
  run(`state=stalePurchaseDocument;revision=10;
   syncDinoCompraInventory(serverOrder);changed();`);
  assert.equal(await run('persistNow()'),false,'out-of-date device cannot overwrite the successful receipt');
  assert.equal(run('conflict'),true);
  assert.equal(ctx.remotePurchaseDocument.document.pantry.v2.purchases.length,1);
  run(`state=structuredClone(remotePurchaseDocument.document);revision=remotePurchaseDocument.revision;dirty=false;conflict=false;saveError='';`);
  assert.equal(run('syncDinoCompraInventory(serverOrder).posted'),0,'reloaded receipt replay is a no-op');
  assert.equal(run('DinoPantry.stock("flan").received'),4);
  assert.equal(await run('persistNow()'),true);
  assert.equal(ctx.remotePurchaseDocument.writes,2,'no remote write for idempotent replay after load');
  assert.equal(ctx.remotePurchaseDocument.document.pantry.v2.purchases[0].id,initialReceiptId);
 }finally{
  run(`({state,db,dirty,conflict,saveError,revision,changeCount,activeView}=previousReceiptRuntime);`);
  delete ctx.previousReceiptRuntime;delete ctx.remotePurchaseDocument;
 }
}

checkCompraPersistence().then(checkDiary).catch(error=>{console.error(error);process.exitCode=1});
