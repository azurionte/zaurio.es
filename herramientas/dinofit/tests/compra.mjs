import assert from 'node:assert/strict';
import {cleanShopPlan,shopOccurrence,dueShopOccurrences,madridTime} from '../compra-core.mjs';
import {dinoEndpoint,runDinoPush,handleDinoPush} from '../../../supabase/functions/dinofit-push/handler.mjs';
const plan=cleanShopPlan({coverStart:'2026-12-01',orderDate:'2026-11-27',deliveryDate:'2026-11-28',weeks:2,cadence:2,lead:0,time:'10:00',enabled:true,
 changes:{'2026-12-29':{order:'2026-12-22',delivery:'2026-12-23',remind:'2026-12-21'}}});
assert.deepEqual(shopOccurrence(plan,0),{index:0,start:'2026-12-01',end:'2026-12-15',order:'2026-11-27',delivery:'2026-11-28',remind:'2026-11-27',skip:false,custom:false});
assert.equal(shopOccurrence(plan,1).order,'2026-12-11');
assert.equal(shopOccurrence(plan,2).delivery,'2026-12-23');
assert.equal(shopOccurrence(plan,2).end,'2027-01-12');
assert.equal(shopOccurrence(plan,3).order,'2027-01-08');
assert.equal(shopOccurrence(plan,3).start,'2027-01-12');
assert.equal(madridTime('2027-03-28','02:30'),Date.parse('2027-03-28T01:00:00Z'));
assert.equal(madridTime('2027-10-31','02:30'),Date.parse('2027-10-31T00:30:00Z'));
assert.equal(cleanShopPlan({...plan,orderDate:'2026-11-29'}),null);
assert.equal(cleanShopPlan({...plan,cadence:1}),null);
assert.equal(cleanShopPlan({...plan,coverStart:'2026-02-31'}),null);
const now=Date.parse('2026-12-21T09:00:30Z');
assert.deepEqual(dueShopOccurrences(plan,now).map(x=>x.start),['2026-12-29']);
assert.deepEqual(dueShopOccurrences({...plan,enabled:false},now),[]);
assert.deepEqual(dueShopOccurrences({...plan,changes:{'2026-12-29':{...plan.changes['2026-12-29'],skip:true}}},now),[]);
assert.deepEqual(dueShopOccurrences(plan,now-60000),[]);
assert.deepEqual(dueShopOccurrences(plan,now+24*3600000),[]);
const endpoint='https://web.push.apple.com/receipt';
assert.equal(dinoEndpoint(endpoint),endpoint);
assert.equal(dinoEndpoint('https://push.apple.com.bad.example/secret'),null);
assert.equal(dinoEndpoint('https://127.0.0.1/secret'),null);
const claims=new Set(),sent=[];
const admin=async (env,path,options={})=>{
 if(path.startsWith('/dinofit_push_subscriptions?'))return Response.json([{id:'device',endpoint,p256dh:'B'+'a'.repeat(86),auth:'b'.repeat(22),dinofit_documents:{document:{shoppingPlan:{plan}}}}]);
 if(path==='/dinofit_push_deliveries'&&options.method==='POST'){
  const k=options.body;if(claims.has(k))return Response.json([]);
  claims.add(k);return Response.json([{}],{status:201});
 }
 throw Error(path);
};
const post=async (...x)=>{sent.push(x);return new Response(null,{status:201})};
const env={SUPABASE_SERVICE_ROLE_KEY:'test',VAPID_PUBLIC_KEY:'test',VAPID_PRIVATE_KEY:'test'};
await Promise.all([runDinoPush(env,{admin,post},now),runDinoPush(env,{admin,post},now)]);
assert.equal(sent.length,1);
assert.equal(sent[0][2].url,'/dinofit/#compra');
assert.equal(sent[0][3].redirect,'error');
const origin='https://herramientas.zaurio.es';
const json=(body,init={})=>Response.json(body,init);
assert.equal((await handleDinoPush(new Request(origin+'/api/dinofit/push/test',{method:'POST',headers:{Origin:origin}}),env,{admin,post,json})).status,401);
assert.equal((await handleDinoPush(new Request(origin+'/api/dinofit/push/test',{method:'POST',headers:{Origin:'https://example.com'}}),env,{admin,post,json})).status,403);
console.log('Compra: calendario, cambio horario, excepciones, permisos y envío sin duplicados: OK');

