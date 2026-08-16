import { assertMinor } from './money.js';
import { queryLedger } from './ledger.js';
import { assertIsoDay } from './dates.js';

function key(accountId,bucketId=null){return`${accountId||'__unassigned__'}|${bucketId||'__free__'}`;}
function eventDay(event){return String(event.occurredAt||event.scheduledAt||'').slice(0,10);}
function latestObservation(observations,accountId,{scope,bucketId=null,asOf}){return(observations||[]).filter(row=>row.accountId===accountId&&(row.scope|| (row.bucketId?'bucket':'account_total'))===scope&&(scope!=='bucket'||row.bucketId===bucketId)&&String(row.observedAt).slice(0,10)<=asOf).sort((a,b)=>String(b.observedAt).localeCompare(String(a.observedAt)))[0]||null;}

export function resolveAccountState({accounts=[],buckets=[],events=[],transfers=[],observations=[],from,asOf}){
  assertIsoDay(from,'from');assertIsoDay(asOf,'asOf');
  const rows=queryLedger(events,{from,to:asOf});
  const balances=new Map(),provenance=new Map();
  const ensure=(accountId,bucketId=null)=>{const k=key(accountId,bucketId);if(!balances.has(k))balances.set(k,0);if(!provenance.has(k))provenance.set(k,[]);return k;};
  for(const account of accounts)ensure(account.id,null);for(const bucket of buckets)ensure(bucket.accountId,bucket.id);
  for(const event of rows){if(!event.accountId)continue;const k=ensure(event.accountId,event.bucketId||null),amount=assertMinor(Number(event.amountMinor),'event.amountMinor');balances.set(k,balances.get(k)+amount);provenance.get(k).push({kind:'event',id:event.id,day:eventDay(event),amountMinor:amount});}
  for(const transfer of transfers||[]){if(!['confirmed','actual'].includes(transfer.status))continue;const day=String(transfer.occurredAt||transfer.expectedAt||'').slice(0,10);if(!day||day<from||day>asOf)continue;const amount=Math.abs(assertMinor(Number(transfer.amountMinor),'transfer.amountMinor')),outKey=ensure(transfer.fromAccountId,transfer.fromBucketId||null),inKey=ensure(transfer.toAccountId,transfer.toBucketId||null);balances.set(outKey,balances.get(outKey)-amount);balances.set(inKey,balances.get(inKey)+amount);provenance.get(outKey).push({kind:'transfer_out',id:transfer.id,day,amountMinor:-amount});provenance.get(inKey).push({kind:'transfer_in',id:transfer.id,day,amountMinor:amount});}

  const reconciliations=[];
  for(const bucket of buckets){const k=key(bucket.accountId,bucket.id),observation=latestObservation(observations,bucket.accountId,{scope:'bucket',bucketId:bucket.id,asOf});if(!observation)continue;const observed=assertMinor(Number(observation.amountMinor),'observation.amountMinor'),observationDay=String(observation.observedAt).slice(0,10),items=provenance.get(k)||[],post=items.filter(row=>row.day>observationDay).reduce((sum,row)=>sum+row.amountMinor,0),current=observed+post;balances.set(k,current);reconciliations.push({scope:'bucket',accountId:bucket.accountId,bucketId:bucket.id,observationId:observation.id,observedMinor:observed,currentMinor:current});}
  for(const account of accounts){const k=key(account.id,null),observation=latestObservation(observations,account.id,{scope:'free_balance',asOf});if(!observation)continue;const observed=assertMinor(Number(observation.amountMinor),'observation.amountMinor'),observationDay=String(observation.observedAt).slice(0,10),items=provenance.get(k)||[],post=items.filter(row=>row.day>observationDay).reduce((sum,row)=>sum+row.amountMinor,0),current=observed+post;balances.set(k,current);reconciliations.push({scope:'free_balance',accountId:account.id,bucketId:null,observationId:observation.id,observedMinor:observed,currentMinor:current});}

  const accountStates=accounts.map(account=>{
    const folderRows=buckets.filter(bucket=>bucket.accountId===account.id).map(bucket=>({id:bucket.id,name:bucket.name,balanceMinor:balances.get(key(account.id,bucket.id))||0,truthStatus:latestObservation(observations,account.id,{scope:'bucket',bucketId:bucket.id,asOf})?'observed':'modelled'}));
    let freeMinor=balances.get(key(account.id,null))||0;
    const totalObservation=latestObservation(observations,account.id,{scope:'account_total',asOf});
    if(totalObservation){
      const observationDay=String(totalObservation.observedAt).slice(0,10),observedTotal=assertMinor(Number(totalObservation.amountMinor),'observation.amountMinor');
      const accountEventDelta=rows.filter(e=>e.accountId===account.id&&eventDay(e)>observationDay).reduce((sum,e)=>sum+Number(e.amountMinor||0),0);
      const transferDelta=(transfers||[]).filter(t=>['confirmed','actual'].includes(t.status)&&String(t.occurredAt||t.expectedAt||'').slice(0,10)>observationDay&&String(t.occurredAt||t.expectedAt||'').slice(0,10)<=asOf).reduce((sum,t)=>sum+(t.toAccountId===account.id?Number(t.amountMinor||0):0)-(t.fromAccountId===account.id?Number(t.amountMinor||0):0),0);
      const targetTotal=observedTotal+accountEventDelta+transferDelta;
      const bucketTotal=folderRows.reduce((sum,b)=>sum+b.balanceMinor,0);
      freeMinor=targetTotal-bucketTotal;balances.set(key(account.id,null),freeMinor);
      reconciliations.push({scope:'account_total',accountId:account.id,bucketId:null,observationId:totalObservation.id,observedMinor:observedTotal,currentMinor:targetTotal});
    }
    const totalMinor=freeMinor+folderRows.reduce((sum,b)=>sum+b.balanceMinor,0);
    return{id:account.id,name:account.name,isPrimary:!!account.isPrimary,freeMinor,buckets:folderRows,totalMinor,balanceKnown:!!totalObservation,truthStatus:totalObservation?'observed':'modelled'};
  });
  const totalWealthMinor=accountStates.reduce((sum,a)=>sum+a.totalMinor,0),splitMinor=accountStates.reduce((sum,a)=>sum+a.freeMinor+a.buckets.reduce((n,b)=>n+b.balanceMinor,0),0);
  return{asOf,totalWealthMinor,accounts:accountStates,reconciliations,diagnostics:{totalWealthMinor,splitMinor,invariantDifferenceMinor:totalWealthMinor-splitMinor,eventCount:rows.length,transferCount:(transfers||[]).filter(row=>['confirmed','actual'].includes(row.status)).length,knownAccountCount:accountStates.filter(a=>a.balanceKnown).length}};
}
export function assertAccountingInvariants(state){if(state.diagnostics.invariantDifferenceMinor!==0)throw new Error('Accounting invariant failed: account split differs from total wealth');for(const account of state.accounts){const split=account.freeMinor+account.buckets.reduce((sum,b)=>sum+b.balanceMinor,0);if(split!==account.totalMinor)throw new Error(`Accounting invariant failed for account ${account.id}`);}return true;}
