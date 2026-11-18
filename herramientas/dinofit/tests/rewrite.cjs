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
assert.equal((rendered.match(/data-recipe=/g)||[]).length,10,'ten food shortcuts');
assert.equal((rendered.match(/data-action="metric"/g)||[]).length,12,'12 metric cards');
assert.ok(rendered.includes('Grasa visceral')&&rendered.includes('Composición corporal'));
assert.equal((rendered.match(/stroke-dasharray=/g)||[]).length>=2,true,'two dashed forecasts');
assert.ok(!rendered.includes('NaN')&&!rendered.includes('undefined'));
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
console.log('PASS DinoFit reescritura: JS, tema oscuro, 12 gráficas, 10 comidas, fechas, dos proyecciones, histórico e importación no destructiva.');
