import {cleanShopPlan,shopLocalDate,shopUpcoming,addShopDays,cleanPurchaseOrder,cleanPurchaseOrders,usualPurchase,purchaseEstimate,madridTime,PURCHASE_REMINDER_TIME,nextPurchaseDates,purchaseLeadDates,applyPurchaseOrderChange,makeCompraJournal,purchaseCatalog,findPurchaseCatalogDraftIndex,purchaseLabelPart} from './compra-core.mjs';

const eur=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'});
const esc=x=>htmlSafe(String(x??''));
const day=x=>x?x.split('-').reverse().join('/'):'—';
const cents=x=>x===''?null:Math.round(Number(x)*100);
const tile=(shape)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+shape+'</svg>';
const trash=tile('<path d="M4 7h16M10 10v7m4-7v7M9 7V4h6v3M6 7l1 13h10l1-13"/>');
const bell=tile('<path d="M18 8a6 6 0 0 0-12 0c0 6-3 7-3 9h18c0-2-3-3-3-9m-8 12a2 2 0 0 0 4 0"/>');
const bag=tile('<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/>');
const dates=(name,label,value,required=false)=>'<label>'+label+'<input type="date" name="'+name+'"'+(required?' required':'')+' value="'+esc(value)+'"></label>';
const number=(name,label,value,min,max)=>'<label>'+label+'<input type="number" name="'+name+'" required min="'+min+'" max="'+max+'" value="'+value+'"></label>';
const defaults=()=>{const today=shopLocalDate();return {coverStart:addShopDays(today,3),orderDate:today,deliveryDate:addShopDays(today,1),weeks:2,cadence:2,lead:0,time:PURCHASE_REMINDER_TIME,enabled:false,changes:{}}};
const sample={coverStart:'2026-12-01',orderDate:'2026-11-27',deliveryDate:'2026-11-28',weeks:2,cadence:2,lead:0,time:PURCHASE_REMINDER_TIME,enabled:false,changes:{}};
function currentShop(){return state?.shoppingPlan||{}}
const orders=()=>cleanPurchaseOrders(currentShop().orders);
let pushStatus='',pushAccount=null,deviceActive=false;
const priceText=({cents,unknown})=>eur.format(cents/100)+(unknown?' · '+unknown+' sin precio':'');
const promptStatus=()=>deviceActive?bell+'<span>Notificaciones activadas</span>':bell+'<span>Activar notificaciones</span>';
function legacyCalendar(){
 const plan=currentShop().plan,p=cleanShopPlan(plan)||defaults();
 if(!plan)return '';
 const entries=shopUpcoming(p),enabled=!!plan?.enabled;
 return  '<details class="compra-legacy"><summary>Calendario recurrente anterior</summary><p class="helper">Las fechas son orientativas; no reservan entregas. Puedes adelantar solo una compra si cae en festivo.</p>'+
 (!plan?'<p><button class="click sm" type="button" data-shop="sample">Usar el ejemplo de diciembre (sin activar avisos)</button></p>':'')+
 '<form class="compra-dates" id="compra-plan">'+dates('coverStart','Primer día que cubre',p.coverStart)+dates('orderDate','Hacer el primer pedido',p.orderDate)+dates('deliveryDate','Primera entrega prevista',p.deliveryDate)+
 number('weeks','Semanas que cubre',p.weeks,1,8)+number('cadence','Repetir cada (semanas)',p.cadence,1,8)+number('lead','Avisar días antes del pedido',p.lead,0,21)+
 '<label>Hora del aviso (España peninsular)<input name="time" type="time" required value="'+esc(p.time)+'"></label>'+
 '<label class="compra-check"><input name="enabled" type="checkbox"'+(enabled?' checked':'')+'> Programar avisos de compra</label>'+
 '<div class="tools"><button class="click primary">Guardar calendario</button></div></form>'+
 (entries.length?'<h3>Próximas compras</h3><p class="helper">La fecha final es el inicio de la semana siguiente.</p>'+entries.map(item=>'<details class="compra-occur"><summary>Cubre '+day(item.start)+' al '+day(item.end)+(item.skip?' · Sin aviso':item.custom?' · Ajuste puntual':'')+'</summary>'+
 '<form class="compra-dates compra-override" data-cover="'+esc(item.start)+'">'+dates('order','Pedido previsto',item.order)+dates('delivery','Entrega prevista',item.delivery)+
 dates('remind','Fecha de aviso',item.remind)+'<label class="compra-check"><input name="skip" type="checkbox"'+(item.skip?' checked':'')+'> Omitir aviso de esta compra</label>'+
 '<div class="tools"><button class="click primary">Guardar este ajuste</button>'+(item.custom?'<button class="click" type="button" data-shop="reset" data-cover="'+esc(item.start)+'">Volver a fechas habituales</button>':'')+'</div></form></details>').join(''):'')+'</details>';
}

let editorDraft=null,compraSaving=false;
const draftKey=()=>account?.id?'dinofit-purchase-draft-v1:'+account.id:null;
function readPurchaseDraft(){
 try{
  const key=draftKey(),draft=key?JSON.parse(sessionStorage.getItem(key)||'null'):null;
  if(!draft||typeof draft.id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(draft.id)||!Array.isArray(draft.items)||draft.items.length>100||
   (draft.expected!==null&&cleanPurchaseOrder(draft.expected)?.id!==draft.id))return null;
  return {...draft,expected:draft.expected===null?null:cleanPurchaseOrder(draft.expected)};
 }catch{return null;}
}
function forgetPurchaseDraft(id){
 try{const key=draftKey();if(key&&readPurchaseDraft()?.id===id)sessionStorage.removeItem(key);}catch{}
}
function rememberPurchaseDraft(form){
 if(!editorDraft||!form||editorDraft.id!==form.dataset.id||compraSaving)return;
 const dates=Object.fromEntries(['orderDate','deliveryDate','coverStart','coverEnd','reminderDate'].map(k=>[k,form.elements[k].value]));
 const items=[...form.querySelectorAll('.compra-item')].map(el=>({...collected(el),draftQty:el.elements.cantidad.value,draftPrice:el.elements.precio.value}));
 try{const key=draftKey();if(key)sessionStorage.setItem(key,JSON.stringify({...editorDraft,dates,items}));}catch{}
}

