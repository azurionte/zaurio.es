import { assertIsoDay } from './dates.js';
import { assertMinor } from './money.js';
import { chooseStrongestEvidence } from './ledger.js';

function day(value){return String(value||'').slice(0,10);}
function dayDistance(a,b){return Math.round((Date.parse(`${a}T12:00:00Z`)-Date.parse(`${b}T12:00:00Z`))/86400000);}
function latestTotalObservation(observations,accountId,asOf){return(observations||[]).filter(row=>row.accountId===accountId&&(row.scope||'account_total')==='account_total'&&day(row.observedAt)<=asOf).sort((a,b)=>String(b.observedAt).localeCompare(String(a.observedAt)))[0]||null;}

export function resolveCurrentPosition({accounts=[],observations=[],events=[],transfers=[],asOf,maxAgeDays=1}){
  assertIsoDay(asOf,'asOf');
  const resolvedEvents=chooseStrongestEvidence(events).filter(event=>['actual','confirmed'].includes(event.status));
  const accountStates=accounts.map(account=>{
    const observation=latestTotalObservation(observations,account.id,asOf);
    if(!observation)return{id:account.id,name:account.name,known:false,fresh:false,reason:'missing_account_total',balanceMinor:null,observedAt:null,appliedEvents:[],appliedTransfers:[]};
    const observedAt=day(observation.observedAt),ageDays=Math.max(0,dayDistance(asOf,observedAt)),fresh=maxAgeDays==null||ageDays<=Number(maxAgeDays);
    const base=assertMinor(Number(observation.amountMinor),'observation.amountMinor');
    const appliedEvents=resolvedEvents.filter(event=>event.accountId===account.id&&day(event.occurredAt||event.scheduledAt)>observedAt&&day(event.occurredAt||event.scheduledAt)<=asOf);
    const eventDelta=appliedEvents.reduce((sum,event)=>sum+Number(event.amountMinor||0),0);
    const appliedTransfers=(transfers||[]).filter(t=>['actual','confirmed'].includes(t.status)&&day(t.occurredAt||t.expectedAt)>observedAt&&day(t.occurredAt||t.expectedAt)<=asOf&&(t.fromAccountId===account.id||t.toAccountId===account.id));
    const transferDelta=appliedTransfers.reduce((sum,t)=>sum+(t.toAccountId===account.id?Number(t.amountMinor||0):0)-(t.fromAccountId===account.id?Number(t.amountMinor||0):0),0);
    return{id:account.id,name:account.name,known:fresh,fresh,reason:fresh?null:'stale_account_total',balanceMinor:base+eventDelta+transferDelta,observedAt:observation.observedAt,observationId:observation.id,observationSource:observation.source||'unknown',ageDays,appliedEvents,appliedTransfers};
  });
  const unknownAccounts=accountStates.filter(row=>!row.known),known=unknownAccounts.length===0&&accountStates.length>0,totalMinor=known?accountStates.reduce((sum,row)=>sum+row.balanceMinor,0):null,oldestObservation=known?accountStates.map(row=>day(row.observedAt)).sort()[0]:null;
  return{asOf,known,totalMinor,oldestObservation,maxAgeDays,accounts:accountStates,unknownAccounts,explanation:{rule:'fresh account-total truth + confirmed/bank facts after observation',unknownAccountIds:unknownAccounts.map(row=>row.id),staleAccountIds:unknownAccounts.filter(row=>row.reason==='stale_account_total').map(row=>row.id)}};
}
