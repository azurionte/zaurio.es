const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
const code=(html.match(/<script>([\s\S]*?)<\/script>/)||[])[1];
const catalog=(html.match(/<script id="catalog-data" type="application\/json">([\s\S]*?)<\/script>/)||[])[1];
assert.ok(code&&catalog);new vm.Script(code);
const elements=new Map();
function el(key){if(!elements.has(key))elements.set(key,{
_value:"",get value(){return this._value},set value(next){this._value=String(next)},innerHTML:"",
textContent:key==="#catalog-data"?catalog:"",dataset:{},checked:false,hidden:false,
classList:{toggle(){},add(){},remove(){}},setAttribute(){},removeAttribute(){},showModal(){this.open=true},
close(){this.open=false},append(){},click(){},focus(){},
querySelectorAll(sel){if(sel==="[data-global-move]"){const b=["-1","1"].map(n=>({dataset:{globalMove:n},onclick:null}));this.dateButtons=b;return b;}return []},
querySelector(sel){return el(sel)}
});return elements.get(key);}
const ctx=vm.createContext({document:{querySelector:el,querySelectorAll:()=>[],documentElement:{dataset:{}},body:{className:""},addEventListener(){}},window:{addEventListener(){},scrollTo(){}},crypto:require("node:crypto").webcrypto,location:{origin:"https://herramientas.zaurio.es"},confirm:()=>true,setTimeout:()=>1,clearTimeout(){},console,Intl,Date,Math,Number,String,JSON,Set,Map,Array,Object});
const run=s=>vm.runInContext(s,ctx);
run(code);
run('state=defaultDocument({user_metadata:{full_name:"Test"}});activeUser={id:"tester",email:"test@example.invalid"};selectedDate="2026-04-18";currentView="today"');
assert.equal(run('state.weights.length+state.logs.length'),0);
const old=run('JSON.parse(JSON.stringify(state))');
old.weights=[{id:"old",date:"2026-04-11",weight:108.2,approx:false,note:""}];
assert.equal(run("validateData("+JSON.stringify(old)+")"),true);
run('state.weights=[108.2,107.8,107.7,107.6,107.4,107.3,107.2,107.0].map((weight,i)=>({id:"w"+i,date:addDays("2026-04-11",i),weight,approx:false,note:"",bodyFat:30.1-i*.13,muscleMass:55.0+i*.02,bodyWater:50.2+i*.1}));state.profile.targetWeight=85');
const page=run('renderToday()'),progress=run('renderProgress()');
assert.equal((page.match(/data-recipe="/g)||[]).length,10);
assert.ok((page.match(/stroke-dasharray=/g)||[]).length>=2);
assert.ok(page.includes("dashboard-graph")&&progress.includes("dashboard-graph"));
assert.ok(!page.includes("NaN")&&!progress.includes("NaN"));
run("render()");
assert.ok(el("#globalDateNav").innerHTML.includes("18 abr"));
el("#globalDateNav").dateButtons[0].onclick();
assert.equal(run("selectedDate"),"2026-04-17");
run("openWeight(state.weights[7])");
assert.ok(el("#scale_bodyFat").value);
el("#scale_muscleMass").value="55.5";el("#weightValue").value="107.0";
el("#weightDate").value="2026-04-18";el("#weightApprox").checked=false;
el("#weightNote").value="Editado";el("#weightDialog").dataset.edit="w7";
el("#weightForm").onsubmit({preventDefault(){}});
assert.equal(run('state.weights.find(w=>w.id==="w7").muscleMass'),55.5);
assert.ok(Math.abs(run('state.weights.find(w=>w.id==="w7").bodyWater')-50.9)<1e-7);
assert.throws(()=>run('validateData({...state,weights:[{...state.weights[0],bodyFat:-1}]})'));
assert.ok(run('state.foods.some(f=>f.id==="activia-cereales")&&state.foods.some(f=>f.id==="yopro")'));
run('selectedDate="2026-04-18";currentView="today";state.logs.push({id:"test-log",date:"2026-04-17",meal:"Cena",title:"Flan",parts:[makePart("flan",1)],note:""});render()');
assert.equal(typeof el("#scaleBulkImport").onclick,"function");
el("#scaleBulk").value=JSON.stringify([
  {date:"2026-04-18",weight:107.0,bodyFat:29.5,protein:15.2},
  {date:"2026-04-19",weight:106.8,bodyFat:29.4}
]);
el("#scaleBulkImport").onclick();
assert.equal(run('state.weights.length'),9);
assert.equal(run('state.weights.find(w=>w.date==="2026-04-18").muscleMass'),55.5,"Unspecified metrics must be preserved");
assert.equal(run('state.weights.find(w=>w.date==="2026-04-18").protein'),15.2);
assert.equal(run('state.weights.find(w=>w.date==="2026-04-19").weight'),106.8);
assert.equal(run('state.logs.length'),1,"Food logs must not be affected");
const before=run('state.weights.length');
el("#scaleBulk").value=JSON.stringify([{date:"2026-04-19",weight:106.8,bodyFat:-10}]);
el("#scaleBulkImport").onclick();
assert.equal(run('state.weights.length'),before,"Invalid bulk import must not alter existing data");

console.log("PASS: legacy data, metrics, navigation, ten quick foods, and projections, and non-destructive import");