function shopRender(){
 const pending=readPurchaseDraft(), queued=journalEntries();
 const saved=orders().sort((a,b)=>b.coverStart.localeCompare(a.coverStart)||b.orderDate.localeCompare(a.orderDate));
 if(pushAccount!==account?.id){pushAccount=account?.id;deviceActive=false;readyDevice=null;deviceLoading=null;pushStatus='';}
 void preparePushDevice().catch(()=>{});
 const rows=saved.map(x=>{
   const id=esc(x.id),n=x.items.length;
   const estimate=x.totalCents==null?priceText(purchaseEstimate(x.items)):eur.format(x.totalCents/100);
   const onList=x.purchased?'<span class="compra-stock-note">'+(x.inventoryReceived?'Recepción confirmada':x.deliveryDate?'Entrega prevista el '+day(x.deliveryDate):'Por añadir a Despensa')+'</span>':
     (x.reminderDate?'<span class="compra-stock-note">Aviso '+day(x.reminderDate)+' · 11:30</span>':'');
   return '<article class="compra-card"><div class="compra-card-main"><button type="button" class="compra-open" data-shop="edit" data-id="'+id+'">Compra del '+day(x.coverStart)+' al '+day(addShopDays(x.coverEnd,-1))+'</button>'+
    '<div class="compra-card-info"><span>Pedido del '+day(x.orderDate)+'</span><span>'+n+' '+(n===1?'producto':'productos')+'</span><span>'+esc(estimate)+' estimados</span></div>'+onList+'</div>'+
    '<div class="compra-card-actions"><button type="button" class="compra-state" data-shop="toggle" data-id="'+id+'" aria-pressed="'+x.purchased+'" title="'+(x.purchased?'Marcar pendiente':'Marcar comprado')+'">'+(x.purchased?'Comprado':'Pendiente')+'</button>'+
    (x.purchased&&!x.inventoryReceived?'<button type="button" class="compra-receive" data-shop="receive" data-id="'+id+'">Añadir a Despensa</button>':'')+'</div></article>';
 }).join('');
 return '<section class="section compra compra-home"><header class="compra-head"><div><p class="eyebrow">MERCADONA · PLANIFICACIÓN</p><h1>Compra</h1></div>'+
   '<div class="compra-notifs"><button type="button" id="compra-push-control" class="compra-squircle" data-shop="subscribe" '+(deviceActive?'disabled':'')+'>'+promptStatus()+'</button>'+
   '<details id="compra-push-options" class="compra-push-options" '+(deviceActive?'':'hidden')+'><summary>Opciones de aviso</summary><div><button type="button" class="click sm" data-shop="test">Enviar aviso de prueba</button><button type="button" class="click sm" data-shop="unsubscribe">Desactivar en este dispositivo</button></div></details></div></header>'+
   '<p id="compra-push-status" class="compra-push-status" role="status">'+esc(pushStatus)+'</p>'+
   '<div class="compra-board-head"><div><h2>Mis compras</h2><p class="helper">Organiza tus pedidos y el período que cubren.</p></div><button type="button" class="click primary compra-plan-button" data-shop="new"><span aria-hidden="true">+</span> Planificar compra</button></div>'+
   (queued.length?'<p class="compra-draft-bar" role="status">'+(queued.some(op=>op.blocked)?'Hay cambios pendientes que necesitan revisión.':'Hay compras pendientes de sincronizar.')+' <button type="button" class="click sm" data-shop="retry-outbox">Reintentar sincronización</button></p>'+queued.filter(o=>o.blocked).map(o=>
    '<p class="compra-draft-bar">Compra del '+day(o.item.orderDate)+' <button type="button" class="click sm" data-shop="discard-blocked" data-id="'+esc(o.id)+'">Descartar cambio rechazado</button></p>').join(''):'')+
   (pending?'<p class="compra-draft-bar"><button class="click sm" type="button" data-shop="continue-draft">Continuar borrador</button> <button class="click sm" type="button" data-shop="discard-draft">Descartar borrador</button></p>':'')+
   (rows?'<div class="compra-board">'+rows+'</div>':'<div class="compra-empty">'+bag+'<strong>Todavía no hay compras guardadas</strong><p>Prepara la próxima y añade un aviso si lo necesitas.</p></div>')+
   legacyCalendar()+'<dialog id="compra-dialog" class="compra-dialog" aria-labelledby="compra-dialog-title"></dialog><dialog id="compra-catalog-dialog" class="compra-dialog compra-catalog-dialog" aria-labelledby="compra-catalog-title"></dialog></section>';
}
globalThis.renderDinoCompra=shopRender;
globalThis.refreshDinoCompra=()=>totals();

