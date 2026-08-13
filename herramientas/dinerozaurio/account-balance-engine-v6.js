(() => {
  'use strict';

  const PATCH_VERSION='2.6-account-balance-1';
  const TRANSFER_KEY='__folderTransfers';
  const GENERAL_KEY='__accountGeneralBalances';

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
  function transferMap(ym){
    const raw=state.monthAdjustments?.[ym]?.expenseOverrides?.[TRANSFER_KEY];
    return raw && typeof raw==='object' && !Array.isArray(raw) ? raw : {};
  }
  function generalMap(ym){
    const raw=state.monthAdjustments?.[ym]?.expenseOverrides?.[GENERAL_KEY];
    return raw && typeof raw==='object' && !Array.isArray(raw) ? raw : {};
  }
  function saveGeneral(ym,accountId,amount){
    const adj=normalizeMonthAdjustmentShape(state.monthAdjustments?.[ym]||{},ym);
    const map=adj.expenseOverrides?.[GENERAL_KEY] && typeof adj.expenseOverrides[GENERAL_KEY]==='object' ? cloneData(adj.expenseOverrides[GENERAL_KEY]) : {};
    map[accountId]={amount:Math.max(0,Number(amount||0)),updatedAt:new Date().toISOString()};
    adj.expenseOverrides[GENERAL_KEY]=map;
    state.monthAdjustments[ym]=adj;
    touchState();
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
    let delta=Number(generals[account.id]?.amount||0);
    (account.folders||[]).forEach(folder=>{
      const key=`${account.id}|${folder.id}`;
      const transferred=Number(transfers[key]?.amount||0);
      if(folder.actualBalance!==null && folder.actualBalance!==undefined){
        delta+=Number(folder.actualBalance||0)-transferred;
      }
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
    if(hint) hint.textContent=`Suma reconstruida entre cuentas. Ajuste empírico por saldos reales de carpetas: ${empiricalDelta>=0?'+':'−'}${euros(Math.abs(empiricalDelta))}.`;

    const salary=organization.accounts.find(a=>a.id===organization.salaryAccountId);
    const salaryCard=root.querySelector('.dzAccountWidget.salary');
    const vals=salaryCard?.querySelectorAll('.dzBalanceMetric strong');
    if(vals?.[0]){ vals[0].textContent=euros(primaryBalance); vals[0].className=primaryBalance>=0?'is-positive':'is-negative'; }
    const primaryFuture=(summary.upcomingCharges||[]).filter(e=>assignmentFor(e,organization).accountId===organization.salaryAccountId).reduce((s,e)=>s+Math.abs(Number(e.amount||0)),0);
    if(vals?.[1]){ const end=primaryBalance-primaryFuture; vals[1].textContent=euros(end); vals[1].className=end>=0?'is-positive':'is-negative'; }
    const subtitle=salaryCard?.querySelector('.dzAccountWidgetHead p');
    if(subtitle) subtitle.textContent='Calculado a partir del total del periodo y del dinero conocido en las otras cuentas';

    secondary.forEach(account=>renderSecondaryGeneral(root,account,summary,organization,transfers,generals));

    root.querySelector('[data-dz-v6-total-info]')?.addEventListener('click',()=>{
      openInfo('Cómo se calcula el total',`DineroZaurio parte del total matemático del periodo y lo corrige con diferencias empíricas de cuentas secundarias. Si una carpeta tenía 200 € transferidos y ahora quedan 133,14 €, se interpreta que 66,86 € ya se gastaron. Si aparece dinero que ya estaba en Revolut y no procedía de una transferencia registrada, se suma como saldo preexistente.`);
    });
  }

  function renderSecondaryGeneral(root,account,summary,organization,transfers,generals){
    const card=[...root.querySelectorAll('.dzAccountWidget.secondary')].find(c=>c.querySelector('h3')?.textContent?.trim()===account.name);
    if(!card) return;
    const general=Number(generals[account.id]?.amount||0);
    const known=accountKnownBalance(account,summary.periodYm,transfers,generals);
    const first=card.querySelector('.dzBalanceMetric strong');
    if(first){ first.textContent=euros(known); first.className=known>=0?'is-positive':'is-negative'; }

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
    tile.innerHTML=`<span>Saldo general</span><strong class="${general>=0?'is-positive':'is-negative'}">${euros(general)}</strong><small>${futureGeneral.length?`${futureGeneral.length} cargo${futureGeneral.length===1?'':'s'} próximo${futureGeneral.length===1?'':'s'} · ${euros(futureTotal)}`:'Sin cargos próximos'}</small>`;
    if(futureTotal>general+0.009) tile.classList.add('dzGeneralWarning'); else tile.classList.remove('dzGeneralWarning');
    const open=()=>openGeneralEditor(account,summary.periodYm,general,futureGeneral,futureTotal);
    tile.onclick=open; tile.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};

    let warning=card.querySelector('.dzGeneralAlert');
    if(futureTotal>general+0.009){
      if(!warning){ warning=document.createElement('div'); warning.className='dzGeneralAlert'; grid.insertAdjacentElement('afterend',warning); }
      warning.innerHTML=`<strong>Saldo general insuficiente</strong><span>Hay ${euros(futureTotal)} previstos fuera de carpetas y solo ${euros(general)} disponibles en saldo general.</span>`;
    }else warning?.remove();
  }

  function openGeneralEditor(account,ym,current,events,total){
    const rows=events.map(e=>`<div class="dzGeneralCharge"><span>${escapeHtml(e.name)}</span><strong>${euros(Math.abs(Number(e.amount||0)))}</strong></div>`).join('');
    const root=document.getElementById('modalRoot'); root.className='modalRoot';
    root.innerHTML=`<div class="modalCard dzV6Modal"><div class="modalHead"><div><h3>Saldo general · ${escapeHtml(account.name)}</h3><div class="sub">Dinero que está en la cuenta pero no dentro de una carpeta.</div></div><button id="dzV6Close" class="dzV5Close" type="button">×</button></div><div class="field"><label>Saldo general actual</label><input id="dzV6General" class="input" type="number" min="0" step="0.01" value="${current.toFixed(2)}"></div>${events.length?`<div class="dzGeneralUpcoming"><strong>Próximos cargos desde saldo general</strong>${rows}<div class="dzGeneralCharge total"><span>Total previsto</span><strong>${euros(total)}</strong></div></div>`:''}<div class="btnRow" style="margin-top:18px"><button id="dzV6Save" class="btn primary">Guardar</button></div></div>`;
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
    s.textContent=`.dzGeneralMini{order:-10}.dzGeneralWarning{border-color:rgba(251,191,36,.45)!important;background:rgba(251,191,36,.09)!important}.dzGeneralAlert{margin-top:10px;padding:11px 12px;border-radius:13px;background:rgba(251,191,36,.09);border:1px solid rgba(251,191,36,.18)}.dzGeneralAlert strong{display:block;color:#ffe084;font-size:12px}.dzGeneralAlert span{display:block;margin-top:4px;color:var(--muted);font-size:11px;line-height:1.4}.dzGeneralUpcoming{margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08)}.dzGeneralUpcoming>strong{display:block;margin-bottom:7px;font-size:12px}.dzGeneralCharge{display:flex;justify-content:space-between;gap:12px;padding:7px 0;font-size:12px}.dzGeneralCharge.total{margin-top:5px;padding-top:9px;border-top:1px solid rgba(255,255,255,.07)}.dzGeneralCharge span{color:var(--muted)}.dzGeneralCharge strong{white-space:nowrap}`;
    document.head.appendChild(s);
  }

  window.addEventListener('load',install,{once:true});
  if(document.readyState==='complete') install();
})();