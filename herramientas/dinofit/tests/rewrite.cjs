const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const get=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=get('index.html'),css=get('app.css');
const scripts=['app.js','app-ui.js','app-events.js'].map(get);
const catalog=(html.match(/<script id="catalog-data" type="application\/json">([\s\S]*?)<\/script>/)||[])[1];
assert.ok(catalog,'inline food catalog required');
for(const s of scripts)new vm.Script(s);
for(const name of ['app.css','app.js','app-ui.js','app-events.js'])assert.ok(html.includes('/dinofit/'+name),'index references '+name);
assert.ok(css.includes('--bg:#090e1a')&&css.includes('.scale-card{'),'dark design tokens must be present');
assert.ok(!html.includes('function renderToday(')&&!html.includes('<style>'),'old inline application and styles removed');
const elMap=new Map();
function el(key){
 if(!elMap.has(key))elMap.set(key,{
  _value:'',get value(){return this._value},set value(v){this._value=String(v)},
  innerHTML:'',textContent:key==='#catalog-data'?catalog:'',dataset:{},hidden:false,
  classList:{toggle(){},add(){},remove(){}},setAttribute(){},removeAttribute(){},
  appendChild(){},querySelector(){return null},querySelectorAll(){return []},
  focus(){},remove(){}
 });
 return elMap.get(key);
}
const sessionData=new Map();
const ctx=vm.createContext({
 document:{readyState:'loading',querySelector:el,querySelectorAll(){return []},addEventListener(){},body:{appendChild(){},className:''},createElement(){return el('created')}},
 window:{addEventListener(){},location:{hash:''}},
 location:{origin:'https://herramientas.zaurio.es',pathname:'/dinofit/',search:''},
 history:{replaceState(){}},sessionStorage:{getItem:k=>sessionData.get(k)||null,setItem:(k,v)=>sessionData.set(k,v),removeItem:k=>sessionData.delete(k)},
 Intl,Date,Math,JSON,String,Number,Array,Object,Set,Map,Blob,TextDecoder,Uint8Array,
 console,crypto:require('node:crypto').webcrypto,structuredClone,
 setTimeout:()=>1,clearTimeout(){},
});
for(const js of scripts)vm.runInContext(js,ctx);
const run=s=>vm.runInContext(s,ctx);
run('state=defaultDocument({user_metadata:{full_name:"Test"}});account={id:"test-user"};selectedDate="2026-04-18"');
assert.equal(run('state.weights.length'),0);
assert.equal(run('validateState(state)'),true);
run('state.weights.push({id:"legacy",date:"2026-03-20",weight:112,approx:false,note:"old"})');
const synthetic=Array.from({length:8},(_,i)=>({
 date:'2026-04-'+String(11+i).padStart(2,'0'),
 weight: +(108.4-i*.2).toFixed(2),bodyFat:+(33-i*.15).toFixed(2),skeletalMuscle:30+i*.1,
 bmi:40-i*.09,muscleMass:54+i*.03,protein:13+i*.01,bmr:1850-i,
 fatFreeMass:72+i*.01,subcutaneousFat:35-i*.1,visceralFat:23,bodyWater:39+i*.1,boneMass:3.2,
 ...(i===3?{alternates:[{time:'16:22',weight:107.6,bodyFat:32.1}]}:{})
}));
const payload={type:'dinofit-chat-import-v1',weights:synthetic,targetWeight:85,trackingStartDate:'2026-04-11',
 activities:[{date:'2026-04-17',type:'Beat Saber',minutes:7.5,note:'VR en dificultad alta'}]};
