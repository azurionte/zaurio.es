const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const original=read('app.js'),html=read('index.html');
const catalog=JSON.parse(html.match(/<script id="catalog-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const foods=catalog.foods.map(({nutrition,...f})=>f); // simulate existing account, not a new seed
const ctx=vm.createContext({URL,rawCatalog:()=>catalog,food:id=>foods.find(f=>f.id===id),isNumber:n=>typeof n==='number'&&Number.isFinite(n),htmlSafe:v=>String(v),locale:(x)=>String(x)});
vm.runInContext(original.slice(original.indexOf('const dfNutrients='))+'\nObject.assign(this,{dfNutritionPart,dfNutritionSummary,dfNutritionProductMarkup});',ctx);
const p=(id,qty)=>({foodId:id,qty});
const have=(parts,k,extras=0)=>ctx.dfNutritionSummary(parts,extras).find(i=>i.key===k);
assert.equal(have([p('saute-chicken',56.25),p('saute-frank',56.25)],'fibre').total,2.1375);
assert.equal(have([p('cheese',1)],'protein').total,6.75);
assert.equal(have([p('yopro-fresa',1),p('yopro',1)],'fibre').total,0);
assert.equal(have([p('yopro-fresa',1),p('yopro',1)],'fibre',1).count,3);
assert.equal(have([p('yopro-stracciatella',1)],'calcium').total,null);
assert.equal(ctx.dfNutritionPart(p('cola',200)).salt,.04);
assert.equal(have([p('milk',200)],'calcium').total,null); // g and ml never interchangeable by assumption
assert.match(ctx.dfNutritionProductMarkup(foods.find(x=>x.id==='saute-chicken')),/Ver fuente/);
assert.match(read('app-pantry-v3.js'),/id="pantry3Nutrition" hidden/);
assert.match(read('app-pantry-v3.js'),/name="packages"[^>]*required/);
for (const f of catalog.foods) if(f.nutrition) assert.ok(/^https:\/\//.test(f.nutrition.source),f.id);
console.log('PASS nutrition: verified profiles, grams/ml/packs, unknown vs zero, existing account, hidden purchase details');
