import { assertMinor } from './money.js';
import { assertIsoDay, inClosedRange } from './dates.js';
import { generateOccurrences } from './recurrence-engine.js';

function isBalanceDriven(debt){return debt.debtType==='revolving'||debt.balanceKnown===true||debt.metadata?.balanceKnown===true;}
function versionFor(versions,schedule,day){return(versions||[]).filter(row=>row.sourceType==='debt_schedule'&&row.sourceId===schedule.id&&row.effectiveFrom<=day).sort((a,b)=>b.effectiveFrom.localeCompare(a.effectiveFrom))[0]||null;}
function paymentAmountFor(debt,schedule,occurrenceIndex,balanceMinor,version){const configured=version?.amountMinor!=null?version.amountMinor:schedule.paymentAmountMinor;const scheduled=Math.abs(assertMinor(Number(configured||0),'schedule.paymentAmountMinor'));if(schedule.remainingInstallments!=null&&occurrenceIndex>=Number(schedule.remainingInstallments))return 0;if(isBalanceDriven(debt)){if(balanceMinor<=0)return 0;return Math.min(scheduled,balanceMinor);}return scheduled;}
function adjustmentFor(adjustments,debtId,day){return(adjustments||[]).filter(row=>row.debtId===debtId&&row.effectiveDate===day).at(-1)||null;}

export function generateDebtEvents({debt,schedule,recurrenceRule,adjustments=[],ruleVersions=[],from,to}){
  assertIsoDay(from,'from');assertIsoDay(to,'to');if(!debt||!schedule)throw new TypeError('debt and schedule are required');if(debt.status==='settled'||schedule.enabled===false)return[];
  const occurrences=generateOccurrences(recurrenceRule,{from,to});let balance=Math.max(0,assertMinor(Number(debt.currentBalanceMinor||0),'debt.currentBalanceMinor'));const balanceDriven=isBalanceDriven(debt),rate=Math.max(0,Number(debt.annualInterestRate||0)),monthlyRate=rate/100/12,result=[];
  occurrences.forEach((occurrence,index)=>{
    if(balanceDriven&&balance<=0)return;
    const version=versionFor(ruleVersions,schedule,occurrence.scheduledAt);if(version?.enabled===false)return;
    const adjustment=adjustmentFor(adjustments,debt.id,occurrence.scheduledAt);if(adjustment?.adjustmentType==='skip_payment')return;
    let payment=paymentAmountFor(debt,schedule,index,balance,version);
    if(adjustment?.adjustmentType==='custom_payment'&&adjustment.amountMinor!=null){const custom=Math.abs(assertMinor(Number(adjustment.amountMinor)));payment=balanceDriven?Math.min(balance,custom):custom;}
    if(adjustment?.adjustmentType==='extra_payment'&&adjustment.amountMinor!=null){const extra=Math.abs(assertMinor(Number(adjustment.amountMinor)));payment=balanceDriven?Math.min(balance,payment+extra):payment+extra;}
    if(adjustment?.adjustmentType==='payoff'){const feePct=Math.max(0,Number(schedule.payoffFeePercent||0));if(!balanceDriven)throw new Error('Cannot calculate payoff for a debt without a known balance');payment=balance+Math.round(balance*feePct/100);}
    if(payment<=0)return;
    let interestMinor=0;if(debt.debtType==='revolving'&&monthlyRate>0)interestMinor=Math.round(balance*monthlyRate);
    const principalMinor=balanceDriven?Math.max(0,Math.min(balance,payment-interestMinor)):null,actualPayment=balanceDriven?Math.max(0,Math.min(payment,balance+interestMinor)):payment,balanceAfterMinor=balanceDriven?Math.max(0,balance-principalMinor):null;
    result.push({id:`expected:debt:${debt.id}:${occurrence.scheduledAt}`,sourceType:'debt',sourceId:debt.id,eventType:'debt_payment',name:debt.name,originalScheduledAt:occurrence.scheduledAt,scheduledAt:occurrence.scheduledAt,serviceDate:occurrence.serviceDate,occurredAt:null,amountMinor:-actualPayment,currency:debt.currency||'EUR',accountId:debt.paymentAccountId||null,bucketId:null,status:'expected',evidenceLevel:'forecast',metadata:{interestMinor,principalMinor,balanceKnown:balanceDriven,balanceBeforeMinor:balanceDriven?balance:null,balanceAfterMinor,adjustmentId:adjustment?.id||null,ruleVersionId:version?.id||null}});
    if(balanceDriven)balance=balanceAfterMinor;
  });
  return result.filter(event=>inClosedRange(event.scheduledAt,from,to));
}

export function payoffQuote({debt,schedule}){if(!isBalanceDriven(debt))throw new Error('Cannot calculate payoff for a debt without a known balance');const balanceMinor=Math.max(0,assertMinor(Number(debt.currentBalanceMinor||0),'debt.currentBalanceMinor')),feePercent=Math.max(0,Number(schedule?.payoffFeePercent||0)),feeMinor=Math.round(balanceMinor*feePercent/100);return{balanceMinor,feeMinor,totalMinor:balanceMinor+feeMinor};}
export function applyConfirmedDebtPayment({debt,actualPaymentMinor,interestMinor=0}){if(!isBalanceDriven(debt))return debt;const paid=Math.abs(assertMinor(Number(actualPaymentMinor),'actualPaymentMinor')),interest=Math.max(0,assertMinor(Number(interestMinor),'interestMinor')),principal=Math.max(0,paid-interest),nextBalance=Math.max(0,Number(debt.currentBalanceMinor||0)-principal);return{...debt,currentBalanceMinor:nextBalance,status:nextBalance===0?'settled':debt.status};}
