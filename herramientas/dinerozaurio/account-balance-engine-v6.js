(() => {
  'use strict';

  const PATCH_VERSION='2.6-account-balance-3';
  const FOLDER_TRANSFER_KEY='__folderTransfers';
  const OBSERVED_GENERAL_KEY='__accountGeneralBalances';
  const GENERAL_TRANSFER_KEY='__accountGeneralTransfers';
  const SAVINGS_KEY='__savingsTransferConfirmations';

  function install(){
    if(window.__DZ_ACCOUNT_V6__===PATCH_VERSION) return;
    if(typeof renderHomeDashboard!=='function'||typeof buildTodayFinancialSnapshot!=='function'){
      setTimeout(install,60); return;
    }
    window.__DZ_ACCOUNT_V6__=PATCH_VERSION;
    const baseRender=renderHomeDashboard;
    renderHomeDashboard=function(){
      baseRender();
      setTimeout(()=>{try{reconcileAccountView();}catch(e){console.error('DZ account v6',e);}},0);
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

  function observedGeneral(accountId,ym){ return Number(observedGeneralMap(ym)[accountId]?.amount||0); }
  function transferredGeneral(accountId,ym){ return Number(generalTransferMap(ym)[accountId]?.amount||0); }

  function folderBalance(account,folder,ym){
    if(folder.actualBalance!==null&&folder.actualBalance!==undefined) return Number(folder.actualBalance||0);
    return Number(folderTransferMap(ym)[`${account.id}|${folder.id}`]?.amount||0);
  }

  function accountKnownBalance(account,ym){
    const general=observedGeneral(account.id,ym)+transferredGeneral(account.id,ym);
    return general+(account.folders||[]).reduce((sum,folder)=>sum+folderBalance(account,folder,ym),0);
  }

  function empiricalMoneyStillExisting(account,ym){
    // Only money that the budget engine may have treated as spent must be added back to the global total.
    // Explicit transfers between own accounts never change total wealth.
    let amount=observedGeneral(account.id,ym);
    (account.folders||[]).forEach(folder=>{ amount+=folderBalance(account,folder,ym); });
    return amount;
  }

  function reconcileAccountView(){
    const root=document.getElementById('homeDashboard'); if(!root) return;
    const organization=org(); if(!organization.enabled) return;
    const summary=buildTodayFinancialSnapshot(new Date());
    const secondary=organization.accounts.filter(a=>a.id!==organization.salaryAccountId);

    const addBack=secondary.reduce((sum,account)=>sum+empiricalMoneyStillExisting(account,summary.periodYm),0);
    const correctedTotal=Number(summary.potentialNow||0)+addBack;
    const secondaryTotal=secondary.reduce((sum,account)=>sum+accountKnownBalance(account,summary.periodYm),0);
    const primaryBalance=correctedTotal-secondaryTotal;

    const hero=root.querySelector('.homeHero');
    const heroValue=hero?.querySelector('.homeHeroValue');
    const heroLabel=hero?.querySelector('.label');
    if(heroLabel) heroLabel.innerHTML=`Dinero total estimado hoy <button class="dzInfoButton" type="button" data-dz-v6-total-info>i</button>`;
    if(heroValue){heroValue.textContent=euros(correctedTotal);heroValue.classList.remove('dzNeedsBalance');}
    const hint=hero?.querySelector('.dzV5TotalHint');
    if(hint) hint.textContent='Mover dinero entre BBVA y Revolut cambia dónde está, no cuánto dinero tienes.';

    const salaryCard=root.querySelector('.dzAccountWidget.salary');
    const salaryValues=salaryCard?.querySelectorAll('.dzBalanceMetric strong');
    const primaryFuture=(summary.upcomingCharges||[]).filter(e=>assignmentFor(e,organization).accountId===organization.salaryAccountId).reduce((s,e)=>s+Math.abs(Number(e.amount||0)),0);
    if(salaryValues?.[0]){salaryValues[0].textContent=euros(primaryBalance);salaryValues[0].className=primaryBalance>=0?'is-positive':'is-negative';}
    if(salaryValues?.[1]){const end=primaryBalance-primaryFuture;salaryValues[1].textContent=euros(end);salaryValues[1].className=end>=0?'is-positive':'is-negative';}
    const salarySub=salaryCard?.querySelector('.dzAccountWidgetHead p');
    if(salarySub) salarySub.textContent='Saldo reconstruido para esta cuenta';

    secondary.forEach(account=>renderSecondaryAccount(root,account,summary,organization));
    renderSavingsWarnings(root,summary,organization);

    root.querySelector('[data-dz-v6-total-info]')?.addEventListener('click',()=>openInfo(
      'Cómo se calcula',
      'DineroZaurio separa patrimonio y ubicación. Una transferencia entre tus cuentas solo cambia la ubicación. Un saldo observado que ya existía en Revolut sí corrige el dinero total conocido.'
    ));
  }

  function renderSecondaryAccount(root,account,summary,organization){
    const card=[...root.querySelectorAll('.dzAccountWidget.secondary')].find(c=>c.querySelector('h3')?.textContent?.trim()===account.name);
    if(!card) return;
    const known=accountKnownBalance(account,summary.periodYm);
    const observed=observedGeneral(account.id,summary.periodYm);
    const moved=transferredGeneral(account.id,summary.periodYm);
    const allFuture=(summary.upcomingCharges||[]).filter(e=>assignmentFor(e,organization).accountId===account.id);
    const futureTotal=allFuture.reduce((s,e)=>s+Math.abs(Number(e.amount||0)),0);
    const values=card.querySelectorAll('.dzBalanceMetric strong');
    if(values[0]){values[0].textContent=euros(known);values[0].className=known>=0?'is-positive':'is-negative';}
    if(values[1]){const end=known-futureTotal;values[1].textContent=euros(end);values[1].className=end>=0?'is-positive':'is-negative';}
    const sub=card.querySelector('.dzAccountWidgetHead p');
    if(sub) sub.textContent='Dinero situado ahora en esta cuenta';

    let grid=card.querySelector('.dzFolderBalances');
    if(!grid){grid=document.createElement('div');grid.className='dzFolderBalances dzFolderMiniGrid';card.querySelector('.dzBalancePair')?.insertAdjacentElement('afterend',grid);}

    let tile=grid.querySelector('[data-dz-general-balance]');
    if(!tile){tile=document.createElement('div');tile.className='dzFolderMini dzGeneralMini';tile.tabIndex=0;tile.setAttribute('role','button');tile.dataset.dzGeneralBalance=account.id;grid.prepend(tile);}
    const available=observed+moved;
    tile.innerHTML=`<span>Disponible sin carpeta</span><strong class="${available>=0?'is-positive':'is-negative'}">${euros(available)}</strong><small>${observed>0?`${euros(observed)} ya estaban aquí`:moved>0?`${euros(moved)} movidos desde BBVA`:'Sin saldo registrado'}</small>`;
    const editObserved=()=>openObservedBalanceEditor(account,summary.periodYm,observed);
    tile.onclick=editObserved;tile.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();editObserved();}};

    const futureGeneral=allFuture.filter(e=>!assignmentFor(e,organization).folderId);
    const generalFutureTotal=futureGeneral.reduce((s,e)=>s+Math.abs(Number(e.amount||0)),0);
    const shortfall=Math.max(0,generalFutureTotal-available);
    tile.classList.toggle('dzGeneralWarning',shortfall>0.009);

    card.querySelector('.dzGeneralFundingAlert')?.remove();
    if(shortfall>0.009){
      const alert=document.createElement('div');
      alert.className='dzGeneralFundingAlert';
      alert.innerHTML=`<div><strong>Hay cargos sin dinero preparado</strong><span>Faltan ${euros(shortfall)} para ${futureGeneral.map(e=>`<b>${escapeHtml(e.name)}</b>`).join(', ')}.</span></div><button type="button">Resolver</button>`;
      tile.insertAdjacentElement('afterend',alert);
      alert.querySelector('button').onclick=()=>openFundingResolver(account,summary.periodYm,available,futureGeneral,generalFutureTotal,shortfall,organization);
    }
  }

  function openObservedBalanceEditor(account,ym,current){
    const root=document.getElementById('modalRoot'); root.className='modalRoot';
    root.innerHTML=`<div class="modalCard dzV6Modal"><div class="modalHead"><div><h3>Corregir saldo que ya existía</h3><div class="sub">Usa esto solo para dinero que ya estaba en ${escapeHtml(account.name)} y que DineroZaurio no conocía. No mueve dinero desde BBVA.</div></div><button id="dzV6Close" class="dzV5Close" type="button">×</button></div><div class="dzBalanceBefore"><span>Valor conocido</span><strong>${euros(current)}</strong></div><div class="field"><label>Dinero que ya estaba aquí</label><input id="dzV6Observed" class="input" type="number" min="0" step="0.01" value="${current.toFixed(2)}"></div><div class="dzV6NoMove">Ejemplo: esos 2,92 € antiguos de Revolut pertenecen aquí.</div><div class="btnRow" style="margin-top:18px"><button id="dzV6Save" class="btn primary">Guardar corrección</button></div></div>`;
    document.getElementById('dzV6Close').onclick=closeModal;
    document.getElementById('dzV6Save').onclick=()=>{
      const map=observedGeneralMap(ym);
      map[account.id]={amount:Math.max(0,Number(document.getElementById('dzV6Observed').value||0)),updatedAt:new Date().toISOString(),kind:'preexisting_observed'};
      saveSpecial(ym,OBSERVED_GENERAL_KEY,map);closeModal();setTimeout(()=>renderHomeDashboard(),0);
    };
  }

  function openFundingResolver(account,ym,available,events,total,shortfall,organization){
    const salary=organization.accounts.find(a=>a.id===organization.salaryAccountId);
    const rows=events.map(e=>`<div class="dzGeneralCharge"><span><b>${escapeHtml(e.name)}</b></span><strong>${euros(Math.abs(Number(e.amount||0)))}</strong></div>`).join('');
    const root=document.getElementById('modalRoot');root.className='modalRoot';
    root.innerHTML=`<div class="modalCard dzV6Modal"><div class="modalHead"><div><h3>Preparar dinero para próximos cargos</h3><div class="sub">Estos cargos saldrán de ${escapeHtml(account.name)}. Resolverlo significa mover dinero desde tu cuenta principal, no inventar saldo.</div></div><button id="dzV6Close" class="dzV5Close" type="button">×</button></div><div class="dzFundingSummary"><div><span>Disponible ahora</span><strong>${euros(available)}</strong></div><div><span>Próximos cargos</span><strong>${euros(total)}</strong></div><div><span>Falta preparar</span><strong class="is-negative">${euros(shortfall)}</strong></div></div><div class="dzGeneralUpcoming">${rows}</div><div class="btnRow dzFundingActions"><button id="dzV6Transfer" class="btn primary" type="button">Mover ${euros(shortfall)} desde ${escapeHtml(salary?.name||'BBVA')}</button></div></div>`;
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
    root.querySelectorAll('.dzSavingsPlacementAlert').forEach(n=>n.remove());
    const active=(summary.snapshot?.goalItems||summary.snapshot?.goals||[]).filter(g=>Number(g.monthAmount||g.amount||0)>0.009);
    if(!active.length) return;
    const confirmations=savingsMap(summary.periodYm);
    const unresolved=active.filter(goal=>{const a=organization.assignments?.[goal.id];return !a?.accountId||!a?.folderId;});
    const needsMove=active.filter(goal=>{const a=organization.assignments?.[goal.id];return a?.accountId&&a?.folderId&&!confirmations[goal.id]?.moved;});
    if(!unresolved.length&&!needsMove.length) return;
    const anchor=root.querySelector('.dzInsightsGrid')||root.querySelector('.dzAccountWidgetGrid'); if(!anchor) return;
    const alert=document.createElement('section');alert.className='panel dzSavingsPlacementAlert';
    const rows=[
      ...unresolved.map(goal=>`<div class="dzSavingsAlertRow"><div><strong>${escapeHtml(goal.name)}</strong><span>${euros(goal.monthAmount||goal.amount)} reservados, pero todavía no tienen destino.</span></div><button type="button" data-dz-savings-place="${escapeHtml(goal.id)}">Elegir destino</button></div>`),
      ...needsMove.map(goal=>{const a=organization.assignments[goal.id];const acc=organization.accounts.find(x=>x.id===a.accountId);const folder=acc?.folders.find(x=>x.id===a.folderId);return `<div class="dzSavingsAlertRow"><div><strong>${escapeHtml(goal.name)}</strong><span>${euros(goal.monthAmount||goal.amount)} deben ir a ${escapeHtml(acc?.name||'la cuenta')} · ${escapeHtml(folder?.name||'la carpeta')}. Falta confirmar el movimiento.</span></div><button type="button" data-dz-savings-confirm="${escapeHtml(goal.id)}">Ya lo moví</button></div>`;})
    ].join('');
    alert.innerHTML=`<div class="dzSavingsAlertHead"><span class="dzAccountEyebrow">AHORRO</span><h3>Acciones pendientes de ahorro</h3></div>${rows}`;
    anchor.insertAdjacentElement('beforebegin',alert);
    alert.querySelectorAll('[data-dz-savings-place]').forEach(btn=>btn.onclick=()=>openSavingsDestination(btn.dataset.dzSavingsPlace,summary.periodYm));
    alert.querySelectorAll('[data-dz-savings-confirm]').forEach(btn=>btn.onclick=()=>confirmSavingsMove(btn.dataset.dzSavingsConfirm,summary.periodYm));
  }

  function openSavingsDestination(goalId,ym){
    const organization=org();const goal=(state.goals||[]).find(g=>g.id===goalId);if(!goal)return;
    const options=organization.accounts.flatMap(account=>(account.folders||[]).map(folder=>`<option value="${escapeHtml(account.id)}|${escapeHtml(folder.id)}">${escapeHtml(account.name)} · ${escapeHtml(folder.name)}</option>`)).join('');
    const root=document.getElementById('modalRoot');root.className='modalRoot';
    root.innerHTML=`<div class="modalCard dzV6Modal"><div class="modalHead"><div><h3>Dónde guardar ${escapeHtml(goal.name)}</h3><div class="sub">Elegir destino no marca el dinero como movido.</div></div><button id="dzV6Close" class="dzV5Close" type="button">×</button></div><div class="field"><label>Cuenta y carpeta</label><select id="dzV6SavingsDestination" class="select">${options}</select></div><div class="btnRow" style="margin-top:18px"><button id="dzV6Save" class="btn primary">Guardar destino</button></div></div>`;
    document.getElementById('dzV6Close').onclick=closeModal;
    document.getElementById('dzV6Save').onclick=()=>{const [accountId,folderId]=String(document.getElementById('dzV6SavingsDestination').value||'').split('|');const next=org();next.assignments[goalId]={accountId,folderId};state.moneyOrganization=next;touchState();closeModal();setTimeout(()=>renderHomeDashboard(),0);};
  }

  function confirmSavingsMove(goalId,ym){
    const map=savingsMap(ym);map[goalId]={moved:true,confirmedAt:new Date().toISOString()};saveSpecial(ym,SAVINGS_KEY,map);
    const organization=org();const a=organization.assignments?.[goalId];const goal=(state.goals||[]).find(g=>g.id===goalId);
    if(a?.accountId&&a?.folderId&&goal){
      const transfers=folderTransferMap(ym);const key=`${a.accountId}|${a.folderId}`;
      const amount=Number(getGoalMonthlyCharge(goal,ym,999999999).amount||0);
      transfers[key]={amount:Number(transfers[key]?.amount||0)+amount,confirmedAt:new Date().toISOString(),source:'savings_goal'};
      saveSpecial(ym,FOLDER_TRANSFER_KEY,transfers);
    }
    setTimeout(()=>renderHomeDashboard(),0);
  }

  function openInfo(title,text){
    const root=document.getElementById('modalRoot');root.className='modalRoot';
    root.innerHTML=`<div class="modalCard dzV6Modal"><div class="modalHead"><div><h3>${escapeHtml(title)}</h3><div class="sub" style="line-height:1.55">${escapeHtml(text)}</div></div><button id="dzV6Close" class="dzV5Close" type="button">×</button></div></div>`;
    document.getElementById('dzV6Close').onclick=closeModal;
  }

  function injectStyles(){
    if(document.getElementById('dzV6Styles')) return;
    const s=document.createElement('style');s.id='dzV6Styles';s.textContent=`
      .dzGeneralMini{order:-10}.dzGeneralWarning{border-color:rgba(251,191,36,.45)!important;background:rgba(251,191,36,.09)!important}.dzGeneralFundingAlert{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:-2px;padding:11px 12px;border-radius:13px;background:rgba(251,191,36,.09);border:1px solid rgba(251,191,36,.18)}.dzGeneralFundingAlert strong{display:block;color:#ffe084;font-size:12px}.dzGeneralFundingAlert span{display:block;margin-top:4px;color:var(--muted);font-size:11px;line-height:1.45}.dzGeneralFundingAlert b{color:#fff}.dzGeneralFundingAlert button{border:1px solid rgba(251,191,36,.25);border-radius:999px;background:rgba(251,191,36,.13);color:#ffe084;padding:8px 11px;font-size:10px;font-weight:900;cursor:pointer;white-space:nowrap}.dzBalanceBefore,.dzFundingSummary{display:grid;gap:8px;margin:8px 0 14px}.dzBalanceBefore{grid-template-columns:1fr auto;padding:11px 12px;border-radius:12px;background:rgba(255,255,255,.04)}.dzBalanceBefore span,.dzFundingSummary span{color:var(--muted);font-size:10px}.dzFundingSummary{grid-template-columns:repeat(3,1fr)}.dzFundingSummary>div{padding:11px;border-radius:12px;background:rgba(255,255,255,.04)}.dzFundingSummary strong{display:block;margin-top:5px}.dzGeneralUpcoming{margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08)}.dzGeneralCharge{display:flex;justify-content:space-between;gap:12px;padding:7px 0;font-size:12px}.dzGeneralCharge span{color:var(--muted)}.dzGeneralCharge b{color:#fff}.dzGeneralCharge strong{white-space:nowrap}.dzV6NoMove{margin-top:12px;padding:10px 12px;border-radius:12px;background:rgba(34,211,238,.07);color:#bff7ff;font-size:11px;line-height:1.45}.dzFundingActions .btn{width:100%}.dzSavingsPlacementAlert{margin:16px 0;border-color:rgba(251,191,36,.2)!important}.dzSavingsAlertHead h3{margin:4px 0 10px}.dzSavingsAlertRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-top:1px solid rgba(255,255,255,.06)}.dzSavingsAlertRow strong{display:block;font-size:12px}.dzSavingsAlertRow span{display:block;margin-top:4px;color:var(--muted);font-size:11px;line-height:1.4}.dzSavingsAlertRow button{border:1px solid rgba(34,211,238,.2);border-radius:999px;background:rgba(34,211,238,.12);color:#bff7ff;padding:8px 10px;font-size:10px;font-weight:900;white-space:nowrap;cursor:pointer}@media(max-width:600px){.dzGeneralFundingAlert,.dzSavingsAlertRow{align-items:flex-start;flex-direction:column}.dzGeneralFundingAlert button,.dzSavingsAlertRow button{width:100%}.dzFundingSummary{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  window.addEventListener('load',install,{once:true});
  if(document.readyState==='complete') install();
})();