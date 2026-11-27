import {cleanShopPlan,shopLocalDate,shopUpcoming,addShopDays,cleanPurchaseOrder,cleanPurchaseOrders,usualPurchase,purchaseEstimate,madridTime,PURCHASE_REMINDER_TIME,nextPurchaseDates,purchaseLeadDates} from './compra-core.mjs';

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
function shopRender(){
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
   (rows?'<div class="compra-board">'+rows+'</div>':'<div class="compra-empty">'+bag+'<strong>Todavía no hay compras guardadas</strong><p>Prepara la próxima y añade un aviso si lo necesitas.</p></div>')+
   legacyCalendar()+'<dialog id="compra-dialog" class="compra-dialog" aria-labelledby="compra-dialog-title"></dialog></section>';
}
globalThis.renderDinoCompra=shopRender;
globalThis.refreshDinoCompra=()=>totals();

function purchaseRow(item){
 const p=item||{id:crypto.randomUUID(),name:'',pack:'',qty:1,cents:null};
 const product=esc(p.name),image=esc(p.imageUrl);
 const thumb='<div class="compra-thumb" aria-hidden="true">'+bag+(image?'<img data-mercadona-image="'+image+'" alt="" width="48" height="48" hidden>':'')+'</div>';
 return '<fieldset class="compra-item" data-item="'+esc(p.id)+'" data-image="'+image+'"'+(p.inventory?' data-inventory="'+esc(JSON.stringify(p.inventory))+'"':'')+' data-product-id="'+esc(p.productId)+'">'+
  thumb+'<label class="compra-item-name">Producto<input name="producto" required maxlength="100" value="'+product+'"></label>'+
  '<label class="compra-item-qty">Cantidad<input name="cantidad" type="number" min="1" max="999" step="1" required value="'+esc(p.qty)+'"></label>'+
  '<label class="compra-item-price">Precio (€)<input name="precio" type="number" min="0" max="1000" step="0.01" value="'+esc(p.cents==null?'':p.cents/100)+'"></label>'+
  '<button class="compra-trash" type="button" data-shop="remove" aria-label="'+(p.name?'Quitar '+product:'Quitar producto')+'">'+trash+'</button>'+
  '<input type="hidden" name="formato" value="'+esc(p.pack)+'">'+
  '<output class="compra-line-total" aria-label="Subtotal de este producto"></output></fieldset>';
}
function viewOrder(existing=null){
 const d=document.querySelector('#compra-dialog');if(!d)return;
 const suggested=existing||nextPurchaseDates(currentShop().orders),start=suggested.coverStart,last=usualPurchase(currentShop().orders);
 const lastDay=addShopDays(suggested.coverEnd,-1);
 const oldList=!last&&Array.isArray(currentShop().items)&&currentShop().items.length>0;
 const legacyItems=oldList?'<button class="click" type="button" data-shop="previous-list">Recuperar lista anterior</button>':'';
 const hasReceipt=existing?.totalCents!=null;
 d.innerHTML='<form id="compra-order" data-id="'+esc(existing?.id)+'">'+
 '<header class="compra-modal-head"><div><p class="eyebrow">'+(existing?'DETALLE DEL PEDIDO':'NUEVO PEDIDO')+'</p><h2 id="compra-dialog-title">'+(existing?'Compra del '+day(start):'Planificar compra')+'</h2></div><button class="compra-close" type="button" data-shop="close" aria-label="Cerrar">×</button></header>'+
 '<div class="compra-modal-body">'+
 '<details class="compra-period"><summary>Período que cubre <span id="compra-period-label">'+day(start)+' – '+day(lastDay)+'</span></summary><div class="compra-dates">'+dates('coverStart','Desde',start,true)+dates('coverEnd','Hasta',lastDay,true)+'</div></details>'+
 '<div class="compra-dates compra-order-dates">'+dates('orderDate','Fecha del pedido',suggested.orderDate,true)+dates('deliveryDate','Fecha de entrega (opcional)',suggested.deliveryDate)+dates('reminderDate','Fecha del recordatorio (opcional)',suggested.reminderDate)+'</div>'+
 '<p class="helper compra-time">Los avisos se envían a las 11:30, hora peninsular.</p>'+
 '<div class="compra-products-head"><h3>Productos</h3><div class="compra-actions"><button class="click" type="button" data-shop="usual" '+(last?'':'disabled title="Todavía no hay una compra marcada como comprada"')+'>Cargar compra usual</button>'+
 '<button class="click" type="button" data-shop="add">Añadir producto</button><button class="click" type="button" data-shop="clear">Empezar de cero</button>'+legacyItems+'</div></div>'+
 '<div id="compra-products">'+(existing?.items||[]).map(x=>purchaseRow({...x,id:x.id||crypto.randomUUID()})).join('')+'</div>'+
 '<p id="compra-products-empty" class="helper">Añade un producto o recupera los de tu última compra.</p>'+
 (hasReceipt?'<aside class="compra-receipt"><span>Total estimado del pedido</span><strong>'+eur.format(existing.totalCents/100)+'</strong>'+(existing.feesCents?'<small>Incluye '+eur.format(existing.feesCents/100)+' de preparación o envío.</small>':'')+'</aside>':'')+
 '<p id="compra-form-error" class="compra-form-error" role="alert" hidden></p></div>'+
 '<footer class="compra-modal-foot"><div class="compra-total"><span>Subtotal estimado de productos</span><output id="compra-total"></output></div><button class="click primary">Guardar compra</button></footer></form>';
 d.addEventListener('close',()=>productObserver?.disconnect(),{once:true});
 const editor=d.querySelector('#compra-order');
 let previousLead=purchaseLeadDates(start);
 editor.elements.coverStart.addEventListener('change',()=>{
  const value=editor.elements.coverStart.value;if(!value)return;
  const nextLead=purchaseLeadDates(value);
  for(const key of ['orderDate','deliveryDate','reminderDate']){
   const field=editor.elements[key];
   if(field.value===previousLead[key])field.value=nextLead[key];
  }
  previousLead=nextLead;totals();
 });
 d.showModal();totals();prepareProductImages(d);
}
function collected(el){
 let inventory=null;
 try{inventory=JSON.parse(el.dataset.inventory||'null')}catch{}
 return {id:el.dataset.item,name:el.elements.producto.value.trim(),pack:el.elements.formato.value.trim(),qty:Number(el.elements.cantidad.value),
  cents:cents(el.elements.precio.value),...(el.dataset.productId?{productId:el.dataset.productId}:{}),...(el.dataset.image?{imageUrl:el.dataset.image}:{}),...(inventory?{inventory}:{})};
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
 area.querySelector('input:not([type=hidden])')?.focus();
}
async function saveUpdate(patch,msg){
 if(!state||!account)return;
 state.shoppingPlan={...currentShop(),...patch};changed();
 toast(await persistNow()?msg:'No se pudo guardar en tu cuenta. Revisa el estado de sincronización.');
}
async function saveOrder(item,msg){
 if(!state||!account)return;
 let stock;
 try{stock=globalThis.syncDinoCompraInventory?.(item);}catch(e){const f=document.querySelector('#compra-order');if(f)formError(f,e.message);else toast(e.message);return;}
 const prior=orders();
 const exists=prior.some(x=>x.id===item.id);
 const updated=exists?prior.map(x=>x.id===item.id?item:x):[item,...prior];
 const dialog=document.querySelector('#compra-dialog');
 if(dialog?.open)dialog.close();
 if(item.inventoryReceived&&stock?.skipped&&stock.linked)msg+=' Los demás productos no estaban vinculados.';
 if(item.inventoryReceived&&!stock?.linked)msg='Recepción guardada. No se añadieron existencias: no hay productos vinculados a Despensa.';
 await saveUpdate({orders:updated},msg);
}
document.addEventListener('input',e=>{if(e.target.closest('#compra-order'))totals()});
document.addEventListener('error',e=>{if(e.target.matches?.('.compra-thumb img'))e.target.hidden=true},true);
document.addEventListener('submit',e=>{
 const form=e.target;
 if(!form.matches('#compra-order,#compra-plan,.compra-override'))return;
 e.preventDefault();e.stopImmediatePropagation();
 const data=Object.fromEntries(new FormData(form));
 if(form.id==='compra-order'){
  const previous=orders().find(o=>o.id===form.dataset.id);
  const items=[...form.querySelectorAll('.compra-item')].map(row=>{
   const item=collected(row),old=previous?.items.find(x=>x.id===item.id);
   if(old&&old.name!==item.name){delete item.inventory;delete item.imageUrl;delete item.productId;}
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
  const item=cleanPurchaseOrder({...previous,...data,coverEnd:addShopDays(data.coverEnd,1),id:previous?.id||crypto.randomUUID(),items,deliveryDate:data.deliveryDate||null,reminderDate:data.reminderDate||null,
   totalCents:same?previous.totalCents:undefined,feesCents:same?previous.feesCents:undefined});
  if(!item){formError(form,'Revisa el nombre, las cantidades, los precios y las fechas.');return;}
  void saveOrder(item,item.reminderDate&&!item.purchased?'Compra guardada con aviso a las 11:30.':'Compra guardada.');
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
 if(a==='new')viewOrder();
 else if(a==='close')document.querySelector('#compra-dialog')?.close();
 else if(a==='edit'){const existing=orders().find(o=>o.id===button.dataset.id);if(existing)viewOrder(existing)}
 else if(a==='toggle'||a==='receive'){
  const previous=orders().find(o=>o.id===button.dataset.id);if(!previous)return;
  if(a==='receive'&&previous.deliveryDate>shopLocalDate()){toast('Aún no ha llegado la fecha de entrega. Confirma la entrada cuando recibas el pedido.');return;}
  const purchased=a==='receive'||!previous.purchased;
  const received=purchased&&(a==='receive'||!previous.deliveryDate);
  const item=cleanPurchaseOrder({...previous,purchased,inventoryReceived:received,inventoryReceivedAt:received?new Date().toISOString():null,
   reminderDate:!purchased&&previous.reminderDate&&madridTime(previous.reminderDate,PURCHASE_REMINDER_TIME)<=Date.now()?null:previous.reminderDate,
   items:previous.items.map(x=>({...x,id:x.id||crypto.randomUUID(),inventory:x.inventory||globalThis.suggestDinoCompraInventory?.(x)||undefined}))});
  if(item)void saveOrder(item,received?'Recepción guardada. Los productos reconocidos se han añadido a Despensa.':purchased?'Compra marcada como comprada.':'Compra marcada como pendiente.');
 }else if(a==='add'){
  const el=document.querySelector('#compra-products');if(!el)return;
  if(el.children.length>=100){toast('La lista admite hasta 100 productos.');return}
  el.insertAdjacentHTML('beforeend',purchaseRow());el.lastElementChild.querySelector('input').focus();totals();
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
