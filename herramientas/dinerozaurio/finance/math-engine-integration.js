(() => {
  'use strict';

  const MARKER='math-engine-integration-1';
  window.__DINEROZAURIO_MATH_ENGINE_INTEGRATION__=MARKER;

  function ready(){
    try{
      return !!window.DineroZaurioMathEngine && typeof window.buildCalendarEvents==='function' && typeof state!=='undefined';
    }catch(_error){
      return false;
    }
  }

  function install(){
    if(window.buildCalendarEvents?.__dzCanonicalMathEngine) return;

    const original=window.buildCalendarEvents;
    const engine=window.DineroZaurioMathEngine;

    function canonicalBuildCalendarEvents(startDate,horizon){
      const rawEvents=original(startDate,horizon);
      const startDay=engine.dayKey(startDate);
      const endDay=engine.addDays(startDay,Math.max(1,Number(horizon||1))-1);
      return engine.canonicalizeEvents({
        startDay,
        endDay,
        events:rawEvents,
        expenses:state.expenses||[],
        monthAdjustments:state.monthAdjustments||{}
      });
    }

    canonicalBuildCalendarEvents.__dzCanonicalMathEngine=true;
    canonicalBuildCalendarEvents.__dzOriginal=original;
    window.buildCalendarEvents=canonicalBuildCalendarEvents;

    window.__DINEROZAURIO_MATH_ENGINE__=engine.VERSION;
    window.__DINEROZAURIO_ACCOUNTING_AUTHORITY__=engine.VERSION;
    window.__DINEROZAURIO_ROUTING_AUTHORITY__=engine.VERSION;

    if(typeof window.renderForecast==='function') window.renderForecast();
    if(typeof window.renderHomeDashboard==='function') window.renderHomeDashboard();
    const activeTab=document.querySelector('.tab.active')?.dataset?.tab;
    if(activeTab==='calendar'&&typeof window.renderCalendar==='function') window.renderCalendar();
  }

  let attempts=0;
  const timer=setInterval(()=>{
    attempts+=1;
    if(ready()){
      clearInterval(timer);
      install();
    }else if(attempts>400){
      clearInterval(timer);
      console.error('DineroZaurio: math-engine no pudo conectarse al runtime');
    }
  },25);
})();
