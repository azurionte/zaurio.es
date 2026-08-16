(()=>{
  'use strict';

  const STORAGE_KEY='dinerozaurio_step1_state';
  const MODE_KEY='dinerozaurio_budget_period_mode_v1';
  const ROLLOVER_KEY='dinerozaurio_period_rollover_v1';
  const VERSION='period-rollover-1';

  function ymNow(){
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  }
  function addMonths(ym,delta){
    const [y,m]=String(ym).split('-').map(Number);
    const d=new Date(y,m-1+Number(delta||0),1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  }
  function monthDiff(fromYm,toYm){
    const [fy,fm]=String(fromYm).split('-').map(Number);
    const [ty,tm]=String(toYm).split('-').map(Number);
    return (ty-fy)*12+(tm-fm);
  }
  function activePeriod(){
    const mode=localStorage.getItem(MODE_KEY)==='calendar_month'?'calendar_month':'salary_cycle';
    if(mode==='salary_cycle' && typeof window.budgetPeriodForDate==='function'){
      try{return window.budgetPeriodForDate(new Date());}catch(_err){}
    }
    return ymNow();
  }
  function readLocal(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch(_err){return {};}
  }
  function writeLocal(next){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(next));
  }
  function rollForecastWindow(period){
    const saved=readLocal();
    const forecast=saved.forecast&&typeof saved.forecast==='object'?{...saved.forecast}:{};
    const from=forecast.from||saved.defaultStartMonth||period;
    if(!/^\d{4}-\d{2}$/.test(from) || from>=period) return false;
    const oldTo=/^\d{4}-\d{2}$/.test(forecast.to||'')?forecast.to:addMonths(from,12);
    const horizon=Math.max(0,monthDiff(from,oldTo));
    forecast.from=period;
    forecast.to=addMonths(period,horizon||12);
    saved.forecast=forecast;
    writeLocal(saved);
    if(typeof window.loadLocal==='function') window.loadLocal();
    return true;
  }
  function refreshVisiblePeriod(period){
    const from=document.getElementById('forecastFrom');
    const to=document.getElementById('forecastTo');
    const saved=readLocal();
    if(from && saved.forecast?.from) from.value=saved.forecast.from;
    if(to && saved.forecast?.to) to.value=saved.forecast.to;
    if(typeof window.renderForecast==='function') window.renderForecast();
    if(typeof window.renderCurrentMonthPanel==='function') window.renderCurrentMonthPanel();
    if(typeof window.renderHomeDashboard==='function') window.renderHomeDashboard();

    // KPIs must follow the active period, not the historical plan start month.
    if(typeof window.buildForecastMonthSnapshot==='function'){
      try{
        const snapshot=window.buildForecastMonthSnapshot(period);
        const set=(id,value)=>{const el=document.getElementById(id);if(el&&typeof window.euros==='function')el.textContent=window.euros(Number(value||0));};
        set('kpiIncome',snapshot.income);
        set('kpiExpense',snapshot.expense);
        set('kpiDebt',snapshot.debt);
        set('kpiSavings',snapshot.savings);
      }catch(_err){}
    }
  }
  function install(){
    if(window.__DZ_PERIOD_ROLLOVER__===VERSION) return;
    const period=activePeriod();
    const last=localStorage.getItem(ROLLOVER_KEY)||'';
    const changed=last!==period?rollForecastWindow(period):false;
    localStorage.setItem(ROLLOVER_KEY,period);
    refreshVisiblePeriod(period);
    window.__DZ_PERIOD_ROLLOVER__=VERSION;
    window.__DZ_PERIOD_ROLLOVER_STATUS__={period,changed,at:new Date().toISOString()};
  }
  function waitForApp(attempt=0){
    if(typeof window.renderForecast==='function' && document.getElementById('forecastFrom')){
      install();
      return;
    }
    if(attempt<200) setTimeout(()=>waitForApp(attempt+1),50);
  }

  if(document.readyState==='complete') waitForApp();
  else window.addEventListener('load',()=>waitForApp(),{once:true});
})();
