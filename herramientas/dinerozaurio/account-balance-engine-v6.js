(() => {
  'use strict';

  const MODULE_VERSION='accounts-ui-1';
  const FOLDER_TRANSFER_KEY='__folderTransfers';
  const OBSERVED_GENERAL_KEY='__accountGeneralBalances';
  const GENERAL_TRANSFER_KEY='__accountGeneralTransfers';
  const SAVINGS_KEY='__savingsTransferConfirmations';

  function install(){
    if(window.__DZ_ACCOUNTS_UI__===MODULE_VERSION) return;
    if(typeof renderHomeDashboard!=='function'||typeof buildTodayFinancialSnapshot!=='function'){
      setTimeout(install,60); return;
    }
    window.__DZ_ACCOUNTS_UI__=MODULE_VERSION;
    const baseRender=renderHomeDashboard;
    renderHomeDashboard=function(){
      baseRender();
      setTimeout(()=>{try{renderAccountControls();}catch(error){console.error('DineroZaurio accounts UI error',error);}},0);
    };
    injectStyles();
    if(document.getElementById('homeDashboard')) renderHomeDashboard();
  }

  function org(){ return normalizeMoneyOrganization(state.moneyOrganization); }
  function specialMap(ym,key){
    const raw=state.monthAdjustments?.[ym]?.expenseOverrides?.[key];
    return raw&&typeof raw==='object'&&!Array.isArray(raw)?cloneData(raw):{};
  }
  function saveSpecial(ym,key,map){
    const adj=normalizeMonthAdjustmentShape(state.monthAdjustments?.[ym]||{},ym);
    if(map&&Object.keys(map).length) adj.expenseOverrides[key]=cloneData(map);
    else delete adj.expenseOverrides[key];
    state.monthAdjustments[ym]=adj;
    touchState();
  }
  function observedGeneralMap(ym){ return specialMap(ym,OBSERVED_GENERAL_KEY); }
  function generalTransferMap(ym){ return specialMap(ym,GENERAL_TRANSFER_KEY); }
  function folderTransferMap(ym){ return specialMap(ym,FOLDER_TRANSFER_KEY); }
  function savingsMap(ym){ return specialMap(ym,SAVINGS_KEY); }

  function assignmentFor(event,organization){
    if(!event?.itemId) return {accountId:organization.salaryAccountId,folderId:''};
    return organization.assignments?.[event.itemId]||{accountId:organization.salaryAccountId,folderId:''};
  }

  function renderAccountControls(){
    const root=document.getElementById('homeDashboard'); if(!root) return;
    const organization=org(); if(!organization.enabled) return;
    const summary=buildTodayFinancialSnapshot(new Date());
    organization.accounts
      .filter(account=>account.id!==organization.salaryAccountId)
      .forEach(account=>renderSecondaryControls(root,account,summary,organization));
    renderSavingsWarnings(root,summary,organization);
  }

  function renderSecondaryControls(root,account,summary,organization){
    const card=[...root.querySelectorAll('.dzAccountWidget.secondary')].find(c=>c.querySelector('h3')?.textContent?.trim()===account.name);
    if(!card) return;
    const observed=Number(observedGeneralMap(summary.periodYm)[account.id]?.amount||0);
    const moved=Number(generalTransferMap(summary.periodYm)[account.id]?.amount||0);
    const available=observed+moved;
    const allFuture=(summary.upcomingCharges||[]).filter(event=>assignmentFor(event,organization).accountId===account.id);
    const futureGeneral=allFuture.filter(event=>!assignmentFor(event,organization).folderId);
    const generalFutureTotal=futureGeneral.reduce((sum,event)=>sum+Math.abs(Number(event.amount||0)),0);
    const shortfall=Math.max(0,generalFutureTotal-available);

    let grid=card.querySelector('.dzFolderBalances');
    if(!grid){grid=document.createElement('div');grid.className='dzFolderBalances dzFolderMiniGrid';card.querySelector('.dzBalancePair')?.insertAdjacentElement('afterend',grid);}
    let tile=grid.querySelector('[data-dz-general-balance]');
    if(!tile){tile=document.createElement('div');tile.className='dzFolderMini dzGeneralMini';tile.tabIndex=0;tile.setAttribute('role','button');tile.dataset.dzGeneralBalance=account.id;grid.prepend(tile);}
    tile.innerHTML=`<span>Disponible sin carpeta</span><strong class="${available>=0?'is-positive':'is-negative'}">${euros(available)}</strong><small>${observed>0?`${euros(observed)} ya estaban aquí`:moved>0?`${euros(moved)} movidos desde la cuenta principal`:'Sin saldo registrado'}</small>`;
    const editObserved=()=>openObservedBalanceEditor(account,summary.periodYm,observed);
    tile.onclick=editObserved;
    tile.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();editObserved();}};
    tile.classList.toggle('dzGeneralWarning',shortfall>0.009);

    card.querySelector('.dzGeneralFundingAlert')?.remove();
    if(shortfall>0.009){
      const alert=document.createElement('div');
      alert.className='dzGeneralFundingAlert';
      alert.innerHTML=`<div><strong>Hay cargos sin dinero preparado</strong><span>Faltan ${euros(shortfall)} para ${futureGeneral.map(event=>`<b>${escapeHtml(event.name)}</b>`).join(', ')}.</span></div><button type="button">Resolver</button>`;
      tile.insertAdjacentElement('afterend',alert);
      alert.querySelector('button').onclick=()=>openFundingResolver(account,summary.periodYm,available,futureGeneral,generalFutureTotal,shortfall,organization);
    }
  }

  function openObservedBalanceEditor(account,ym,current){
    const root=document.getElementById('modalRoot'); root.className='modalRoot';
    root.innerHTML=`<div class="modalCard dzV6Modal"><div class="modalHead"><div><h3>Corregir saldo que ya existía</h3><div class="sub">Usa esto solo para dinero que ya estaba en ${escapeHtml(account.name)} y que DineroZaurio no conocía. No mueve dinero desde la cuenta principal.</div></div><button id="dzV6Close" class="dzV5Close" type="button">×</button></div><div class="dzBalanceBefore"><span>Valor conocido</span><strong>${euros(current)}</strong></div><div class="field"><label>Dinero que ya estaba aquí</label><input id="dzV6Observed" class="input" type="number" min="0" step="0.01" value="${current.toFixed(2)}"></div><div class="dzV6NoMove">Esta corrección describe dinero preexistente; no crea una transferencia.</div><div class="btnRow" style="margin-top:18px"><button id="dzV6Save" class="btn primary">Guardar corrección</button></div></div>`;
    document.getElementById('dzV6Close').onclick=closeModal;
    document.getElementById('dzV6Save').onclick=()=>{
      const map=observedGeneralMap(ym);
      map[account.id]={amount:Math.max(0,Number(document.getElementById('dzV6Observed').value||0)),updatedAt:new Date().toISOString(),kind:'preexisting_observed'};
      saveSpecial(ym,OBSERVED_GENERAL_KEY,map);closeModal();setTimeout(()=>renderHomeDashboard(),0);
    };
  }

  function openFundingResolver(account,ym,available,events,total,shortfall,organization){
    const salary=organization.accounts.find(a=>a.id===organization.salaryAccountId);
    const rows=events.map(event=>`<div class="dzGeneralCharge"><span><b>${escapeHtml(event.name)}</b></span><strong>${euros(Math.abs(Number(event.amount||0)))}</strong></div>`).join('');
    const root=document.getElementById('modalRoot');root.className='modalRoot';
    root.innerHTML=`<div class="modalCard dzV6Modal"><div class="modalHead"><div><h3>Preparar dinero para próximos cargos</h3><div class="sub">Confirma esto solo después de hacer la transferencia real desde ${escapeHtml(salary?.name||'la cuenta principal')} a ${escapeHtml(account.name)}.</div></div><button id="dzV6Close" class="dzV5Close" type="button">×</button></div><div class="dzFundingSummary"><div><span>Disponible ahora</span><strong>${euros(available)}</strong></div><div><span>Próximos cargos</span><strong>${euros(total)}</strong></div><div><span>Falta preparar</span><strong class="is-negative">${euros(shortfall)}</strong></div></div><div class="dzGeneralUpcoming">${rows}</div><div class="btnRow dzFundingActions"><button id="dzV6Transfer" class="btn primary" type="button">Ya transferí ${euros(shortfall)}</button></div></div>`;
    document.getElementById('dzV6Close').onclick=closeModal;
    document.getElementById('dzV6Transfer').onclick=()=>{
      const map=generalTransferMap(ym);
      const previous=Number(map[account.id]?.amount||0);
      map[account.id]={amount:previous+shortfall,confirmedAt:new Date().toISOString(),sourceAccountId:organization.salaryAccountId,kind:'internal_transfer'};
      saveSpecial(ym,GENERAL_TRANSFER_KEY,map);
      closeModal();setTimeout(()=>renderHomeDashboard(),0);
    };
  }

  function renderSavingsWarnings(root,summary,organization){
    root.querySelectorAll('.dzSavingsPlacementAlert').forEach(node=>node.remove());
    const active=(summary.snapshot?.goalItems||summary.snapshot?.goals||[]).filter(goal=>Number(goal.monthAmount||goal.amount||0)>0.009);
    if(!active.length) return;
    const confirmations=savingsMap(summary.periodYm);
    const unresolved=active.filter(goal=>{const assignment=organization.assignments?.[goal.id];return !assignment?.accountId||!assignment?.folderId;});
    const needsMove=active.filter(goal=>{const assignment=organization.assignments?.[goal.id];return assignment?.accountId&&assignment?.folderId&&!confirmations[goal.id]?.moved;});
    if(!unresolved.length&&!needsMove.length) return;
    const anchor=root.querySelector('.dzInsightsGrid')||root.querySelector('.dzAccountWidgetGrid'); if(!anchor) return;
    const alert=document.createElement('section');alert.className='panel dzSavingsPlacementAlert';
    const rows=[
      ...unresolved.map(goal=>`<div class="dzSavingsAlertRow"><div><strong>${escapeHtml(goal.name)}</strong><span>${euros(goal.monthAmount||goal.amount)} reservados, pero todavía no tienen destino.</span></div><button type="button" data-dz-savings-place="${escapeHtml(goal.id)}">Elegir destino</button></div>`),
      ...needsMove.map(goal=>{const assignment=organization.assignments[goal.id];const account=organization.accounts.find(x=>x.id===assignment.accountId);const folder=account?.folders.find(x=>x.id===assignment.folderId);return `<div class="dzSavingsAlertRow"><div><strong>${escapeHtml(goal.name)}</strong><span>${euros(goal.monthAmount||goal.amount)} deben ir a ${escapeHtml(account?.name||'la cuenta')} · ${escapeHtml(folder?.name||'la carpeta')}. Falta confirmar el movimiento.</span></div><button type="button" data-dz-savings-confirm="${escapeHtml(goal.id)}">Ya lo moví</button></div>`;})
    ].join('');
    alert.innerHTML=`<div class="dzSavingsAlertHead"><span class="dzAccountEyebrow">AHORRO</span><h3>Acciones pendientes de ahorro</h3></div>${rows}`;
    anchor.insertAdjacentElement('beforebegin',alert);
    alert.querySelectorAll('[data-dz-savings-place]').forEach(button=>button.onclick=()=>openSavingsDestination(button.dataset.dzSavingsPlace,summary.periodYm));
    alert.querySelectorAll('[data-dz-savings-confirm]').forEach(button=>button.onclick=()=>confirmSavingsMove(button.dataset.dzSavingsConfirm,summary.periodYm));
  }

  function openSavingsDestination(goalId,ym){
    const organization=org();const goal=(state.goals||[]).find(item=>item.id===goalId);if(!goal)return;
    const options=organization.accounts.flatMap(account=>(account.folders||[]).map(folder=>`<option value="${escapeHtml(account.id)}|${escapeHtml(folder.id)}">${escapeHtml(account.name)} · ${escapeHtml(folder.name)}</option>`)).join('');
    const root=document.getElementById('modalRoot');root.className='modalRoot';
    root.innerHTML=`<div class="modalCard dzV6Modal"><div class="modalHead"><div><h3>Dónde guardar ${escapeHtml(goal.name)}</h3><div class="sub">Elegir destino no marca el dinero como movido.</div></div><button id="dzV6Close" class="dzV5Close" type="button">×</button></div><div class="field"><label>Cuenta y carpeta</label><select id="dzV6SavingsDestination" class="select">${options}</select></div><div class="btnRow" style="margin-top:18px"><button id="dzV6Save" class="btn primary">Guardar destino</button></div></div>`;
    document.getElementById('dzV6Close').onclick=closeModal;
    document.getElementById('dzV6Save').onclick=()=>{const [accountId,folderId]=String(document.getElementById('dzV6SavingsDestination').value||'').split('|');const next=org();next.assignments[goalId]={accountId,folderId};state.moneyOrganization=next;touchState();closeModal();setTimeout(()=>renderHomeDashboard(),0);};
  }

  function confirmSavingsMove(goalId,ym){
    const map=savingsMap(ym);map[goalId]={moved:true,confirmedAt:new Date().toISOString()};saveSpecial(ym,SAVINGS_KEY,map);
    const organization=org();const assignment=organization.assignments?.[goalId];const goal=(state.goals||[]).find(item=>item.id===goalId);
    if(assignment?.accountId&&assignment?.folderId&&goal){
      const transfers=folderTransferMap(ym);const key=`${assignment.accountId}|${assignment.folderId}`;
      const amount=Number(getGoalMonthlyCharge(goal,ym,999999999).amount||0);
      transfers[key]={amount:Number(transfers[key]?.amount||0)+amount,confirmedAt:new Date().toISOString(),source:'savings_goal'};
      saveSpecial(ym,FOLDER_TRANSFER_KEY,transfers);
    }
    setTimeout(()=>renderHomeDashboard(),0);
  }

  function injectStyles(){
    if(document.getElementById('dzV6Styles')) return;
    const style=document.createElement('style');style.id='dzV6Styles';style.textContent=`
      .dzGeneralMini{order:-10}.dzGeneralWarning{border-color:rgba(251,191,36,.45)!important;background:rgba(251,191,36,.09)!important}.dzGeneralFundingAlert{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:-2px;padding:11px 12px;border-radius:13px;background:rgba(251,191,36,.09);border:1px solid rgba(251,191,36,.18)}.dzGeneralFundingAlert strong{display:block;color:#ffe084;font-size:12px}.dzGeneralFundingAlert span{display:block;margin-top:4px;color:var(--muted);font-size:11px;line-height:1.45}.dzGeneralFundingAlert b{color:#fff}.dzGeneralFundingAlert button{border:1px solid rgba(251,191,36,.25);border-radius:999px;background:rgba(251,191,36,.13);color:#ffe084;padding:8px 11px;font-size:10px;font-weight:900;cursor:pointer;white-space:nowrap}.dzBalanceBefore,.dzFundingSummary{display:grid;gap:8px;margin:8px 0 14px}.dzBalanceBefore{grid-template-columns:1fr auto;padding:11px 12px;border-radius:12px;background:rgba(255,255,255,.04)}.dzFundingSummary{grid-template-columns:repeat(3,1fr)}.dzFundingSummary>div{padding:11px;border-radius:12px;background:rgba(255,255,255,.04)}.dzFundingSummary span{color:var(--muted);font-size:10px}.dzFundingSummary strong{display:block;margin-top:5px}.dzGeneralUpcoming{margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08)}.dzGeneralCharge{display:flex;justify-content:space-between;gap:12px;padding:7px 0;font-size:12px}.dzV6NoMove{margin-top:12px;padding:10px 12px;border-radius:12px;background:rgba(34,211,238,.07);color:#bff7ff;font-size:11px}.dzFundingActions .btn{width:100%}.dzSavingsPlacementAlert{margin:16px 0;border-color:rgba(251,191,36,.2)!important}.dzSavingsAlertHead h3{margin:4px 0 10px}.dzSavingsAlertRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-top:1px solid rgba(255,255,255,.06)}.dzSavingsAlertRow strong{display:block;font-size:12px}.dzSavingsAlertRow span{display:block;margin-top:4px;color:var(--muted);font-size:11px}.dzSavingsAlertRow button{border:1px solid rgba(34,211,238,.2);border-radius:999px;background:rgba(34,211,238,.12);color:#bff7ff;padding:8px 10px;font-size:10px;font-weight:900;white-space:nowrap;cursor:pointer}@media(max-width:600px){.dzGeneralFundingAlert,.dzSavingsAlertRow{align-items:flex-start;flex-direction:column}.dzGeneralFundingAlert button,.dzSavingsAlertRow button{width:100%}.dzFundingSummary{grid-template-columns:1fr}}
    `;document.head.appendChild(style);
  }

  window.addEventListener('load',install,{once:true});
  if(document.readyState==='complete') install();
})();