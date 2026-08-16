(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.DineroZaurioMathEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='math-engine-1';
  const DAY_MS=86400000;
  const EXPENSE_TYPES=new Set(['Presupuesto','Gasto','Gasto extraordinario','Gasto puntual']);

  function toCents(value){
    const number=Number(value||0);
    if(!Number.isFinite(number)) return 0;
    return Math.round((number+Number.EPSILON)*100);
  }

  function fromCents(value){
    return Number((Number(value||0)/100).toFixed(2));
  }

  function round2(value){
    return fromCents(toCents(value));
  }

  function pad2(value){
    return String(value).padStart(2,'0');
  }

  function dayKey(value){
    if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date=value instanceof Date?value:new Date(value);
    if(Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${pad2(date.getMonth()+1)}-${pad2(date.getDate())}`;
  }

  function toLocalDate(value){
    const key=dayKey(value);
    return key?new Date(`${key}T12:00:00`):null;
  }

  function addDays(value,days){
    const date=toLocalDate(value);
    if(!date) return '';
    date.setDate(date.getDate()+Number(days||0));
    return dayKey(date);
  }

  function daysBetween(startDay,endDay){
    const start=toLocalDate(startDay),end=toLocalDate(endDay);
    if(!start||!end) return 0;
    return Math.round((end-start)/DAY_MS);
  }

  function monthKey(value){
    const key=dayKey(value);
    return key?key.slice(0,7):'';
  }

  function monthEndDay(ym){
    if(!/^\d{4}-\d{2}$/.test(String(ym||''))) return '';
    const [year,month]=ym.split('-').map(Number);
    return dayKey(new Date(year,month,0,12));
  }

  function inRange(value,startDay,endDay){
    const key=dayKey(value);
    return !!key&&key>=startDay&&key<=endDay;
  }

  function normalizePeriodicity(value){
    const raw=String(value||'monthly').trim().toLowerCase();
    const aliases={
      mensual:'monthly',semanal:'weekly',quincenal:'biweekly',bimensual:'bimonthly',
      trimestral:'quarterly',cuatrimestral:'four_monthly',anual:'yearly',puntual:'one_time'
    };
    return aliases[raw]||raw;
  }

  function isRecurringByDays(item){
    const periodicity=normalizePeriodicity(item?.periodicity);
    return periodicity==='weekly'||periodicity==='biweekly';
  }

  function intervalDaysFor(item){
    return normalizePeriodicity(item?.periodicity)==='weekly'?7:14;
  }

  function recurringAnchorDay(item){
    const explicit=String(item?.startDate||'');
    if(/^\d{4}-\d{2}-\d{2}$/.test(explicit)) return explicit;
    const ym=String(item?.startMonth||'');
    if(!/^\d{4}-\d{2}$/.test(ym)) return '';
    return `${ym}-${pad2(Math.max(1,Math.min(31,Number(item?.dueDay||1))))}`;
  }

  function baseRecurringDays(item,startDay,endDay){
    if(!isRecurringByDays(item)||!startDay||!endDay||endDay<startDay) return [];
    const anchor=recurringAnchorDay(item);
    if(!anchor) return [];
    const firstCharge=addDays(anchor,-Math.max(0,Number(item?.chargeLeadDays||0)));
    if(!firstCharge) return [];
    const interval=intervalDaysFor(item);
    let cursor=firstCharge;
    let safety=0;
    while(cursor<startDay&&safety<5000){
      cursor=addDays(cursor,interval);
      safety+=1;
    }
    const out=[];
    const firstAllowed=String(item?.startMonth||anchor.slice(0,7));
    const lastAllowed=String(item?.endMonth||'');
    while(cursor&&cursor<=endDay&&safety<10000){
      const ym=monthKey(cursor);
      if((!firstAllowed||ym>=firstAllowed)&&(!lastAllowed||ym<=lastAllowed)) out.push(cursor);
      cursor=addDays(cursor,interval);
      safety+=1;
    }
    return out;
  }

  function normalizeOverride(raw){
    if(raw===undefined||raw===null) return null;
    if(raw&&typeof raw==='object'&&!Array.isArray(raw)){
      const mode=['this_month','from_here','remove_from_here'].includes(raw.mode)?raw.mode:'this_month';
      return {...raw,mode,amount:mode==='remove_from_here'?0:Number(raw.amount||0)};
    }
    return {mode:'this_month',amount:Number(raw||0)};
  }

  function recurringOverrideForMonth(monthAdjustments,itemId,ym){
    const keys=Object.keys(monthAdjustments||{}).filter(key=>/^\d{4}-\d{2}$/.test(key)&&key<=ym).sort();
    let persistent=null;
    for(const key of keys){
      const raw=normalizeOverride(monthAdjustments?.[key]?.expenseOverrides?.[itemId]);
      if(!raw) continue;
      if(key===ym&&raw.mode==='this_month') return raw;
      if(raw.mode==='from_here'||raw.mode==='remove_from_here') persistent=raw;
    }
    return persistent;
  }

  function isBudgetExpense(item){
    if(String(item?.calendarBehavior||'')==='budget') return true;
    const normalized=String(item?.name||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    return /comida|ocio y caprichos/.test(normalized)||/iberdrola.*reserva|reserva.*luz/.test(normalized);
  }

  function recurringOccurrences(item,startDay,endDay,monthAdjustments={}){
    const baseDays=baseRecurringDays(item,startDay,endDay);
    const occurrences=[];
    for(const scheduledDay of baseDays){
      const ym=monthKey(scheduledDay);
      const override=recurringOverrideForMonth(monthAdjustments,item.id,ym);
      if(override?.mode==='remove_from_here') continue;

      const replacement=override?.dateReplacements?.[scheduledDay];
      const confirmation=override?.actualConfirmations?.[scheduledDay];
      const actualDay=dayKey(confirmation?.actualDate||replacement||scheduledDay)||scheduledDay;
      if(!inRange(actualDay,startDay,endDay)) continue;

      let amount=Number(item?.amount||0);
      if(override&&override.mode!=='remove_from_here'&&Object.prototype.hasOwnProperty.call(override,'amount')) amount=Number(override.amount||0);
      if(confirmation&&Object.prototype.hasOwnProperty.call(confirmation,'amount')) amount=Number(confirmation.amount||0);
      if(!Number.isFinite(amount)||Math.abs(amount)<0.005) continue;

      occurrences.push({
        scheduledDay,
        day:actualDay,
        attributedYm:ym,
        amount:round2(amount),
        confirmed:!!confirmation
      });
    }
    return occurrences;
  }

  function eventKey(event){
    return [dayKey(event?.date),String(event?.type||''),String(event?.itemId||''),String(event?.name||''),toCents(event?.amount||0)].join('|');
  }

  function canonicalizeEvents(options={}){
    const startDay=dayKey(options.startDay||options.startDate);
    const endDay=dayKey(options.endDay||options.endDate);
    if(!startDay||!endDay||endDay<startDay) return [];

    const expenses=Array.isArray(options.expenses)?options.expenses:[];
    const monthAdjustments=options.monthAdjustments||{};
    const recurringIds=new Set(expenses.filter(isRecurringByDays).map(item=>item.id));
    const kept=(options.events||[]).filter(event=>{
      if(recurringIds.has(event?.itemId)) return false;
      return inRange(event?.date,startDay,endDay);
    });

    const regenerated=[];
    for(const item of expenses){
      if(!isRecurringByDays(item)) continue;
      const budget=isBudgetExpense(item);
      const confidence=String(item?.calendarConfidence||'estimated');
      const note=String(item?.calendarNote||'')||`Se repite cada ${intervalDaysFor(item)} días`;
      for(const occurrence of recurringOccurrences(item,startDay,endDay,monthAdjustments)){
        regenerated.push({
          date:toLocalDate(occurrence.day),
          itemId:item.id,
          attributedYm:occurrence.attributedYm,
          type:budget?'Presupuesto':'Gasto',
          name:item.name||'Gasto',
          amount:-Math.abs(occurrence.amount),
          confidence:occurrence.confirmed?'confirmada':confidence,
          note,
          canonicalOccurrence:true,
          scheduledDay:occurrence.scheduledDay
        });
      }
    }

    const deduped=new Map();
    for(const event of [...kept,...regenerated]) deduped.set(eventKey(event),event);
    return Array.from(deduped.values()).sort((a,b)=>{
      const dayCompare=dayKey(a.date).localeCompare(dayKey(b.date));
      if(dayCompare) return dayCompare;
      return toCents(b.amount)-toCents(a.amount);
    });
  }

  function summarizeEvents(events,startDay,endDay){
    const selected=(events||[]).filter(event=>inRange(event?.date,startDay,endDay));
    let incomeCents=0,expenseCents=0,debtCents=0,savingsCents=0;
    const groupedExpenses=new Map();

    for(const event of selected){
      const amountCents=toCents(event?.amount||0);
      const type=String(event?.type||'');
      if(amountCents>0) incomeCents+=amountCents;
      if(EXPENSE_TYPES.has(type)){
        const absolute=Math.abs(amountCents);
        expenseCents+=absolute;
        const name=String(event?.name||'Gasto');
        groupedExpenses.set(name,(groupedExpenses.get(name)||0)+absolute);
      }else if(type==='Deuda'){
        debtCents+=Math.abs(amountCents);
      }else if(type==='Ahorro'){
        savingsCents+=Math.abs(amountCents);
      }
    }

    const netCents=incomeCents-expenseCents-debtCents-savingsCents;
    return {
      income:fromCents(incomeCents),
      expense:fromCents(expenseCents),
      debt:fromCents(debtCents),
      savings:fromCents(savingsCents),
      net:fromCents(netCents),
      expenseItems:Array.from(groupedExpenses.entries()).map(([name,cents])=>({name,monthAmount:fromCents(cents)})),
      events:selected
    };
  }

  function buildPeriodSnapshot(options={}){
    const startDay=dayKey(options.startDay||options.startDate);
    const endDay=dayKey(options.endDay||options.endDate);
    const events=canonicalizeEvents({...options,startDay,endDay});
    return {...summarizeEvents(events,startDay,endDay),startDay,endDay};
  }

  return {
    VERSION,
    DAY_MS,
    EXPENSE_TYPES,
    toCents,
    fromCents,
    round2,
    dayKey,
    toLocalDate,
    addDays,
    daysBetween,
    monthKey,
    monthEndDay,
    inRange,
    normalizePeriodicity,
    isRecurringByDays,
    baseRecurringDays,
    recurringOverrideForMonth,
    recurringOccurrences,
    canonicalizeEvents,
    summarizeEvents,
    buildPeriodSnapshot
  };
});
