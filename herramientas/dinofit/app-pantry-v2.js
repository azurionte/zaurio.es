'use strict';
// DinoFit Despensa: inventario verificado, compras y tuppers individuales.
// Se mantiene intacta la estructura historica anterior.
const pantry2LegacyBalance=pantryBalance;
const pantry2LegacyAction=pantryAction;
const pantry2LegacyQuickFoods=quickFoods;
let pantry2ShowAll=false;
const pantry2N=n=>typeof n==='number'&&Number.isFinite(n);
const pantry2Round=n=>Math.round((n+Number.EPSILON)*1000)/1000;
const pantry2Raw=f=>!!f&&(['chicken','beef','egg','burger-beef','burger-chicken','burger-mixed','saute-chicken','saute-frank','onion','garlic','oil','curry','oregano','pepper'].includes(f.id)||['proteins','veg'].includes(pantryGroup(f)));
const pantry2FoodName=id=>food(id)?.name||'Producto';
const pantry2Unit=id=>food(id)?.unit||'ud';
function pantry2Data(){
 if(!state.pantry)normalizePantry();
 if(state.pantry.v2)return state.pantry.v2;
 const counted={};
 for(const f of state.foods||[]){
  const old=pantry2LegacyBalance(f.id);
  if(!old)continue;
  const prior=state.pantry.inventory[f.id]||{};
  counted[f.id]={qty:old.remaining,pieces:pantry2N(prior.pieces)?prior.pieces:(f.unit==='ud'?old.remaining:null),
   grams:pantry2N(prior.weightG)?prior.weightG:(f.unit==='g'?old.remaining:null),
   min:pantry2N(old.min)?old.min:null,logIds:(state.logs||[]).map(x=>x.id),
   purchaseIds:[],tupperIds:[],countedAt:prior.countedAt||new Date().toISOString()};
 }
 return state.pantry.v2={version:2,stock:counted,purchases:[],tuppers:[],history:[],
  migratedAt:new Date().toISOString(),legacyBatchesPreserved:(state.pantry.batches||[]).length};
}
function pantry2ProductMin(id,original){
 if(pantry2N(original))return original;
 return ['activia-cereales','yopro'].includes(id)?4:null;
}
function pantry2SameParts(a,b){
 const compact=parts=>{const m=new Map();for(const x of parts||[])m.set(x.foodId,pantry2Round((m.get(x.foodId)||0)+x.qty));return [...m].sort(([a],[b])=>a.localeCompare(b));};
 return JSON.stringify(compact(a))===JSON.stringify(compact(b));
}
function pantry2Consumed(){
 const p=pantry2Data(),logs=state.logs||[],used=new Set(),matched=new Map();
 for(const l of logs){
  const t=p.tuppers.find(x=>x.id===l.pantryTupperId&&x.status==='prepared');
  if(t&&!used.has(t.id)){used.add(t.id);matched.set(l.id,t.id)}
 }
 for(const l of logs){
  if(matched.has(l.id))continue;
  const t=p.tuppers.find(x=>x.status==='prepared'&&!used.has(x.id)&&
   (!x.date||l.date>=x.date)&&pantry2SameParts(l.parts,x.ingredients));
  if(t){used.add(t.id);matched.set(l.id,t.id)}
 }
 return {used,matched};
}
function pantry2Stock(id,excludeTupperId=null){
 const p=pantry2Data(),f=food(id),s=p.stock[id],purchases=p.purchases.filter(x=>x.foodId===id&&x.active!==false&&!s?.purchaseIds?.includes(x.id));
 const known=purchases.reduce((n,x)=>n+x.qty,0);
 if(!f||!s||!pantry2N(s.qty))return {known:false,received:pantry2Round(known),qty:null,pieces:null,grams:null,min:null};
 const {matched}=pantry2Consumed();
 let qty=s.qty,pcs=pantry2N(s.pieces)?s.pieces:null,grams=pantry2N(s.grams)?s.grams:null;
 for(const m of purchases){qty+=m.qty;if(pcs!==null)pcs+=pantry2N(m.pieces)?m.pieces:(f.unit==='ud'?m.qty:0);if(grams!==null)grams+=pantry2N(m.grams)?m.grams:(f.unit==='g'?m.qty:0)}
 const beforeUseQty=qty,beforeUseGrams=grams;
 for(const t of p.tuppers){
  if(t.status!=='prepared'||t.id===excludeTupperId||s.tupperIds?.includes(t.id))continue;
  for(const ing of t.ingredients||[])if(ing.foodId===id){
   qty-=ing.qty;
   if(pcs!==null)pcs-=pantry2N(ing.pieces)?ing.pieces:(f.unit==='ud'?ing.qty:0);
   if(grams!==null)grams-=pantry2N(ing.grams)?ing.grams:(f.unit==='g'?ing.qty:0);
  }
 }
 for(const l of state.logs||[]){
  if(s.logIds?.includes(l.id)||matched.has(l.id))continue;
  for(const part of l.parts||[])if(part.foodId===id&&pantry2N(part.qty)){
   qty-=part.qty;
   if(pcs!==null&&f.unit==='ud')pcs-=part.qty;
   if(grams!==null&&f.unit==='g')grams-=part.qty;
  }
 }
 // No se muestran piezas fraccionarias como si fueran filetes reales.
 if(f.unit==='g'&&pcs!==null&&qty<beforeUseQty&&beforeUseQty>0){
  const cooked=p.tuppers.filter(t=>t.status==='prepared'&&t.id!==excludeTupperId&&!s.tupperIds?.includes(t.id))
   .flatMap(t=>t.ingredients||[]).filter(x=>x.foodId===id);
  const missingCookedPieces=cooked.some(x=>!pantry2N(x.pieces)||x.pieces<=0);
  const directLog=state.logs.some(l=>!s.logIds?.includes(l.id)&&!matched.has(l.id)&&
   (l.parts||[]).some(x=>x.foodId===id&&x.qty>0));
  if(missingCookedPieces||directLog)pcs=null;
 }
 if(f.unit==='ud'&&grams!==null&&qty<beforeUseQty&&beforeUseQty>0){
  const explicitlyCooked=p.tuppers.filter(t=>t.status==='prepared'&&t.id!==excludeTupperId&&!s.tupperIds?.includes(t.id)).flatMap(t=>t.ingredients||[])
   .filter(x=>x.foodId===id).reduce((n,x)=>n+(x.grams||0),0);
  if(explicitlyCooked===0)grams=beforeUseGrams*(qty/beforeUseQty);
 }
 return {known:true,qty:pantry2Round(qty),pieces:pcs===null?null:pantry2Round(pcs),
  grams:grams===null?null:pantry2Round(grams),min:pantry2ProductMin(id,s.min),
  shortage:qty<-.0001};
}
function pantry2Quantity(id,qty,pieces=null,grams=null){
 if(!food(id)||!pantry2N(qty)||qty<0||qty>1e6)throw Error('Cantidad no valida.');
 for(const value of [pieces,grams])if(value!==null&&(!pantry2N(value)||value<0||value>1e6))throw Error('Revisa piezas y peso.');
 if(pantry2Unit(id)==='g')grams=qty;
 if(pantry2Unit(id)==='ud'&&pieces===null)pieces=qty;
 return {qty:pantry2Round(qty),pieces,grams};
}
function pantry2Recount(id,qty,pieces=null,grams=null,min=null){
 const p=pantry2Data(),old=p.stock[id]||null;
 if(min!==null&&(!pantry2N(min)||min<0||min>1e6))throw Error('Umbral incorrecto.');
 const fields=pantry2Quantity(id,qty,pieces,grams);
 p.history.push({id:uid(),foodId:id,previous:old?structuredClone(old):null,newCount:true,at:new Date().toISOString()});
 p.stock[id]={...fields,min:pantry2ProductMin(id,min??old?.min),
  countedAt:new Date().toISOString(),logIds:(state.logs||[]).map(x=>x.id),
  purchaseIds:p.purchases.filter(x=>x.foodId===id&&x.active!==false).map(x=>x.id),
  tupperIds:p.tuppers.filter(x=>x.status==='prepared').map(x=>x.id)};
 return pantry2Stock(id);
}
function pantry2Purchase(id,qty,pieces=null,grams=null){
 const p=pantry2Data(),fields=pantry2Quantity(id,qty,pieces,grams);
 if(fields.qty<=0)throw Error('La compra debe ser mayor que cero.');
 const next={id:uid(),foodId:id,...fields,active:true,at:new Date().toISOString()};
 p.purchases.push(next);return next;
}
function pantry2UndoPurchase(id){
 const p=pantry2Data(),x=p.purchases.find(x=>x.id===id&&x.active!==false);
 if(!x)throw Error('Compra no encontrada.');
 if(p.stock[x.foodId]?.purchaseIds?.includes(id))throw Error('Esta compra ya se incluyo en un recuento posterior.');
 const b=pantry2Stock(x.foodId);
 if(b.known&&b.qty-x.qty<-.001)throw Error('Ya se han usado esas existencias. Corrige el recuento primero.');
 x.active=false;
}
function pantry2UndoRecount(id){
 const p=pantry2Data(),i=p.history.findLastIndex(x=>x.foodId===id&&x.newCount);
 if(i<0)throw Error('Sin recuento anterior.');
 const h=p.history[i];if(h.previous)p.stock[id]=h.previous;else delete p.stock[id];
 p.history.splice(i,1);
}
function pantry2AvailableTuppers(){
 const p=pantry2Data(),used=pantry2Consumed().used;
 return p.tuppers.filter(t=>t.status==='prepared'&&!used.has(t.id));
}
function pantry2DiaryTuppers(date){
 return pantry2AvailableTuppers().filter(t=>!dateValid(t.date)||t.date<=date);
}
function pantry2HasStock(parts){
 if(!parts.length)return false;
 const needed=new Map();
 for(const part of parts){
  const [id,qty]=Array.isArray(part)?part:[part.foodId,part.qty];
  if(!pantry2N(qty)||qty<=0)return false;
  needed.set(id,(needed.get(id)||0)+qty);
 }
 return [...needed].every(([id,qty])=>{
  const balance=pantry2Stock(id);
  return balance.known&&balance.qty>0&&balance.qty+1e-9>=qty;
 });
}
function pantry2TupperKey(t){
 const amounts=t.ingredients.map(x=>[x.foodId,pantry2Round(x.qty),x.pieces??null])
  .sort((a,b)=>a[0].localeCompare(b[0]));
 return JSON.stringify([String(t.title||'Tupper').trim().toLocaleLowerCase('es'),amounts]);
}
function pantry2TupperPortion(t){
 const main=t.ingredients.find(x=>['chicken','beef','burger-beef','burger-chicken','burger-mixed','egg'].includes(x.foodId))||t.ingredients[0];
 if(!main)return '';
 const unit=pantry2Unit(main.foodId),pieces=main.pieces;
 if(unit==='ud')return locale(main.qty,Number.isInteger(main.qty)?0:2)+' '+({egg:'huevos','burger-beef':'hamburguesas','burger-chicken':'hamburguesas','burger-mixed':'hamburguesas'}[main.foodId]||'ud');
 const size=locale(main.qty,0)+' '+unit;
 const fillets=['chicken','beef'].includes(main.foodId);
 const amount=fillets?(pieces===1?'filete':'filetes'):(pieces===1?'pieza':'piezas');
 return pantry2N(pieces)&&pieces>0?locale(pieces,0)+' '+amount+' · '+size:size;
}
function pantry2QuickGroups(date){
 const groups=new Map();
 for(const t of pantry2DiaryTuppers(date)){
  if(!t.ingredients?.length||t.ingredients.some(x=>!food(x.foodId)))continue;
  const key=pantry2TupperKey(t);
  if(!groups.has(key))groups.set(key,{t,count:0});
  groups.get(key).count++;
 }
 const tuppers=[...groups.values()].map(({t,count})=>({tupperId:t.id,name:t.title||'Tupper',
  parts:t.ingredients.map(x=>[x.foodId,x.qty]),hint:[pantry2TupperPortion(t),count===1?'1 disponible':count+' disponibles'].filter(Boolean).join(' · ')}));
 const stocked=ids=>RECIPES.filter(r=>ids.includes(r.id)&&pantry2HasStock(r.parts));
 return [
  {id:'tuppers',title:'Tuppers preparados',emoji:'🍲',choices:tuppers},
  {id:'treats',title:'Postres y lácteos',emoji:'🍮',choices:stocked(['cheese','flan','yopro','activia'])},
  {id:'drinks',title:'Bebidas',emoji:'🥤',choices:stocked(['coffee','cola'])}
 ];
}
function pantry2Ingredients(recipeId,custom=null){
 const r=RECIPES.find(x=>x.id===recipeId);
 const source=custom||r?.parts?.map(([foodId,qty])=>({foodId,qty}));
 if(!source?.length)throw Error('Introduce ingredientes en el tupper.');
 const map=new Map();
 for(const x of source){
  if(!food(x.foodId)||!pantry2N(x.qty)||x.qty<=0||x.qty>1e6)throw Error('Ingrediente o cantidad incorrecta.');
  const fields=pantry2Quantity(x.foodId,x.qty,x.pieces??null,x.grams??null),prior=map.get(x.foodId);
  if(prior){prior.qty+=fields.qty;prior.pieces=prior.pieces===null?fields.pieces:(fields.pieces===null?prior.pieces:prior.pieces+fields.pieces)}
  else map.set(x.foodId,{foodId:x.foodId,...fields});
 }
 return [...map.values()];
}
function pantry2CheckCook(items,excludeId=null){
 const requested=new Map();
 for(const t of items)for(const ing of t.ingredients){
  const k=ing.foodId,existing=requested.get(k)||{qty:0,pieces:0};
  existing.qty+=ing.qty;existing.pieces+=ing.pieces||0;requested.set(k,existing);
 }
 for(const [id,need] of requested){
  const b=pantry2Stock(id,excludeId);if(!b.known)continue;
  if(b.qty+0.0001<need.qty)throw Error('No hay suficiente '+pantry2FoodName(id)+'. Revisa el inventario.');
  if(b.pieces!==null&&need.pieces>0&&b.pieces+0.0001<need.pieces)throw Error('No quedan tantas piezas de '+pantry2FoodName(id)+'.');
 }
}
function pantry2MakeTuppers({recipeId='',count=1,ingredients=null,title='',date=isoToday(),prepared=true}){
 if(!Number.isInteger(count)||count<1||count>30||!dateValid(date))throw Error('Revisa la fecha y cantidad de tuppers.');
 const r=RECIPES.find(x=>x.id===recipeId),parts=pantry2Ingredients(recipeId,ingredients);
 const label=(title||r?.name||'Mi tupper').trim().slice(0,90);
 const items=Array.from({length:count},()=>({id:uid(),date,title:label,recipeId,ingredients:structuredClone(parts),status:prepared?'prepared':'planned'}));
 if(prepared)pantry2CheckCook(items);
 pantry2Data().tuppers.push(...items);return items;
}
function pantry2Prepare(id){
 const t=pantry2Data().tuppers.find(x=>x.id===id);
 if(!t||t.status!=='planned')throw Error('Tupper no planificado.');
 pantry2CheckCook([t]);t.status='prepared';t.preparedAt=new Date().toISOString();
}
function pantry2UpdateTupper(id,{title,ingredients,recipeId}){
 const p=pantry2Data(),t=p.tuppers.find(x=>x.id===id);
 if(!t)throw Error('Tupper no encontrado.');
 const newParts=pantry2Ingredients(recipeId||t.recipeId,ingredients);
 if(t.status==='prepared')pantry2CheckCook([{ingredients:newParts}],id);
 t.title=(title||t.title).trim().slice(0,90);t.ingredients=newParts;t.recipeId=recipeId||t.recipeId;
 for(const l of state.logs||[])if(l.pantryTupperId===id){l.parts=newParts.map(x=>makePart(x.foodId,x.qty));l.title=t.title}
}
function pantry2DeleteTupper(id){
 const p=pantry2Data(),t=p.tuppers.find(x=>x.id===id);
 if(!t)throw Error('Tupper no encontrado.');
 if(pantry2Consumed().used.has(id))throw Error('Este tupper ya figura consumido. Elimina primero esa comida del diario.');
 p.tuppers=p.tuppers.filter(x=>x.id!==id);
}
function pantry2EatTupper(id,date=isoToday()){
 const p=pantry2Data(),t=p.tuppers.find(x=>x.id===id);
 if(!t||t.status!=='prepared'||!dateValid(date))throw Error('Tupper no disponible.');
 if(pantry2Consumed().used.has(id))throw Error('Este tupper ya fue registrado.');
 const parts=t.ingredients.map(x=>makePart(x.foodId,x.qty));
 const log={id:uid(),date,meal:inferFoodMeal(date,parts),title:t.title,parts,
  pantryTupperId:id,note:'Registrado desde Tuppers'};
 state.logs.push(log);return log;
}
function pantry2EatUnit(id,date=isoToday()){
 const f=food(id);if(!f||f.unit!=='ud')throw Error('Selecciona la cantidad consumida.');
 const bal=pantry2Stock(id);if(bal.known&&bal.qty<1)throw Error('No quedan existencias verificadas.');
 const parts=[makePart(id,1)];
 state.logs.push({id:uid(),date,meal:inferFoodMeal(date,parts),title:f.name,parts,note:'Desde Despensa'});
}
function pantry2SummaryQty(id,b){
 if(!b.known)return b.received>0?'Pendiente de contar · +'+pantryQty(b.received,pantry2Unit(id)):'Sin contar';
 const f=food(id),left=pantryQty(Math.max(0,b.qty),f.unit);
 if(f.unit==='g'&&b.pieces!==null)return pantryQty(Math.max(0,b.pieces),'piezas')+' · '+left;
 if(f.unit==='ud'&&b.grams!==null)return left+' · '+pantryQty(Math.max(0,b.grams),'g');
 return f.unit==='g'&&b.pieces===null&&pantry2Data().stock[id]?.pieces!=null?left+' · piezas por revisar':left;
}
function pantry2Visual(id){
 if(id?.startsWith('burger-'))return '🍔';
 return ({chicken:'🍗',beef:'🥩',egg:'🥚',flan:'🍮',yopro:'🥛',
  'activia-cereales':'🥣',milk:'🥛',cheese:'🧀',coffee:'☕',cola:'🥤',
  'saute-chicken':'🥦','saute-frank':'🥔',onion:'🧅',garlic:'🧄',oil:'🫒'})[id]||'🍲';
}
function pantry2ProductCard(f){
 const b=pantry2Stock(f.id),low=b.known&&pantry2N(b.min)&&b.qty<=b.min;
 return '<article class="pantry2-card '+(low?'pantry2-low':'')+'">'+
  '<div class="pantry2-card-top"><span class="pantry2-art" aria-hidden="true">'+pantry2Visual(f.id)+'</span>'+
  '<span class="pantry2-stock '+(low?'pantry2-warning':'')+'">'+(low?'Reponer pronto':b.known?'En inventario':'Sin verificar')+'</span></div>'+
  '<strong>'+htmlSafe(f.name)+'</strong><span class="pantry2-count">'+htmlSafe(pantry2SummaryQty(f.id,b))+'</span>'+
  '<div class="pantry2-card-actions"><button type="button" data-action="pantry2-buy-one" data-id="'+htmlSafe(f.id)+'">+ Compra</button>'+
  '<button type="button" data-action="pantry2-count" data-id="'+htmlSafe(f.id)+'">Ajustar</button>'+
  (!pantry2Raw(f)?'<button class="pantry2-eat" type="button" data-action="pantry2-eat" data-id="'+htmlSafe(f.id)+'">Consumí</button>':'')+
  (pantry2Data().history.some(x=>x.foodId===f.id)?'<button type="button" data-action="pantry2-undo-count" data-id="'+htmlSafe(f.id)+'">Deshacer recuento</button>':'')+'</div></article>';
}
function pantry2TupperCards(){
 const p=pantry2Data(),used=pantry2Consumed().used,groups=new Map();
 for(const t of p.tuppers){
  const key=t.recipeId+'|'+t.title+'|'+t.status;
  if(!groups.has(key))groups.set(key,{name:t.title,recipe:t.recipeId,status:t.status,items:[]});groups.get(key).items.push(t);
 }
 if(!groups.size)return '<div class="pantry2-empty">Todavía no hay tuppers. Puedes crear varios juntos y luego modificar cada uno.<button type="button" data-action="pantry2-cook">Preparar tuppers</button></div>';
 return [...groups.values()].reverse().map(g=>{
  const pending=g.items.filter(x=>x.status==='prepared'&&!used.has(x.id)),first=pending[0],planned=g.status==='planned';
  return '<article class="pantry2-tupper"><div class="pantry2-art">'+(g.recipe.includes('burger')?'🍔':'🍲')+'</div>'+
   '<div class="pantry2-tupper-info"><strong>'+htmlSafe(g.name)+'</strong><span>'+pending.length+' disponibles · '+g.items.length+' '+(planned?'planificados':'preparados')+'</span></div>'+
   '<div class="pantry2-tupper-buttons">'+(first?'<button type="button" class="pantry2-primary" data-action="pantry2-eat-tupper" data-id="'+first.id+'">Comí uno</button>':'')+
   (planned?'<button type="button" data-action="pantry2-prepare-group" data-id="'+g.items[0].id+'">Confirmar cocina</button>':'')+'</div>'+
   '<details><summary>Ver y editar cada tupper</summary><div class="pantry2-tupper-list">'+g.items.map((t,i)=>{
    const consumed=used.has(t.id);
    return '<div><span>Tupper '+(i+1)+(consumed?' · consumido':'')+'</span><span class="pantry2-actions">'+
     '<button type="button" data-action="pantry2-edit-tupper" data-id="'+t.id+'">Editar</button>'+
     (!consumed&&t.status==='prepared'?'<button type="button" data-action="pantry2-eat-tupper" data-id="'+t.id+'">Comí</button>':'')+
     (!consumed?'<button type="button" data-action="pantry2-delete-tupper" data-id="'+t.id+'">Eliminar</button>':'')+'</span></div>';
   }).join('')+'</div></details></article>';
 }).join('');
}
function pantry2Cards(){
 const all=(state.foods||[]).filter(f=>f.id!=='burger-unknown'&&(!pantryQuery||f.name.toLocaleLowerCase('es').includes(pantryQuery)));
 const order=(a,b)=>Number(pantry2Stock(b.id).known)-Number(pantry2Stock(a.id).known)||a.name.localeCompare(b.name,'es');
 const section=(title,emoji,items,type)=>{
  const visible=pantry2ShowAll||pantryQuery?items:items.slice(0,6);
  return '<section class="pantry2-zone"><div class="pantry2-zone-heading"><span class="pantry2-zone-emoji">'+emoji+'</span><div><h2>'+title+'</h2><p>'+
  (type==='consumables'?'Listos para consumir. Descuento automático desde el diario.':'Ingredientes para cocinar. Piezas y gramos cuando los conoces.')+
  '</p></div><span class="pantry2-zone-total">'+items.length+' productos</span></div>'+
  '<div class="pantry2-grid">'+(visible.length?visible.map(pantry2ProductCard).join(''):'<div class="pantry2-empty">No hay productos que coincidan.</div>')+'</div>'+(!pantry2ShowAll&&items.length>6&&!pantryQuery?'<button class="pantry2-see-more" type="button" data-action="pantry2-showall">Ver los '+(items.length-6)+' restantes</button>':'')+'</section>';
 };
 return section('Consumibles','🥛',all.filter(f=>!pantry2Raw(f)).sort(order),'consumables')+
  section('Crudos','🥩',all.filter(pantry2Raw).sort(order),'raw')+
  '<section class="pantry2-zone"><div class="pantry2-zone-heading"><span class="pantry2-zone-emoji">🍲</span><div><h2>Tuppers</h2><p>Tu comida preparada, editable y lista para registrar.</p></div>'+
  '<button type="button" class="pantry2-inline-action" data-action="pantry2-cook">+ Preparar</button></div>'+
  '<div class="pantry2-tuppers">'+pantry2TupperCards()+'</div></section>';
}
function pantry2Current(){
 const foods=(state.foods||[]).filter(x=>x.id!=='burger-unknown'),p=pantry2Data();
 const low=foods.filter(f=>{const b=pantry2Stock(f.id);return b.known&&pantry2N(b.min)&&b.qty<=b.min});
 const prepared=pantry2AvailableTuppers().length;
 return '<div class="pantry2-intro"><span class="eyebrow">TU COCINA, ORGANIZADA</span><h1>Despensa</h1>'+
  '<p>Abre la nevera, mira lo que tienes y registra tu compra, tu cocina o tu comida sin repetir cantidades.</p>'+
  '<div class="pantry2-main-actions"><button class="pantry2-primary" data-action="pantry2-buy" type="button">+ Registrar compra</button>'+
  '<button type="button" data-action="pantry2-cook">Preparar tuppers</button><button type="button" data-action="pantry-product-new">+ Producto nuevo</button></div></div>'+
  '<div class="pantry2-overview"><div><small>Consumibles contados</small><strong>'+foods.filter(f=>!pantry2Raw(f)&&pantry2Stock(f.id).known).length+'</strong></div>'+
  '<div><small>Ingredientes contados</small><strong>'+foods.filter(f=>pantry2Raw(f)&&pantry2Stock(f.id).known).length+'</strong></div>'+
  '<div><small>Tuppers disponibles</small><strong>'+prepared+'</strong></div></div>'+
  (low.length?'<div class="pantry2-alert"><strong>Se están acabando</strong><span>'+htmlSafe(low.map(f=>f.name).join(' · '))+'</span><button type="button" data-action="pantry2-buy" >Reponer</button></div>':'')+
  '<label class="pantry2-search">Buscar en mi despensa<input type="search" id="pantrySearch" placeholder="Yogur, pollo, filetes..." value="'+htmlSafe(pantryQuery)+'"></label>'+
  '<div id="pantryCatalog">'+pantry2Cards()+'</div>'+
  (p.purchases.some(x=>x.active!==false)?'<details class="pantry2-history"><summary>Últimas compras y correcciones</summary>'+p.purchases.filter(x=>x.active!==false).slice(-8).reverse().map(x=>
   '<div><span>'+htmlSafe(pantry2FoodName(x.foodId))+' · +'+pantryQty(x.qty,pantry2Unit(x.foodId))+'</span><button type="button" data-action="pantry2-undo-buy" data-id="'+x.id+'">Deshacer</button></div>').join('')+'</details>':'')+
  ((state.pantry.batches||[]).length?'<details class="pantry2-history"><summary>Preparaciones anteriores (conservadas)</summary>'+(state.pantry.batches||[]).map(x=>'<div><span>Lote '+htmlSafe(x.date||'')+' · '+htmlSafe((x.mixed||0)+(x.plain||0))+' tuppers · '+htmlSafe(x.status||'planificado')+'</span></div>').join('')+'</details>':'')+
  ((state.pantry.shopping||[]).length?'<details class="pantry2-history"><summary>Lista de compra anterior (conservada)</summary>'+(state.pantry.shopping||[]).map(x=>'<div><span>'+htmlSafe(pantry2FoodName(x.foodId))+' · '+htmlSafe(pantryQty(x.qty||0,pantry2Unit(x.foodId)))+' · '+htmlSafe(x.status||'pendiente')+'</span></div>').join('')+'</details>':'');
}
function pantry2ProductOptions(selected='',raw=false){
 return (state.foods||[]).filter(f=>f.id!=='burger-unknown'&&(!raw||pantry2Raw(f)))
  .map(f=>'<option value="'+htmlSafe(f.id)+'"'+(selected===f.id?' selected':'')+'>'+htmlSafe(f.name)+'</option>').join('');
}
function pantry2Footer(label='Guardar',more=false){
 return '<div class="pantry2-form-buttons"><button type="button" data-action="close-modal">Cancelar</button>'+
  (more?'<button type="submit" data-more="1">Guardar y añadir otro</button>':'')+
  '<button type="submit" class="pantry2-primary">'+label+'</button></div>';
}
function pantry2OpenBuy(selected=''){
 const f=food(selected),b=f?pantry2Stock(f.id):null;
 renderModal('Registrar compra','<form id="pantry2BuyForm" class="pantry2-form">'+
  '<p>Sumar lo comprado a tus existencias, sin alterar lo que ya tienes. Si aún no habías contado un producto, puedes registrar su total actual.</p>'+
  '<label>Producto<select name="foodId" id="pantry2BuyProduct">'+pantry2ProductOptions(selected)+'</select></label>'+
  '<label>Cantidad (<span id="pantry2BuyUnit">'+htmlSafe(f?.unit||'ud')+'</span>)<input name="qty" type="number" step="any" min="0.001" required value="1"></label>'+
  '<div class="pantry2-form-grid"><label>Filetes / piezas (si procede)<input name="pieces" type="number" step="1" min="0" placeholder="Ej.: 5"></label>'+
  '<label>Peso del paquete en gramos (si procede)<input name="grams" type="number" step="any" min="0" placeholder="Ej.: 619"></label></div>'+
  '<label>Tipo de cambio<select name="mode"><option value="purchase">Sumar compra a las existencias</option><option value="count"'+(b&&!b.known?' selected':'')+'>Este es el total que tengo</option></select></label>'+pantry2Footer('Guardar compra',true)+'</form>');
}
function pantry2OpenCount(id){
 const f=food(id),b=pantry2Stock(id);if(!f)throw Error('Producto no encontrado.');
 renderModal('Ajustar '+f.name,'<form id="pantry2CountForm" data-id="'+htmlSafe(id)+'" class="pantry2-form">'+
  '<p>Indica cuánto tienes ahora, no lo que compraste la última vez. El recuento sustituye el saldo anterior.</p>'+
  '<label>Disponible ('+htmlSafe(f.unit)+')<input name="qty" type="number" step="any" min="0" required value="'+(b.known?b.qty:'')+'"></label>'+
  '<div class="pantry2-form-grid"><label>Piezas / filetes<input name="pieces" type="number" step="any" min="0" placeholder="Opcional" value="'+(b.pieces??'')+'"></label>'+
  '<label>Peso total (g)<input name="grams" type="number" step="any" min="0" placeholder="Opcional" value="'+(b.grams??'')+'"></label></div>'+
  '<label>Avisarme cuando queden<input name="min" type="number" step="any" min="0" placeholder="Opcional" value="'+(b.min??'')+'"></label>'+pantry2Footer('Guardar inventario')+'</form>');
}
function pantry2Rows(ingredients=[]){
 const count=Math.max(5,ingredients.length+1);
 return Array.from({length:count},(_,i)=>{
  const x=ingredients[i]||{},f=food(x.foodId);
  return '<div class="pantry2-ingredient"><select name="ing'+i+'" aria-label="Ingrediente '+(i+1)+'"><option value="">Sin ingrediente</option>'+pantry2ProductOptions(x.foodId)+'</select>'+
   '<input type="number" name="qty'+i+'" step="any" min="0" placeholder="'+htmlSafe(f?.unit||'g/ud')+'" value="'+(x.qty??'')+'" aria-label="Cantidad '+(i+1)+'">'+
   '<input type="number" name="pcs'+i+'" step="any" min="0" placeholder="Piezas" value="'+(x.pieces??(x.foodId==='chicken'||x.foodId==='beef'?1:''))+'" aria-label="Piezas '+(i+1)+'"></div>';
 }).join('');
}
function pantry2OpenCook(id=null){
 const t=id?pantry2Data().tuppers.find(x=>x.id===id):null;if(id&&!t)throw Error('Tupper no encontrado.');
 const recipe=t?.recipeId||'mixed-chicken',r=RECIPES.find(x=>x.id===recipe),ings=t?.ingredients||r?.parts.map(([foodId,qty])=>({foodId,qty}))||[];
 renderModal(t?'Editar tupper':'Preparar tuppers','<form id="pantry2CookForm" class="pantry2-form" data-id="'+htmlSafe(id||'')+'">'+
  '<label>Tipo de plato<select name="recipe" id="pantry2Recipe">'+RECIPES.filter(x=>['mixed','plain'].includes(x.group)).map(x=>'<option value="'+x.id+'"'+(recipe===x.id?' selected':'')+'>'+htmlSafe(x.name)+'</option>').join('')+
  '<option value="custom"'+(recipe==='custom'?' selected':'')+'>Personalizado</option></select></label>'+
  '<label>Nombre<input name="title" maxlength="90" required value="'+htmlSafe(t?.title||r?.name||'Mi tupper')+'"></label>'+
  '<div class="pantry2-form-grid"><label>Fecha<input name="date" type="date" required value="'+htmlSafe(t?.date||isoToday())+'"></label>'+
  (t?'':'<label>¿Cuántos preparo?<input name="count" type="number" min="1" max="30" step="1" value="1" required></label>')+'</div>'+
  '<h3>Ingredientes por tupper</h3><p>Si sabes el peso exacto, introdúcelo. Puedes indicar los filetes y ajustar los gramos después.</p>'+
  '<div id="pantry2IngredientRows">'+pantry2Rows(ings)+'</div>'+
  '<div class="pantry2-cost" id="pantry2CostPreview">Al confirmar se descontarán los ingredientes que tengas contados. Planificar no consume existencias.</div>'+
  '<div class="pantry2-form-buttons"><button type="button" data-action="close-modal">Cancelar</button>'+
  (!t?'<button type="submit" data-plan="1">Guardar plan</button>':'')+
  '<button type="submit" class="pantry2-primary">'+(t?'Guardar cambios':'Confirmar preparados')+'</button></div></form>');
}
function pantry2Optional(v){if(v===''||v===null||v===undefined)return null;const n=asNum(v);if(!pantry2N(n)||n<0)throw Error('Introduce una cantidad válida.');return n}
function pantry2ReadIngredients(v){
 const result=[];for(let i=0;i<40;i++){
  if(!v.has('ing'+i))break;
  const id=String(v.get('ing'+i)||''),raw=String(v.get('qty'+i)||'').trim();
  if(!id&&!raw)continue;
  if(!id||!raw)throw Error('Completa ingrediente y cantidad.');
  const qty=pantry2Optional(raw),pieces=pantry2Optional(String(v.get('pcs'+i)||'').trim());
  result.push({foodId:id,qty,pieces});
 }
 return result;
}
function pantry2Form(form,event){
 const v=new FormData(form),id=form.dataset.id;
 if(form.id==='pantry2BuyForm'){
  const foodId=String(v.get('foodId')||''),qty=pantry2Optional(String(v.get('qty')||''));
  const pcs=pantry2Optional(String(v.get('pieces')||'').trim()),grams=pantry2Optional(String(v.get('grams')||'').trim());
  if(v.get('mode')==='count')pantry2Recount(foodId,qty,pcs,grams);
  else pantry2Purchase(foodId,qty,pcs,grams);
  if(event.submitter?.dataset.more==='1')pantry2OpenBuy(foodId);else closeModal();
  changed('Compra registrada.');return;
 }
 if(form.id==='pantry2CountForm'){
  const qty=pantry2Optional(String(v.get('qty')||'')),pieces=pantry2Optional(String(v.get('pieces')||'').trim());
  const grams=pantry2Optional(String(v.get('grams')||'').trim()),min=pantry2Optional(String(v.get('min')||'').trim());
  pantry2Recount(id,qty,pieces,grams,min);closeModal();changed('Inventario actualizado.');return;
 }
 if(form.id==='pantry2CookForm'){
  const recipeId=String(v.get('recipe')||''),title=String(v.get('title')||''),date=String(v.get('date')||'');
  const ingredients=pantry2ReadIngredients(v);
  if(id)pantry2UpdateTupper(id,{title,recipeId,ingredients});
  else pantry2MakeTuppers({recipeId,title,date,ingredients,count:asNum(v.get('count')),prepared:event.submitter?.dataset.plan!=='1'});
  closeModal();changed(id?'Tupper actualizado.':'Tuppers guardados.');return;
 }
}
function pantry2Action(button){
 const act=button.dataset.action,id=button.dataset.id;
 switch(act){
  case 'pantry2-buy':pantry2OpenBuy();return true;
  case 'pantry2-buy-one':pantry2OpenBuy(id);return true;
  case 'pantry2-count':pantry2OpenCount(id);return true;
  case 'pantry2-cook':pantry2OpenCook();return true;
  case 'pantry2-edit-tupper':pantry2OpenCook(id);return true;
  case 'pantry2-showall':pantry2ShowAll=true;render();return true;
  case 'pantry2-eat':{
   if(pantry2Unit(id)!=='ud'){openPantryConsume(id);return true}
   pantry2EatUnit(id);changed('Consumo añadido al diario.');return true;
  }
  case 'pantry2-eat-tupper':{
   const date=button.dataset.date;
   if(date&&!pantry2DiaryTuppers(date).some(t=>t.id===id))throw Error('Tupper no disponible para esta fecha.');
   pantry2EatTupper(id,date||isoToday());
   if(date)selectCalendarDay(date,false);
   changed('Tupper registrado en el diario.');return true;
  }
  case 'pantry2-delete-tupper':{
   if(!confirm('¿Eliminar este tupper? Se devolverán sus ingredientes al inventario si estaba preparado.'))return true;
   pantry2DeleteTupper(id);changed('Tupper eliminado e inventario actualizado.');return true;
  }
  case 'pantry2-prepare-group':{
   const p=pantry2Data(),first=p.tuppers.find(x=>x.id===id);
   const pending=p.tuppers.filter(t=>t.status==='planned'&&t.title===first?.title&&t.recipeId===first?.recipeId);
   pantry2CheckCook(pending);for(const t of pending){t.status='prepared';t.preparedAt=new Date().toISOString()}
   changed('Tuppers preparados; ingredientes descontados.');return true;
  }
  case 'pantry2-undo-buy':pantry2UndoPurchase(id);changed('Compra deshecha.');return true;
  case 'pantry2-undo-count':pantry2UndoRecount(id);changed('Recuento deshecho.');return true;
  default:return false;
 }
}
pantryAction=function(button){return pantry2Action(button)||pantry2LegacyAction(button)};
currentPantry=pantry2Current;
pantryCards=pantry2Cards;
quickFoods=function(){return pantry2LegacyQuickFoods(pantry2QuickGroups(selectedDate))};
if(typeof document!=='undefined'&&document.addEventListener){
 document.addEventListener('submit',event=>{
  if(!['pantry2BuyForm','pantry2CountForm','pantry2CookForm'].includes(event.target.id))return;
  event.preventDefault();try{pantry2Form(event.target,event)}catch(err){toast('No se guardó: '+err.message)}
 });
 document.addEventListener('change',event=>{
  if(event.target.id==='pantry2BuyProduct'){
   const f=food(event.target.value),unit=$('#pantry2BuyUnit');if(unit)unit.textContent=f?.unit||'ud';
  }
  if(event.target.id==='pantry2Recipe'){
   const r=RECIPES.find(x=>x.id===event.target.value),rows=$('#pantry2IngredientRows');
   if(rows)rows.innerHTML=pantry2Rows(r?.parts.map(([foodId,qty])=>({foodId,qty}))||[]);
   const title=$('#pantry2CookForm [name="title"]');if(title&&r)title.value=r.name;
  }
 });
}
globalThis.DinoPantry={data:pantry2Data,stock:pantry2Stock,recount:pantry2Recount,purchase:pantry2Purchase,undoPurchase:pantry2UndoPurchase,
 undoRecount:pantry2UndoRecount,available:pantry2AvailableTuppers,makeTuppers:pantry2MakeTuppers,prepare:pantry2Prepare,
 updateTupper:pantry2UpdateTupper,deleteTupper:pantry2DeleteTupper,eatTupper:pantry2EatTupper,eatUnit:pantry2EatUnit,
 consumed:pantry2Consumed,sameParts:pantry2SameParts};
