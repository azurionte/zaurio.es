import { assertMinor } from './money.js';
import { assertIsoDay, inClosedRange } from './dates.js';

export function expectedTransferRequirement({rule,triggerEvent,upcomingEvents,destinationAccountBalanceMinor=0,destinationBalanceKnown=true,windowEnd}){
  if(!rule?.fromAccountId||!rule?.toAccountId)throw new TypeError('Transfer rule requires source and destination accounts');
  assertMinor(destinationAccountBalanceMinor,'destinationAccountBalanceMinor');assertIsoDay(triggerEvent.scheduledAt,'triggerEvent.scheduledAt');assertIsoDay(windowEnd,'windowEnd');
  let amountMinor=0,requiredMinor=0;
  if(rule.amountStrategy==='fixed'){amountMinor=Math.max(0,assertMinor(rule.amountMinor||0,'rule.amountMinor'));requiredMinor=amountMinor;}
  else if(rule.amountStrategy==='percentage'){const incomeMinor=Math.max(0,assertMinor(triggerEvent.amountMinor||0,'triggerEvent.amountMinor')),percentage=Number(rule.percentage||0);amountMinor=Math.max(0,Math.round(incomeMinor*percentage));requiredMinor=amountMinor;}
  else if(rule.amountStrategy==='fund_upcoming_obligations'){
    const obligations=(upcomingEvents||[]).filter(event=>event.accountId===rule.toAccountId&&event.amountMinor<0&&inClosedRange(event.scheduledAt,triggerEvent.scheduledAt,windowEnd));
    requiredMinor=obligations.reduce((sum,event)=>sum+Math.abs(assertMinor(event.amountMinor)),0);
    amountMinor=Math.max(0,requiredMinor-Math.max(0,destinationAccountBalanceMinor));
  }else throw new RangeError(`Unsupported amount strategy: ${rule.amountStrategy}`);
  return{transferRuleId:rule.id||null,fromAccountId:rule.fromAccountId,fromBucketId:rule.fromBucketId||null,toAccountId:rule.toAccountId,toBucketId:rule.toBucketId||null,amountMinor,requiredMinor,destinationOpeningBalanceMinor:destinationAccountBalanceMinor,destinationBalanceKnown:!!destinationBalanceKnown,expectedAt:triggerEvent.scheduledAt,reason:rule.amountStrategy};
}

export function detectMissingTransfers({expectedTransfers,actualTransfers,asOf}){
  assertIsoDay(asOf,'asOf');const actual=actualTransfers||[],missing=[];
  for(const expected of expectedTransfers||[]){
    if(expected.amountMinor<=0||expected.expectedAt>asOf)continue;
    const matching=actual.filter(observed=>['actual','confirmed'].includes(observed.status)&&observed.fromAccountId===expected.fromAccountId&&observed.toAccountId===expected.toAccountId).filter(observed=>{const observedDay=String(observed.occurredAt||observed.expectedAt||'').slice(0,10);return observedDay&&dayDistance(observedDay,expected.expectedAt)>=-1&&dayDistance(observedDay,expected.expectedAt)<=7;});
    const transferredMinor=matching.reduce((sum,row)=>sum+Math.max(0,assertMinor(Number(row.amountMinor||0))),0),missingMinor=Math.max(0,expected.amountMinor-transferredMinor);
    if(missingMinor>0)missing.push({...expected,amountMinor:missingMinor,expectedAmountMinor:expected.amountMinor,transferredMinor,matchingTransferIds:matching.map(row=>row.id),status:transferredMinor>0?'partially_funded':'missing'});
  }
  return missing;
}

export function explainFundingRisk({missingTransfers,upcomingEvents,asOf}){
  assertIsoDay(asOf,'asOf');
  return(missingTransfers||[]).map(transfer=>{const affected=(upcomingEvents||[]).filter(event=>event.accountId===transfer.toAccountId&&event.amountMinor<0&&event.scheduledAt>=asOf).sort((a,b)=>a.scheduledAt.localeCompare(b.scheduledAt));return{...transfer,affectedEvents:affected,firstRiskDate:affected[0]?.scheduledAt||null,affectedTotalMinor:affected.reduce((sum,event)=>sum+Math.abs(assertMinor(event.amountMinor)),0),truthGap:transfer.destinationBalanceKnown?null:'destination_balance_unknown'};});
}
function dayDistance(a,b){return Math.round((Date.parse(`${a}T12:00:00Z`)-Date.parse(`${b}T12:00:00Z`))/86400000);}
