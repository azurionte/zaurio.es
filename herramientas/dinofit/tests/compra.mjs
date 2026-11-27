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