const parsed=run('normalizeImport('+JSON.stringify(payload)+')');
assert.equal(parsed.weights.length,8);
run('mergeImport(normalizeImport('+JSON.stringify(payload)+'))');
assert.equal(run('state.weights.length'),9,'retain old entry and import new entries');
assert.equal(run('timeLine().length'),8,'current period excludes historical record');
assert.equal(run('state.weights.find(w=>w.date==="2026-04-14").alternates[0].weight'),107.6);
assert.equal(run('state.activities[0].minutes'),7.5);
assert.equal(run('state.profile.targetWeight'),85);
assert.equal(run('validateState(state)'),true);
assert.throws(()=>run('normalizeImport({type:"dinofit-chat-import-v1",weights:[{date:"2026-04-19",weight:-1}]})'));
const rendered=run('currentDay()');
assert.equal((rendered.match(/data-action="dashboard-tab"/g)||[]).length,4,'four accessible dashboard tabs');
assert.ok(rendered.includes('Kilos que faltan')&&rendered.includes('Kcal del ')&&rendered.includes('Ritmo y composición'));
assert.ok(rendered.includes('Seguimiento activo')&&rendered.includes('Ritmo medido'));
assert.equal((rendered.match(/stroke-dasharray=/g)||[]).length>=2,true,'two forecast models');
assert.ok(!rendered.includes('NaN')&&!rendered.includes('undefined'));
const baseline=run('projections()');
assert.ok(baseline.slope<0&&baseline.activeSlope<0&&baseline.empDate&&baseline.adjDate);
assert.equal(baseline.evidence.completed,0,'do not treat incomplete days as full intake');
run('dashboardArea="composition"');
const composition=run('currentDay()');
assert.equal((composition.match(/data-action="composition-metric"/g)||[]).length,15,'12 scale metrics and 3 derived indicators');
assert.ok(composition.includes('Grasa calculada')&&composition.includes('Masa sin grasa calculada')&&composition.includes('Agua calculada'));
assert.ok(composition.includes('variación porcentual'));
run('compositionFocus="fatKg"');
const isolated=run('currentDay()');
assert.ok(isolated.includes('Vista individual: Grasa calculada')&&isolated.includes('composition-key isolate'));
run('compositionFocus="all";dashboardArea="goal"');
const goals=run('currentDay()');
assert.ok(goals.includes('Tu camino hasta')&&goals.includes('Actividad física'));
run('dashboardArea="nutrition"');
const foods=run('currentDay()');
assert.equal((foods.match(/data-recipe=/g)||[]).length,14,'eight tuppers and six drink/snack shortcuts');
assert.ok(foods.includes('Platos con salteados')&&foods.includes('Solo proteína'));
assert.ok(foods.includes('Postres y lácteos')&&foods.includes('Bebidas'));
assert.ok(foods.includes('Día completo'));
assert.ok(foods.includes('data-recipe="cola"'));
assert.equal(run('makePart("cola",330).kcal'),0);