import {readFileSync} from 'node:fs';
import liveAssets from '../../../workers/dinofit-compra-assets.mjs';
for (const [url,[type,body]] of Object.entries(liveAssets)) {
 assert.match(type,/^(text|application|image)\//);
 assert.equal(body,readFileSync(new URL('../'+url.split('/').pop(),import.meta.url),'utf8'),url);
}
assert.equal(Object.keys(liveAssets).length,6);

import {runInNewContext} from 'node:vm';
const pantryScript=readFileSync(new URL('../app-pantry.js',import.meta.url),'utf8');
class WorkerScope{}
const testWorker=new WorkerScope(),events=[];
testWorker.addEventListener=(name)=>events.push(name);
runInNewContext(pantryScript,{self:testWorker,ServiceWorkerGlobalScope:WorkerScope});
assert.deepEqual(events,['install','activate','push','notificationclick']);
const appUi=readFileSync(new URL('../app-ui.js',import.meta.url),'utf8');
assert.match(appUi,/app-pantry\.js\?compra-worker=1/);
const browserSandbox={document:{addEventListener(){}},window:{document:{},addEventListener(){}},Intl};
runInNewContext(appUi,browserSandbox);
assert.equal(typeof browserSandbox.renderDinoCompra,'function');


import {cleanPurchaseOrder,cleanPurchaseImage,usualPurchase,purchaseEstimate,duePurchaseOrders} from '../compra-core.mjs';
import {dinoProductImage} from '../../../supabase/functions/dinofit-push/handler.mjs';
const imageUrl='https://prod-mercadona.imgix.net/images/sample_fruit.jpg?fit=crop&w=300&tracking=x';
const line={id:'fruit-1',name:'Manzanas',qty:3,cents:205,pack:'Bandeja',imageUrl};
const explicit={id:'order1',orderDate:'2026-12-21',deliveryDate:'2026-12-23',coverStart:'2026-12-29',coverEnd:'2027-01-12',reminderDate:'2026-12-21',purchased:false,items:[line]};
const purchased={...explicit,id:'past-pay',orderDate:'2026-12-20',purchased:true,totalCents:725,feesCents:110,inventoryReceived:false};
assert.match(cleanPurchaseImage(imageUrl),/^https:\/\/prod-mercadona\.imgix\.net\/images\/sample_fruit\.jpg\?fm=jpg&fit=crop&w=160&h=160$/);
assert.equal(cleanPurchaseImage('https://prod-mercadona.imgix.net.evil.test/images/sample_fruit.jpg'),'');
assert.equal(cleanPurchaseImage('https://user:pass@prod-mercadona.imgix.net/images/sample_fruit.jpg'),'');
assert.equal(cleanPurchaseImage('https://prod-mercadona.imgix.net/images/../x.txt'),'');
assert.equal(cleanPurchaseOrder({...explicit,coverEnd:explicit.coverStart}),null);
assert.equal(cleanPurchaseOrder({...explicit,inventoryReceived:true}).inventoryReceived,false);
assert.equal(cleanPurchaseOrder(purchased).inventoryReceived,false);
assert.equal(cleanPurchaseOrder(purchased).feesCents,110);
assert.equal(usualPurchase([purchased,explicit]).id,'past-pay');
assert.deepEqual(purchaseEstimate([line,{...line,cents:null}]),{cents:615,unknown:1});
const slot=Date.parse('2026-12-21T10:30:00Z');
assert.deepEqual(duePurchaseOrders([explicit,purchased],slot-60000),[]);
assert.deepEqual(duePurchaseOrders([explicit,purchased],slot).map(o=>o.id),['order1']);
assert.deepEqual(duePurchaseOrders([explicit,purchased],slot+12*3600000),[]);
const summer={...explicit,reminderDate:'2027-07-02'};
assert.deepEqual(duePurchaseOrders([summer],Date.parse('2027-07-02T09:30:00Z')).map(o=>o.id),['order1']);
const originalPost=sent.length;
const queuedAdmin=async (env,path,options={})=>{
 if(path.startsWith('/dinofit_push_subscriptions?'))return Response.json([{id:'device',endpoint,p256dh:'B'+'a'.repeat(86),auth:'b'.repeat(22),dinofit_documents:{document:{shoppingPlan:{plan,orders:[explicit,purchased]}}}}]);
 return admin(env,path,options);
};
await runDinoPush(env,{admin:queuedAdmin,post},slot-90*60000); // Legacy same period suppressed.
await Promise.all([runDinoPush(env,{admin:queuedAdmin,post},slot),runDinoPush(env,{admin:queuedAdmin,post},slot+60000)]);
assert.equal(sent.length,originalPost+1);
assert.ok([...claims].some(text=>JSON.parse(text).occurrence==='order:purchase:order1'));
assert.ok(![...claims].some(text=>JSON.parse(text).occurrence==='order:purchase:past-pay'));
const validPhoto=new Uint8Array([255,216,255,224,1,2,255,217]);
const smallResponse=()=>new Response(validPhoto,{headers:{'Content-Type':'image/jpeg'}});
assert.match(await dinoProductImage(imageUrl,async(url,options)=>{
 assert.equal(new URL(url).hostname,'prod-mercadona.imgix.net');
 assert.equal(options.redirect,'error');
 return smallResponse();
}),/^data:image\/jpeg;base64,/);
assert.equal(await dinoProductImage('https://private.test/images/pic.jpg',()=>{throw Error('unsafe origin')}),null);
assert.equal(await dinoProductImage(imageUrl,()=>new Response('other',{headers:{'Content-Type':'text/html'}})),null);
assert.equal(await dinoProductImage(imageUrl,()=>new Response('bytes',{headers:{'Content-Type':'image/jpeg','Content-Length':'180001'}})),null);
assert.equal(await dinoProductImage(imageUrl,()=>new Response(new Uint8Array(180001),{headers:{'Content-Type':'image/jpeg'}})),null);
const allowedNoAuthRequest=new Request(origin+'/api/dinofit/push/image',{method:'POST',headers:{Origin:origin},body:JSON.stringify({url:imageUrl})});
assert.equal((await handleDinoPush(allowedNoAuthRequest,env,{admin,post,json})).status,401);
const escapeValue=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
Object.assign(browserSandbox,{state:{shoppingPlan:{orders:[purchased,explicit]}},account:{id:'isolated'},navigator:{},htmlSafe:escapeValue});
const view=browserSandbox.renderDinoCompra();
assert.match(view,/Planificar compra/);
assert.match(view,/Activar notificaciones/);
assert.match(view,/Compra del 29\/12\/2026 al 11\/01\/2027/);
assert.match(view,/Comprado/);
assert.match(view,/Pendiente/);
assert.match(view,/Añadir a Despensa/);
console.log('Compra: historial, clonación, imágenes oficiales y aviso por pedido a las 11:30 con deduplicación: OK');

const {nextPurchaseDates,addShopDays,purchaseLeadDates}=await import('../compra-core.mjs');
const booked={...explicit,id:'dec-1',orderDate:'2026-11-27',deliveryDate:'2026-11-28',
 coverStart:'2026-12-01',coverEnd:'2026-12-15',purchased:true};
assert.deepEqual(nextPurchaseDates([booked],'2026-11-27'),{
 coverStart:'2026-12-15',coverEnd:'2026-12-29',orderDate:'2026-12-10',deliveryDate:'2026-12-12',reminderDate:'2026-12-10'
});
const late={...explicit,id:'dec-20',orderDate:'2026-12-17',deliveryDate:null,coverStart:'2026-12-20',coverEnd:'2027-01-03',reminderDate:null};
assert.deepEqual(nextPurchaseDates([late,booked],'2026-11-27'),{
 coverStart:'2026-12-15',coverEnd:'2026-12-20',orderDate:'2026-12-10',deliveryDate:'2026-12-12',reminderDate:'2026-12-10'
});
assert.equal(nextPurchaseDates([booked,{...late,cancelled:true}],'2026-11-27').coverEnd,'2026-12-29');
assert.equal(nextPurchaseDates([],'2026-11-30').orderDate,'2026-11-26');
assert.equal(addShopDays(nextPurchaseDates([booked],'2026-11-27').coverEnd,-1),'2026-12-28');

assert.deepEqual(purchaseLeadDates('2026-12-11'),{
 orderDate:'2026-12-10',deliveryDate:'2026-12-10',reminderDate:'2026-12-10'
});
assert.deepEqual(purchaseLeadDates('2026-12-17'),{
 orderDate:'2026-12-10',deliveryDate:'2026-12-12',reminderDate:'2026-12-10'
});

const removeSource=appUi.match(/function removePurchaseProduct\(button\)\{[\s\S]+?(?=\nfunction reportPush)/)?.[0];
assert.ok(removeSource);
const offsets={scrollTop:510,scrollHeight:900,clientHeight:320},calls=[];
const modal={scrollTop:0,scrollHeight:700,clientHeight:700,querySelector:()=>offsets};
const right={querySelector:()=>({focus(options){calls.push(options.preventScroll);offsets.scrollTop=0;}})};
const rowMiddle={closest:()=>modal,nextElementSibling:right,remove(){calls.push('removed');}};
runInNewContext(removeSource+'\nremovePurchaseProduct(button)',{
 button:{closest:()=>rowMiddle},totals(){calls.push('recalculate');}
});
assert.deepEqual(calls,['removed','recalculate',true]);
assert.equal(offsets.scrollTop,510);


import {applyPurchaseOrderChange} from '../compra-core.mjs';
const appSource=readFileSync(new URL('../app.js',import.meta.url),'utf8');
function casHarness(initial,hook=async()=>undefined){
 let remote={document:structuredClone(initial),revision:123};
 let writes=0;
 const dbFixture={from:()=>({
  select:()=>({eq:(field,owner)=>({
   maybeSingle:async()=>{assert.equal(field,'user_id');assert.equal(owner,'cas-owner');return {data:structuredClone(remote)}}
  })}),
  update:arg=>({eq:(field,owner)=>({eq:(revField,rev)=>({
   select:async()=>{
    assert.equal(field,'user_id');assert.equal(owner,'cas-owner');assert.equal(revField,'revision');
    const override=await hook(++writes,remote,arg.document);
    if(override?.lost){
     remote.document=structuredClone(arg.document);remote.revision++;
     return {error:new Error('ack switched off')};
    }
    if(rev!==remote.revision)return {data:[]};
    remote.document=structuredClone(arg.document);remote.revision++;
    return {data:[{revision:remote.revision}]};
   }
  })})})
 })};
 const sandbox={structuredClone,Intl,Date,dbFixture,
  document:{querySelector:()=>null},localMock:structuredClone(initial),
  clearTimeout(){},setTimeout(){}};
 runInNewContext(appSource,sandbox);
 runInNewContext('db=dbFixture;account={id:"cas-owner"};revision=122;state=localMock;validateState=()=>true;',sandbox);
 return {
  remote:()=>remote,
  writes:()=>writes,
  live:()=>runInNewContext('({state,revision,dirty,conflict,changeCount})',sandbox),
  run:callback=>sandbox.persistCompraMutation(callback),
  set:code=>runInNewContext(code,sandbox)
 };
}
const intended=cleanPurchaseOrder({...explicit,id:'browser-stable-draft'});
const initial={logs:[{id:'fresh-remote-diary'}],profile:{owner:'test'},pantry:{movements:[]},shoppingPlan:{plan:{legacy:true},orders:[purchased],other:'keep'}};
const racing=casHarness(initial,async (n,remote)=>{
 if(n===1){remote.document.logs.push({id:'concurrent-diary'});remote.document.shoppingPlan.orders[0].unrelatedField='change-other-purchase';remote.revision++;}
});
let applyAttempts=0;
const afterRace=await racing.run(draft=>{
 assert.equal(draft.logs[0].id,'fresh-remote-diary');
 return applyPurchaseOrderChange(draft,intended,null,()=>{applyAttempts++;draft.pantry.movements.push({id:intended.id});return {linked:1};});
});
assert.equal(afterRace.kind,'ok');
assert.equal(applyAttempts,2);
assert.equal(racing.writes(),2);
assert.equal(racing.remote().document.logs.length,2);
assert.equal(racing.remote().document.shoppingPlan.orders[1].unrelatedField,'change-other-purchase');
assert.equal(racing.remote().document.shoppingPlan.other,'keep');
assert.equal(racing.remote().document.pantry.movements.length,1);
assert.equal(racing.live().revision,125);
assert.equal((await racing.run(draft=>applyPurchaseOrderChange(draft,intended,null))).kind,'ok');
assert.equal(racing.writes(),2);

const lost=casHarness(initial,async n=>n===1?{lost:true}:undefined);
assert.equal((await lost.run(draft=>applyPurchaseOrderChange(draft,intended,null))).kind,'ok');
assert.equal(lost.writes(),1);
assert.equal(lost.remote().document.shoppingPlan.orders.filter(o=>o.id===intended.id).length,1);

const existing=cleanPurchaseOrder(purchased),edited=cleanPurchaseOrder({...purchased,coverEnd:'2027-01-15'});
const competing=casHarness(initial);
competing.remote().document.shoppingPlan.orders[0].coverEnd='2027-01-13';
const blocked=await competing.run(draft=>applyPurchaseOrderChange(draft,edited,existing));
assert.equal(blocked.kind,'changed');
assert.equal(competing.writes(),0);
assert.equal(competing.remote().document.shoppingPlan.orders[0].coverEnd,'2027-01-13');
assert.equal(competing.live().state.shoppingPlan.orders[0].coverEnd,'2027-01-13');
assert.equal(competing.live().revision,123);

const pantryBlocked=casHarness(initial);
const blockedPantry=await pantryBlocked.run(draft=>applyPurchaseOrderChange(draft,edited,existing,()=>{
 draft.pantry.movements.push({id:'must-not-persist'});throw Error('Ya se han usado existencias.');
}));
assert.equal(blockedPantry.kind,'invalid');
assert.equal(blockedPantry.message,'Ya se han usado existencias.');
assert.equal(pantryBlocked.writes(),0);
assert.equal(pantryBlocked.live().state.pantry.movements.length,0);
assert.equal(pantryBlocked.remote().document.pantry.movements.length,0);

const local=casHarness(initial);local.set('state.logs.push({id:"not-synced"});dirty=true;conflict=true;changeCount++;');
assert.equal((await local.run(draft=>applyPurchaseOrderChange(draft,intended,null))).kind,'local');
assert.equal(local.live().state.logs.length,2);
assert.equal(local.remote().document.logs.length,1);

let mid;
mid=casHarness(initial,async()=>{mid.set('state.logs.push({id:"not-synced"});dirty=true;changeCount++;')});
assert.equal((await mid.run(draft=>applyPurchaseOrderChange(draft,intended,null))).kind,'committed-with-local-edits');
assert.equal(mid.live().state.logs.length,2);
assert.equal(mid.live().revision,122);
assert.equal(mid.remote().document.shoppingPlan.orders[0].id,intended.id);
assert.equal(mid.remote().document.logs.length,1);

const draftSession={
 getItem:key=>key.endsWith(':isolated')?JSON.stringify({id:intended.id,expected:null,items:intended.items,dates:{}}):null
};
Object.assign(browserSandbox,{sessionStorage:draftSession});
assert.match(browserSandbox.renderDinoCompra(),/Continuar borrador/);
assert.match(browserSandbox.renderDinoCompra(),/Descartar borrador/);
console.log('Compra CAS: reintentos, historial y almacén preservados, confirmación perdida, edición ajena, borrador y cambios locales: OK');

import {makeCompraJournal} from '../compra-core.mjs';
const storageFixture=new Map();
const memoryStorage={
 get length(){return storageFixture.size;},
 key:index=>[...storageFixture.keys()][index]??null,
 getItem:key=>storageFixture.get(key)??null,
 setItem:(key,value)=>storageFixture.set(key,value),
 removeItem:key=>storageFixture.delete(key)
};
const ownerBox=makeCompraJournal(memoryStorage,'isolated');
const otherBox=makeCompraJournal(memoryStorage,'another-account');
ownerBox.put({id:'durable-operation',item:intended,expected:null,at:123});
otherBox.put({id:'foreign-operation',item:intended,expected:null,at:123});
assert.equal(makeCompraJournal(memoryStorage,'isolated').entries()[0].id,'durable-operation');
assert.equal(ownerBox.entries().length,1);
assert.equal(otherBox.entries().length,1);
const refreshedCas=casHarness(initial);
const replayEvents=new Map();
const target={document:{addEventListener(){}},window:{document:{},addEventListener:(name,cb)=>replayEvents.set(name,cb)},Intl,
 state:initial,account:{id:'isolated'},navigator:{onLine:false},activeView:'today',localStorage:memoryStorage,
 persistCompraMutation:cb=>refreshedCas.run(cb)};
runInNewContext(appUi,target);
target.resumeDinoCompraSync();
assert.equal(ownerBox.entries().length,1);
assert.equal(refreshedCas.writes(),0);
target.navigator.onLine=true;
replayEvents.get('online')();
await new Promise(resolve=>setImmediate(resolve));
assert.equal(ownerBox.entries().length,0);
assert.equal(refreshedCas.remote().document.shoppingPlan.orders[0].id,intended.id);
assert.equal(otherBox.entries().length,1);

const blockedOp={id:'known-blocked',item:edited,expected:existing,at:125,blocked:true};
ownerBox.put(blockedOp);
target.resumeDinoCompraSync();
await new Promise(resolve=>setImmediate(resolve));
assert.equal(refreshedCas.writes(),1);
assert.equal(ownerBox.entries()[0].blocked,true);
console.log('Compra outbox: localStorage after reload, cross-account isolation, offline→online replay, blocked conflict retained: OK');
