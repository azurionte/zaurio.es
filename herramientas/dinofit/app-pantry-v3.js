'use strict';
// DinoFit pantry UX v3. Additive UI layer: keep v2 stock and historical logs.
let pantry3Tab='consumables';
const pantry3Defaults={
 coffee:{name:'caja',sizes:[10,20],unit:'c\u00e1psulas'},
 cheese:{name:'paquete',sizes:[12,13],unit:'lonchas'},
 'activia-cereales':{name:'pack',sizes:[4,8],unit:'yogures'},
 flan:{name:'pack',sizes:[4,6],unit:'flanes'},
 yopro:{name:'pack',sizes:[4,6],unit:'unidades'},
 egg:{name:'cart\u00f3n',sizes:[6,12],unit:'huevos'},
 'burger-beef':{name:'bandeja',sizes:[2,4],unit:'hamburguesas'},
 'burger-chicken':{name:'bandeja',sizes:[2,4],unit:'hamburguesas'},
 'burger-mixed':{name:'bandeja',sizes:[2,4],unit:'hamburguesas'},
 'saute-chicken':{name:'bolsa',sizes:[400,1000],unit:'g'},
 'saute-frank':{name:'bolsa',sizes:[400,1000],unit:'g'},
 milk:{name:'brik',sizes:[1000,2000],unit:'ml'},
 cola:{name:'botella',sizes:[1000,2000],unit:'ml'},

};
function pantry3Format(id){
 const f=food(id),known=pantry3Defaults[id];
 const defaultSizes=f?.unit==='ud'?[1,4]:f?.unit==='ml'?[500,1000]:[400,800];
 const all=pantry2Data();
 const stored=all.packageFormats?.[id];
 return {name:known?.name||(pantry2Raw(f)?'bandeja':'envase'),
  unit:known?.unit||(f?.unit==='ud'?'unidades':f?.unit||'ud'),
  sizes:Array.isArray(stored)&&stored.length===2?stored:(known?.sizes||defaultSizes)};
}
function pantry3RememberSize(id,size){
 const v=pantry2Data();v.packageFormats=v.packageFormats||{};
 const old=pantry3Format(id).sizes;
 if(old.includes(size))return;
 v.packageFormats[id]=[old[0],size];
}
function pantry3PartialBaseline(id,pieces=null){
 const p=pantry2Data(),f=food(id);
 if(p.stock[id])return;
 // The counted baseline remains explicitly partial: only purchases recorded from now on are known.
 p.stock[id]={qty:0,pieces:f.unit==='ud'||pieces!==null?0:null,grams:f.unit==='g'?0:null,
  min:pantry2ProductMin(id,null),countedAt:new Date().toISOString(),partial:true,
  logIds:(state.logs||[]).map(x=>x.id),
  purchaseIds:p.purchases.filter(x=>x.foodId===id&&x.active!==false).map(x=>x.id),
  tupperIds:p.tuppers.filter(x=>x.status==='prepared').map(x=>x.id)};
}
function pantry3BuyPack(id,size,boxes=1,pieces=null,grams=null){
 const f=food(id);
 if(!f||!pantry2N(size)||size<=0||!Number.isInteger(boxes)||boxes<1||boxes>100)throw Error('Revisa el formato y la cantidad de envases.');
 const qty=pantry2Round(size*boxes);
 pantry3PartialBaseline(id,pieces);
 if(f.unit==='g')pantry2Purchase(id,qty,pieces,qty);
 else pantry2Purchase(id,qty,pieces??(f.unit==='ud'?qty:null),grams);
 return qty;
}
function pantry3QtyLabel(id){
 return ({coffee:'c\u00e1psulas',cheese:'lonchas','activia-cereales':'yogures',flan:'flanes',
  yopro:'unidades',egg:'huevos','burger-beef':'hamburguesas','burger-chicken':'hamburguesas',
  'burger-mixed':'hamburguesas'})[id]||pantry2Unit(id);
}
function pantry3DisplayNumber(id,stock){
 const f=food(id),qty=stock.known?Math.max(0,stock.qty):null;
 if(qty===null)return '<strong class="pantry3-big">--</strong><span class="pantry3-bigunit">sin contar</span>';
 const n=locale(qty,Number.isInteger(qty)?0:2);
 return '<strong class="pantry3-big">'+htmlSafe(n)+'</strong><span class="pantry3-bigunit">'+htmlSafe(pantry3QtyLabel(id))+'</span>';
}
function pantry3Card(f){
 const b=pantry2Stock(f.id),p=pantry2Data(),isRaw=pantry2Raw(f),partial=!!p.stock[f.id]?.partial;
 const min=b.known&&pantry2N(b.min)&&b.qty<=b.min,meta=pantry3Format(f.id);
 const quick=f.unit!=='g'?meta.sizes.slice(0,2).map((n,i)=>
  '<button type="button" class="pantry3-pack '+(i===0?'pantry3-pack-primary':'')+'" data-action="pantry3-buy-quick" data-id="'+htmlSafe(f.id)+'" data-size="'+n+'">+ 1 '+htmlSafe(meta.name)+' <b>'+htmlSafe(locale(n,0))+'</b></button>').join(''):
  '<button type="button" class="pantry3-pack pantry3-pack-primary" data-action="pantry3-buy-custom" data-id="'+htmlSafe(f.id)+'">+ A\u00f1adir '+htmlSafe(meta.name)+'</button>';
 const available=b.known?(partial?'M\u00ednimo registrado':'Disponibles ahora'):'Sin recuento inicial';
 return '<article class="pantry3-card '+(min?'pantry3-low':'')+'">'+
  '<div class="pantry3-heading"><span class="pantry3-emoji" aria-hidden="true">'+pantry2Visual(f.id)+'</span><div><h3>'+htmlSafe(f.name)+'</h3><small>'+htmlSafe(available)+'</small></div></div>'+
  '<div class="pantry3-quantity">'+pantry3DisplayNumber(f.id,b)+'</div>'+
  (b.known&&f.unit==='g'&&b.pieces!==null?'<div class="pantry3-secondary">'+htmlSafe(locale(b.pieces,0))+' piezas / filetes</div>':'')+
  (b.known&&f.unit==='ud'&&b.grams!==null?'<div class="pantry3-secondary">'+htmlSafe(locale(b.grams,0))+' g en total</div>':'')+
  (min?'<span class="pantry3-warning">Se est\u00e1 agotando</span>':'')+
  '<div class="pantry3-buyrow">'+quick+'</div>'+
  '<div class="pantry3-footer">'+(!isRaw?'<button type="button" class="pantry3-eat" data-action="pantry2-eat" data-id="'+htmlSafe(f.id)+'">'+(f.unit==='ud'?'Consum\u00ed 1':'Registrar uso')+'</button>':'')+
  '<button type="button" class="pantry3-subtle" data-action="pantry3-buy-custom" data-id="'+htmlSafe(f.id)+'">Otro formato</button>'+
  '<button type="button" class="pantry3-subtle" data-action="pantry3-recount" data-id="'+htmlSafe(f.id)+'">Ajustar</button></div></article>';
}
function pantry3Filtered(){
 const foods=(state.foods||[]).filter(f=>f?.id&&f.id!=='burger-unknown');
 return foods.filter(f=>(pantry3Tab==='raw'?pantry2Raw(f):!pantry2Raw(f))&&
  (!pantryQuery||f.name.toLocaleLowerCase('es').includes(pantryQuery)))
  .sort((a,b)=>Number(pantry2Stock(b.id).known)-Number(pantry2Stock(a.id).known)||a.name.localeCompare(b.name,'es'));
}
function pantry3Cards(){
 if(pantry3Tab==='tuppers')return '<div class="pantry2-tuppers">'+pantry2TupperCards()+'</div>';
 const items=pantry3Filtered();
 return items.length?'<div class="pantry3-grid">'+items.map(pantry3Card).join('')+'</div>':
  '<div class="pantry2-empty">No hay productos con ese nombre en esta secci\u00f3n.</div>';
}
function pantry3Current(){
 const p=pantry2Data(),foods=(state.foods||[]).filter(f=>f?.id&&f.id!=='burger-unknown');
 const count=tab=>tab==='tuppers'?pantry2AvailableTuppers().length:foods.filter(f=>tab==='raw'?pantry2Raw(f):!pantry2Raw(f)).filter(f=>pantry2Stock(f.id).known).length;
 const tabs=[['consumables','Consumibles','\uD83E\uDD5B'],['raw','Crudos','\uD83E\uDD69'],['tuppers','Tuppers','\uD83C\uDF72']];
 const labels={consumables:'Listos para comer',raw:'Ingredientes para cocinar',tuppers:'Comidas ya preparadas'};
 const action=pantry3Tab==='tuppers'?'<button class="pantry3-header-action" type="button" data-action="pantry2-cook">+ Preparar</button>':
  '<button type="button" class="pantry3-header-action" data-action="pantry3-buy-custom">+ A\u00f1adir compra</button>';
 const low=foods.filter(f=>{const b=pantry2Stock(f.id);return b.known&&pantry2N(b.min)&&b.qty<=b.min});
 const purchases=p.purchases.filter(x=>x.active!==false&&pantry3Tab!=='tuppers'&&(pantry3Tab==='raw'?pantry2Raw(food(x.foodId)):!pantry2Raw(food(x.foodId))));
 return '<div class="pantry3-page"><header class="pantry3-intro"><div><span class="eyebrow">TU COCINA</span><h1>Despensa</h1></div><p>Lo que tienes, lo que cocinas y lo que comes.</p></header>'+
  '<nav class="pantry3-tabs" role="tablist" aria-label="Apartados de Despensa">'+tabs.map(([id,label,emoji])=>
  '<button type="button" role="tab" aria-selected="'+(id===pantry3Tab)+'" class="pantry3-tab '+(id===pantry3Tab?'selected':'')+'" data-action="pantry3-tab" data-id="'+id+'">'+
   '<span aria-hidden="true">'+emoji+'</span><strong>'+label+'</strong><small>'+count(id)+'</small></button>').join('')+'</nav>'+
  '<section class="pantry3-section" role="tabpanel" aria-label="'+htmlSafe(tabs.find(x=>x[0]===pantry3Tab)[1])+'">'+
   '<div class="pantry3-sectionhead"><div><span class="eyebrow">'+htmlSafe(labels[pantry3Tab])+'</span><h2>'+htmlSafe(tabs.find(x=>x[0]===pantry3Tab)[1])+'</h2></div>'+action+'</div>'+
  (pantry3Tab!=='tuppers'?'<label class="pantry3-search">Buscar<input type="search" id="pantrySearch" placeholder="Buscar producto..." value="'+htmlSafe(pantryQuery)+'"></label>':'')+
  (low.length&&pantry3Tab==='consumables'?'<p class="pantry3-lowhint">Para reponer: '+htmlSafe(low.filter(f=>!pantry2Raw(f)).map(f=>f.name).join(' \u00b7 '))+'</p>':'')+
  '<div id="pantryCatalog">'+pantry3Cards()+'</div></section>'+
  (purchases.length?'<details class="pantry2-history pantry3-history"><summary>Compras recientes y deshacer</summary>'+purchases.slice(-8).reverse().map(x=>
  '<div><span>'+htmlSafe(pantry2FoodName(x.foodId))+' +'+htmlSafe(pantryQty(x.qty,pantry2Unit(x.foodId)))+'</span><button type="button" data-action="pantry2-undo-buy" data-id="'+x.id+'">Deshacer</button></div>').join('')+'</details>':'')+
  (pantry3Tab==='tuppers'&&(state.pantry.batches||[]).length?'<details class="pantry2-history"><summary>Preparaciones anteriores</summary>'+pantryBatchHtml()+'</details>':'')+
  '</div>';
}
function pantry3BuyFields(f){
 const meta=pantry3Format(f.id),rawWeight=f.unit==='g';
 if(rawWeight)return '<div class="pantry3-buy-fields"><label>Gramos del envase<input name="grams" type="number" inputmode="decimal" min="1" step="any" required placeholder="Ej.: 619"></label>'+ 
  '<label>Piezas o filetes (si lo sabes)<input name="pieces" inputmode="numeric" type="number" min="1" step="1" placeholder="Ej.: 5"></label></div>'+
  '<p class="pantry3-note">Solo necesitas los gramos y, si los sabes, los filetes.</p>';
 const formats=meta.sizes;
 return '<div class="pantry3-quick-packs" role="group" aria-label="Formato comprado">'+formats.map((n,i)=>
 '<button type="button" class="pantry3-choice '+(!i?'selected':'')+'" data-action="pantry3-select-size" data-size="'+n+'">'+htmlSafe(meta.name)+' de <b>'+htmlSafe(locale(n,0))+'</b></button>').join('')+'</div>'+
 '<div class="pantry3-buy-fields"><label>Envases<input name="packages" type="number" inputmode="numeric" min="1" max="100" step="1" required value="1"></label>'+ 
 '<label>Unidades por envase<input name="size" inputmode="decimal" type="number" min="0.01" step="any" required value="'+formats[0]+'"></label></div>'+
 '<p class="pantry3-note">Se a\u00f1adir\u00e1n '+htmlSafe(meta.unit)+' al inventario; al consumir se descuenta una unidad.</p>';
}
function pantry3OpenBuy(id=''){
 const candidates=(state.foods||[]).filter(f=>f.id!=='burger-unknown');
 const selected=food(id)||candidates.find(f=>pantry3Tab==='raw'?pantry2Raw(f):!pantry2Raw(f))||candidates[0];
 if(!selected)throw Error('No hay productos disponibles.');
 renderModal('A\u00f1adir compra','<form id="pantry3BuyForm" class="pantry3-form">'+
  '<label>Producto<select name="foodId" id="pantry3Product">'+candidates.map(f=>'<option value="'+htmlSafe(f.id)+'"'+(f.id===selected.id?' selected':'')+'>'+htmlSafe(f.name)+'</option>').join('')+'</select></label>'+
  '<div id="pantry3BuyFields">'+pantry3BuyFields(selected)+'</div><footer class="pantry3-modal-actions">'+
  '<button type="button" data-action="close-modal">Cancelar</button><button type="submit" class="pantry3-submit">Sumar al inventario</button></footer></form>');
}
function pantry3OpenCount(id){
 const f=food(id),b=pantry2Stock(id);if(!f)throw Error('Producto no encontrado.');
 renderModal('Ajustar inventario','<form id="pantry3CountForm" class="pantry3-form" data-id="'+htmlSafe(id)+'">'+
 '<strong class="pantry3-modal-product">'+htmlSafe(f.name)+'</strong>'+ 
 '<label>Cu\u00e1nto te queda ('+htmlSafe(pantry3QtyLabel(id))+')<input name="qty" type="number" inputmode="decimal" min="0" step="any" value="'+(b.known?b.qty:'')+'" required></label>'+ 
 '<details class="pantry3-options"><summary>Piezas, peso o alerta (opcional)</summary><div class="pantry3-extra">'+
 '<label>Filetes / piezas<input name="pieces" type="number" min="0" step="1" value="'+(b.pieces??'')+'"></label>'+ 
 '<label>Peso (g)<input name="grams" type="number" min="0" step="any" value="'+(b.grams??'')+'"></label>'+ 
 '<label>Aviso cuando queden<input name="min" type="number" min="0" step="any" value="'+(b.min??'')+'"></label></div></details>'+ 
 '<footer class="pantry3-modal-actions"><button type="button" data-action="close-modal">Cancelar</button><button type="submit" class="pantry3-submit">Guardar cantidad</button></footer></form>');
}
// The legacy ingredient reader already supports sequential ing/qty/pcs form rows.
pantry2Rows=function(ingredients=[]){
 const n=ingredients.length+1;
 return Array.from({length:n},(_,i)=>{
  const x=ingredients[i]||{},f=food(x.foodId);
  return '<div class="pantry2-ingredient"><select name="ing'+i+'" aria-label="Ingrediente '+(i+1)+'"><option value="">Sin ingrediente</option>'+pantry2ProductOptions(x.foodId)+'</select>'+ 
   '<input type="number" name="qty'+i+'" step="any" min="0" placeholder="'+htmlSafe(f?.unit||'g/ud')+'" value="'+(x.qty??'')+'" aria-label="Cantidad '+(i+1)+'">'+ 
   '<input type="number" name="pcs'+i+'" step="1" min="0" placeholder="Filetes" value="'+(x.pieces??'')+'" aria-label="Piezas '+(i+1)+'"></div>';
 }).join('');
};
pantry2OpenCook=function(id=null){
 const t=id?pantry2Data().tuppers.find(x=>x.id===id):null;if(id&&!t)throw Error('Tupper no encontrado.');
 const recipe=t?.recipeId||'mixed-chicken',r=RECIPES.find(x=>x.id===recipe);
 const ingredients=t?.ingredients||r?.parts.map(([foodId,qty])=>({foodId,qty}))||[];
 const countButtons=t?'': '<div class="pantry3-cook-count" role="group" aria-label="N\u00famero de tuppers">'+[1,2,6,8,14].map(n=>
 '<button type="button" class="'+(n===1?'selected':'')+'" data-action="pantry3-cook-number" data-value="'+n+'">'+n+'</button>').join('')+'</div>';
 renderModal(t?'Editar tupper':'Preparar tuppers','<form id="pantry2CookForm" class="pantry3-form" data-id="'+htmlSafe(id||'')+'">'+
  '<label>Qu\u00e9 vas a cocinar<select name="recipe" id="pantry2Recipe">'+RECIPES.filter(x=>['mixed','plain'].includes(x.group)).map(x=>
   '<option value="'+x.id+'"'+(recipe===x.id?' selected':'')+'>'+htmlSafe(x.name)+'</option>').join('')+
   '<option value="custom"'+(recipe==='custom'?' selected':'')+'>Plato personalizado</option></select></label>'+ 
  (t?'': '<label>Tuppers que has preparado<input type="number" name="count" value="1" min="1" max="30" step="1" required></label>'+countButtons)+
  '<details class="pantry3-options"><summary>Personalizar ingredientes, nombre o fecha</summary><div class="pantry3-extra">'+
  '<label>Nombre<input name="title" maxlength="90" required value="'+htmlSafe(t?.title||r?.name||'Mi tupper')+'"></label>'+ 
  '<label>Fecha<input name="date" type="date" required value="'+htmlSafe(t?.date||isoToday())+'"></label>'+ 
  '<div class="pantry3-ingredient-head"><strong>Ingredientes por tupper</strong><button type="button" data-action="pantry3-ingredient-add">+ Ingrediente</button></div>'+ 
  '<div id="pantry2IngredientRows">'+pantry2Rows(ingredients)+'</div></div></details>'+ 
  '<p class="pantry3-note">'+(t?'Al editar, se actualizan las cantidades del inventario.':'Los ingredientes se descuentan una sola vez, al confirmar la preparaci\u00f3n.')+'</p>'+ 
  '<footer class="pantry3-modal-actions"><button type="button" data-action="close-modal">Cancelar</button>'+(!t?'<button type="submit" data-plan="1">Planificar</button>':'')+ 
  '<button type="submit" class="pantry3-submit">'+(t?'Guardar':'Preparados')+'</button></footer></form>');
};
function pantry3HandleForm(form,event){
 const v=new FormData(form);
 if(form.id==='pantry3BuyForm'){
  const id=String(v.get('foodId')||''),f=food(id);if(!f)throw Error('Producto no encontrado.');
  let size,boxes=1,pieces=null,grams=null;
  if(f.unit==='g'){
   size=asNum(v.get('grams'));pieces=pantry2Optional(String(v.get('pieces')||'').trim());grams=size;
  }else{
   size=asNum(v.get('size'));boxes=asNum(v.get('packages'));
   if(!pantry2N(size)||size<=0)throw Error('Indica unidades por envase.');
   pantry3RememberSize(id,size);
  }
  pantry3BuyPack(id,size,boxes,pieces,grams);closeModal();changed('Compra sumada al inventario.');return true;
 }
 if(form.id==='pantry3CountForm'){
  const id=form.dataset.id,qty=asNum(v.get('qty'));
  const pieces=pantry2Optional(String(v.get('pieces')||'').trim()),grams=pantry2Optional(String(v.get('grams')||'').trim());
  const min=pantry2Optional(String(v.get('min')||'').trim());
  pantry2Recount(id,qty,pieces,grams,min);closeModal();changed('Inventario corregido.');return true;
 }
 return false;
}
function pantry3Action(button){
 const action=button.dataset.action,id=button.dataset.id;
 switch(action){
  case 'pantry3-tab':if(['consumables','raw','tuppers'].includes(id)){pantry3Tab=id;pantryQuery='';render()}return true;
  case 'pantry3-buy-quick':{
   const size=Number(button.dataset.size);pantry3BuyPack(id,size);changed('A\u00f1adido 1 envase de '+locale(size,0)+'.');return true;
  }
  case 'pantry3-buy-custom':pantry3OpenBuy(id||'');return true;
  case 'pantry3-recount':pantry3OpenCount(id);return true;
  case 'pantry3-select-size':{
   const form=$('#pantry3BuyForm'),input=form?.querySelector('[name="size"]');if(input)input.value=button.dataset.size;
   for(const node of form?.querySelectorAll('.pantry3-choice')||[])node.classList.toggle('selected',node===button);
   return true;
  }
  case 'pantry3-cook-number':{
   const form=$('#pantry2CookForm'),input=form?.querySelector('[name="count"]');if(input)input.value=button.dataset.value;
   for(const node of form?.querySelectorAll('.pantry3-cook-count button')||[])node.classList.toggle('selected',node===button);
   return true;
  }
  case 'pantry3-ingredient-add':{
   const box=$('#pantry2IngredientRows'),n=box?.children.length||0;
   if(!box||n>=30)return true;
   const row=pantry2Rows(Array.from({length:n},(_,i)=>({foodId:'',qty:null,pieces:null}))); // same sequential naming as the current form
   const wrapper=document.createElement('div');wrapper.innerHTML=row;const newRow=wrapper.children[n];
   if(newRow)box.appendChild(newRow);return true;
  }
  default:return false;
 }
}
const pantry3PreviousAction=pantryAction;
pantryAction=function(button){return pantry3Action(button)||pantry3PreviousAction(button)};
currentPantry=pantry3Current;
pantryCards=pantry3Cards;
const pantry3PreviousRender=render;
render=function(){
 pantry3PreviousRender();
 const onPantry=activeView==='pantry';
 const calendar=$('#calendarBar');if(calendar)calendar.hidden=onPantry;
 const heading=document.querySelector('.topbar>.eyebrow');if(heading)heading.hidden=onPantry;
};
if(typeof document!=='undefined'&&document.addEventListener){
 document.addEventListener('submit',event=>{
  if(!['pantry3BuyForm','pantry3CountForm'].includes(event.target.id))return;
  event.preventDefault();try{pantry3HandleForm(event.target,event)}catch(err){toast('No se guard\u00f3: '+err.message)}
 });
 document.addEventListener('change',event=>{
  if(event.target.id!=='pantry3Product')return;
  const f=food(event.target.value),fields=$('#pantry3BuyFields');if(f&&fields)fields.innerHTML=pantry3BuyFields(f);
 });
}
// Expose tested package and tab functions without changing private user data.
globalThis.DinoPantryV3={formats:pantry3Format,buyPack:pantry3BuyPack,getTab:()=>pantry3Tab,setTab:x=>{pantry3Tab=x},recount:pantry2Recount};