import {dueShopOccurrences,shopLocalDate,addShopDays,cleanPurchaseOrders,duePurchaseOrders,cleanPurchaseImage} from '../../../herramientas/dinofit/compra-core.mjs';

const host='herramientas.zaurio.es', route='/api/dinofit/push/';
const table='/dinofit_push_subscriptions', deliveries='/dinofit_push_deliveries';
const accountKey='sb_publishable_D8CL0HI8vLfD5L3g5ZgUGg_HOM6Ixdk';
const reminderDateLabel=date=>date.slice(8,10)+'/'+date.slice(5,7)+'/'+date.slice(0,4);
export function dinoPurchaseReminder(coverStart,coverEnd){
 const start=typeof coverStart==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(coverStart)?coverStart:null;
 const end=typeof coverEnd==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(coverEnd)?coverEnd:null;
 const days=start&&end?(Date.parse(end)-Date.parse(start))/86400000:14;
 const body=days>0&&days!==14
   ? 'Haz la compra para el periodo del '+reminderDateLabel(start)+' al '+reminderDateLabel(addShopDays(end,-1))+'.'
   : 'Haz la compra para las próximas dos semanas.';
 return {title:'Compra de Mercadona',body,url:'/dinofit/#compra',urgency:'normal'};
}
const trusted=(h,s)=>h===s||h.endsWith('.'+s);
export function dinoEndpoint(value){
 if(typeof value!=='string'||value.length>2048)return null;
 let u;try{u=new URL(value)}catch{return null}
 if(u.protocol!=='https:'||u.port||u.username||u.password||u.hash||u.pathname==='/')return null;
 if(!(trusted(u.hostname,'push.apple.com')||u.hostname==='fcm.googleapis.com'||
 u.hostname==='updates.push.services.mozilla.com'||trusted(u.hostname,'notify.windows.com')))return null;
 return u.href;
}
function validKeys(keys){return typeof keys?.p256dh==='string'&&typeof keys?.auth==='string'&&
 /^B[A-Za-z0-9_-]{86}$/.test(keys.p256dh)&&/^[A-Za-z0-9_-]{22}$/.test(keys.auth)}
function available(env){return Boolean(env.SUPABASE_SERVICE_ROLE_KEY&&env.VAPID_PUBLIC_KEY&&env.VAPID_PRIVATE_KEY)}
async function uid(request,env,defaultUrl){
 const token=request.headers.get('Authorization');
 if(!token||!/^Bearer [A-Za-z0-9._-]{10,10000}$/.test(token))return null;
 const r=await fetch((env.SUPABASE_URL||defaultUrl)+'/auth/v1/user',{headers:{Authorization:token,apikey:accountKey},redirect:'error'});
 if(!r.ok)return null;
 const input=await r.json();
 return /^[0-9a-f-]{36}$/i.test(input.id||'')?input.id:null;
}
function encoder(value){return encodeURIComponent(value)}
function bodyLimit(request){
 if(Number(request.headers.get('Content-Length')||0)>6000)return Promise.resolve(null);
 return (async()=>{
  const reader=request.body?.getReader();if(!reader)return null;
  const decoder=new TextDecoder();let size=0,value='';
  try{
   for(;;){const {value:bytes,done}=await reader.read();if(done)break;
    size+=bytes.length;if(size>6000){await reader.cancel();return null}
    value+=decoder.decode(bytes,{stream:true});
   }
   return JSON.parse(value+decoder.decode());
  }catch{return null}finally{reader.releaseLock()}
 })();
}
function idQuery(id){return '?id=eq.'+encoder(id)}
async function rows(admin,env,path){
 const r=await admin(env,path);if(!r.ok)throw Error('Read failed');return r.json();
}
async function claim(admin,env,sub,key){
 const r=await admin(env,deliveries,{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},
   body:JSON.stringify({subscription_id:sub,occurrence:key})});
 if(!r.ok)throw Error('Claim failed');
 return (await r.json()).length===1;
}
async function remove(admin,env,id){return admin(env,table+idQuery(id),{method:'DELETE'})}
async function send(admin,post,env,sub,key,payload,ttl){
 if(!dinoEndpoint(sub.endpoint)||!validKeys(sub))return {status:400};
 // Claim before the network send. In an ambiguous network failure, do not
 // resend the same occurrence automatically; a provider may already have accepted it.
 if(!await claim(admin,env,sub.id,key))return {status:409};
 const response=await post(env,sub,payload,{ttl,redirect:'error'});
 if(response.status===404||response.status===410)await remove(admin,env,sub.id);
 // Retry only a definitive provider throttle response (delivery did not start).
 if(response.status===429&&key.startsWith('order:')){
  await admin(env,deliveries+'?subscription_id=eq.'+encoder(sub.id)+'&occurrence=eq.'+encoder(key),{method:'DELETE'});
 }
 return response;
}

const MAX_PRODUCT_IMAGE=180000;
export async function dinoProductImage(raw,requestImage=fetch){
 const url=cleanPurchaseImage(raw);
 if(!url)return null;
 try{
  const r=await requestImage(url,{method:'GET',redirect:'error',signal:AbortSignal.timeout(4000),headers:{Accept:'image/jpeg'}});
  if(!r.ok||r.headers.get('Content-Type')?.split(';')[0]!=='image/jpeg'||
    Number(r.headers.get('Content-Length')||0)>MAX_PRODUCT_IMAGE||!r.body)return null;
  const reader=r.body.getReader();const chunks=[];let size=0;
  try{
   for(;;){
    const {value,done}=await reader.read();if(done)break;size+=value.length;
    if(size>MAX_PRODUCT_IMAGE){await reader.cancel();return null;}
    chunks.push(value);
   }
  }finally{reader.releaseLock();}
  if(size<4)return null;
  const bytes=new Uint8Array(size);let offset=0;
  for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  if(bytes[0]!==255||bytes[1]!==216||bytes[2]!==255||bytes[size-2]!==255||bytes[size-1]!==217)return null;
  let binary='';
  for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return 'data:image/jpeg;base64,'+btoa(binary);
 }catch{return null;}
}