function purchaseRow(item){
 const p=item||{id:crypto.randomUUID(),name:'',pack:'',qty:1,cents:null};
 const product=esc(p.name),image=esc(p.imageUrl);
 const thumb='<div class="compra-thumb" aria-hidden="true">'+bag+(image?'<img data-mercadona-image="'+image+'" alt="" width="48" height="48" hidden>':'')+'</div>';
 return '<fieldset class="compra-item" data-item="'+esc(p.id)+'" data-source-name="'+product+'" data-image="'+image+'"'+(p.inventory?' data-inventory="'+esc(JSON.stringify(p.inventory))+'"':'')+' data-product-id="'+esc(p.productId)+'" data-category="'+esc(p.category)+'">'+
  thumb+'<label class="compra-item-name">Producto<input name="producto" required maxlength="100" value="'+product+'"></label>'+
  '<label class="compra-item-qty">Cantidad<input name="cantidad" type="number" min="1" max="999" step="1" required value="'+esc(p.draftQty??p.qty)+'"></label>'+
  '<label class="compra-item-price">Precio (€)<input name="precio" type="number" min="0" max="1000" step="0.01" value="'+esc(p.draftPrice??(p.cents==null?'':p.cents/100))+'"></label>'+
  '<button class="compra-trash" type="button" data-shop="remove" aria-label="'+(p.name?'Quitar '+product:'Quitar producto')+'">'+trash+'</button>'+
  '<input type="hidden" name="formato" value="'+esc(p.pack)+'">'+
  '<output class="compra-line-total" aria-label="Subtotal de este producto"></output></fieldset>';
}
function moveReminderWithOrderDate(editor){
 const next=editor.elements.orderDate.value;if(!next)return;
 editor.elements.reminderDate.value=next;
 rememberPurchaseDraft(editor);
}
function viewOrder(existing=null,draft=null){
 const d=document.querySelector('#compra-dialog');if(!d)return;
 editorDraft={id:draft?.id||existing?.id||crypto.randomUUID(),expected:draft?draft.expected:existing};
 const savedDates=draft?.dates;
 const suggested=existing||nextPurchaseDates(currentShop().orders),start=suggested.coverStart,last=usualPurchase(currentShop().orders);
 const lastDay=addShopDays(suggested.coverEnd,-1);
 const oldList=!last&&Array.isArray(currentShop().items)&&currentShop().items.length>0;
 const legacyItems=oldList?'<button class="click" type="button" data-shop="previous-list">Recuperar lista anterior</button>':'';
 const hasReceipt=existing?.totalCents!=null;
 d.innerHTML='<form id="compra-order" data-id="'+esc(editorDraft.id)+'">'+
 '<header class="compra-modal-head"><div><p class="eyebrow">'+(existing?'DETALLE DEL PEDIDO':'NUEVO PEDIDO')+'</p><h2 id="compra-dialog-title">'+(existing?'Compra del '+day(start):'Planificar compra')+'</h2></div><button class="compra-close" type="button" data-shop="close" aria-label="Cerrar">×</button></header>'+
 '<div class="compra-modal-body">'+
 '<details class="compra-period"><summary>Período que cubre <span id="compra-period-label">'+day(start)+' – '+day(lastDay)+'</span></summary><div class="compra-dates">'+dates('coverStart','Desde',savedDates?.coverStart??start,true)+dates('coverEnd','Hasta',savedDates?.coverEnd??lastDay,true)+'</div></details>'+
 '<div class="compra-dates compra-order-dates">'+dates('orderDate','Fecha del pedido',savedDates?.orderDate??suggested.orderDate,true)+dates('deliveryDate','Fecha de entrega (opcional)',savedDates?.deliveryDate??suggested.deliveryDate)+dates('reminderDate','Fecha del recordatorio (opcional)',savedDates?.reminderDate??suggested.reminderDate)+'</div>'+
 '<p class="helper compra-time">Los avisos se envían a las 11:30, hora peninsular.</p>'+
 '<div class="compra-products-head"><h3>Productos</h3><div class="compra-actions"><button class="click" type="button" data-shop="usual" '+(last?'':'disabled title="Todavía no hay una compra registrada"')+'>Cargar compra usual</button>'+
 '<button class="click" type="button" data-shop="add">Añadir producto</button><button class="click" type="button" data-shop="clear">Empezar de cero</button>'+legacyItems+'</div></div>'+
 '<div id="compra-products">'+(draft?.items||existing?.items||[]).filter(x=>x&&typeof x==='object').map(x=>purchaseRow({...x,id:x.id||crypto.randomUUID()})).join('')+'</div>'+
 '<p id="compra-products-empty" class="helper">Añade un producto o recupera los de tu última compra.</p>'+
 (hasReceipt?'<aside class="compra-receipt"><span>Total estimado del pedido</span><strong>'+eur.format(existing.totalCents/100)+'</strong>'+(existing.feesCents?'<small>Incluye '+eur.format(existing.feesCents/100)+' de preparación o envío.</small>':'')+'</aside>':'')+
 '<p id="compra-form-error" class="compra-form-error" role="alert" hidden></p></div>'+
 '<footer class="compra-modal-foot"><div class="compra-total"><span>Subtotal estimado de productos</span><output id="compra-total"></output></div><button class="click primary">Guardar compra</button></footer></form>';
 d.addEventListener('close',()=>{productObserver?.disconnect();editorDraft=null;if(activeView==='compra')render();},{once:true});
 d.oncancel=e=>{if(compraSaving||document.querySelector('#compra-catalog-dialog[open]'))e.preventDefault();};
 const editor=d.querySelector('#compra-order');
 let previousLead=purchaseLeadDates(savedDates?.coverStart||start);
 editor.elements.orderDate.addEventListener('change',()=>moveReminderWithOrderDate(editor));
 editor.elements.coverStart.addEventListener('change',()=>{
  const value=editor.elements.coverStart.value;if(!value)return;
  const nextLead=purchaseLeadDates(value);
  for(const key of ['orderDate','deliveryDate','reminderDate']){
   const field=editor.elements[key];
   if(field.value===previousLead[key])field.value=nextLead[key];
  }
  previousLead=nextLead;totals();rememberPurchaseDraft(editor);
 });
 d.showModal();totals();prepareProductImages(d);
}
function collected(el){
 const name=el.elements.producto.value.trim();
 const original=el.dataset.sourceName;
 const fromSource=original==null||purchaseLabelPart(name)===purchaseLabelPart(original);
 let inventory=null;
 if(fromSource)try{inventory=JSON.parse(el.dataset.inventory||'null')}catch{}
 return {id:el.dataset.item,name,pack:el.elements.formato.value.trim(),qty:Number(el.elements.cantidad.value),
  cents:cents(el.elements.precio.value),...(fromSource&&el.dataset.productId?{productId:el.dataset.productId}:{}),...(fromSource&&el.dataset.category?{category:el.dataset.category}:{}),...(fromSource&&el.dataset.image?{imageUrl:el.dataset.image}:{}),...(inventory?{inventory}:{})};
}

/* The top-level browser dialog stacks natively over the still-live editor.
   Closing it never calls render() or reconstructs the draft. */
