(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.DineroZaurioAccountingCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='accounting-core-2';
  const DEFAULT_TIME_ZONE='Europe/Madrid';
  const KEYS={
    folderTransfers:'__folderTransfers',
    generalTransfers:'__accountGeneralTransfers',
    generalBalances:'__accountGeneralBalances',
    savingsConfirmations:'__savingsTransferConfirmations'
  };
  const ORDER={period_open:0,transfer:10,event:20,observed:30};
  const FLOW_TYPES=new Set(['Gasto','Deuda','Ingreso','Ingreso extraordinario']);

  function toCents(value){
    const number=Number(value||0);
    if(!Number.isFinite(number)) return 0;
    return Math.round((number+Number.EPSILON)*100);
  }
  function fromCents(value){ return Number((Number(value||0)/100).toFixed(2)); }
  function round2(value){ return fromCents(toCents(value)); }
  function sumCents(items,getter){ return (items||[]).reduce((sum,item)=>sum+toCents(getter(item)),0); }

  function toDate(value){
    if(!value) return null;
    const date=value instanceof Date?new Date(value):new Date(value);
    return Number.isNaN(date.getTime())?null:date;
  }
  function endOfDay(value){
    const date=toDate(value)||new Date();
    date.setHours(23,59,59,999);
    return date;
  }
  function monthStart(ym){
    const match=String(ym||'').match(/^(\d{4})-(\d{2})$/);
    return match?new Date(Number(match[1]),Number(match[2])-1,1,0,0,0,0):new Date(0);
  }
  function dayKey(value,timeZone=DEFAULT_TIME_ZONE){
    if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date=toDate(value); if(!date) return '';
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    const get=type=>parts.find(part=>part.type===type)?.value||'';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function effectiveAt(value,kind='event',timeZone=DEFAULT_TIME_ZONE){
    return {day:dayKey(value,timeZone),order:ORDER[kind]??ORDER.event};
  }
  function compareEffective(a,b){
    if(a.day!==b.day) return a.day<b.day?-1:1;
    return a.order-b.order;
  }
  function afterEffective(value,kind,anchorValue,anchorKind,timeZone){
    const current=effectiveAt(value,kind,timeZone);
    const anchor=effectiveAt(anchorValue,anchorKind,timeZone);
    return !!current.day&&!!anchor.day&&compareEffective(current,anchor)>0;
  }

  function specialMap(monthAdjustments,ym,key){
    const raw=monthAdjustments?.[ym]?.expenseOverrides?.[key];
    return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  }
  function assignmentFor(event,organization){
    if(!event?.itemId) return {accountId:organization.salaryAccountId,folderId:''};
    const assigned=organization.assignments?.[event.itemId];
    if(!assigned?.accountId) return {accountId:organization.salaryAccountId,folderId:''};
    return {accountId:assigned.accountId,folderId:assigned.folderId||''};
  }
  function isFinancialFlow(event){ return FLOW_TYPES.has(String(event?.type||'')); }
  function signedCents(event){ return toCents(event?.amount||0); }
  function eventDate(event){ return event?.effectiveAt||event?.date||null; }
  function isSettled(event,asOf,timeZone){
    const day=dayKey(eventDate(event),timeZone);
    return !!day&&day<=dayKey(asOf,timeZone);
  }
  function routedEvents(events,organization,accountId,folderId='',predicate){
    return (events||[]).filter(event=>{
      if(!isFinancialFlow(event)) return false;
      const assigned=assignmentFor(event,organization);
      if(assigned.accountId!==accountId||(assigned.folderId||'')!==(folderId||'')) return false;
      return predicate?predicate(event):true;
    });
  }

  function transferEntries(record){
    if(!record||typeof record!=='object') return [];
    if(Array.isArray(record.entries)&&record.entries.length){
      return record.entries.map(entry=>({amount:round2(entry.amount),confirmedAt:entry.confirmedAt||record.confirmedAt||''}));
    }
    return toCents(record.amount)?[{amount:round2(record.amount),confirmedAt:record.confirmedAt||''}]:[];
  }
  function confirmedTransferCents(record,asOf,timeZone){
    const asOfDay=dayKey(asOf,timeZone);
    return transferEntries(record).filter(entry=>{
      const day=dayKey(entry.confirmedAt||asOf,timeZone);
      return !day||day<=asOfDay;
    }).reduce((sum,entry)=>sum+toCents(entry.amount),0);
  }
  function transferCentsAfter(record,anchorAt,asOf,timeZone){
    return transferEntries(record).filter(entry=>{
      const at=entry.confirmedAt||asOf;
      return afterEffective(at,'transfer',anchorAt,'observed',timeZone)&&dayKey(at,timeZone)<=dayKey(asOf,timeZone);
    }).reduce((sum,entry)=>sum+toCents(entry.amount),0);
  }

  function resolveGeneralBucket(input,account){
    const {monthAdjustments,periodYm,events,futureEvents,organization,asOf,timeZone}=input;
    const observedRecord=specialMap(monthAdjustments,periodYm,KEYS.generalBalances)[account.id]||{};
    const transferRecord=specialMap(monthAdjustments,periodYm,KEYS.generalTransfers)[account.id]||{};
    const observedCents=toCents(observedRecord.amount||0);
    const transferredCents=confirmedTransferCents(transferRecord,asOf,timeZone);
    const settled=routedEvents(events,organization,account.id,'',event=>isSettled(event,asOf,timeZone));
    const settledNetCents=settled.reduce((sum,event)=>sum+signedCents(event),0);
    const future=routedEvents(futureEvents,organization,account.id,'',event=>!isSettled(event,asOf,timeZone));
    const futureNetCents=future.reduce((sum,event)=>sum+signedCents(event),0);
    const currentCents=observedCents+transferredCents+settledNetCents;
    return {
      id:`${account.id}|`,accountId:account.id,folderId:'',label:'Disponible sin carpeta',
      base:fromCents(observedCents+transferredCents),current:fromCents(currentCents),projected:fromCents(currentCents+futureNetCents),
      observed:fromCents(observedCents),transferred:fromCents(transferredCents),settledNet:fromCents(settledNetCents),futureNet:fromCents(futureNetCents),
      settledEvents:settled,futureEvents:future
    };
  }

  function resolveFolderBucket(input,account,folder){
    const {monthAdjustments,periodYm,events,futureEvents,organization,asOf,timeZone}=input;
    const key=`${account.id}|${folder.id}`;
    const transferRecord=specialMap(monthAdjustments,periodYm,KEYS.folderTransfers)[key]||{};
    const settledAll=routedEvents(events,organization,account.id,folder.id,event=>isSettled(event,asOf,timeZone));
    const future=routedEvents(futureEvents,organization,account.id,folder.id,event=>!isSettled(event,asOf,timeZone));
    const hasObserved=folder.actualBalance!==null&&folder.actualBalance!==undefined;
    let currentCents,settled;
    const transferTotalCents=confirmedTransferCents(transferRecord,asOf,timeZone);
    if(hasObserved){
      const observedAt=folder.balanceUpdatedAt||asOf;
      settled=settledAll.filter(event=>afterEffective(eventDate(event),'event',observedAt,'observed',timeZone));
      const transfersAfter=transferCentsAfter(transferRecord,observedAt,asOf,timeZone);
      currentCents=toCents(folder.actualBalance)+transfersAfter+settled.reduce((sum,event)=>sum+signedCents(event),0);
    }else{
      settled=settledAll;
      currentCents=transferTotalCents+settled.reduce((sum,event)=>sum+signedCents(event),0);
    }
    const futureNetCents=future.reduce((sum,event)=>sum+signedCents(event),0);
    return {
      id:key,accountId:account.id,folderId:folder.id,label:folder.name||'Carpeta',
      base:hasObserved?round2(folder.actualBalance):fromCents(transferTotalCents),current:fromCents(currentCents),projected:fromCents(currentCents+futureNetCents),
      observed:hasObserved?round2(folder.actualBalance):null,transferred:fromCents(transferTotalCents),
      settledNet:fromCents(settled.reduce((sum,event)=>sum+signedCents(event),0)),futureNet:fromCents(futureNetCents),settledEvents:settled,futureEvents:future
    };
  }

  function empiricalAdjustmentCents(input,secondaryAccounts){
    const {monthAdjustments,periodYm,events,organization,asOf,timeZone}=input;
    const observedGeneral=specialMap(monthAdjustments,periodYm,KEYS.generalBalances);
    const folderTransfers=specialMap(monthAdjustments,periodYm,KEYS.folderTransfers);
    let cents=0;
    for(const account of secondaryAccounts){
      cents+=toCents(observedGeneral[account.id]?.amount||0);
      for(const folder of account.folders||[]){
        if(folder.actualBalance===null||folder.actualBalance===undefined) continue;
        const key=`${account.id}|${folder.id}`;
        const transfer=confirmedTransferCents(folderTransfers[key],asOf,timeZone);
        const observedAt=folder.balanceUpdatedAt||asOf;
        const flowsBeforeObservation=routedEvents(events,organization,account.id,folder.id,event=>{
          if(!isSettled(event,asOf,timeZone)) return false;
          const eventPoint=effectiveAt(eventDate(event),'event',timeZone);
          const observedPoint=effectiveAt(observedAt,'observed',timeZone);
          return compareEffective(eventPoint,observedPoint)<=0;
        }).reduce((sum,event)=>sum+signedCents(event),0);
        const expected=transfer+flowsBeforeObservation;
        cents+=toCents(folder.actualBalance)-expected;
      }
    }
    return cents;
  }

  function savingsReservationCorrectionCents(events,asOf,timeZone){
    return (events||[]).filter(event=>String(event?.type||'')==='Ahorro'&&isSettled(event,asOf,timeZone))
      .reduce((sum,event)=>sum+Math.max(0,-signedCents(event)),0);
  }

  function buildDiagnostics(model){
    return {
      version:model.version,periodYm:model.periodYm,total:model.total,splitDiff:model.splitDiff,
      accounts:[model.primary,...model.secondary].filter(Boolean).map(entry=>({
        accountId:entry.account.id,name:entry.account.name,current:entry.current,projected:entry.projected,
        buckets:(entry.buckets||[]).map(bucket=>({id:bucket.id,label:bucket.label,current:bucket.current,projected:bucket.projected,observed:bucket.observed,transferred:bucket.transferred,settledNet:bucket.settledNet,futureNet:bucket.futureNet,settledCharges:bucket.settledEvents.map(event=>({itemId:event.itemId,name:event.name,amount:round2(event.amount),date:dayKey(eventDate(event),model.timeZone)})),futureCharges:bucket.futureEvents.map(event=>({itemId:event.itemId,name:event.name,amount:round2(event.amount),date:dayKey(eventDate(event),model.timeZone)}))}))
      })),
      internalTransfers:model.internalTransfers,observedAdjustment:model.empiricalAdjustment
    };
  }

  function resolveAccountState(options){
    const organization=options.organization||{accounts:[],assignments:{},salaryAccountId:''};
    const periodYm=options.periodYm||'';
    const timeZone=options.timeZone||DEFAULT_TIME_ZONE;
    const asOf=endOfDay(options.asOf||new Date());
    const events=options.events||[];
    const futureEvents=options.futureEvents||[];
    const monthAdjustments=options.monthAdjustments||{};
    const accounts=organization.accounts||[];
    const salaryAccount=accounts.find(account=>account.id===organization.salaryAccountId)||accounts[0]||null;
    const secondaryAccounts=accounts.filter(account=>!salaryAccount||account.id!==salaryAccount.id);
    const input={organization,periodYm,asOf,events,futureEvents,monthAdjustments,timeZone};
    const secondary=secondaryAccounts.map(account=>{
      const general=resolveGeneralBucket(input,account);
      const folders=(account.folders||[]).map(folder=>resolveFolderBucket(input,account,folder));
      const buckets=[general,...folders];
      const current=fromCents(sumCents(buckets,bucket=>bucket.current));
      const projected=fromCents(sumCents(buckets,bucket=>bucket.projected));
      return {account,current,projected,general,folders,buckets};
    });
    const adjustmentCents=empiricalAdjustmentCents(input,secondaryAccounts);
    const savingsCorrectionCents=savingsReservationCorrectionCents(events,asOf,timeZone);
    const totalCents=toCents(options.potentialNow||0)+adjustmentCents+savingsCorrectionCents;
    const secondaryCents=sumCents(secondary,entry=>entry.current);
    const primaryCurrentCents=totalCents-secondaryCents;
    const primaryFutureCents=salaryAccount?routedEvents(futureEvents,organization,salaryAccount.id,'',event=>!isSettled(event,asOf,timeZone)).reduce((sum,event)=>sum+signedCents(event),0):0;
    const primary=salaryAccount?{account:salaryAccount,current:fromCents(primaryCurrentCents),projected:fromCents(primaryCurrentCents+primaryFutureCents),buckets:[]}:null;
    const internalTransfers=[];
    for(const account of secondaryAccounts){
      const general=specialMap(monthAdjustments,periodYm,KEYS.generalTransfers)[account.id];
      transferEntries(general).forEach(entry=>internalTransfers.push({toAccountId:account.id,folderId:'',amount:round2(entry.amount),confirmedAt:entry.confirmedAt||''}));
      for(const folder of account.folders||[]){
        const record=specialMap(monthAdjustments,periodYm,KEYS.folderTransfers)[`${account.id}|${folder.id}`];
        transferEntries(record).forEach(entry=>internalTransfers.push({toAccountId:account.id,folderId:folder.id,amount:round2(entry.amount),confirmedAt:entry.confirmedAt||''}));
      }
    }
    const model={version:VERSION,timeZone,periodYm,asOf,total:fromCents(totalCents),primary,secondary,secondaryTotal:fromCents(secondaryCents),empiricalAdjustment:fromCents(adjustmentCents),savingsReservationCorrection:fromCents(savingsCorrectionCents),splitDiff:fromCents(Math.abs(totalCents-(primaryCurrentCents+secondaryCents))),internalTransfers};
    model.diagnostics=buildDiagnostics(model);
    return model;
  }

  function recurringDatesForMonth(item,ym){
    const periodicity=String(item?.periodicity||'monthly');
    if(periodicity!=='weekly'&&periodicity!=='biweekly') return [];
    const intervalDays=periodicity==='weekly'?7:14;
    const fallback=`${item.startMonth||ym}-${String(item.dueDay||1).padStart(2,'0')}`;
    const anchorText=/^\d{4}-\d{2}-\d{2}$/.test(String(item.startDate||''))?item.startDate:fallback;
    let cursor=new Date(`${anchorText}T12:00:00`); if(Number.isNaN(cursor.getTime())) return [];
    const [year,month]=String(ym).split('-').map(Number);
    const start=new Date(year,month-1,1,12),end=new Date(year,month,0,12);
    while(cursor<start) cursor=new Date(cursor.getFullYear(),cursor.getMonth(),cursor.getDate()+intervalDays,12);
    const dates=[];
    while(cursor<=end){
      const charge=new Date(cursor); charge.setDate(charge.getDate()-Math.max(0,Number(item.chargeLeadDays||0)));
      dates.push(`${charge.getFullYear()}-${String(charge.getMonth()+1).padStart(2,'0')}-${String(charge.getDate()).padStart(2,'0')}`);
      cursor=new Date(cursor.getFullYear(),cursor.getMonth(),cursor.getDate()+intervalDays,12);
    }
    return dates;
  }
  function debtActiveForMonth(debt,ym,settledMonth){
    const paid=String(settledMonth||debt?.settledMonth||'');
    return !paid||ym<=paid;
  }
  function savingsStage(goalId,organization,monthAdjustments,ym){
    const assignment=organization?.assignments?.[goalId];
    const confirmation=specialMap(monthAdjustments,ym,KEYS.savingsConfirmations)[goalId];
    if(confirmation?.moved) return 'movement_confirmed';
    if(assignment?.accountId&&assignment?.folderId) return 'destination_defined';
    return 'planned';
  }

  return {VERSION,DEFAULT_TIME_ZONE,KEYS,ORDER,toCents,fromCents,round2,dayKey,effectiveAt,compareEffective,assignmentFor,transferEntries,resolveAccountState,recurringDatesForMonth,debtActiveForMonth,savingsStage};
});