export async function handleDinoPush(request,env,helpers){
 const u=new URL(request.url),{admin,post,json,defaultUrl}=helpers,prefix=helpers.routePrefix||route;
 if(!u.pathname.startsWith(prefix))return null;
 const reply=(status,message)=>json({ok:false,message},{status});
 if(!helpers.expectedOrigin&&u.hostname!==host)return reply(404,'No encontrado.');
 if(request.method!=='POST')return reply(405,'Método no permitido.');
 if(request.headers.get('Origin')!==(helpers.expectedOrigin||u.origin))return reply(403,'Origen no permitido.');
 try{
  const owner=await uid(request,env,defaultUrl);if(!owner)return reply(401,'Entra en DinoFit para gestionar avisos.');
  const action=u.pathname.slice(prefix.length);
  if(action==='key')return available(env)?json({ok:true,publicKey:env.VAPID_PUBLIC_KEY}):reply(503,'Los avisos todavía no están disponibles.');
  if(!['subscribe','unsubscribe','test','status','image'].includes(action))return reply(404,'No encontrado.');
  const data=await bodyLimit(request);
  if(action==='image'){
   const image=await dinoProductImage(data?.url,helpers.requestImage);
   return image?json({ok:true,image}):reply(404,'No hay imagen disponible para este producto.');
  }
  const endpoint=dinoEndpoint(action==='subscribe'?data?.subscription?.endpoint:data?.endpoint);
  if(!endpoint)return reply(400,'El servicio de notificaciones de este dispositivo no es compatible.');
  const query='?user_id=eq.'+encoder(owner)+'&endpoint=eq.'+encoder(endpoint);
  if(action==='unsubscribe'){
   const response=await admin(env,table+query,{method:'DELETE'});
   return response.ok?json({ok:true}):reply(503,'No se pudieron desactivar los avisos.');
  }
  if(!available(env))return reply(503,'Los avisos todavía no están disponibles.');
  const existing=(await rows(admin,env,table+query+'&select=id,endpoint,p256dh,auth'))[0];
  if(action==='status')return json({ok:true,active:!!existing});
  if(action==='subscribe'){
   const keys=data?.subscription?.keys;
   if(!validKeys(keys))return reply(400,'No se pudo leer el permiso de este dispositivo.');
   const fields={p256dh:keys.p256dh,auth:keys.auth};
   const r=existing?await admin(env,table+query,{method:'PATCH',body:JSON.stringify(fields)}):
    await admin(env,table,{method:'POST',body:JSON.stringify({...fields,user_id:owner,endpoint})});
   if(r.status===409)return reply(409,'Este dispositivo ya está vinculado. Desactiva el permiso de DinoFit en los ajustes y vuelve a activarlo.');
   return r.ok?json({ok:true}):reply(503,'No se pudo guardar el dispositivo.');
  }
  if(!existing)return reply(404,'Activa de nuevo los avisos para este dispositivo.');
  const key='test:'+Math.floor(Date.now()/60000);
  const r=await send(admin,post,env,existing,key,dinoPurchaseReminder(),120);
  if(r.status===409)return reply(429,'Espera un minuto antes de repetir la prueba.');
  if(r.status===404||r.status===410)return reply(410,'El permiso caducó. Desactiva y vuelve a activar los avisos.');
  return r.ok?json({ok:true}):reply(503,'No se pudo enviar la notificación de prueba.');
 }catch{return reply(503,'No se pudo conectar con el servicio de avisos.')}
}
export async function runDinoPush(env,{admin,post},now=Date.now()){
 if(!available(env))return;
 for(let offset=0;;offset+=100){
  const subs=await rows(admin,env,table+'?select=id,endpoint,p256dh,auth,dinofit_documents!inner(document)&order=id.asc&limit=100&offset='+offset);
  // Keep endpoint calls serial for low authenticated fan-out and safe cleanup.
  for(const sub of subs){
   const saved=sub.dinofit_documents?.document?.shoppingPlan;
   const explicit=cleanPurchaseOrders(saved?.orders);
   for(const due of duePurchaseOrders(explicit,now)){
    try{await send(admin,post,env,sub,'order:purchase:'+due.id,dinoPurchaseReminder(due.coverStart,due.coverEnd),600)}catch{console.error('DinoFit push delivery failed');}
   }
   const covered=new Set(explicit.map(o=>o.coverStart));
   for(const due of dueShopOccurrences(saved?.plan,now)){
    if(covered.has(due.start))continue;
    try{await send(admin,post,env,sub,'order:'+due.start,dinoPurchaseReminder(due.start,due.end),600)}catch{console.error('DinoFit push delivery failed');}
   }
  }
  if(subs.length<100)break;
 }
 if(shopLocalDate(now).endsWith('-01')&&new Date(now).getUTCHours()===12&&new Date(now).getUTCMinutes()===0)
  await admin(env,deliveries+'?claimed_at=lt.'+encoder(new Date(now-60*86400000).toISOString()),{method:'DELETE'});
}
