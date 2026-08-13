(() => {
  'use strict';
  const VERSION='2.7-accounting-invariants';
  const FOLDER='__folderTransfers';
  const GENERAL='__accountGeneralTransfers';
  const OBSERVED='__accountGeneralBalances';

  function install(){
    if(window.__DZ_ACCOUNTING_INVARIANTS__===VERSION) return;
    if(typeof renderHomeDashboard!=='function'||typeof buildTodayFinancialSnapshot!=='function'||typeof normalizeMoneyOrganization!=='function'){
      setTimeout(install,60);return;
    }
    window.__DZ_ACCOUNTING_INVARIANTS__=VERSION;
    const previous=renderHomeDashboard;
    renderHomeDashboard=function(){
      previous();
      setTimeout(()=>{try{applyInvariantAccounting();}catch(error){console.error('DineroZaurio accounting invariant error',error);}},0);
    };
    if(document.getElementById('homeDashboard')) renderHomeDashboard();
  }

  function mapFor(ym,key){
    const raw=state.monthAdjustments?.[ym]?.expenseOverrides?.[key];
    return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  }

  function assignmentFor(event,organization){
    if(!event?.itemId) return {accountId:organization.salaryAccountId,folderId:''};
    return organization.assignments?.[event.itemId]||{accountId:organization.salaryAccountId,folderId:''};
  }

  function folderTransfer(accountId,folderId,ym){
    return Number(mapFor(ym,FOLDER)[`${accountId}|${folderId}`]?.amount||0);
  }

  function secondaryBalance(account,ym){
    const generalObserved=Number(mapFor(ym,OBSERVED)[account.id]?.amount||0);
    const generalMoved=Number(mapFor(ym,GENERAL)[account.id]?.amount||0);
    const folders=(account.folders||[]).reduce((sum,folder)=>{
      const current=folder.actualBalance!==null&&folder.actualBalance!==undefined
        ? Number(folder.actualBalance||0)
        : folderTransfer(account.id,folder.id,ym);
      return sum+current;
    },0);
    return generalObserved+generalMoved+folders;
  }

  function empiricalAdjustment(account,ym){
    let delta=Number(mapFor(ym,OBSERVED)[account.id]?.amount||0);
    (account.folders||[]).forEach(folder=>{
      if(folder.actualBalance===null||folder.actualBalance===undefined) return;
      delta+=Number(folder.actualBalance||0)-folderTransfer(account.id,folder.id,ym);
    });
    return delta;
  }

  function applyInvariantAccounting(){
    const root=document.getElementById('homeDashboard');
    if(!root) return;
    const organization=normalizeMoneyOrganization(state.moneyOrganization);
    if(!organization.enabled) return;
    const summary=buildTodayFinancialSnapshot(new Date());
    const secondary=organization.accounts.filter(account=>account.id!==organization.salaryAccountId);
    const adjustment=secondary.reduce((sum,account)=>sum+empiricalAdjustment(account,summary.periodYm),0);
    const total=Number(summary.potentialNow||0)+adjustment;
    const secondaryTotal=secondary.reduce((sum,account)=>sum+secondaryBalance(account,summary.periodYm),0);
    const primary=total-secondaryTotal;

    const hero=root.querySelector('.homeHero .homeHeroValue');
    if(hero) hero.textContent=euros(total);

    const primaryCard=root.querySelector('.dzAccountWidget.salary');
    const primaryValues=primaryCard?.querySelectorAll('.dzBalanceMetric strong');
    if(primaryValues?.[0]){primaryValues[0].textContent=euros(primary);primaryValues[0].className=primary>=0?'is-positive':'is-negative';}
    const primaryFuture=(summary.upcomingCharges||[]).filter(event=>assignmentFor(event,organization).accountId===organization.salaryAccountId).reduce((sum,event)=>sum+Math.abs(Number(event.amount||0)),0);
    if(primaryValues?.[1]){const end=primary-primaryFuture;primaryValues[1].textContent=euros(end);primaryValues[1].className=end>=0?'is-positive':'is-negative';}

    secondary.forEach(account=>{
      const balance=secondaryBalance(account,summary.periodYm);
      const card=[...root.querySelectorAll('.dzAccountWidget.secondary')].find(node=>node.querySelector('h3')?.textContent?.trim()===account.name);
      const values=card?.querySelectorAll('.dzBalanceMetric strong');
      if(values?.[0]){values[0].textContent=euros(balance);values[0].className=balance>=0?'is-positive':'is-negative';}
      const future=(summary.upcomingCharges||[]).filter(event=>assignmentFor(event,organization).accountId===account.id).reduce((sum,event)=>sum+Math.abs(Number(event.amount||0)),0);
      if(values?.[1]){const end=balance-future;values[1].textContent=euros(end);values[1].className=end>=0?'is-positive':'is-negative';}
    });

    const splitDiff=Math.abs(total-(primary+secondaryTotal));
    window.__DINEROZAURIO_ACCOUNT_DIAGNOSTICS__={version:VERSION,month:summary.periodYm,total,primary,secondary:secondaryTotal,empiricalAdjustment:adjustment,splitDiff};
    if(splitDiff>0.009) console.error('DineroZaurio invariant failed: total != account split',window.__DINEROZAURIO_ACCOUNT_DIAGNOSTICS__);
  }

  window.addEventListener('load',install,{once:true});
  if(document.readyState==='complete') install();
})();