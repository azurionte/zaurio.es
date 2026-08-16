(() => {
  'use strict';

  const MARKER='future-charge-editor-1';
  window.__DINEROZAURIO_FUTURE_CHARGE_EDITOR__=MARKER;

  const EXPENSE_TYPES=new Set(['Presupuesto','Gasto','Gasto extraordinario','Gasto puntual']);

  function runtimeReady(){
    try{
      return typeof buildTodayFinancialSnapshot==='function' &&
        typeof commitMonthAdjustmentGlobal==='function' &&
        typeof closeModal==='function' &&
        typeof state!=='undefined';
    }catch(_error){
      return false;
    }
  }

  function dayKey(value){
    if(window.DineroZaurioMathEngine?.dayKey) return window.DineroZaurioMathEngine.dayKey(value);
    const date=value instanceof Date?value:new Date(value);
    if(Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }

  function clone(value){
    return JSON.parse(JSON.stringify(value??null));
  }

  function findSource(event){
    if(!event?.itemId) return null;
    if(EXPENSE_TYPES.has(String(event.type||''))){
      const item=(state.expenses||[]).find(entry=>entry.id===event.itemId);
      return item?{kind:'expense',item}:null;
    }
    if(String(event.type||'')==='Deuda'){
      const item=(state.debts||[]).find(entry=>entry.id===event.itemId);
      return item?{kind:'debt',item}:null;
    }
    return null;
  }

  function escape(value){
    if(typeof escapeHtml==='function') return escapeHtml(String(value??''));
    return String(value??'').replace(/[&<>"']/g,char=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
    })[char]);
  }

  function openEditor(event){
    const source=findSource(event);
    if(!source) return;

    const originalDay=dayKey(event.date);
    const scheduledDay=String(event.scheduledDay||originalDay);
    const attributedYm=String(event.attributedYm||scheduledDay.slice(0,7));
    const amount=Math.abs(Number(event.amount||0));
    const recurring=source.kind==='expense' && ['weekly','biweekly'].includes(String(source.item.periodicity||''));
    const root=document.getElementById('modalRoot');
    if(!root) return;

    root.className='modalRoot';
    root.innerHTML=`<div class="modalCard">
      <div class="modalHead">
        <div><h3>Editar cargo futuro</h3><div class="sub">${escape(event.name||'Cargo')}</div></div>
        <button id="closeModalBtn" class="btn danger" type="button">Cerrar</button>
      </div>
      <div class="modalGrid">
        <div class="field"><label>Importe previsto</label><input id="futureChargeAmount" class="input" type="number" min="0" step="0.01" value="${amount.toFixed(2)}"></div>
        <div class="field"><label>Fecha prevista</label><input id="futureChargeDate" class="input" type="date" value="${originalDay}"></div>
      </div>
      <div class="sub" style="margin-top:12px">${recurring?'Este cambio afecta solo a esta ocurrencia. La recurrencia general no se modifica.':'Este cambio ajusta este cargo previsto en su mes de origen.'}</div>
      <div class="btnRow" style="margin-top:16px"><button id="saveFutureChargeBtn" class="btn primary" type="button">Guardar cambio</button></div>
    </div>`;

    document.getElementById('closeModalBtn').onclick=closeModal;
    document.getElementById('saveFutureChargeBtn').onclick=()=>{
      const nextAmount=Math.max(0,Number(document.getElementById('futureChargeAmount').value||0));
      const nextDate=document.getElementById('futureChargeDate').value||originalDay;

      if(source.kind==='expense'){
        commitMonthAdjustmentGlobal(attributedYm,nextAdj=>{
          nextAdj.expenseOverrides=nextAdj.expenseOverrides||{};
          const raw=nextAdj.expenseOverrides[source.item.id];
          const base=raw&&typeof raw==='object'&&!Array.isArray(raw)?clone(raw):{mode:'this_month',amount:Number(source.item.amount||0)};

          if(recurring){
            base.mode=base.mode||'this_month';
            if(!Object.prototype.hasOwnProperty.call(base,'amount')) base.amount=Number(source.item.amount||0);
            base.occurrenceOverrides={...(base.occurrenceOverrides||{}),[scheduledDay]:{amount:nextAmount,date:nextDate,editedAt:new Date().toISOString()}};
          }else{
            base.mode='this_month';
            base.amount=nextAmount;
            base.calendarDate=nextDate;
          }
          nextAdj.expenseOverrides[source.item.id]=base;
        },{reopenMonth:null});
      }else{
        commitMonthAdjustmentGlobal(attributedYm,nextAdj=>{
          nextAdj.debtOverrides=nextAdj.debtOverrides||{};
          const raw=nextAdj.debtOverrides[source.item.id];
          const base=raw&&typeof raw==='object'&&!Array.isArray(raw)?clone(raw):{};
          nextAdj.debtOverrides[source.item.id]={
            ...base,
            mode:'custom',
            scope:'this_month',
            amount:nextAmount,
            calendarDate:nextDate,
            source:base.source||'salary'
          };
        },{reopenMonth:null});
      }

      closeModal();
      setTimeout(()=>{
        try{ if(typeof renderForecast==='function') renderForecast(); }catch(_error){}
        try{ if(typeof renderHomeDashboard==='function') renderHomeDashboard(); }catch(_error){}
        try{ if(document.querySelector('.tab.active')?.dataset?.tab==='calendar'&&typeof renderCalendar==='function') renderCalendar(); }catch(_error){}
      },0);
    };
  }

  function enhanceHome(){
    let summary;
    try{ summary=buildTodayFinancialSnapshot(); }catch(_error){ return; }
    const charges=Array.isArray(summary?.upcomingCharges)?summary.upcomingCharges:[];
    const rows=Array.from(document.querySelectorAll('#homeDashboard .homeChargeList .homeCharge'));
    rows.forEach((row,index)=>{
      const event=charges[index];
      const source=findSource(event);
      if(!event||!source) return;
      if(row.querySelector('[data-edit-future-charge]')) return;

      const button=document.createElement('button');
      button.type='button';
      button.className='btn ghost';
      button.dataset.editFutureCharge='true';
      button.textContent='Editar';
      button.style.padding='7px 11px';
      button.style.marginLeft='8px';
      button.addEventListener('click',clickEvent=>{
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        openEditor(event);
      });
      row.appendChild(button);
    });
  }

  function install(){
    if(window.renderHomeDashboard?.__dzFutureChargeEditor) return;
    const original=window.renderHomeDashboard;
    if(typeof original!=='function') return;

    function wrappedRenderHomeDashboard(...args){
      const result=original.apply(this,args);
      setTimeout(enhanceHome,0);
      return result;
    }
    wrappedRenderHomeDashboard.__dzFutureChargeEditor=true;
    wrappedRenderHomeDashboard.__dzOriginal=original;
    window.renderHomeDashboard=wrappedRenderHomeDashboard;
    enhanceHome();
  }

  let attempts=0;
  const timer=setInterval(()=>{
    attempts+=1;
    if(runtimeReady()&&typeof window.renderHomeDashboard==='function'){
      clearInterval(timer);
      install();
    }else if(attempts>400){
      clearInterval(timer);
      console.error('DineroZaurio: no se pudo activar el editor de cargos futuros');
    }
  },25);
})();