let catalogSession=null;
function catalogScrollPositions(planner){
 return [planner,planner?.querySelector('.compra-modal-body')].filter(Boolean).map(el=>[el,el.scrollTop]);
}
function restoreCatalogScroll(scrolls){
 for(const [el,top] of scrolls)if(el.isConnected)el.scrollTop=Math.min(top,Math.max(0,el.scrollHeight-el.clientHeight));
}
const catalogSearchKey=value=>purchaseLabelPart(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function renderCatalogProducts(search=''){
 if(!catalogSession)return;
 const {dialog,entries,categories,categoryIndex}=catalogSession,list=dialog.querySelector('#compra-catalog-grid');
 for(const thumb of list.querySelectorAll('.compra-thumb'))productObserver?.unobserve(thumb);
 const query=catalogSearchKey(search);
 const category=categories[categoryIndex];
 const indexes=entries.map((entry,i)=>[entry,i]).filter(([entry])=>(category===null||(entry.product.category||'')===category)&&
  catalogSearchKey(entry.product.name+' '+entry.product.pack).includes(query));
 list.innerHTML=indexes.map(([entry,i])=>{
  const p=entry.product,price=p.cents===null?'Sin precio registrado':eur.format(p.cents/100);
  const image=esc(p.imageUrl);
  const photo='<div class="compra-thumb compra-catalog-photo">'+bag+(image?'<img data-mercadona-image="'+image+'" alt="" hidden>':'')+'</div>';
  return '<article class="compra-catalog-card">'+photo+'<div class="compra-catalog-copy"><h3>'+esc(p.name)+'</h3>'+
   (p.pack?'<p>'+esc(p.pack)+'</p>':'')+'<div class="compra-catalog-price"><strong>'+esc(price)+'</strong>'+
   (entry.priceDate?'<small>Por formato · registrado el '+day(entry.priceDate)+'</small>':'')+'</div></div>'+
   '<button type="button" class="click primary" data-shop="catalog-add" data-index="'+i+'" aria-label="Añadir '+esc(p.name)+'">Añadir</button></article>';
 }).join('')||'<p class="compra-catalog-empty">'+(entries.length?'No hay coincidencias.':'Todavía no hay productos en tus compras guardadas.')+'</p>';
 prepareProductImages(list);
}

function chooseCatalogCategory(index,focus=false){
 if(!catalogSession||!Number.isInteger(index)||index<0||index>=catalogSession.categories.length)return;
 const {dialog}=catalogSession;catalogSession.categoryIndex=index;
 for(const tab of dialog.querySelectorAll('[data-shop="catalog-category"]')){
  const active=Number(tab.dataset.index)===index;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;
  if(active&&focus)tab.focus({preventScroll:true});
 }
 dialog.querySelector('#compra-catalog-grid').setAttribute('aria-labelledby','compra-catalog-tab-'+index);
 renderCatalogProducts(dialog.querySelector('#compra-catalog-search')?.value||'');
}
function openPurchaseCatalog(opener){
 const dialog=document.querySelector('#compra-catalog-dialog'),planner=document.querySelector('#compra-dialog[open]');
 if(!dialog||!planner||dialog.open)return;
 const form=planner.querySelector('#compra-order'),entries=purchaseCatalog(currentShop().orders,currentShop().catalogCategories);
 if(!form)return;
 const before=planner.getBoundingClientRect();
 dialog.style.setProperty('--compra-plan-width',Math.floor(before.width)+'px');
 dialog.style.setProperty('--compra-plan-height',Math.floor(before.height)+'px');
 const group=new Set(entries.map(entry=>entry.product.category||''));
 const categories=[null,...[...group].filter(Boolean).sort((a,b)=>a.localeCompare(b,'es')),...(group.has('')?['']:[])];
 const session={dialog,form,opener,entries,categories,categoryIndex:0,scrolls:catalogScrollPositions(planner)};
 const tabs='<div class="compra-catalog-tabs" role="tablist" aria-label="Categorías de productos">'+categories.map((category,i)=>
  '<button type="button" role="tab" id="compra-catalog-tab-'+i+'" data-shop="catalog-category" data-index="'+i+'" aria-controls="compra-catalog-grid" aria-selected="'+(i===0)+'" tabindex="'+(i===0?'0':'-1')+'">'+esc(category===null?'Todos':(category||'Sin clasificar'))+'</button>').join('')+'</div>';
 catalogSession=session;
 dialog.innerHTML='<header class="compra-modal-head"><div><p class="eyebrow">TUS COMPRAS GUARDADAS</p><h2 id="compra-catalog-title">Añadir producto</h2></div>'+
  '<button class="compra-close" type="button" data-shop="catalog-close" aria-label="Cerrar catálogo" autofocus>×</button></header>'+
  '<div class="compra-catalog-body"><p class="helper compra-catalog-note">Los precios son los últimos registrados, no los precios actuales de la tienda.</p>'+
  (entries.length?'<label class="compra-catalog-search">Buscar producto<input id="compra-catalog-search" type="search" placeholder="Nombre o formato" autocomplete="off"></label>':'')+
  (entries.length?tabs:'')+'<p class="compra-catalog-feedback" role="status" aria-live="polite"></p><div class="compra-catalog-grid" id="compra-catalog-grid"'+(entries.length?' role="tabpanel" aria-labelledby="compra-catalog-tab-0"':'')+'></div>'+
  '<details class="compra-catalog-manual"'+(entries.length?'':' open')+'><summary>Añadir un producto nuevo manualmente</summary>'+
  '<form id="compra-catalog-manual"><label>Nombre<input name="nombre" type="text" maxlength="100" required></label>'+
  '<label>Formato (opcional)<input name="formato" type="text" maxlength="60" placeholder="Pack, botella…"></label>'+
  '<label>Precio estimado (€)<input name="precio" type="number" min="0" max="1000" step="0.01"></label>'+
  '<button class="click" type="submit">Añadir a la lista</button></form></details></div>';
 dialog.addEventListener('close',()=>{
  if(catalogSession!==session)return;
  for(const el of dialog.querySelectorAll('.compra-thumb'))productObserver?.unobserve(el);
  catalogSession=null;
  if(planner.open&&opener.isConnected){opener.focus({preventScroll:true});restoreCatalogScroll(session.scrolls);}
 },{once:true});
 dialog.querySelector('[role="tablist"]')?.addEventListener('keydown',ev=>{
  const index=Number(ev.target.dataset?.index);if(!Number.isInteger(index))return;
  const n=categories.length;
  const next={ArrowLeft:(index+n-1)%n,ArrowRight:(index+1)%n,Home:0,End:n-1}[ev.key];
  if(next===undefined)return;ev.preventDefault();chooseCatalogCategory(next,true);
 });
 // Populate after opening so the photo observer observes the top layer.
 dialog.showModal();renderCatalogProducts();
}
function catalogFeedback(text){
 const feedback=catalogSession?.dialog.querySelector('.compra-catalog-feedback');
 if(feedback)feedback.textContent=text;
}
function addCatalogSelection(entry){
 const session=catalogSession;if(!session?.form.isConnected||!entry?.product?.name)return false;
 const list=session.form.querySelector('#compra-products');
 const rows=[...list.querySelectorAll('.compra-item')],cur=rows.map(collected);
 const found=findPurchaseCatalogDraftIndex(cur,entry,session.entries.includes(entry)?session.entries:[...session.entries,entry]);
 if(found>=0){
  const qty=rows[found].elements.cantidad;
  const previous=Number.isInteger(Number(qty.value))?Math.max(0,Number(qty.value)):0;
  if(previous>=999){catalogFeedback('No puedes superar 999 unidades por producto.');return false;}
  qty.value=previous+1;
  catalogFeedback(entry.product.name+' · '+qty.value+' en tu lista.');
 }else{
  if(rows.length>=100){catalogFeedback('La lista admite hasta 100 productos.');return false;}
  list.insertAdjacentHTML('beforeend',purchaseRow({...entry.product,id:crypto.randomUUID(),qty:1}));
  const thumb=list.lastElementChild.querySelector('.compra-thumb');
  if(thumb)hydrateProductImage(thumb);
  catalogFeedback(entry.product.name+' · 1 en tu lista.');
 }
 totals();rememberPurchaseDraft(session.form);restoreCatalogScroll(session.scrolls);
 return true;
}
function addManualCatalogProduct(form){
 const name=form.elements.nombre.value.trim(),pack=form.elements.formato.value.trim(),price=cents(form.elements.precio.value);
 if(!name){catalogFeedback('Indica el nombre del producto antes de añadirlo.');form.elements.nombre.focus();return;}
 const known=catalogSession?.entries||[];
 const same=known.filter(entry=>purchaseLabelPart(entry.product.name)===purchaseLabelPart(name)&&purchaseLabelPart(entry.product.pack)===purchaseLabelPart(pack));
 // An explicit manual price stays explicit; do not silently substitute a
 // saved product or merge an ambiguous variant.
 const entry=same.length===1&&same[0].product.cents===price?same[0]:{product:{name,pack,cents:price},labels:[JSON.stringify([purchaseLabelPart(name),purchaseLabelPart(pack)])]};
 if(addCatalogSelection(entry))form.reset();
}

function totals(){
 const form=document.querySelector('#compra-order');if(!form)return;
 const rows=[...form.querySelectorAll('.compra-item')];
 const estimate=purchaseEstimate(rows.map(collected));
 form.querySelector('#compra-products-empty').hidden=rows.length>0;
 form.querySelector('#compra-total').textContent=priceText(estimate);
 form.querySelector('#compra-period-label').textContent=day(form.elements.coverStart.value)+' – '+day(form.elements.coverEnd.value);
 for(const el of rows){const x=collected(el);el.querySelector('output').textContent=x.cents===null?'Sin precio':eur.format((x.cents*x.qty)/100);}
}
function formError(form,text){
 const help=form.querySelector('#compra-form-error');help.hidden=!text;help.textContent=text;
}
function replaceProducts(list){
 const area=document.querySelector('#compra-products');if(!area)return;
 if(area.children.length&&!confirm('¿Sustituir los productos de esta compra?'))return;
 area.innerHTML=list.slice(0,100).map(x=>purchaseRow({...x,id:crypto.randomUUID()})).join('');
 totals();prepareProductImages(area);
 rememberPurchaseDraft(area.closest('form'));
 area.querySelector('input:not([type=hidden])')?.focus();
}
async function saveUpdate(patch,msg){
 if(!state||!account)return;
 state.shoppingPlan={...currentShop(),...patch};changed();
 toast(await persistNow()?msg:'No se pudo guardar en tu cuenta. Revisa el estado de sincronización.');
}


function journal(){
 const owner=account?.id;if(!owner)return null;
 try{return makeCompraJournal(localStorage,owner);}catch{return null;}
}
function journalEntries(){try{return journal()?.entries()||[];}catch{return [];}}
function draftMarker(draft){return draft?JSON.stringify([draft.dates,draft.items]):'';}
function stageCompraOperation(item,expected,message,keepDraft){
 const box=journal();if(!box)return {error:'El navegador no permite conservar cambios pendientes. El editor sigue abierto.'};
 try{
  const prior=box.entries().filter(o=>o.item.id===item.id);
  const existing=prior.find(o=>JSON.stringify(o.item)===JSON.stringify(item)&&JSON.stringify(o.expected)===JSON.stringify(expected));
  if(existing)return {box,op:existing};
  if(prior.length)return {error:'Ya hay cambios pendientes en esta compra. Revisa primero esa versión para no perder ninguno.'};
  const op=box.put({id:crypto.randomUUID(),item,expected,at:Date.now(),message,draft:keepDraft?draftMarker(readPurchaseDraft()):''});
  return {box,op};
 }catch{return {error:'El navegador no pudo conservar esta compra. El editor y sus datos siguen abiertos.'};}
}
async function applyJournalEntry(box,op){
 if(navigator.onLine===false)return {kind:'offline'};
 let result;
 try{result=await persistCompraMutation(document=>applyPurchaseOrderChange(document,op.item,op.expected,globalThis.syncDinoCompraInventory));}
 catch{result={kind:'offline'};}
 try{
  if(result.kind==='ok'||result.kind==='committed-with-local-edits')box.clear(op.id);
  else if(result.kind==='changed'||result.kind==='invalid')box.put({...op,blocked:true});
 }catch{/* Save acknowledgement is separate from cleanup; operation remains idempotent. */}
 return result;
}
let outboxTimer=null,outboxDelay=8000,outboxRunning=false;
function scheduleCompraReplay(){
 if(outboxTimer||!account||navigator.onLine===false)return;
 const owner=account.id;
 outboxTimer=setTimeout(()=>{
  outboxTimer=null;if(account?.id===owner)void resumeCompraOutbox();
 },outboxDelay);
 outboxDelay=Math.min(120000,outboxDelay*2);
}
async function resumeCompraOutbox(includeBlocked=false){
 if(outboxRunning||compraSaving||!state||!account||navigator.onLine===false)return;
 const owner=account.id,box=journal();if(!box)return;
 outboxRunning=true;
 let needsRetry=false,redraw=false;
 try{
  const list=journalEntries().filter(op=>includeBlocked||!op.blocked);
  for(const op of list){
   if(account?.id!==owner||compraSaving)break;
   const result=await applyJournalEntry(box,op);
   if(account?.id!==owner)return;
   redraw=true;
   if(result.kind==='ok'||result.kind==='committed-with-local-edits'){
    outboxDelay=8000;
    const draft=readPurchaseDraft();
    if(draft?.id===op.item.id&&op.draft&&draftMarker(draft)===op.draft)forgetPurchaseDraft(draft.id);
    if(activeView==='compra')toast('Compra sincronizada'+(result.kind==='committed-with-local-edits'?'. Hay otros cambios locales pendientes.':'.'));
   }else if(['offline','busy','retries'].includes(result.kind)){
    needsRetry=true;break;
   }else if(result.kind==='changed'&&activeView==='compra')toast('Otra sesión cambió una compra pendiente. No se ha sobrescrito.');
  }
 }finally{
  outboxRunning=false;
  if(needsRetry&&account?.id===owner)scheduleCompraReplay();
  if(redraw&&account?.id===owner&&activeView==='compra')render();
 }
}
globalThis.resumeDinoCompraSync=()=>{void resumeCompraOutbox();};
window.addEventListener('online',()=>{outboxDelay=8000;void resumeCompraOutbox();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void resumeCompraOutbox();});
window.addEventListener('storage',e=>{
 if(account?.id&&e.key?.startsWith('dinofit-compra-outbox-v1:'+account.id+':'))void resumeCompraOutbox();
});

async function saveOrder(item,expected,msg,form=null){
 if(!state||!account||compraSaving)return;
 const owner=account.id;
 if(form)rememberPurchaseDraft(form);
 const staged=stageCompraOperation(item,expected,msg,!!form);
 if(staged.error){if(form)formError(form,staged.error);else toast(staged.error);return;}
 compraSaving=true;
 if(form){formError(form,'');form.inert=true;form.setAttribute('aria-busy','true');}
 let result;
 try{result=await applyJournalEntry(staged.box,staged.op);}
 catch{result={kind:'offline'};}
 finally{compraSaving=false;if(form){form.inert=false;form.removeAttribute('aria-busy');}}
 if(account?.id!==owner)return;
 if(result.kind==='ok'||result.kind==='committed-with-local-edits'){
  forgetPurchaseDraft(item.id);
  const dialog=document.querySelector('#compra-dialog');
  if(form&&dialog?.open)dialog.close();
  const stock=result.detail;
  if(stock&&item.inventoryReceived&&stock.skipped&&stock.linked)msg+=' Los demás productos no estaban vinculados.';
  if(stock&&item.inventoryReceived&&!stock.linked)msg='Recepción guardada. No se añadieron existencias: no hay productos vinculados a Despensa.';
  if(result.kind==='committed-with-local-edits')msg+=' Hay otros cambios locales que siguen sin sincronizarse.';
  if(activeView==='compra')render();
  toast(msg);
  return;
 }
 const messages={
  changed:'Otra sesión cambió esta compra. No se ha sobrescrito. Puedes cerrar el editor y descartar este cambio pendiente para abrir la versión guardada.',
  local:'Hay otros cambios de esta pestaña sin sincronizar. La compra no se ha escrito y el borrador sigue guardado.',
  session:'Vuelve a entrar en tu cuenta para guardar la compra.',
  retries:'La cuenta está cambiando en otra sesión. El cambio queda pendiente y se reintentará automáticamente.',
  busy:'Hay un guardado en curso. Vuelve a intentarlo en un momento.',
  offline:'Sin confirmación del servidor. La compra queda pendiente y se guardará al recuperar la conexión.',
  invalid:'No se pudo guardar la compra. Revisa los datos.'
 };
 if(['offline','busy','retries'].includes(result.kind))scheduleCompraReplay();
 const problem=result.message||messages[result.kind]||messages.offline;
 if(form&&form.isConnected)formError(form,problem);else toast(problem);
}
document.addEventListener('input',e=>{
 if(e.target.id==='compra-catalog-search'){renderCatalogProducts(e.target.value);return;}
 const form=e.target.closest('#compra-order');if(form){totals();rememberPurchaseDraft(form);}
});
document.addEventListener('error',e=>{if(e.target.matches?.('.compra-thumb img'))e.target.hidden=true},true);
document.addEventListener('submit',e=>{
 const form=e.target;
 if(!form.matches('#compra-order,#compra-plan,.compra-override,#compra-catalog-manual'))return;
 e.preventDefault();e.stopImmediatePropagation();
 if(form.id==='compra-catalog-manual'){addManualCatalogProduct(form);return;}
 const data=Object.fromEntries(new FormData(form));
 if(form.id==='compra-order'){
  if(compraSaving||!editorDraft||editorDraft.id!==form.dataset.id)return;
  const previous=editorDraft.expected;
  const items=[...form.querySelectorAll('.compra-item')].map(row=>{
   const item=collected(row),old=previous?.items.find(x=>x.id===item.id);
   if(old&&old.name!==item.name){delete item.inventory;delete item.imageUrl;delete item.productId;delete item.category;}
   if(!item.inventory)item.inventory=globalThis.suggestDinoCompraInventory?.(item)||undefined;
   return item;
  });
  if(!items.length){formError(form,'Añade al menos un producto.');return;}
  if(data.coverEnd<data.coverStart){formError(form,'El último día no puede ser anterior al inicio.');form.querySelector('.compra-period').open=true;return;}
  if(data.deliveryDate&&data.deliveryDate<data.orderDate){formError(form,'La entrega no puede ser anterior al pedido.');return;}
  if(!previous?.purchased&&data.reminderDate&&data.reminderDate!==previous?.reminderDate&&madridTime(data.reminderDate,PURCHASE_REMINDER_TIME)<=Date.now()){
   formError(form,'Elige una fecha cuyo aviso de las 11:30 todavía no haya pasado.');return;
  }
  const two=x=>x.map(z=>[z.name,z.pack,z.qty,z.cents]);
  const same=previous&&JSON.stringify(two(previous.items))===JSON.stringify(two(items));
  const item=cleanPurchaseOrder({...previous,...data,coverEnd:addShopDays(data.coverEnd,1),id:editorDraft.id,items,deliveryDate:data.deliveryDate||null,reminderDate:data.reminderDate||null,
   totalCents:same?previous.totalCents:undefined,feesCents:same?previous.feesCents:undefined});
  if(!item){formError(form,'Revisa el nombre, las cantidades, los precios y las fechas.');return;}
  void saveOrder(item,previous,item.reminderDate&&!item.purchased?'Compra guardada con aviso a las 11:30.':'Compra guardada.',form);
  return;
 }
 if(form.id==='compra-plan'){
  const old=currentShop().plan;
  const preserve=old?.coverStart===data.coverStart&&Number(old.cadence)===Number(data.cadence);
  if(!preserve&&Object.keys(old?.changes||{}).length&&!confirm('Al cambiar el inicio o la frecuencia se quitarán los ajustes puntuales anteriores. ¿Continuar?'))return;
  const plan=cleanShopPlan({...data,enabled:data.enabled==='on',changes:preserve?old.changes:{}});
  if(!plan){toast('Revisa las fechas y la frecuencia: no debe haber solapes.');return}
  void saveUpdate({plan},'Calendario guardado');return;
 }
 const plan=cleanShopPlan(currentShop().plan),key=form.dataset.cover;
 if(!plan||!shopUpcoming(plan).some(x=>x.start===key))return;
 const override={order:data.order,delivery:data.delivery,remind:data.remind,skip:data.skip==='on'};
 const next=cleanShopPlan({...plan,changes:{...plan.changes,[key]:override}});
 if(!next?.changes[key]||next.changes[key].remind!==data.remind){toast('Revisa las fechas: aviso antes del pedido y pedido antes de la entrega.');return}
 void saveUpdate({plan:next},'Ajuste puntual guardado');
},true);

function keyBytes(string){return Uint8Array.from(atob(string.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(string.length/4)*4,'=')),c=>c.charCodeAt(0))}
async function pushApi(action,body){
 const {data}=await db.auth.getSession();
 const token=data.session?.access_token;
 if(!token)throw Error('Entra en tu cuenta para gestionar avisos.');
 const r=await fetch(SUPABASE_URL+'/functions/v1/dinofit-push/'+action,{method:'POST',headers:{'Content-Type':'application/json',apikey:SUPABASE_KEY,Authorization:'Bearer '+token},body:JSON.stringify(body)});
 const result=await r.json().catch(()=>null);
 if(!r.ok||!result?.ok)throw Error(result?.message||'No se pudo conectar con el servicio de avisos.');
 return result;
}
let pushBusy=false,readyDevice=null,deviceLoading=null;
function preparePushDevice(){
 if(!('serviceWorker'in navigator)||!('Notification'in window)||!('PushManager'in window))return Promise.resolve(null);
 if(!deviceLoading){const owner=account?.id;deviceLoading=(async()=>{
  await navigator.serviceWorker.register('/dinofit/app-pantry.js?compra-worker=1',{scope:'/dinofit/'});
  const registration=await navigator.serviceWorker.ready;
  const {publicKey}=await pushApi('key',{});
  if(owner!==account?.id)return null;
  const subscription=await registration.pushManager.getSubscription();
  if(subscription&&Notification.permission==='granted'){
   const result=await pushApi('status',{endpoint:subscription.endpoint}).catch(()=>null);
   if(owner===account?.id)setDeviceActive(result?.active===true);
  }
  return owner===account?.id?(readyDevice={registration,applicationServerKey:keyBytes(publicKey)}):null;
 })().catch(e=>{if(owner===account?.id)deviceLoading=null;throw e});}
 return deviceLoading;
}
async function changePush(action){
 if(pushBusy)return;
 if(!('serviceWorker'in navigator)||!('Notification'in window)||!('PushManager'in window)){reportPush('Este navegador no permite avisos aquí. En iPhone, abre DinoFit desde la pantalla de inicio.');return}
 pushBusy=true;
 try{
  if(action==='subscribe'&&await Notification.requestPermission()!=='granted')throw Error('Los avisos no tienen permiso. Revisa los ajustes de notificaciones del dispositivo.');
  reportPush('Comprobando notificaciones…');
  if(!readyDevice){await preparePushDevice();if(action==='subscribe'){reportPush('Toca otra vez Activar notificaciones para vincular este dispositivo.');return}}
  if(!readyDevice)throw Error('No se pudo preparar este dispositivo.');
  const {registration,applicationServerKey}=readyDevice;
  let sub=await registration.pushManager.getSubscription();
  if(action==='subscribe'){
   if(!sub){
    sub=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey});
   }
   await pushApi('subscribe',{subscription:sub.toJSON()});
   setDeviceActive(true);
   reportPush('Avisos activados en este dispositivo. Ya puedes enviar una prueba.');
  }else if(action==='test'){
   if(!sub)throw Error('Activa primero los avisos en este dispositivo.');
   await pushApi('test',{endpoint:sub.endpoint});
   reportPush('Prueba enviada al servicio de notificaciones. Comprueba si te llega.');
  }else{
   if(sub){await pushApi('unsubscribe',{endpoint:sub.endpoint});await sub.unsubscribe();}
   setDeviceActive(false);
   reportPush('Avisos desactivados en este dispositivo.');
  }
 }catch(error){reportPush(error.message||'No se pudieron configurar los avisos.')}
 finally{pushBusy=false}
}


