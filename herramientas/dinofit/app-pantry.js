'use strict';
// La despensa se guarda en el documento privado existente; stock inicial historico != stock actual.
let pantryCategory='all',pantryQuery='';
const PANTRY_GROUPS=[['all','Todos'],['proteins','Proteinas'],['veg','Verduras'],['dairy','Postres y lacteos'],['drinks','Bebidas'],['other','Otros']];
function pantryGroup(f){
 if(f.category&&PANTRY_GROUPS.some(x=>x[0]===f.category))return f.category;
 if(['chicken','beef','egg','burger-beef','burger-chicken','burger-mixed','burger-unknown'].includes(f.id))return 'proteins';
 if(['saute-chicken','saute-frank','onion','garlic'].includes(f.id))return 'veg';
 if(['flan','yopro','activia-cereales','cheese','yogurt','yogurt-berries','yogurt-pineapple','milk'].includes(f.id))return 'dairy';
 if(['cola','coffee'].includes(f.id))return 'drinks';
 return 'other';
}
function pantryDirect(f){return f&&['dairy','drinks'].includes(pantryGroup(f))&&f.id!=='milk'||f?.id==='milk'}
function normalizePantry(){
 if(!state)return false;
 if(!state.pantry||Array.isArray(state.pantry)||typeof state.pantry!=='object'){
  state.pantry={version:1,inventory:{},shopping:[],batches:[]};return true;
 }
 let changed=false,p=state.pantry;
 if(!p.inventory||typeof p.inventory!=='object'||Array.isArray(p.inventory)){p.inventory={};changed=true;}
 for(const k of ['shopping','batches'])if(!Array.isArray(p[k])){p[k]=[];changed=true;}
 if(p.version!==1){p.version=1;changed=true;}
 return changed;
}
function pantryData(){return state?.pantry||{version:1,inventory:{},shopping:[],batches:[]}}
function pantryBalance(id){
 const f=food(id),rec=pantryData().inventory[id];
 if(!f||!rec||!isNumber(rec.quantity))return null;
 const base=new Set(rec.existingLogIds||[]);
 let used=0;
 if(pantryDirect(f))for(const log of state.logs||[]){
  if(base.has(log.id)||log.date<rec.date)continue;
  for(const part of log.parts||[])if(part.foodId===id&&isNumber(part.qty))used+=part.qty;
 }
 return {qty:rec.quantity,used,remaining:Math.max(0,+(rec.quantity-used).toFixed(3)),min:rec.min};
}
function pantrySetBalance(id,amount,min=null){
 if(!food(id)||!isNumber(amount)||amount<0||amount>1000000||min!==null&&(!isNumber(min)||min<0||min>1000000))throw Error('Revisa las cantidades.');
 normalizePantry();
 state.pantry.inventory[id]={quantity:amount,min,date:isoToday(),countedAt:new Date().toISOString(),
  existingLogIds:(state.logs||[]).map(l=>l.id)};
}
function pantryQty(value,unit){return locale(value,Number.isInteger(value)?0:2)+' '+(unit||'ud')}
function pantryCatalog(){
 return (state.foods||[]).filter(f=>f?.id&&f.id!=='burger-unknown'&&(pantryCategory==='all'||pantryGroup(f)===pantryCategory)&&
 (!pantryQuery||String(f.name||'').toLocaleLowerCase('es').includes(pantryQuery)));
}
function pantryCards(){
 const foods=pantryCatalog();
 if(!foods.length)return '<div class="empty">No se encontraron productos.</div>';
 return foods.map(f=>{
  const count=pantryBalance(f.id),low=count&&isNumber(count.min)&&count.remaining<=count.min;
  return '<article class="pantry-product"><div class="pantry-description"><strong>'+htmlSafe(f.name)+'</strong>'+
   '<small>'+htmlSafe(f.brand||'')+(f.brand?' · ':'')+htmlSafe(pantryGroup(f))+
   (isNumber(f.kcal)?' · '+htmlSafe(locale(f.kcal,0))+' kcal/100 g o ml':' · Sin ficha nutricional')+'</small>'+
   '<span>'+(count?pantryQty(count.remaining,f.unit):'Stock sin verificar')+'</span>'+
   (low?'<small class="warning">Bajo el minimo</small>':'')+'</div><div class="pantry-buttons">'+
   '<button type="button" class="click sm" data-action="pantry-count" data-id="'+htmlSafe(f.id)+'">Contar</button>'+
   '<button type="button" class="click sm" data-action="pantry-consume" data-id="'+htmlSafe(f.id)+'">Consumir</button>'+
   '</div></article>';
 }).join('');
}
function pantryShopHtml(){
 const list=pantryData().shopping;
 if(!list.length)return '<div class="empty">Aun no has preparado ninguna lista.</div>';
 return list.map(s=>{
  const f=food(s.foodId);return '<div class="pantry-line"><div><strong>'+htmlSafe(f?.name||'Producto')+'</strong>'+
   '<small>'+htmlSafe(pantryQty(s.qty,f?.unit||'ud'))+(s.note?' · '+htmlSafe(s.note):'')+'</small></div>'+
   '<div class="pantry-buttons"><span class="pantry-state">'+(s.status==='received'?'Recibido':'Pendiente')+'</span>'+
   (s.status==='received'?'':'<button class="click sm" data-action="pantry-receive" data-id="'+htmlSafe(s.id)+'">Recibido</button>')+
   '<button class="click sm danger" data-action="pantry-shop-remove" data-id="'+htmlSafe(s.id)+'">Quitar</button></div></div>';
 }).join('');
}
function pantryKcal(batch){
 if(!batch.ingredients?.length)return null;
 let total=0;for(const line of batch.ingredients){
  const f=food(line.foodId);if(!f||!isNumber(f.kcal))return null;
  total+=line.qty*(f.unit==='ud'?(f.factor||1):1)/100*f.kcal;
 }return Math.round(total);
}
function pantryBatchHtml(){
 const list=pantryData().batches;
 if(!list.length)return '<div class="empty">No hay lotes preparados o planificados.</div>';
 return list.slice().reverse().map(b=>{
  const total=pantryKcal(b);
  return '<article class="pantry-batch"><div class="pantry-line"><div><strong>Lote '+htmlSafe(readableDate(b.date))+'</strong>'+
  '<small>'+b.mixed+' con verduras · '+b.plain+' solo proteina · '+(b.mixed+b.plain)+' tuppers</small>'+
  '<small>'+(total===null?'Kcal pendientes de ingredientes':locale(total,0)+' kcal en ingredientes totales (sin repartir por tipo)')+'</small>'+
  '<small>'+htmlSafe(b.note||'')+'</small></div><div class="pantry-buttons">'+
  '<span class="pantry-state">'+(b.status==='prepared'?'Preparado':'Planificado')+'</span>'+
  '<button class="click sm" data-action="pantry-batch-edit" data-id="'+htmlSafe(b.id)+'">Editar</button>'+
  (b.status==='prepared'?'':'<button class="click sm" data-action="pantry-batch-prepare" data-id="'+htmlSafe(b.id)+'">Confirmar preparacion</button>')+
  '</div></div></article>';
 }).join('');
}
function currentPantry(){
 const catalog=(state.foods||[]).filter(f=>f.id!=='burger-unknown');
 const verified=catalog.filter(f=>pantryBalance(f.id)).length;
 const todo=pantryData().shopping.filter(x=>x.status==='pending').length;
 return '<div class="view-head"><span class="eyebrow">ALIMENTACION</span><h1>Despensa</h1>'+
 '<p>Compra cada dos semanas, cocina una vez por semana. Stock real, recetas y tuppers conectados al diario.</p></div>'+
 '<div class="pantry-stats"><div><small>Productos</small><strong>'+catalog.length+'</strong></div>'+
 '<div><small>Contados</small><strong>'+verified+'</strong></div><div><small>Compra pendiente</small><strong>'+todo+'</strong></div></div>'+
 '<section class="section"><div class="section-head"><div><h2>Productos habituales</h2>'+
 '<p>No confundimos las cantidades originales de compra con lo que queda ahora.</p></div>'+
 '<button class="click primary sm" data-action="pantry-product-new">+ Producto</button></div>'+
 '<label class="pantry-search-label">Buscar producto<input type="search" id="pantrySearch" placeholder="YoPRO, pollo, Activia..." value="'+htmlSafe(pantryQuery)+'"></label>'+
 '<div class="pantry-filters">'+PANTRY_GROUPS.map(g=>'<button class="pillbutton '+(pantryCategory===g[0]?'active':'')+
 '" data-action="pantry-category" data-id="'+g[0]+'">'+g[1]+'</button>').join('')+'</div>'+
 '<div id="pantryCatalog" class="pantry-products">'+pantryCards()+'</div>'+
 '<p class="helper section-gap">Tras un recuento, los postres y bebidas consumidos en el diario se descuentan automaticamente. Las materias primas de lotes se descuentan solo al confirmar la preparacion, sin doble descuento por comer tuppers.</p></section>'+
 '<section class="section"><div class="section-head"><div><h2>Lista de compra</h2><p>El pedido no aumenta las existencias hasta marcarlo recibido.</p></div>'+
 '<button class="click primary sm" data-action="pantry-shop-add">+ Añadir</button></div>'+pantryShopHtml()+'</section>'+
 '<section class="section"><div class="section-head"><div><h2>Preparaciones semanales</h2><p>Ingredientes del lote completo, sin pesar individualmente cada filete.</p></div>'+
 '<button class="click primary sm" data-action="pantry-batch-add">+ Lote</button></div>'+pantryBatchHtml()+
 '<p class="helper section-gap">No se crean comidas por planificar un lote. Solo se registra una comida cuando la consumes.</p></section>';
}
function pantryOptions(selected=''){
 return (state.foods||[]).filter(f=>f.id!=='burger-unknown').map(f=>'<option value="'+htmlSafe(f.id)+'"'+(f.id===selected?' selected':'')+'>'+
 htmlSafe(f.name)+' ('+htmlSafe(f.unit||'ud')+')</option>').join('');
}
function pantryFooter(button='Guardar'){
 return '<div class="tools" style="grid-column:1/-1;justify-content:flex-end"><button class="click" type="button" data-action="close-modal">Cancelar</button><button class="click primary" type="submit">'+button+'</button></div>';
}
function openPantryCount(id){
 const f=food(id),bal=pantryBalance(id);if(!f)throw Error('Producto no encontrado.');
 renderModal('Contar '+f.name,'<form id="pantryCountForm" class="input-grid" data-id="'+htmlSafe(id)+'">'+
 '<label>Cantidad actual ('+htmlSafe(f.unit||'ud')+')<input name="amount" type="number" min="0" step="any" required value="'+(bal?bal.remaining:'')+'"></label>'+
 '<label>Avisar si queda menos de<input name="min" type="number" min="0" step="any" value="'+(bal?.min??'')+'" placeholder="Opcional"></label>'+
 pantryFooter('Guardar recuento')+'</form>');
}
function openPantryProduct(){
 renderModal('Nuevo producto','<form id="pantryProductForm" class="input-grid">'+
 '<label>Nombre<input name="name" maxlength="100" required></label><label>Marca<input name="brand" maxlength="80"></label>'+
 '<label>Categoria<select name="category">'+PANTRY_GROUPS.slice(1).map(g=>'<option value="'+g[0]+'">'+g[1]+'</option>').join('')+'</select></label>'+
 '<label>Unidad<select name="unit"><option value="ud">Unidades</option><option value="g">Gramos</option><option value="ml">Mililitros</option></select></label>'+
 '<label>Peso de una unidad (g o ml)<input name="factor" type="number" min=".1" max="10000" step="any" value="1"></label>'+
 '<label>Kcal por 100 g o ml<input name="kcal" type="number" min="0" max="2000" step="any" required></label>'+
 '<label>Hidratos por 100 g o ml<input name="carbs" type="number" min="0" max="100" step="any"></label>'+
 '<label>Proteinas por 100 g o ml<input name="proteins" type="number" min="0" max="100" step="any"></label>'+
 '<label>Grasas por 100 g o ml<input name="fats" type="number" min="0" max="100" step="any"></label>'+
 pantryFooter('Guardar producto')+'</form>');
}
function openPantryShop(){
 renderModal('Anadir a la compra','<form id="pantryShopForm" class="input-grid">'+
 '<label style="grid-column:1/-1">Producto<select name="id">'+pantryOptions()+'</select></label>'+
 '<label>Cantidad en las unidades indicadas<input type="number" name="qty" min=".001" max="1000000" step="any" value="1" required></label>'+
 '<label>Observaciones<input name="note" maxlength="100" placeholder="Tienda o formato"></label>'+
 pantryFooter('Anadir a la lista')+'</form>');
}
function pantryIngredientsFields(batch){
 const lines=batch?.ingredients||[];
 return Array.from({length:Math.max(8,lines.length+1)},(_,i)=>{
  const ing=lines[i];
  return '<div class="pantry-ingredient"><label>Ingrediente<select name="ing'+i+'"><option value="">Sin usar</option>'+pantryOptions(ing?.foodId)+'</select></label>'+
  '<label>Cantidad<input name="qty'+i+'" type="number" step="any" min="0" value="'+(ing?.qty??'')+'" placeholder="g, ml o ud"></label></div>';
 }).join('');
}
function openPantryBatch(id=null){
 const batch=pantryData().batches.find(b=>b.id===id);
 if(batch?.status==='prepared')throw Error('Lote ya preparado: no se puede cambiar un consumo confirmado.');
 renderModal(batch?'Editar plan':'Planificar lote',
 '<form id="pantryBatchForm" class="input-grid" data-id="'+htmlSafe(id||'')+'">'+
 '<label>Primera fecha<input type="date" name="date" value="'+htmlSafe(batch?.date||isoToday())+'" required></label>'+
 '<label>Con verduras<input name="mixed" type="number" min="0" max="100" step="1" value="'+(batch?.mixed??8)+'" required></label>'+
 '<label>Solo proteina<input name="plain" type="number" min="0" max="100" step="1" value="'+(batch?.plain??6)+'" required></label>'+
 '<label style="grid-column:1/-1">Notas<input name="note" maxlength="350" value="'+htmlSafe(batch?.note||'')+'"></label>'+
 '<div style="grid-column:1/-1"><h3>Ingredientes del lote completo</h3><p class="helper">Se pueden completar al cocinar.</p>'+
 pantryIngredientsFields(batch)+'</div>'+pantryFooter('Guardar lote')+'</form>');
}
function openPantryConsume(id){
 const f=food(id);if(!f)throw Error('Producto no encontrado.');
 renderModal('Registrar consumo','<form id="pantryConsumeForm" class="input-grid" data-id="'+htmlSafe(id)+'">'+
 '<p class="helper" style="grid-column:1/-1">'+htmlSafe(f.name)+'</p>'+
 '<label>Fecha<input type="date" name="date" value="'+isoToday()+'" required></label>'+
 '<label>Cantidad ('+htmlSafe(f.unit||'ud')+')<input name="qty" type="number" min=".001" max="1000000" step="any" value="1" required></label>'+
 pantryFooter('Registrar comida')+'</form>');
}
function pantryForm(form){
 const v=new FormData(form),id=form.dataset.id;
 if(form.id==='pantryCountForm'){
  const amount=asNum(v.get('amount')),min=String(v.get('min')||'').trim();
  pantrySetBalance(id,amount,min===''?null:asNum(min));
  closeModal();changed('Recuento guardado.');return true;
 }
 if(form.id==='pantryProductForm'){
  const name=String(v.get('name')||'').trim(),unit=String(v.get('unit')||'ud'),kcal=asNum(v.get('kcal'));
  const factor=unit==='ud'?asNum(v.get('factor')):1;
  if(name.length<2||name.length>100||!['ud','g','ml'].includes(unit)||!isNumber(kcal)||kcal<0||kcal>2000||!isNumber(factor)||factor<=0)throw Error('Ficha de producto no valida.');
  const macros={};for(const field of ['carbs','proteins','fats']){
   const raw=String(v.get(field)||'').trim();
   if(raw){const n=asNum(raw);if(!isNumber(n)||n<0||n>100)throw Error('Macronutriente incorrecto.');macros[field]=n;}
  }
  state.foods.push({id:'custom-'+uid(),name,brand:String(v.get('brand')||'').trim().slice(0,80),
   category:String(v.get('category')||'other'),unit,factor,kcal,min:kcal,max:kcal,stock:null,note:'Ficha creada en despensa',url:'',...macros});
  closeModal();changed('Producto guardado.');return true;
 }
 if(form.id==='pantryShopForm'){
  const foodId=String(v.get('id')||''),qty=asNum(v.get('qty'));
  if(!food(foodId)||!isNumber(qty)||qty<=0||qty>1000000)throw Error('Producto o cantidad no validos.');
  state.pantry.shopping.push({id:uid(),foodId,qty,note:String(v.get('note')||'').trim().slice(0,100),status:'pending'});
  closeModal();changed('Anadido a la compra.');return true;
 }
 if(form.id==='pantryBatchForm'){
  const date=String(v.get('date')||''),mixed=asNum(v.get('mixed')),plain=asNum(v.get('plain'));
  if(!dateValid(date)||!Number.isInteger(mixed)||!Number.isInteger(plain)||mixed<0||plain<0||mixed+plain<1||mixed+plain>100)throw Error('Cantidad de tuppers no valida.');
  const ingredients=new Map();
  for(let i=0;i<Math.max(8,((pantryData().batches.find(b=>b.id===id)?.ingredients)||[]).length+1);i++){
   const foodId=String(v.get('ing'+i)||''),raw=String(v.get('qty'+i)||'').trim();
   if(!foodId&&!raw)continue;
   if(!food(foodId)||!raw)throw Error('Completa ingrediente y cantidad.');
   const qty=asNum(raw);if(!isNumber(qty)||qty<=0||qty>1000000)throw Error('Cantidad incorrecta.');
   ingredients.set(foodId,(ingredients.get(foodId)||0)+qty);
  }
  const current=state.pantry.batches.find(b=>b.id===id);
  const next={id:current?.id||uid(),date,mixed,plain,status:'planned',
   note:String(v.get('note')||'').trim().slice(0,350),
   ingredients:[...ingredients].map(([foodId,qty])=>({foodId,qty}))};
  if(current)Object.assign(current,next);else state.pantry.batches.push(next);
  closeModal();changed('Lote planificado.');return true;
 }
 if(form.id==='pantryConsumeForm'){
  const date=String(v.get('date')||''),qty=asNum(v.get('qty'));
  if(!dateValid(date)||!isNumber(qty)||qty<=0||qty>1000000)throw Error('Fecha o cantidad no validas.');
  const f=food(id),parts=[makePart(id,qty)];
  state.logs.push({id:uid(),date,meal:inferFoodMeal(date,parts),title:f.name,parts,note:'Registrado desde Despensa'});
  closeModal();changed('Consumo registrado en el diario.');return true;
 }
 return false;
}
function pantryAction(button){
 const id=button.dataset.id;
 switch(button.dataset.action){
 case 'pantry-category':pantryCategory=id;render();return true;
 case 'pantry-count':openPantryCount(id);return true;
 case 'pantry-product-new':openPantryProduct();return true;
 case 'pantry-shop-add':openPantryShop();return true;
 case 'pantry-consume':openPantryConsume(id);return true;
 case 'pantry-batch-add':openPantryBatch();return true;
 case 'pantry-batch-edit':openPantryBatch(id);return true;
 case 'pantry-shop-remove':state.pantry.shopping=state.pantry.shopping.filter(s=>s.id!==id);changed('Articulo quitado.');return true;
 case 'pantry-receive':{
  const line=state.pantry.shopping.find(s=>s.id===id);if(!line||line.status==='received')return true;
  const bal=pantryBalance(line.foodId);
  if(bal)pantrySetBalance(line.foodId,bal.remaining+line.qty,bal.min);
  line.status='received';line.receivedAt=new Date().toISOString();
  changed(bal?'Compra incorporada al stock.':'Recibido; falta contar existencias totales.');return true;
 }
 case 'pantry-batch-prepare':{
  const batch=state.pantry.batches.find(b=>b.id===id);if(!batch||batch.status==='prepared')return true;
  if(!batch.ingredients?.length)throw Error('Indica los ingredientes antes de confirmar la preparacion.');
  for(const ing of batch.ingredients){
   const bal=pantryBalance(ing.foodId);
   if(bal&&ing.qty>bal.remaining+1e-6)throw Error('Faltan existencias verificadas de '+food(ing.foodId).name+'. Actualiza el recuento.');
  }
  if(!confirm('¿Has cocinado este lote? Se descontaran ingredientes solo de existencias verificadas.'))return true;
  for(const ing of batch.ingredients){
   const bal=pantryBalance(ing.foodId);
   if(bal)pantrySetBalance(ing.foodId,bal.remaining-ing.qty,bal.min);
  }
  batch.status='prepared';batch.preparedAt=new Date().toISOString();
  changed('Lote preparado; ingredientes contabilizados.');return true;
 }
 default:return false;
 }
}
