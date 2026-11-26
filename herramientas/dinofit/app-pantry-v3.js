'use strict';
// DinoFit Despensa personal: tres pestañas, inventario por envases y cocina por porciones.
// Reutiliza el motor de inventario v2; no se alteran registros antiguos ni cuentas reales.
let pantry3Tab='consumables',pantry3Searching=false;
const pantry3Defaults={
 coffee:{name:'caja',sizes:[10,20],unit:'cápsulas'},
 cheese:{name:'paquete',sizes:[12,13],unit:'lonchas'},
 'activia-cereales':{name:'pack',sizes:[4,8],unit:'yogures'},
 flan:{name:'pack',sizes:[4,6],unit:'flanes'},
 yopro:{name:'pack',sizes:[4,6],unit:'unidades'},
 'yopro-fresa':{name:'pack',sizes:[4],unit:'unidades'},
 'yopro-stracciatella':{name:'pack',sizes:[4],unit:'unidades'},
 egg:{name:'cartón',sizes:[6,12],unit:'huevos'},
 'burger-beef':{name:'bandeja',sizes:[2,4],unit:'hamburguesas'},
 'burger-chicken':{name:'bandeja',sizes:[2,4],unit:'hamburguesas'},
 'burger-mixed':{name:'bandeja',sizes:[2,4],unit:'hamburguesas'},
 chicken:{name:'bandeja',sizes:[],unit:'g'},
 beef:{name:'bandeja',sizes:[],unit:'g'},
 'saute-chicken':{name:'bolsa congelada',sizes:[],unit:'g'},
 'saute-frank':{name:'bolsa congelada',sizes:[],unit:'g'},
 garlic:{name:'bolsa congelada',sizes:[],unit:'g'},
 onion:{name:'bolsa congelada',sizes:[],unit:'g'},
 oil:{name:'botella',sizes:[455,910],labels:['500 ml ≈ 455 g','1 litro ≈ 910 g'],unit:'g'},
 curry:{name:'bote',sizes:[],unit:'g'},
 oregano:{name:'bote',sizes:[],unit:'g'},
 pepper:{name:'bote',sizes:[],unit:'g'},
 milk:{name:'brik',sizes:[1000,2000],unit:'ml'},
 cola:{name:'botella',sizes:[1000,2000],unit:'ml'},
 yogurt:{name:'pack de yogures bebibles',sizes:[],unit:'g'},
 'yogurt-berries':{name:'pack de yogures bebibles',sizes:[],unit:'g'},
 'yogurt-pineapple':{name:'pack de yogures bebibles',sizes:[],unit:'g'}
};
const pantry3Escape=v=>htmlSafe(String(v??''));
const pantry3Icon=id=>({
 yogurt:'🥛','yogurt-berries':'🫐','yogurt-pineapple':'🍍',
 curry:'🧂',oregano:'🌿',pepper:'🧂'
})[id]||pantry2Visual(id);
function pantry3Format(id){
 const f=food(id),known=pantry3Defaults[id],p=pantry2Data();
 const custom=p.packageFormats?.[id];
 const sizes=Array.isArray(custom)&&custom.length>0?custom.filter(x=>pantry2N(x)&&x>0).slice(0,2):known?.sizes||[];
 const defaultName=(f?.unit==='ud'?'paquete':f?.unit==='ml'?'botella':pantry2Raw(f)?'paquete':'envase');
 return {name:known?.name||defaultName,unit:known?.unit||(f?.unit==='ud'?'unidades':f?.unit||'ud'),sizes,
  labels:sizes.map((v,i)=>known?.labels&&v===known.sizes[i]?known.labels[i]:`${locale(v,Number.isInteger(v)?0:2)} ${known?.unit||f?.unit||'ud'}`)};
}
function pantry3RememberSize(id,size){
 if(!pantry2N(size)||size<=0)return;
 const p=pantry2Data(),formats=pantry3Format(id).sizes;if(formats.includes(size))return;
 p.packageFormats=p.packageFormats||{};p.packageFormats[id]=formats.length?[formats[0],size]:[size];
}
function pantry3PartialBaseline(id,pieces=null){
 const p=pantry2Data(),f=food(id);if(!f||p.stock[id])return;
 p.stock[id]={qty:0,pieces:f.unit==='ud'||pieces!==null?0:null,grams:f.unit==='g'?0:null,
  min:pantry2ProductMin(id,null),countedAt:new Date().toISOString(),partial:true,
  logIds:(state.logs||[]).map(x=>x.id),
  purchaseIds:p.purchases.filter(x=>x.foodId===id&&x.active!==false).map(x=>x.id),
  tupperIds:p.tuppers.filter(x=>x.status==='prepared').map(x=>x.id)};
}
function pantry3BuyPack(id,size,packages=1,pieces=null,grams=null){
 const f=food(id);
 if(!f||!pantry2N(size)||size<=0||size>1e6||!Number.isInteger(packages)||packages<1||packages>100)
  throw Error('Revisa la cantidad de envases y su contenido.');
 if(pieces!==null&&(!Number.isInteger(pieces)||pieces<0||pieces>10000))throw Error('Revisa las piezas por envase.');
 const qty=pantry2Round(size*packages);if(qty>1e6)throw Error('Cantidad excesiva.');
 pantry3PartialBaseline(id,pieces);
 const purchase=pantry2Purchase(id,qty,pieces===null?null:pieces*packages,f.unit==='g'?qty:grams);
 purchase.packSize=size;purchase.packCount=packages;purchase.packName=pantry3Format(id).name;
 return purchase;
}
function pantry3LastPack(id){
 const p=pantry2Data(),purchase=p.purchases.slice().reverse().find(x=>x.foodId===id&&x.active!==false&&pantry2N(x.packSize)&&x.packSize>0);
 return purchase?{size:purchase.packSize,name:purchase.packName||pantry3Format(id).name,
  pieces:pantry2N(purchase.pieces)&&pantry2N(purchase.packCount)?purchase.pieces/purchase.packCount:null}:null;
}
function pantry3QtyLabel(id){
 return ({coffee:'cápsulas',cheese:'lonchas','activia-cereales':'yogures',flan:'flanes',
  yopro:'unidades',egg:'huevos','burger-beef':'hamburguesas','burger-chicken':'hamburguesas',
  'burger-mixed':'hamburguesas'})[id]||pantry2Unit(id);
}
function pantry3DisplayNumber(id,b){
 const qty=b.known?Math.max(0,b.qty):null;
 if(qty===null)return '<strong class="pantry3-big">—</strong><span class="pantry3-bigunit">Sin contar</span>';
 return '<strong class="pantry3-big">'+pantry3Escape(locale(qty,Number.isInteger(qty)?0:2))+'</strong>'+
  '<span class="pantry3-bigunit">'+pantry3Escape(pantry3QtyLabel(id))+'</span>';
}
function pantry3Card(f){
 const b=pantry2Stock(f.id),partial=!!pantry2Data().stock[f.id]?.partial;
 const min=b.known&&pantry2N(b.min)&&b.qty<=b.min;
 const extra=b.known&&f.unit==='g'&&b.pieces!==null?' · '+locale(b.pieces,0)+' piezas':
  b.known&&f.unit==='ud'&&b.grams!==null?' · '+locale(b.grams,0)+' g':'';
 return '<button type="button" class="pantry3-tile'+(min?' pantry3-low':'')+'" data-action="pantry3-open" data-id="'+pantry3Escape(f.id)+'"'+
  ' aria-label="'+pantry3Escape('Abrir '+f.name+', '+(b.known?pantryQty(Math.max(0,b.qty),pantry3QtyLabel(f.id)):'sin inventario'))+'">'+
  '<span class="pantry3-tile-emoji" aria-hidden="true">'+pantry3Icon(f.id)+'</span>'+ 
  '<span class="pantry3-tile-name">'+pantry3Escape(f.name)+'</span>'+ 
  '<span class="pantry3-tile-quantity">'+pantry3DisplayNumber(f.id,b)+'</span>'+ 
  (extra?'<span class="pantry3-tile-extra">'+pantry3Escape(extra.slice(3))+'</span>':'')+
  (partial?'<span class="pantry3-tile-hint">Mínimo registrado</span>':min?'<span class="pantry3-tile-hint">Reponer pronto</span>':'')+'</button>';
}
function pantry3Filtered(){
 return (state.foods||[]).filter(f=>f?.id&&f.id!=='burger-unknown'&&
  (pantry3Tab==='raw'?pantry2Raw(f):!pantry2Raw(f))&&(!pantryQuery||f.name.toLocaleLowerCase('es').includes(pantryQuery)))
  .sort((a,b)=>Number(pantry2Stock(b.id).known)-Number(pantry2Stock(a.id).known)||a.name.localeCompare(b.name,'es'));
}
function pantry3TupperKcal(t){
 const ingredients=t?.ingredients||[];
 if(!ingredients.length)return null;
 let total=0;
 for(const item of ingredients){
  const f=food(item.foodId);
  if(!f||!pantry2N(f.kcal)||!pantry2N(item.qty))return null;
  total+=item.qty*(f.unit==='ud'?(f.factor||1):1)*f.kcal/100;
 }
 return Math.round(total);
}
function pantry3TupperCards(){
 const p=pantry2Data(),used=pantry2Consumed().used,groups=new Map();
 for(const t of p.tuppers){
  const key=t.recipeId+'|'+t.title+'|'+t.status;
  if(!groups.has(key))groups.set(key,{name:t.title,status:t.status,items:[]});groups.get(key).items.push(t);
 }
 if(!groups.size)return '<div class="pantry3-empty">Todavía no hay tuppers preparados. Utiliza «Preparar tuppers» para empezar.</div>';
 return '<div class="pantry3-tiles">'+[...groups.values()].reverse().map(g=>{
  const available=g.items.filter(t=>t.status==='prepared'&&!used.has(t.id));
  const count=g.status==='planned'?g.items.length:available.length;
  const availableCalories=(g.status==='planned'?g.items:available).map(pantry3TupperKcal).filter(n=>n!==null);
  const minKcal=availableCalories.length?Math.min(...availableCalories):null;
  const maxKcal=availableCalories.length?Math.max(...availableCalories):null;
  const calorieLabel=minKcal===null?'':(minKcal===maxKcal?'≈ '+minKcal+' kcal/tupper':'≈ '+minKcal+'–'+maxKcal+' kcal/tupper');
  return '<button class="pantry3-tile pantry3-tupper-tile" type="button" data-action="pantry3-open-tuppers" data-id="'+pantry3Escape(g.items[0].id)+'">'+
   '<span class="pantry3-tile-emoji">🍲</span><span class="pantry3-tile-name">'+pantry3Escape(g.name)+'</span>'+ 
   '<span class="pantry3-tile-quantity"><strong class="pantry3-big">'+count+'</strong><span class="pantry3-bigunit">'+(g.status==='planned'?'planificados':'disponibles')+'</span></span>'+ 
   '<span class="pantry3-tile-hint">'+(calorieLabel?pantry3Escape(calorieLabel)+' · ':'')+'Toca para revisar</span></button>';
 }).join('')+'</div>';
}
function pantry3Cards(){
 if(pantry3Tab==='tuppers')return pantry3TupperCards();
 const items=pantry3Filtered();
 return items.length?'<div class="pantry3-tiles">'+items.map(pantry3Card).join('')+'</div>':
  '<div class="pantry3-empty">No hay productos con ese nombre. <button type="button" class="pantry3-close" data-action="pantry-product-new">+ Nuevo producto</button></div>';
}
function pantry3Current(){
 const p=pantry2Data(),foods=(state.foods||[]).filter(f=>f?.id&&f.id!=='burger-unknown');
 const stockCount=type=>type==='tuppers'?pantry2AvailableTuppers().length:foods.filter(f=>{
  if(pantry2Raw(f)!==(type==='raw'))return false;
  const stock=pantry2Stock(f.id);
  return stock.known && stock.qty > 0;
 }).length;
 const tabs=[['consumables','Consumibles','🥛'],['raw','Crudos','🥩'],['tuppers','Tuppers','🍲']];
 const purchases=p.purchases.filter(x=>x.active!==false&&pantry3Tab!=='tuppers'&&(pantry3Tab==='raw'?pantry2Raw(food(x.foodId)):!pantry2Raw(food(x.foodId))));
 return '<div class="pantry3-page"><header class="pantry3-intro"><span class="eyebrow">INVENTARIO PERSONAL</span><h1>Despensa</h1></header>'+ 
  '<nav class="pantry3-tabs" role="tablist" aria-label="Apartados de Despensa">'+tabs.map(([id,name,emoji])=>
  '<button type="button" role="tab" aria-selected="'+(id===pantry3Tab)+'" class="pantry3-tab '+(id===pantry3Tab?'selected':'')+'" data-action="pantry3-tab" data-id="'+id+'">'+
  '<span aria-hidden="true">'+emoji+'</span><strong>'+name+'</strong><small>'+stockCount(id)+'</small></button>').join('')+'</nav>'+ 
  '<section class="pantry3-section" role="tabpanel" aria-label="'+pantry3Escape(tabs.find(x=>x[0]===pantry3Tab)[1])+'">'+
  '<div class="pantry3-compact-head"><span>'+(pantry3Tab==='tuppers'?'Preparados y disponibles':'Toca un producto para registrar una compra')+'</span>'+ 
  (pantry3Tab==='tuppers'?'<button type="button" data-action="pantry2-cook" class="pantry3-prepare">+ Preparar</button>':
   '<button type="button" data-action="pantry3-search-toggle" aria-label="Buscar producto" class="pantry3-search-toggle">⌕</button>')+'</div>'+ 
  (pantry3Searching&&pantry3Tab!=='tuppers'?'<label class="pantry3-search">Buscar producto<input type="search" id="pantrySearch" placeholder="Café, ajo, yogur..." value="'+pantry3Escape(pantryQuery)+'"></label>':'')+
  '<div id="pantryCatalog">'+pantry3Cards()+'</div></section>'+ 
  (purchases.length?'<details class="pantry2-history pantry3-history"><summary>Compras anteriores y deshacer</summary>'+purchases.slice(-8).reverse().map(x=>
   '<div><span>'+pantry3Escape(pantry2FoodName(x.foodId))+' · +'+pantry3Escape(pantryQty(x.qty,pantry2Unit(x.foodId)))+'</span>'+ 
   '<button type="button" data-action="pantry2-undo-buy" data-id="'+pantry3Escape(x.id)+'">Deshacer</button></div>').join('')+'</details>':'')+'</div>';
}
function pantry3OpenTupperGroup(id){
 const p=pantry2Data(),first=p.tuppers.find(t=>t.id===id);if(!first)throw Error('No se encontró el tupper.');
 const group=p.tuppers.filter(t=>t.recipeId===first.recipeId&&t.title===first.title&&t.status===first.status);
 const used=pantry2Consumed().used;
 renderModal(first.title,'<div class="pantry3-form"><p>Revisa y corrige tus preparaciones aquí. Para registrar que has comido un tupper, utiliza Mi día.</p>'+ 
  '<div class="pantry3-tupper-list">'+group.map((t,i)=>{
    const kcal=pantry3TupperKcal(t);
    return '<div class="pantry3-tupper-line"><span>Tupper '+(i+1)+(kcal===null?'':' · ≈ '+kcal+' kcal')+(used.has(t.id)?' · consumido':'')+'</span><span class="pantry3-actions">'+ 
   '<button type="button" data-action="pantry2-edit-tupper" data-id="'+pantry3Escape(t.id)+'">✎ Editar</button>'+ 
   (!used.has(t.id)?'<button type="button" data-action="pantry2-delete-tupper" data-id="'+pantry3Escape(t.id)+'">Eliminar</button>':'')+'</span></div>'+dfNutritionTotalsMarkup(t.ingredients||[],0,'Información nutricional · táper '+(i+1));
  }).join('')+'</div>'+ 
  (first.status==='planned'?'<button type="button" class="pantry3-prepare" data-action="pantry2-prepare-group" data-id="'+pantry3Escape(first.id)+'">Confirmar preparación</button>':'')+ 
  '<button type="button" class="pantry3-close" data-action="close-modal">Cerrar</button></div>');
}
function pantry3OpenBuy(id){
 const f=food(id);if(!f)throw Error('Producto no encontrado.');
 const fmt=pantry3Format(id),stock=pantry2Stock(id),latest=pantry3LastPack(id);
 const sizes=fmt.sizes.length?fmt.sizes:(latest?[latest.size]:[]);
 const first=sizes[0]||'';
 const choices=sizes.length?'<div class="pantry3-choicegrid" role="group" aria-label="Tamaño del envase">'+sizes.slice(0,2).map((n,i)=>
  '<button type="button" class="pantry3-choice '+(!i?'selected':'')+'" data-action="pantry3-select-size" data-size="'+n+'">'+ 
  '<strong>'+pantry3Escape(fmt.labels[i]||`${locale(n)} ${fmt.unit}`)+'</strong><small>1 '+pantry3Escape(fmt.name)+'</small></button>').join('')+'</div>':
  '<label class="pantry3-size-inline">Peso o contenido de 1 '+pantry3Escape(fmt.name)+' ('+pantry3Escape(fmt.unit)+')<input name="size" type="number" step="any" min="0.01" inputmode="decimal" placeholder="Peso que figura en el envase"></label>';
 const sizeField=sizes.length?'<input type="hidden" name="size" value="'+first+'">':'';
 const piecesRequired=['chicken','beef'].includes(id);
 const note=id==='oil'?'<p class="pantry3-note">El aceite se registra en gramos (500 ml ≈ 455 g). Puedes ajustar la cantidad si la conoces.</p>':'<p class="pantry3-note">Se suma el contenido de los envases; no tendrás que contar unidades una a una.</p>';
 renderModal('Compra de '+f.name,'<form id="pantry3BuyForm" class="pantry3-form" data-id="'+pantry3Escape(id)+'">'+
  '<div class="pantry3-modal-intro"><span aria-hidden="true">'+pantry3Icon(id)+'</span><div><strong>'+pantry3Escape(f.name)+'</strong>'+ 
  '<small>Ahora: '+(stock.known?pantry3Escape(pantryQty(Math.max(0,stock.qty),pantry3QtyLabel(id))):'Sin recuento inicial')+'</small></div></div>'+ 
  '<div class="pantry3-buy-title"><strong>He comprado...</strong>'+ 
  '<button type="button" data-action="pantry3-edit-buy" aria-label="Personalizar formato o corregir inventario" class="pantry3-edit-icon" aria-expanded="false">✎</button></div>'+ 
  choices+sizeField+
  '<div class="pantry3-pack-count"><span>Cantidad de envases</span><div><button type="button" data-action="pantry3-package-minus" aria-label="Un envase menos">−</button>'+ 
  '<input name="packages" type="number" inputmode="numeric" min="1" max="100" step="1" value="1" required aria-label="Cantidad de envases">'+ 
  '<button type="button" data-action="pantry3-package-plus" aria-label="Un envase más">+</button></div></div>'+ 
  (piecesRequired?'<label class="pantry3-pieces-simple">Filetes dentro de cada bandeja (opcional)<input name="pieces" type="number" min="0" max="10000" step="1" inputmode="numeric" placeholder="Ej. 5"></label>':'')+
  '<div id="pantry3Advanced" class="pantry3-advanced" hidden><strong>Ajustes</strong>'+ 
  (sizes.length?'<label>Contenido por envase ('+pantry3Escape(fmt.unit)+')<input name="customSize" type="number" min="0.01" step="any" inputmode="decimal" placeholder="Otro tamaño"></label>':'')+
  '<label>Operación<select name="mode"><option value="purchase">Sumar compra</option><option value="count">Corregir lo que tengo</option></select></label>'+ 
  '<label class="pantry3-current-count" hidden>Existencias reales ('+pantry3Escape(pantry3QtyLabel(id))+')<input name="total" type="number" min="0" step="any" inputmode="decimal"></label>'+ 
  '<label>Avisarme cuando queden<input name="min" type="number" min="0" step="any" value="'+pantry3Escape(stock.min??'')+'" placeholder="Opcional"></label></div>'+ 
  note+'<button type="button" class="pantry3-close pantry3-nutrition-link" aria-expanded="false" data-action="pantry3-nutrition">Ficha nutricional</button>'+
  '<div class="pantry3-nutrition" id="pantry3Nutrition" hidden></div><footer class="pantry3-modal-actions"><button type="button" data-action="close-modal">Cancelar</button>'+ 
  '<button type="submit" class="pantry3-submit">Registrar compra</button></footer></form>');
}
function pantry3Rows(ingredients=[]){
 return ingredients.map((x,i)=>pantry3IngredientRow(x,i)).join('');
}
function pantry3IngredientRow(x,i){
 const f=food(x.foodId),pack=pantry3LastPack(x.foodId),n=x.qty??'',unit=f?.unit||'g';
 const portions=pack?'<div class="pantry3-portions"><span>Del último '+pantry3Escape(pack.name)+' comprado:</span>'+ 
  [[0.25,'¼'],[0.5,'½'],[1,'Entero']].map(([frac,label])=>'<button type="button" data-action="pantry3-portion" data-index="'+i+'" data-fraction="'+frac+'">'+label+'</button>').join('')+'</div>':'';
 return '<div class="pantry3-ingredient" data-row="'+i+'">'+ 
  '<div class="pantry3-ingredient-head"><span aria-hidden="true">'+pantry3Icon(f?.id)+'</span><div><strong class="pantry3-ing-name">'+pantry3Escape(f?.name||'Ingrediente')+'</strong>'+ 
  '<small class="pantry3-ing-total">'+pantry3Escape(n?pantryQty(n,unit)+' por tupper':'Indicar cantidad')+'</small></div>'+ 
  '<button type="button" class="pantry3-ing-pencil" data-action="pantry3-ingredient-edit" data-index="'+i+'" aria-label="Editar ingrediente">✎</button></div>'+ 
  portions+'<div class="pantry3-ing-edit" hidden><label>Ingrediente<select name="ing'+i+'" aria-label="Ingrediente '+(i+1)+'"><option value="">Selecciona uno</option>'+pantry2ProductOptions(x.foodId)+'</select></label>'+ 
  '<label>Por tupper ('+pantry3Escape(unit)+')<input type="number" name="qty'+i+'" step="any" min="0" inputmode="decimal" value="'+pantry3Escape(n)+'"></label>'+ 
  '<label>Filetes / piezas (opcional)<input type="number" name="pcs'+i+'" step="1" min="0" value="'+pantry3Escape(x.pieces??'')+'"></label></div>'+ 
  // Hidden inputs must be submitted even when the advanced controls are collapsed.
  '<input type="hidden" name="ing'+i+'" value="'+pantry3Escape(x.foodId||'')+'" data-basic-ing>'+ 
  '<input type="hidden" name="qty'+i+'" value="'+pantry3Escape(n)+'" data-basic-qty>'+ 
  '<input type="hidden" name="pcs'+i+'" value="'+pantry3Escape(x.pieces??'')+'" data-basic-pcs></div>';
}
// Use a single set of named fields per ingredient on submit; the visible edit fields take precedence.
function pantry3CanonicalizeCook(form){
 for(const row of form.querySelectorAll('.pantry3-ingredient')){
  const edits=row.querySelector('.pantry3-ing-edit');const editing=!edits.hidden;
  for(const key of ['ing','qty','pcs']){
   const base=row.querySelector('[data-basic-'+key+']'),visible=edits.querySelector('[name="'+key+row.dataset.row+'"]');
   if(editing&&visible){base.value=visible.value;visible.disabled=true;}else if(visible){visible.disabled=true;}
  }
 }
}
function pantry3OpenCook(id=null){
 const t=id?pantry2Data().tuppers.find(x=>x.id===id):null;if(id&&!t)throw Error('Tupper no encontrado.');
 const recipe=t?.recipeId||'mixed-chicken',r=RECIPES.find(x=>x.id===recipe);
 const ingredients=t?.ingredients||r?.parts.map(([foodId,qty])=>({foodId,qty}))||[];
 const countButtons=t?'':'<div class="pantry3-cook-count" role="group" aria-label="Número de tuppers">'+[1,2,6,8,14].map(n=>
  '<button type="button" class="'+(n===1?'selected':'')+'" data-action="pantry3-cook-number" data-value="'+n+'">'+n+'</button>').join('')+'</div>';
 renderModal(t?'Editar tupper':'Preparar tuppers','<form id="pantry2CookForm" class="pantry3-form" data-id="'+pantry3Escape(id||'')+'">'+ 
  '<label>Qué has preparado<select name="recipe" id="pantry2Recipe">'+RECIPES.filter(x=>['mixed','plain'].includes(x.group)).map(x=>
  '<option value="'+x.id+'"'+(recipe===x.id?' selected':'')+'>'+pantry3Escape(x.name)+'</option>').join('')+
  '<option value="custom"'+(recipe==='custom'?' selected':'')+'>Personalizado</option></select></label>'+ 
  (t?'':'<label>Cuántos tuppers<input name="count" type="number" min="1" max="30" step="1" value="1" required></label>'+countButtons)+
  '<div class="pantry3-ingredients-heading"><strong>Porciones utilizadas</strong><small>¼, ½ o 1 envase se reparten entre todos los tuppers del lote</small></div>'+ 
  '<div id="pantry2IngredientRows">'+pantry3Rows(ingredients)+'</div>'+ 
  '<div class="pantry3-cook-more"><button type="button" data-action="pantry3-ingredient-add">+ Ingrediente</button>'+ 
  '<button type="button" data-action="pantry3-cook-details">✎ Nombre y fecha</button></div>'+ 
  '<div id="pantry3CookDetails" class="pantry3-advanced" hidden>'+ 
  '<label>Nombre del plato<input name="title" maxlength="90" value="'+pantry3Escape(t?.title||r?.name||'Mi tupper')+'" required></label>'+ 
  '<label>Fecha<input type="date" name="date" value="'+pantry3Escape(t?.date||isoToday())+'" required></label></div>'+ 
  '<footer class="pantry3-modal-actions"><button type="button" data-action="close-modal">Cancelar</button>'+ 
  (!t?'<button type="submit" data-plan="1">Planificar</button>':'')+
  '<button type="submit" class="pantry3-submit">'+(t?'Guardar cambios':'Confirmar preparados')+'</button></footer></form>');
}
function pantry3ApplyPortion(row,fraction){
 const basicId=row.querySelector('[data-basic-ing]')?.value,pack=pantry3LastPack(basicId);
 if(!pack)throw Error('Primero registra la compra de ese envase para calcular sus porciones.');
 const count=Number($('#pantry2CookForm [name="count"]')?.value||1);
 if(!Number.isInteger(count)||count<1)return;
 const total=pantry2Round(pack.size*fraction),qty=Math.floor((total/count+1e-9)*1000)/1000,pieces=pack.pieces*fraction/count;
 row.querySelector('[data-basic-qty]').value=qty;
 row.querySelector('[data-basic-pcs]').value=Number.isInteger(pieces)&&pieces>0?pieces:'';
 const editor=row.querySelector('.pantry3-ing-edit');
 if(editor){
  const qtyInput=editor.querySelector('[name="qty'+row.dataset.row+'"]'),pcsInput=editor.querySelector('[name="pcs'+row.dataset.row+'"]');
  if(qtyInput)qtyInput.value=qty;
  if(pcsInput)pcsInput.value=row.querySelector('[data-basic-pcs]').value;
 }
 row.dataset.pantry3Fraction=String(fraction);row.dataset.pantry3Pack=String(pack.size);
 row.querySelector('.pantry3-ing-total').textContent=pantryQty(qty,pantry2Unit(basicId))+' por tupper · '+pantryQty(total,pantry2Unit(basicId))+' en el lote';
 row.querySelectorAll('.pantry3-portions button').forEach(btn=>btn.classList.toggle('selected',Number(btn.dataset.fraction)===fraction));
}
function pantry3Form(form){
 const v=new FormData(form);
 if(form.id==='pantry3BuyForm'){
  const id=form.dataset.id,f=food(id),mode=String(v.get('mode')||'purchase');if(!f)throw Error('Producto no encontrado.');
  let size=pantry2Optional(String(v.get('size')||'').trim()),custom=pantry2Optional(String(v.get('customSize')||'').trim());
  if(custom!==null)size=custom;
  const packages=asNum(v.get('packages')),pieces=pantry2Optional(String(v.get('pieces')||'').trim());
  const min=pantry2Optional(String(v.get('min')||'').trim());
  if(mode==='count'){
   const total=pantry2Optional(String(v.get('total')||'').trim());if(total===null)throw Error('Introduce las existencias actuales.');
   pantry2Recount(id,total,pieces,f.unit==='g'?total:null,min);
  }else{
   if(size===null)throw Error('Indica el contenido del envase.');
   pantry3BuyPack(id,size,packages,pieces);
   pantry3RememberSize(id,size);
   if(min!==null)pantry2Data().stock[id].min=min;
  }
  closeModal();changed(mode==='count'?'Inventario corregido.':'Compra incorporada a la despensa.');return true;
 }
 if(form.id==='pantry2CookForm'){
  pantry3CanonicalizeCook(form);
  // The previous v2 submit listener will use the corrected per-tupper amounts.
  return false;
 }
 return false;
}
function pantry3Action(button){
 const action=button.dataset.action,id=button.dataset.id;
 switch(action){
  case 'pantry3-tab':if(['consumables','raw','tuppers'].includes(id)){pantry3Tab=id;pantryQuery='';pantry3Searching=false;render()}return true;
  case 'pantry3-open':pantry3OpenBuy(id);return true;
  case 'pantry3-open-tuppers':pantry3OpenTupperGroup(id);return true;
  case 'pantry3-search-toggle':pantry3Searching=!pantry3Searching;pantryQuery='';render();if(pantry3Searching)$('#pantrySearch')?.focus();return true;
  case 'pantry3-nutrition':{
   const pane=$('#pantry3Nutrition'),form=$('#pantry3BuyForm');
   if(pane&&form){if(pane.hidden)pane.innerHTML=dfNutritionProductMarkup(food(form.dataset.id));pane.hidden=!pane.hidden;
    button.setAttribute('aria-expanded',String(!pane.hidden));}
   return true;
  }
  case 'pantry3-edit-buy':{
   const panel=$('#pantry3Advanced');if(panel){panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));}
   return true;
  }
  case 'pantry3-package-plus':case 'pantry3-package-minus':{
   const input=$('#pantry3BuyForm [name="packages"]');if(input)input.value=String(Math.max(1,Math.min(100,(Number(input.value)||1)+(action.endsWith('plus')?1:-1))));return true;
  }
  case 'pantry3-select-size':{
   const form=$('#pantry3BuyForm'),input=form?.querySelector('[name="size"]');if(input)input.value=button.dataset.size;
   for(const b of form?.querySelectorAll('.pantry3-choice')||[])b.classList.toggle('selected',b===button);
   return true;
  }
  case 'pantry3-cook-number':{
   const input=$('#pantry2CookForm [name="count"]');if(input)input.value=button.dataset.value;
   for(const b of $('#pantry2CookForm')?.querySelectorAll('.pantry3-cook-count button')||[])b.classList.toggle('selected',b===button);
   for(const row of $('#pantry2IngredientRows')?.children||[])if(row.dataset.pantry3Fraction)pantry3ApplyPortion(row,Number(row.dataset.pantry3Fraction));
   return true;
  }
  case 'pantry3-portion':{
   const row=$('#pantry2IngredientRows')?.querySelector('[data-row="'+button.dataset.index+'"]');if(row)pantry3ApplyPortion(row,Number(button.dataset.fraction));return true;
  }
  case 'pantry3-ingredient-edit':{
   const row=$('#pantry2IngredientRows')?.querySelector('[data-row="'+button.dataset.index+'"]');if(row){const p=row.querySelector('.pantry3-ing-edit');p.hidden=!p.hidden;}return true;
  }
  case 'pantry3-cook-details':{
   const p=$('#pantry3CookDetails');if(p)p.hidden=!p.hidden;return true;
  }
  case 'pantry3-ingredient-add':{
   const box=$('#pantry2IngredientRows');if(!box||box.children.length>=25)return true;
   const i=box.children.length,w=document.createElement('div');w.innerHTML=pantry3IngredientRow({foodId:'',qty:''},i);
   const el=w.firstElementChild;if(el)box.appendChild(el);return true;
  }
  default:return false;
 }
}
// Reuse the same router and private Supabase document, with a simplified UI only.
const pantry3PreviousAction=pantryAction;
pantryAction=function(button){return pantry3Action(button)||pantry3PreviousAction(button)};
currentPantry=pantry3Current;pantryCards=pantry3Cards;
pantry2OpenCook=pantry3OpenCook;
const pantry3PreviousRender=render;
render=function(){
 pantry3PreviousRender();const pantry=activeView==='pantry';
 const cal=$('#calendarBar');if(cal)cal.hidden=pantry;
 const heading=document.querySelector('.topbar>.eyebrow');if(heading)heading.hidden=pantry;
};
if(typeof document!=='undefined'&&document.addEventListener){
 // Capture cook submit first to ensure the original v2 handler gets the canonical values.
 document.addEventListener('submit',event=>{
  if(event.target.id==='pantry2CookForm')pantry3CanonicalizeCook(event.target);
 },true);
 document.addEventListener('submit',event=>{
  if(event.target.id!=='pantry3BuyForm')return;
  event.preventDefault();try{pantry3Form(event.target)}catch(e){toast('No se guardó: '+e.message)}
 });
 document.addEventListener('change',event=>{
  if(event.target.matches('#pantry3BuyForm [name="mode"]')){
   const counted=event.target.value==='count',target=$('#pantry3BuyForm .pantry3-current-count');if(target)target.hidden=!counted;
   const button=$('#pantry3BuyForm .pantry3-submit');if(button)button.textContent=counted?'Guardar existencias':'Registrar compra';
  }
  if(event.target.matches('#pantry2CookForm [name="count"]')){
   for(const row of $('#pantry2IngredientRows')?.children||[])if(row.dataset.pantry3Fraction)pantry3ApplyPortion(row,Number(row.dataset.pantry3Fraction));
  }
  if(event.target.matches('#pantry2IngredientRows [name^="ing"]')){
   const row=event.target.closest('.pantry3-ingredient');if(!row)return;
   const idx=Number(row.dataset.row),name=event.target.value,qty=Number(row.querySelector('[data-basic-qty]')?.value||0);
   const w=document.createElement('div');w.innerHTML=pantry3IngredientRow({foodId:name,qty},idx);row.replaceWith(w.firstElementChild);
   const edit=$('#pantry2IngredientRows [data-row="'+idx+'"] .pantry3-ing-edit');if(edit)edit.hidden=false;
  }
  if(event.target.id==='pantry2Recipe'){
   // The legacy change handler already swaps rows using pantry2Rows; follow after that handler.
   const r=RECIPES.find(x=>x.id===event.target.value),box=$('#pantry2IngredientRows');
   if(box)box.innerHTML=pantry3Rows(r?.parts.map(([foodId,qty])=>({foodId,qty}))||[]);
   const label=$('#pantry2CookForm [name="title"]');if(label&&r)label.value=r.name;
  }
 });
}
globalThis.DinoPantryV3={formats:pantry3Format,buyPack:pantry3BuyPack,getTab:()=>pantry3Tab,setTab:x=>{pantry3Tab=x},recount:pantry2Recount,lastPack:pantry3LastPack,portion:pantry3ApplyPortion};