const imageCache=new Map(),imageQueue=[];
let imageInflight=0;
function drainProductImages(){
 while(imageInflight<4&&imageQueue.length){
  const {url,resolve}=imageQueue.shift();imageInflight++;
  void pushApi('image',{url}).then(r=>resolve(
   typeof r.image==='string'&&r.image.length<350000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(r.image)?r.image:null
  ),()=>resolve(null)).finally(()=>{imageInflight--;drainProductImages()});
 }
}
function productImage(url){
 if(!imageCache.has(url)){
  imageCache.set(url,new Promise(resolve=>{imageQueue.push({url,resolve});drainProductImages()}));
  if(imageCache.size>96)imageCache.delete(imageCache.keys().next().value);
 }
 const promise=imageCache.get(url);
 return promise.then(src=>{if(!src&&imageCache.get(url)===promise)imageCache.delete(url);return src});
}
function hydrateProductImage(thumb){
 const img=thumb.querySelector('img[data-mercadona-image]');if(!img)return;
 const url=img.dataset.mercadonaImage;
 if(!url)return;delete img.dataset.mercadonaImage;
 void productImage(url).then(src=>{if(src&&img.isConnected){img.addEventListener('load',()=>{img.hidden=false},{once:true});img.src=src}});
}
let productObserver;
function prepareProductImages(root){
 const thumbs=root.querySelectorAll('.compra-thumb:has(img[data-mercadona-image])');
 if(typeof IntersectionObserver==='undefined'){for(const el of thumbs)hydrateProductImage(el);return;}
 if(!productObserver)productObserver=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){productObserver.unobserve(entry.target);hydrateProductImage(entry.target)}
 },{rootMargin:'120px'});
 for(const el of thumbs)productObserver.observe(el);
}

