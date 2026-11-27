import {cleanShopPlan,shopLocalDate,shopUpcoming,addShopDays} from './compra-core.mjs';

const eur=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'});
const esc=x=>htmlSafe(String(x??''));
const day=x=>x?x.split('-').reverse().join('/'):'—';
const cents=x=>x===''?null:Math.round(Number(x)*100);
const row=(p={})=>'<fieldset class="compra-item"><label>Producto<input name="producto" required maxlength="100" value="'+esc(p.name)+'"></label>'+
 '<label>Formato<input name="formato" maxlength="60" placeholder="Pack, botella, bandeja…" value="'+esc(p.pack)+'"></label>'+
 '<label>Cantidad<input name="cantidad" type="number" min="1" max="999" required value="'+esc(p.qty??1)+'"></label>'+
 '<label>Precio por formato (€)<input name="precio" type="number" min="0" max="1000" step="0.01" value="'+esc(p.cents==null?'':p.cents/100)+'"></label>'+
 '<output class="compra-line-total" aria-label="Subtotal de este producto"></output><button class="click sm" type="button" data-shop="remove" aria-label="Quitar de la lista">Quitar</button></fieldset>';
const dates=(name,label,value)=>'<label>'+label+'<input type="date" name="'+name+'" required value="'+esc(value)+'"></label>';
const number=(name,label,value,min,max)=>'<label>'+label+'<input type="number" name="'+name+'" required min="'+min+'" max="'+max+'" value="'+value+'"></label>';
const defaults=()=>{const today=shopLocalDate();return {coverStart:addShopDays(today,3),orderDate:today,deliveryDate:addShopDays(today,1),weeks:2,cadence:2,lead:0,time:'10:00',enabled:false,changes:{}}};
const sample={coverStart:'2026-12-01',orderDate:'2026-11-27',deliveryDate:'2026-11-28',weeks:2,cadence:2,lead:0,time:'10:00',enabled:false,changes:{}};
function currentShop(){return state?.shoppingPlan||{}}
let pushStatus='';
function shopRender(){
 const {plan,items=[]}=currentShop(),p=cleanShopPlan(plan)||defaults();
 void preparePushDevice().catch(()=>{});
 const entries=plan?shopUpcoming(p):[];
 const enabled=!!plan?.enabled;
 return '<section class="section compra"><p class="eyebrow">MERCADONA · PREVISIÓN</p><h1>Compra</h1><p class="helper">Prepara tu lista y calcula cuánto te saldrá. Guardarla no hace ningún pedido ni cambia tu despensa.</p>'+
 '<form id="compra-list"><div class="compra-total"><strong>Subtotal estimado</strong> <output id="compra-total"></output></div><div id="compra-products">'+items.map(row).join('')+'</div>'+
 '<div class="tools"><button type="button" class="click" data-shop="add">Añadir producto</button><button class="click primary">Guardar lista</button></div></form></section>'+
 '<section class="section compra"><h2>Calendario de compra</h2><p class="helper">Las fechas son orientativas; no reservan entregas. Puedes adelantar solo una compra si cae en festivo.</p>'+
 (!plan?'<p><button class="click sm" type="button" data-shop="sample">Usar el ejemplo de diciembre (sin activar avisos)</button></p>':'')+
 '<form class="compra-dates" id="compra-plan">'+dates('coverStart','Primer día que cubre',p.coverStart)+dates('orderDate','Hacer el primer pedido',p.orderDate)+dates('deliveryDate','Primera entrega prevista',p.deliveryDate)+
 number('weeks','Semanas que cubre',p.weeks,1,8)+number('cadence','Repetir cada (semanas)',p.cadence,1,8)+number('lead','Avisar días antes del pedido',p.lead,0,21)+
 '<label>Hora del aviso (España peninsular)<input name="time" type="time" required value="'+esc(p.time)+'"></label>'+
 '<label class="compra-check"><input name="enabled" type="checkbox"'+(enabled?' checked':'')+'> Programar avisos de compra</label>'+
 '<div class="tools"><button class="click primary">Guardar calendario</button></div></form>'+
 (entries.length?'<h3>Próximas compras</h3><p class="helper">La fecha final es el inicio de la semana siguiente.</p>'+entries.map(item=>'<details class="compra-occur"><summary>Cubre '+day(item.start)+' al '+day(item.end)+(item.skip?' · Sin aviso':item.custom?' · Ajuste puntual':'')+'</summary>'+
 '<form class="compra-dates compra-override" data-cover="'+esc(item.start)+'">'+dates('order','Pedido previsto',item.order)+dates('delivery','Entrega prevista',item.delivery)+
 dates('remind','Fecha de aviso',item.remind)+'<label class="compra-check"><input name="skip" type="checkbox"'+(item.skip?' checked':'')+'> Omitir aviso de esta compra</label>'+
 '<div class="tools"><button class="click primary">Guardar este ajuste</button>'+(item.custom?'<button class="click" type="button" data-shop="reset" data-cover="'+esc(item.start)+'">Volver a fechas habituales</button>':'')+'</div></form></details>').join(''):'')+'</section>'+
 '<section class="section compra"><h2>Notificaciones en este dispositivo</h2><p class="helper">En el iPhone, abre DinoFit desde su icono en la pantalla de inicio y toca Activar. Programa los avisos arriba por separado.</p>'+
 '<div class="tools"><button class="click" type="button" data-shop="subscribe">Activar en este dispositivo</button><button class="click" type="button" data-shop="test">Enviar aviso de prueba</button>'+
 '<button class="click" type="button" data-shop="unsubscribe">Desactivar en este dispositivo</button></div><p id="compra-push-status" role="status">'+esc(pushStatus)+'</p></section>';
}
globalThis.renderDinoCompra=shopRender;
globalThis.refreshDinoCompra=()=>totals();
function totals(){
 const form=document.querySelector('#compra-list');if(!form)return;
 let total=0,unknown=0;
 for(const el of form.querySelectorAll('.compra-item')){
  const price=cents(el.elements.precio.value),val=price===null?null:price*Number(el.elements.cantidad.value);
  if(val===null)unknown++;else if(Number.isFinite(val))total+=val;
  el.querySelector('output').textContent=val===null?'Sin precio':eur.format(val/100);
 }
 form.querySelector('#compra-total').textContent=eur.format(total/100)+(unknown?' · '+unknown+' sin precio':'');
}
async function saveUpdate(patch,msg){
 if(!state||!account)return;
 state.shoppingPlan={...currentShop(),...patch};changed();
 toast(await persistNow()?msg:'No se pudo guardar en tu cuenta. Revisa el estado de sincronización.');
}
document.addEventListener('input',e=>{if(e.target.closest('#compra-list'))totals()});
document.addEventListener('submit',e=>{
 const form=e.target;
 if(!form.matches('#compra-list,#compra-plan,.compra-override'))return;
 e.preventDefault();e.stopImmediatePropagation();
 if(form.id==='compra-list'){
  const items=[...form.querySelectorAll('.compra-item')].map(el=>({name:el.elements.producto.value.trim(),pack:el.elements.formato.value.trim(),qty:Number(el.elements.cantidad.value),cents:cents(el.elements.precio.value)}));
  if(items.some(x=>!x.name)){toast('Escribe un nombre para cada producto.');return}
  void saveUpdate({items},'Lista guardada');return;
 }
 const data=Object.fromEntries(new FormData(form));
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

function reportPush(msg){pushStatus=msg;const el=document.querySelector('#compra-push-status');if(el)el.textContent=msg}
function keyBytes(string){return Uint8Array.from(atob(string.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(string.length/4)*4,'=')),c=>c.charCodeAt(0))}
async function pushApi(action,body){
 const {data}=await db.auth.getSession();
 const token=data.session?.access_token;
 if(!token)throw Error('Entra en tu cuenta para gestionar avisos.');
 const r=await fetch('/api/dinofit/push/'+action,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});
 const result=await r.json().catch(()=>null);
 if(!r.ok||!result?.ok)throw Error(result?.message||'No se pudo conectar con el servicio de avisos.');
 return result;
}
let pushBusy=false,readyDevice=null,deviceLoading=null;
function preparePushDevice(){
 if(!('serviceWorker'in navigator)||!('Notification'in window)||!('PushManager'in window))return Promise.resolve(null);
 if(!deviceLoading)deviceLoading=(async()=>{
  await navigator.serviceWorker.register('/dinofit/compra-sw.js',{scope:'/dinofit/'});
  const registration=await navigator.serviceWorker.ready;
  const {publicKey}=await pushApi('key',{});
  return readyDevice={registration,applicationServerKey:keyBytes(publicKey)};
 })().catch(e=>{deviceLoading=null;throw e});
 return deviceLoading;
}
async function changePush(action){
 if(pushBusy)return;
 if(!('serviceWorker'in navigator)||!('Notification'in window)||!('PushManager'in window)){reportPush('Este navegador no permite avisos aquí. En iPhone, abre DinoFit desde la pantalla de inicio.');return}
 pushBusy=true;
 try{
  if(action==='subscribe'&&await Notification.requestPermission()!=='granted')throw Error('Los avisos no tienen permiso. Revisa los ajustes de notificaciones del dispositivo.');
  reportPush('Comprobando notificaciones…');
  if(!readyDevice){await preparePushDevice();if(action==='subscribe'){reportPush('Preparado. Vuelve a tocar Activar para vincular este dispositivo.');return}}
  const {registration,applicationServerKey}=readyDevice;
  let sub=await registration.pushManager.getSubscription();
  if(action==='subscribe'){
   if(!sub){
    sub=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey});
   }
   await pushApi('subscribe',{subscription:sub.toJSON()});
   reportPush('Avisos activados en este dispositivo. Ya puedes enviar una prueba.');
  }else if(action==='test'){
   if(!sub)throw Error('Activa primero los avisos en este dispositivo.');
   await pushApi('test',{endpoint:sub.endpoint});
   reportPush('Prueba enviada al servicio de notificaciones. Comprueba si te llega.');
  }else{
   if(sub){await pushApi('unsubscribe',{endpoint:sub.endpoint});await sub.unsubscribe();}
   reportPush('Avisos desactivados en este dispositivo.');
  }
 }catch(error){reportPush(error.message||'No se pudieron configurar los avisos.')}
 finally{pushBusy=false}
}
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-shop]');if(!button)return;
 e.preventDefault();e.stopImmediatePropagation();
 const a=button.dataset.shop;
 if(a==='add'){
  const el=document.querySelector('#compra-products');if(el.children.length>=100){toast('La lista admite hasta 100 productos.');return}
  el.insertAdjacentHTML('beforeend',row());el.lastElementChild.querySelector('input').focus();totals();
 }else if(a==='remove'){button.closest('.compra-item').remove();totals()}
 else if(a==='sample')void saveUpdate({plan:sample},'Ejemplo guardado sin avisos activados');
 else if(a==='reset'){
  const plan=cleanShopPlan(currentShop().plan);if(plan){delete plan.changes[button.dataset.cover];void saveUpdate({plan},'Fechas habituales restauradas')}
 }else void changePush(a);
},true);
window.addEventListener('hashchange',()=>{if(location.hash==='#compra'&&state&&account){activeView='compra';render()}});
if(typeof activeView!=='undefined'&&activeView==='compra')render();
