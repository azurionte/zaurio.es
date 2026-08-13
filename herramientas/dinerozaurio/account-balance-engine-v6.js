(() => {
  'use strict';

  const PATCH_VERSION='2.6-account-balance-2';
  const TRANSFER_KEY='__folderTransfers';
  const GENERAL_KEY='__accountGeneralBalances';
  const SAVINGS_KEY='__savingsTransferConfirmations';

  function install(){
    if(window.__DZ_ACCOUNT_V6__===PATCH_VERSION) return;
    if(typeof renderHomeDashboard!=='function' || typeof buildTodayFinancialSnapshot!=='function'){
      setTimeout(install,60); return;
    }
    window.__DZ_ACCOUNT_V6__=PATCH_VERSION;
    const baseRender=renderHomeDashboard;
    renderHomeDashboard=function(){
      baseRender();
      setTimeout(()=>{ try{ reconcileAccountView(); }catch(e){ console.error('DZ v6',e); } },0);
    };
    injectStyles();
    if(document.getElementById('homeDashboard')) renderHomeDashboard();
  }

  function org(){ return normalizeMoneyOrganization(state.moneyOrganization); }
  function specialMap(ym,key){
    const raw=state.monthAdjustments?.[ym]?.expenseOverrides?.[key];
    return raw && typeof raw==='object' && !Array.isArray(raw) ? raw : {};
  }
  function transferMap(ym){ return specialMap(ym,TRANSFER_KEY); }
  function generalMap(ym){ return specialMap(ym,GENERAL_KEY); }
  function savingsMap(ym){ return specialMap(ym,SAVINGS_KEY); }
  function saveSpecial(ym,key,map){
    const adj=normalizeMonthAdjustmentShape(state.monthAdjustments?.[ym]||{},ym);
    if(map && Object.keys(map).length) adj.expenseOverrides[key]=cloneData(map);
    else delete adj.expenseOverrides[key];
    state.monthAdjustments[ym]=adj;
    touchState();
  }
  function saveGeneral(ym,accountId,amount){
    const map=cloneData(generalMap(ym));
    map[accountId]={amount:Math.max(0,Number(amount||0)),updatedAt:new Date().toISOString(),kind:'observed_balance'};
    saveSpecial(ym,GENERAL_KEY,map);
    setTimeout(()=>renderHomeDashboard(),0);
  }

  function accountKnownBalance(account,ym,transfers,generals){
    let total=Number(generals[account.id]?.amount||0);
    (account.folders||[]).forEach(folder=>{
      const key=`${account.id}|${folder.id}`;
      const transferred=Number(transfers[key]?.amount||0);
      if(folder.actualBalance!==null && folder.actualBalance!==undefined) total+=Number(folder.actualBalance||0);
      else total+=transferred;
    });
    return total;
  }

  function empiricalAdjustment(account,ym,transfers,generals){
    // The base budget engine already removes money allocated to budgets/transfers.
    // Add back the part that still physically exists in the secondary account.
    let delta=Number(generals[account.id]?.amount||0);
    (account.folders||[]).forEach(folder=>{
      const key=`${account.id}|${folder.id}`;
      const transferred=Number(transfers[key]?.amount||0);
      if(folder.actualBalance!==null && folder.actualBalance!==undefined) delta+=Number(folder.actualBalance||0);
      else delta+=transferred;
    });
    return delta;
  }

  function assignmentFor(event,organization){
    if(!event?.itemId) return {accountId:organization.salaryAccountId,folderId:''};
    return organization.assignments?.[event.itemId] || {accountId:organization.salaryAccountId,folderId:''};
  }

  function reconcileAccountView(){
    const root=document.getElementById('homeDashboard'); if(!root) return;
    const organization=org(); if(!organization.enabled) return;
    const summary=buildTodayFinancialSnapshot(new Date());
    const transfers=transferMap(summary.periodYm);
    const generals=generalMap(summary.periodYm);
    const secondary=organization.accounts.filter(a=>a.id!==organization.salaryAccountId);

    const empiricalDelta=secondary.reduce((sum,a)=>sum+empiricalAdjustment(a,summary.periodYm,transfers,generals),0);
    const correctedTotal=Number(summary.potentialNow||0)+empiricalDelta;
    const secondaryTotal=secondary.reduce((sum,a)=>sum+accountKnownBalance(a,summary.periodYm,transfers,generals),0);
    const primaryBalance=correctedTotal-secondaryTotal;

    const hero=root.querySelector('.homeHero');
    const heroValue=hero?.querySelector('.homeHeroValue');
    const heroLabel=hero?.querySelector('.label');
    if(heroLabel) heroLabel.innerHTML=`Dinero total estimado hoy <button class="dzInfoButton" type="button" data-dz-v6-total-info>i</button>`;
    if(heroValue){ heroValue.textContent=euros(correctedTotal); heroValue.classList.remove('dzNeedsBalance'); }
    const hint=hero?.querySelector('.dzV5TotalHint');
    if(hint) hint.textContent='Incluye el dinero que sigue existiendo en BBVA, Revolut y sus carpetas. Mover dinero entre tus cuentas no cambia este total.';

    const salaryCard=root.querySelector('.dzAccountWidget.salary');
    const vals=salaryCard?.querySelectorAll('.dzBalanceMetric strong');
    if(vals?.[0]){ vals[0].textContent=euros(primaryBalance); vals[0].className=primaryBalance>=0?'is-positive':'is-negative'; }
    const primaryFuture=(summary.upcomingCharges||[]).filter(e=>assignmentFor(e,organization).accountId===organization.salaryAccountId).reduce((s,e)=>s+Math.abs(Number(e.amount||0)),0);
    if(vals?.[1]){ const end=primaryBalance-primaryFuture; vals[1].textContent=euros(end); vals[1].className=end>=0?'is-positive':'is-negative'; }
    const subtitle=salaryCard?.querySelector('.dzAccountWidgetHead p');
    if(subtitle) subtitle.textContent='Saldo reconstruido para esta cuenta';

    secondary.forEach(account=>renderSecondaryGeneral(root,account,summary,organization,transfers,generals));
    renderSavingsWarnings(root,summary,organization);

    root.querySelector('[data-dz-v6-total-info]')?.addEventListener('click',()=>{
      openInfo('Cómo se calcula',`DineroZaurio separa dos cosas: el dinero total que todavía existe y dónde está guardado. Una transferencia de BBVA a Revolut cambia la ubicación, no el total. Cuando corriges una carpeta, solo actualizas cuánto queda allí; no se crea otra transferencia salvo que tú la confirmes explícitamente.`);
    });
  }

  function renderSecondaryGeneral(root,account,summary,organization,transfers,generals){
    const card=[...root.querySelectorAll('.dzAccountWidget.secondary')].find(c=>c.querySelector('h3')?.textContent?.trim()===account.name);
    if(!card) return;
    const general=Number(generals[account.id]?.amount||0);
    const known=accountKnownBalance(account,summary.periodYm,transfers,generals);
    const first=card.querySelector('.dzBalanceMetric strong');
    if(first){ first.textContent=euros(known); first.className=known>=0?'is-positive':'is-negative'; }

    const headText=card.querySelector('.dzAccountWidgetHead p');
    if(headText) headText.textContent='Dinero que DineroZaurio sitúa ahora en esta cuenta';

    let grid=card.querySelector('.dzFolderBalances');
    if(!grid){
      grid=document.createElement('div'); grid.className='dzFolderBalances dzFolderMiniGrid';
      card.querySelector('.dzBalancePair')?.insertAdjacentElement('afterend',grid);
    }
    if(!grid.querySelector('[data-dz-general-balance]')){
      const tile=document.createElement('div');
      tile.className='dzFolderMini dzGeneralMini'; tile.tabIndex=0; tile.setAttribute('role','button'); tile.dataset.dzGeneralBalance=account.id;
      grid.prepend(tile);
    }
    const tile=grid.querySelector('[data-dz-general-balance]');
    const futureGeneral=(summary.upcomingCharges||[]).filter(e=>{
      const a=assignmentFor(e,organization); return a.accountId===account.id && !a.folderId;
    });
    const futureTotal=futureGeneral.reduce((s,e)=>s+Math.abs(Number(e.amount||0)),0);
    const shortfall=Math.max(0,futureTotal-general);
    tile.innerHTML=`<span>Disponible sin carpeta</span><strong class="${general>=0?'is-positive':'is-negative'}">${euros(general)}</strong><small>${futureGeneral.length?`${euros(futureTotal)} se cobrarán desde aquí`:'Sin cargos previstos aquí'}</small>`;
    tile.classList.toggle('dzGeneralWarning',shortfall>0.009);
    const open=()=>openGeneralEditor(account,summary.periodYm,general,futureGeneral,futureTotal);
    tile.onclick=open; tile.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};

    let warning=card.querySelector('.dzGeneralAlert');
    if(shortfall>0.009){
      if(!warning){ warning=document.createElement('div'); warning.className='dzGeneralAlert'; grid.insertAdjacentElement('afterend',warning); }
      warning.innerHTML=`<strong>Faltan ${euros(shortfall)} para los próximos cargos</strong><span>${futureGeneral.map(e=>`<b>${escapeHtml(e.name)}</b>`).join(', ')} están configurados para cobrarse de ${escapeHtml(account.name)}, pero el dinero disponible fuera de carpetas no alcanza. Toca “Disponible sin carpeta” para indicar cuánto hay realmente o cambia esos cargos de cuenta/carpeta.</span>`;
    }else warning?.remove();
  }

  function renderSavingsWarnings(root,summary,organization){
    root.querySelectorAll('.dzSavingsPlacementAlert').forEach(n=>n.remove());
    const active=(summary.snapshot?.goalItems||summary.snapshot?.goals||[]).filter(g=>Number(g.monthAmount||g.amount||0)>0.009);
    if(!active.length) return;
    const confirmations=savingsMap(summary.periodYm);
    const unresolved=active.filter(goal=>{
      const assignment=organization.assignments?.[goal.id];
      return !assignment?.accountId || !assignment?.folderId;
    });
    const needsMove=active.filter(goal=>{
      const assignment=organization.assignments?.[goal.id];
      return assignment?.accountId && assignment?.folderId && !confirmations[goal.id]?.moved;
    });
    if(!unresolved.length && !needsMove.length) return;

    const anchor=root.querySelector('.dzInsightsGrid')||root.querySelector('.dzAccountWidgetGrid');
    if(!anchor) return;
    const alert=document.createElement('section');
    alert.className='panel dzSavingsPlacementAlert';
    const rows=[
      ...unresolved.map(goal=>`<div class="dzSavingsAlertRow"><div><strong>${escapeHtml(goal.name)}</strong><span>${euros(goal.monthAmount||goal.amount)} reservados, pero todavía no has indicado dónde guardar ese dinero.</span></div><button type="button" data-dz-savings-place="${escapeHtml(goal.id)}">Elegir destino</button></div>`),
      ...needsMove.map(goal=>{const a=organization.assignments[goal.id];const acc=organization.accounts.find(x=>x.id===a.accountId);const folder=acc?.folders.find(x=>x.id===a.folderId);return `<div class="dzSavingsAlertRow"><div><strong>${escapeHtml(goal.name)}</strong><span>${euros(goal.monthAmount||goal.amount)} deberían estar en ${escapeHtml(acc?.name||'la cuenta')} · ${escapeHtml(folder?.name||'la carpeta')}. Confirma cuando los hayas movido.</span></div><button type="button" data-dz-savings-confirm="${escapeHtml(goal.id)}">Ya lo moví</button></div>`;})
    ].join('');
    alert.innerHTML=`<div class="dzSavingsAlertHead"><div><span class="dzAccountEyebrow">AHORRO</span><h3>Dinero pendiente de ubicar</h3></div></div>${rows}`;
    anchor.insertAdjacentElement('beforebegin',alert);
    alert.querySelectorAll('[data-dz-savings-place]').forEach(btn=>btn.onclick=()=>openSavingsDestination(btn.dataset.dzSavingsPlace,summary.periodYm));
    alert.querySelectorAll('[data-dz-savings-confirm]').forEach(btn=>btn.onclick=()=>confirmSavingsMove(btn.dataset.dzSavingsConfirm,summary.periodYm));
  }

  function openSavingsDestination(goalId,ym){
    const organization=org();
    const goal=(state.goals||[]).find(g=>g.id===goalId); if(!goal) return;
    const options=organization.accounts.flatMap(account=>(account.folders||[]).map(folder=>`<option value="${escapeHtml(account.id)}|${escapeHtml(folder.id)}">${escapeHtml(account.name)} · ${escapeHtml(folder.name)}</option>`)).join('');
    const root=document.getElementById('modalRoot'); root.className='modalRoot';
    root.innerHTML=`<div class="modalCard dzV6Modal"><div class="modalHead"><div><h3>Dónde guardar ${escapeHtml(goal.name)}</h3><div class="sub">Esto define el destino. No marca el dinero como movido todavía.</div></div><button id="dzV6Close" class="dzV5Close" type="button">×</button></div><div class="field"><label>Cuenta y carpeta</label><select id="dzV6SavingsDestination" class="select">${options}</select></div><div class="btnRow" style="margin-top:18px"><button id="dzV6Save" class="btn primary">Guardar destino</button></div></div>`;
    document.getElementById('dzV6Close').onclick=closeModal;
    document.getElementById('dzV6Save').onclick=()=>{
      const [accountId,folderId]=String(document.getElementById('dzV6SavingsDestination').value||'').split('|');
      const next=org(); next.assignments[goalId]={accountId,folderId}; state.moneyOrganization=next; touchState(); closeModal(); setTimeout(()=>renderHomeDashboard(),0);
    };
  }

  function confirmSavingsMove(goalId,ym){
    const map=cloneData(savingsMap(ym));
    map[goalId]={moved:true,confirmedAt:new Date().toISOString()};
    saveSpecial(ym,SAVINGS_KEY,map);
    const organization=org();
    const a=organization.assignments?.[goalId];
    const goal=(state.goals||[]).find(g=>g.id===goalId);
    if(a?.accountId && a?.folderId && goal){
      const transfers=cloneData(transferMap(ym));
      const key=`${a.accountId}|${a.folderId}`;
      transfers[key]={amount:Number(transfers[key]?.amount||0)+Number(getGoalMonthlyCharge(goal,ym,999999999).amount||0),confirmedAt:new Date().toISOString(),source:'savings_goal'};
      saveSpecial(ym,TRANSFER_KEY,transfers);
    }
    setTimeout(()=>renderHomeDashboard(),0);
  }

  function openGeneralEditor(account,ym,current,events,total){
    const rows=events.map(e=>`<div class="dzGeneralCharge"><span><b>${escapeHtml(e.name)}</b></span><strong>${euros(Math.abs(Number(e.amount||0)))}</strong></div>`).join('');
    const root=document.getElementById('modalRoot'); root.className='modalRoot';
    root.innerHTML=`<div class="modalCard dzV6Modal"><div class="modalHead"><div><h3>Dinero sin carpeta · ${escapeHtml(account.name)}</h3><div class="sub">Indica cuánto dinero hay ahora mismo en esta cuenta fuera de las carpetas. Es una observación del saldo actual: no crea una transferencia ni descuenta dinero de BBVA.</div></div><button id="dzV6Close" class="dzV5Close" type="button">×</button></div><div class="dzBalanceBefore"><span>Valor actual</span><strong>${euros(current)}</strong></div><div class="field"><label>Nuevo valor observado</label><input id="dzV6General" class="input" type="number" min="0" step="0.01" value="${current.toFixed(2)}"></div>${events.length?`<div class="dzGeneralUpcoming"><strong>Estos cargos están configurados para salir de este dinero</strong>${rows}<div class="dzGeneralCharge total"><span>Total próximo</span><strong>${euros(total)}</strong></div></div>`:''}<div class="dzV6NoMove">Actualizar este número solo dice dónde está el dinero hoy. No mueve dinero entre tus cuentas.</div><div class="btnRow" style="margin-top:18px"><button id="dzV6Save" class="btn primary">Actualizar saldo observado</button></div></div>`;
    document.getElementById('dzV6Close').onclick=closeModal;
    document.getElementById('dzV6Save').onclick=()=>{ saveGeneral(ym,account.id,Number(document.getElementById('dzV6General').value||0)); closeModal(); };
  }

  function openInfo(title,text){
    const root=document.getElementById('modalRoot'); root.className='modalRoot';
    root.innerHTML=`<div class="modalCard dzV6Modal"><div class="modalHead"><div><h3>${escapeHtml(title)}</h3><div class="sub" style="line-height:1.55">${escapeHtml(text)}</div></div><button id="dzV6Close" class="dzV5Close" type="button">×</button></div></div>`;
    document.getElementById('dzV6Close').onclick=closeModal;
  }

  function injectStyles(){
    if(document.getElementById('dzV6Styles')) return;
    const s=document.createElement('style'); s.id='dzV6Styles';
    s.textContent=`.dzGeneralMini{order:-10}.dzGeneralWarning{border-color:rgba(251,191,36,.45)!important;background:rgba(251,191,36,.09)!important}.dzGeneralAlert{margin-top:10px;padding:12px 13px;border-radius:13px;background:rgba(251,191,36,.09);border:1px solid rgba(251,191,36,.18)}.dzGeneralAlert strong{display:block;color:#ffe084;font-size:12px}.dzGeneralAlert span{display:block;margin-top:4px;color:var(--muted);font-size:11px;line-height:1.55}.dzGeneralAlert b{color:#fff}.dzGeneralUpcoming{margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08)}.dzGeneralUpcoming>strong{display:block;margin-bottom:7px;font-size:12px}.dzGeneralCharge{display:flex;justify-content:space-between;gap:12px;padding:7px 0;font-size:12px}.dzGeneralCharge.total{margin-top:5px;padding-top:9px;border-top:1px solid rgba(255,255,255,.07)}.dzGeneralCharge span{color:var(--muted)}.dzGeneralCharge b{color:#fff}.dzGeneralCharge strong{white-space:nowrap}.dzBalanceBefore{display:flex;justify-content:space-between;align-items:center;padding:11px 12px;margin:5px 0 12px;border-radius:12px;background:rgba(255,255,255,.04)}.dzBalanceBefore span{color:var(--muted);font-size:11px}.dzV6NoMove{margin-top:12px;padding:10px 12px;border-radius:12px;background:rgba(34,211,238,.07);color:#bff7ff;font-size:11px;line-height:1.45}.dzSavingsPlacementAlert{margin:16px 0;border-color:rgba(251,191,36,.2)!important}.dzSavingsAlertHead h3{margin:4px 0 10px}.dzSavingsAlertRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-top:1px solid rgba(255,255,255,.06)}.dzSavingsAlertRow strong{display:block;font-size:12px}.dzSavingsAlertRow span{display:block;margin-top:4px;color:var(--muted);font-size:11px;line-height:1.4}.dzSavingsAlertRow button{border:1px solid rgba(34,211,238,.2);border-radius:999px;background:rgba(34,211,238,.12);color:#bff7ff;padding:8px 10px;font-size:10px;font-weight:900;white-space:nowrap;cursor:pointer}@media(max-width:600px){.dzSavingsAlertRow{align-items:flex-start;flex-direction:column}.dzSavingsAlertRow button{width:100%}}`;
    document.head.appendChild(s);
  }

  window.addEventListener('load',install,{once:true});
  if(document.readyState==='complete') install();
})();