function setDeviceActive(value){
 deviceActive=value;
 const button=document.querySelector('#compra-push-control'),options=document.querySelector('#compra-push-options');
 if(button){button.disabled=value;button.innerHTML=promptStatus();}
 if(options)options.hidden=!value;
}
function removePurchaseProduct(button){
 const row=button.closest('.compra-item');if(!row)return;
 const dialog=row.closest('.compra-dialog');
 const scrolls=[dialog,dialog?.querySelector('.compra-modal-body')].filter(Boolean).map(el=>[el,el.scrollTop]);
 const nearest=row.nextElementSibling||row.previousElementSibling;
 const focus=nearest?.querySelector('[data-shop="remove"]')||dialog?.querySelector('[data-shop="add"]');
 row.remove();totals();
 focus?.focus({preventScroll:true});
 for(const [el,top] of scrolls)el.scrollTop=Math.min(top,Math.max(0,el.scrollHeight-el.clientHeight));
}
function reportPush(msg){pushStatus=msg;const el=document.querySelector('#compra-push-status');if(el)el.textContent=msg}
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-shop]');if(!button)return;
 e.preventDefault();e.stopImmediatePropagation();
 const a=button.dataset.shop;
 if(a==='retry-outbox'){outboxDelay=8000;void resumeCompraOutbox(true);}
 else if(a==='discard-blocked'){
  const box=journal(),op=journalEntries().find(entry=>entry.id===button.dataset.id&&entry.blocked);
  if(!box||!op||!confirm('¿Descartar este cambio rechazado y su borrador? La compra guardada no se modificará.'))return;
  try{box.clear(op.id);forgetPurchaseDraft(op.item.id);render();}catch{toast('No se pudo retirar este cambio del dispositivo.');}
 }
 else if(a==='continue-draft'){const draft=readPurchaseDraft();if(draft?.id)viewOrder(draft.expected,draft);}
 else if(a==='discard-draft'){const draft=readPurchaseDraft();if(draft&&confirm('¿Descartar este borrador?')){forgetPurchaseDraft(draft.id);render();}}
 else if(a==='new'){if(readPurchaseDraft()&&!confirm('Hay un borrador sin guardar. ¿Quieres descartarlo y empezar otra compra?'))return;const draft=readPurchaseDraft();if(draft)forgetPurchaseDraft(draft.id);viewOrder();}
 else if(a==='close')document.querySelector('#compra-dialog')?.close();
 else if(a==='edit'){
  const existing=orders().find(o=>o.id===button.dataset.id),draft=readPurchaseDraft();if(!existing)return;
  if(draft?.id===existing.id){viewOrder(draft.expected,draft);return;}
  if(draft&&!confirm('Hay otro borrador sin guardar. ¿Quieres descartarlo antes de abrir esta compra?'))return;
  if(draft)forgetPurchaseDraft(draft.id);viewOrder(existing);
 }
 else if(a==='toggle'||a==='receive'){
  const previous=orders().find(o=>o.id===button.dataset.id);if(!previous)return;
  if(a==='receive'&&previous.deliveryDate>shopLocalDate()){toast('Aún no ha llegado la fecha de entrega. Confirma la entrada cuando recibas el pedido.');return;}
  const purchased=a==='receive'||!previous.purchased;
  const received=purchased&&(a==='receive'||!previous.deliveryDate);
  const item=cleanPurchaseOrder({...previous,purchased,inventoryReceived:received,inventoryReceivedAt:received?new Date().toISOString():null,
   reminderDate:!purchased&&previous.reminderDate&&madridTime(previous.reminderDate,PURCHASE_REMINDER_TIME)<=Date.now()?null:previous.reminderDate,
   items:previous.items.map(x=>({...x,id:x.id||crypto.randomUUID(),inventory:x.inventory||globalThis.suggestDinoCompraInventory?.(x)||undefined}))});
  if(item)void saveOrder(item,previous,received?'Recepción guardada. Los productos reconocidos se han añadido a Despensa.':purchased?'Compra marcada como comprada.':'Compra marcada como pendiente.');
 }else if(a==='add')openPurchaseCatalog(button);
 else if(a==='catalog-close')catalogSession?.dialog.close();
 else if(a==='catalog-category')chooseCatalogCategory(Number(button.dataset.index));
 else if(a==='catalog-add'){
  const i=Number(button.dataset.index);if(Number.isInteger(i)&&i>=0)addCatalogSelection(catalogSession?.entries[i]);
 }else if(a==='remove'){
  removePurchaseProduct(button);
 }else if(a==='usual'){const latest=usualPurchase(currentShop().orders);if(latest)replaceProducts(latest.items)}
 else if(a==='previous-list')replaceProducts(currentShop().items||[]);
 else if(a==='clear')replaceProducts([]);
 else if(a==='sample')void saveUpdate({plan:sample},'Ejemplo guardado sin avisos activados');
 else if(a==='reset'){
  const plan=cleanShopPlan(currentShop().plan);if(plan){delete plan.changes[button.dataset.cover];void saveUpdate({plan},'Fechas habituales restauradas')}
 }else void changePush(a);
},true);
window.addEventListener('hashchange',()=>{if(location.hash==='#compra'&&state&&account){activeView='compra';render()}});
if(typeof activeView!=='undefined'&&activeView==='compra')render();
