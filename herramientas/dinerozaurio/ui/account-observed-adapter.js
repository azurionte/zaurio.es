(()=>{'use strict';
function install(){
  if(window.__DZ_ACCOUNT_OBSERVED_ADAPTER__)return;
  if(typeof openAccountBalanceEditor!=='function'||!window.DineroZaurioAccountingCore)return;
  window.__DZ_ACCOUNT_OBSERVED_ADAPTER__=true;
  const original=openAccountBalanceEditor;
  openAccountBalanceEditor=function(accountId){
    original(accountId);
    const saveButton=document.getElementById('saveOrganizationActualBalance');
    if(!saveButton)return;
    saveButton.onclick=()=>{
      const core=window.DineroZaurioAccountingCore;
      const summary=buildTodayFinancialSnapshot(new Date());
      const ym=summary.periodYm;
      const adjustment=normalizeMonthAdjustmentShape(state.monthAdjustments?.[ym]||{},ym);
      const key=core.KEYS.accountBalances;
      const current=adjustment.expenseOverrides?.[key];
      const observed=current&&typeof current==='object'&&!Array.isArray(current)?cloneData(current):{};
      observed[accountId]={
        amount:core.round2(document.getElementById('organizationActualBalance').value||0),
        observedAt:new Date().toISOString(),
        kind:'account_observed'
      };
      adjustment.expenseOverrides[key]=observed;
      state.monthAdjustments[ym]=adjustment;
      closeModal();
      touchState();
      if(typeof persistAndRefresh==='function')persistAndRefresh().catch(console.error);
      else if(typeof renderHomeDashboard==='function')renderHomeDashboard();
    };
  };
}
window.addEventListener('load',install,{once:true});
if(document.readyState==='complete')install();
})();