assert.equal(run('foodTone("Desayuno")'),'breakfast');
assert.equal(run('foodTone("Comida")'),'lunch');
assert.equal(run('foodTone("Merienda")'),'snack');
assert.equal(run('foodTone("Otro")'),'other');
const burgerArt=run('foodEmojis({parts:[{foodId:"burger-chicken",qty:2},{foodId:"saute-chicken",qty:56.25},{foodId:"saute-frank",qty:56.25},{foodId:"oil",qty:7}]})');
assert.equal(JSON.stringify(burgerArt),JSON.stringify(['🍔','🍔','🥦','🥔']),'the drawing represents both burgers and the two salteados');
assert.equal(JSON.stringify(run('foodEmojis({parts:[{foodId:"flan",qty:1}]})')),JSON.stringify(['🍮']));
assert.equal(JSON.stringify(run('foodEmojis({parts:[{foodId:"coffee",qty:2},{foodId:"milk",qty:120}]})')),JSON.stringify(['☕','🥛']));
assert.equal(JSON.stringify(run('foodEmojis({parts:[{foodId:"unknown-custom-id",qty:1}],title:"Mi plato"})')),JSON.stringify(['🍽️']),'unknown foods have a neutral fallback');
run('state.logs=[{id:"meal-beef",date:"2026-04-18",meal:"Comida",title:"2 burgers de pollo + salteados",parts:[makePart("burger-chicken",2),makePart("saute-chicken",56.25),makePart("saute-frank",56.25),makePart("oil",7)]},{id:"meal-flan",date:"2026-04-18",meal:"Otro",title:"Flan proteico",parts:[makePart("flan",1)]},{id:"meal-coffee",date:"2026-04-18",meal:"Desayuno",title:"Café con leche desnatada",parts:[makePart("coffee",2),makePart("milk",120)]}]');
const illustrated=run('currentDay()');
assert.ok(illustrated.includes('Tu diario de comidas')&&illustrated.includes('Alimentos registrados'));
assert.equal((illustrated.match(/class="food-record-card/g)||[]).length,3,'each recorded item has a visual card');
assert.equal((illustrated.match(/class="plate-sticker tone-/g)||[]).length,0,'no duplicate gallery of recorded foods');
assert.equal((illustrated.match(/class="section nutrition-overview food-records-section"/g)||[]).length,1,'single nutrition panel for summary and entries');
assert.equal((illustrated.match(/data-action="edit-food"/g)||[]).length,3,'one editable card for each record');
assert.ok(illustrated.includes('class="meal-slice tone-breakfast"')&&illustrated.includes('class="meal-slice tone-lunch"')&&illustrated.includes('class="meal-slice tone-other"'),'colored meal groups');
assert.ok(illustrated.includes('data-action="edit-food" data-id="meal-beef"'),'edit action still targets the original record');
assert.ok(illustrated.includes('825')===false,'calories must be calculated, not hardcoded');
assert.equal(run('dayLogs().reduce((n,e)=>n+logTotal(e.parts),0)').toFixed(2),(457.09+62+46).toFixed(2),'food calories are unchanged');
assert.equal(run('state.logs.length'),3,'new visuals do not change user logs');

// Automatic meal categorisation uses food type + existing entries of that date.
const originalFoodLogs=run('JSON.stringify(state.logs)');
const recipeCoffee=run('RECIPES.find(r=>r.id==="coffee")');
const recipeFlan=run('RECIPES.find(r=>r.id==="flan")');
const recipeChicken=run('RECIPES.find(r=>r.id==="chicken")');
const coffeeParts=[{foodId:'coffee',qty:1},{foodId:'milk',qty:120}];
const dessertParts=[{foodId:'flan',qty:1}];
const mainParts=[{foodId:'chicken',qty:150}];
const infer=(parts,recipe,date='2026-04-18')=>run('inferFoodMeal('+JSON.stringify(date)+','+JSON.stringify(parts)+',RECIPES.find(r=>r.id==='+JSON.stringify(recipe)+'))');
run('state.logs=[]');
assert.equal(infer(coffeeParts,'coffee'),'Desayuno','first coffee becomes breakfast');
assert.equal(infer(dessertParts,'flan'),'Desayuno','first dessert becomes breakfast');
assert.equal(infer(mainParts,'chicken'),'Comida','first protein meal becomes lunch');
run('state.logs=[{id:"morning",date:"2026-04-18",meal:"Desayuno",parts:[{foodId:"coffee",qty:1}]}]');
assert.equal(infer(coffeeParts,'coffee'),'Merienda','second coffee becomes a snack');
assert.equal(infer(mainParts,'chicken'),'Comida','first main meal is lunch even after breakfast');
run('state.logs.push({id:"lunch",date:"2026-04-18",meal:"Comida",parts:[{foodId:"beef",qty:150}]})');
assert.equal(infer(mainParts,'chicken'),'Cena','second protein meal becomes dinner');
assert.equal(infer(dessertParts,'flan'),'Merienda','dessert following lunch is a snack');
assert.equal(infer(coffeeParts,'coffee'),'Merienda','coffee after lunch is a snack');
assert.equal(infer([{foodId:'cola',qty:330}],'cola'),'Otro','soft drink remains an extra');
assert.equal(infer(mainParts,'chicken','2026-04-19'),'Comida','entries from a prior day never change today\'s inference');
run('state.logs.push({id:"dinner",date:"2026-04-18",meal:"Cena",parts:[{foodId:"burger-chicken",qty:2}]})');
assert.equal(infer(dessertParts,'flan'),'Otro','light food after dinner is an extra');
assert.equal(infer(mainParts,'chicken'),'Cena','additional mains remain dinner');
assert.equal(run('foodKind([{foodId:"egg",qty:2}])'),'main','two eggs count as a protein plate');
assert.equal(run('foodKind([["egg",2]])'),'main','recipe ingredients and log ingredients classify consistently');
run('state.logs=JSON.parse('+JSON.stringify(originalFoodLogs)+')');

const oldPage=run('currentHistory()');
assert.ok(oldPage.includes('Archivo anterior')&&oldPage.includes('20 mar'));
const dateBefore=run('selectedDate');
run('selectedDate=addDays(selectedDate,-1)');
assert.equal(run('selectedDate'),'2026-04-17');
run('render()');
assert.ok(el('#content').innerHTML.includes('17 abr'));
assert.ok(el('#calendarBar').innerHTML.includes('17 abr'));
const f=run('RECIPES.find(x=>x.id==="flan")');
assert.ok(f&&f.parts.length===1);
assert.equal(run('makePart("flan",1).kcal'),62);
const stateBefore=run('state.weights.find(x=>x.date==="2026-04-14").bodyWater');
run('mergeImport(normalizeImport({type:"dinofit-chat-import-v1",weights:[{date:"2026-04-14",weight:107.9,bodyFat:31}] }))');
assert.equal(run('state.weights.length'),9);
assert.equal(run('state.weights.find(x=>x.date==="2026-04-14").bodyWater'),stateBefore,'preserve fields omitted by update');
assert.equal(run('state.weights.find(x=>x.date==="2026-04-14").bodyFat'),31);
assert.equal(run('state.weights.find(x=>x.date==="2026-04-14").alternates.length'),1);
// Midnight regression: yesterday's diary must not appear as today's.
run('state.logs=[{id:"only-nov20",date:"2026-11-20",meal:"Comida",title:"Cena del 20 (única)",parts:[{foodId:"chicken",qty:150,kcal:165}],note:""}];selectedDate="2026-11-20";lastObservedToday="2026-11-20";followCurrentDay=true;dashboardArea="nutrition"');
const snapshot=run('JSON.stringify(state.logs)');
assert.ok(run('currentDay()').includes('Cena del 20 (única)'),'the November 20 diary is visible on November 20');
assert.equal(run('refreshCalendarDay("2026-11-21")'),true,'the app observes the new date');
assert.equal(run('selectedDate'),'2026-11-21','the selected date automatically rolls over at midnight');
assert.equal(run('dayLogs().length'),0,'November 21 has no entries when no foods were logged');
const freshDiary=run('currentDay()');
assert.ok(freshDiary.includes('Aún no hay comidas registradas')&&freshDiary.includes('Sin registros'));
assert.ok(!freshDiary.includes('Cena del 20 (única)'),'yesterday food never appears in the new day');
assert.equal(run('JSON.stringify(state.logs)'),snapshot,'the rollover is display-only, never edits meals');
// Manually viewing an older date must not be redirected at midnight.
run('selectedDate="2026-11-19";lastObservedToday="2026-11-20";followCurrentDay=false');
assert.equal(run('refreshCalendarDay("2026-11-21")'),true);
assert.equal(run('selectedDate'),'2026-11-19','manual history selection is preserved');
run('selectCalendarDay("2026-11-20",false)');
assert.equal(run('dayLogs().length'),1,'the previous date remains accessible');
assert.ok(run('currentDay()').includes('Estás consultando el'),'historical viewing is explicitly labeled');
assert.equal(run('JSON.stringify(state.logs)'),snapshot,'date navigation leaves stored logs unchanged');
console.log('PASS DinoFit: 4 pestañas, seguimiento activo, composición interactiva, 14 accesos, fecha, histórico e importación segura.');
