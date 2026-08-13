(() => {
  'use strict';

  const PATCH_VERSION = '2.5-ui-fix-1';
  const CHANGE_LOG_KEY = '__uiChangeLog';
  const TRANSFER_KEY = '__folderTransfers';

  function install(){
    if(window.__DZ_UI_V5__===PATCH_VERSION) return;
    if(typeof renderHomeDashboard!=='function' || typeof normalizeMoneyOrganization!=='function'){
      setTimeout(install,60); return;
    }
    window.__DZ_UI_V5__=PATCH_VERSION;

    const baseRenderHome=renderHomeDashboard;
    renderHomeDashboard=function(){
      baseRenderHome();
      setTimeout(()=>{
        try{ enhanceHome(); }catch(err){ console.error('DZ v5 home',err); }
      },0);
    };

    observeModals();
    observeSettings();
    injectStyles();
    if(document.getElementById('homeDashboard')) renderHomeDashboard();
  }

  function org(){ return normalizeMoneyOrganization(state.moneyOrganization); }
  function monthKey(){ return state.defaultStartMonth || todayMonth(); }
  function clone(v){ return JSON.parse(JSON.stringify(v)); }

  function currentAdjustment(){
    return normalizeMonthAdjustmentShape(state.monthAdjustments?.[monthKey()]||{},monthKey());
  }

  function saveSpecial(key,value){
    const adj=currentAdjustment();
    if(value && ((Array.isArray(value)&&value.length)||(!Array.isArray(value)&&Object.keys(value).length))) adj.expenseOverrides[key]=clone(value);
    else delete adj.expenseOverrides[key];
    state.monthAdjustments[monthKey()]=adj;
  }

  function getSpecial(key){
    const raw=state.monthAdjustments?.[monthKey()]?.expenseOverrides?.[key];
    if(Array.isArray(raw)) return clone(raw);
    return raw && typeof raw==='object' ? clone(raw) : {};
  }

  function recordChange(label,beforeOrg,afterOrg){
    if(JSON.stringify(beforeOrg)===JSON.stringify(afterOrg)) return;
    const log=Array.isArray(getSpecial(CHANGE_LOG_KEY)) ? getSpecial(CHANGE_LOG_KEY) : [];
    log.unshift({ id:uid(), label, at:new Date().toISOString(), beforeOrg:clone(beforeOrg), afterOrg:clone(afterOrg) });
    saveSpecial(CHANGE_LOG_KEY,log.slice(0,50));
    touchState();
  }

  function knownSecondaryBalance(account,periodYm){
    if(account.actualBalance!==null && account.actualBalance!==undefined) return Number(account.actualBalance||0);
    const transfers=(state.monthAdjustments?.[periodYm]?.expenseOverrides?.[TRANSFER_KEY]||{});
    return (account.folders||[]).reduce((sum,folder)=>{
      if(folder.actualBalance!==null && folder.actualBalance!==undefined) return sum+Number(folder.actualBalance||0);
      const rec=transfers[`${account.id}|${folder.id}`];
      return sum+Number(rec?.amount||0);
    },0);
  }

  function enhanceHome(){
    const root=document.getElementById('homeDashboard');
    if(!root) return;
    const organization=org();
    if(!organization.enabled) return;
    const summary=buildTodayFinancialSnapshot(new Date());
    const salary=organization.accounts.find(a=>a.id===organization.salaryAccountId);
    const secondary=organization.accounts.filter(a=>a.id!==organization.salaryAccountId);
    const secondaryTotal=secondary.reduce((s,a)=>s+knownSecondaryBalance(a,summary.periodYm),0);

    let primaryKnown=salary?.actualBalance!==null && salary?.actualBalance!==undefined;
    let primary=primaryKnown ? Number(salary.actualBalance||0) : null;
    const total = primaryKnown ? primary+secondaryTotal : null;

    const hero=root.querySelector('.homeHero');
    const heroValue=hero?.querySelector('.homeHeroValue');
    const heroLabel=hero?.querySelector('.label');
    if(heroLabel) heroLabel.innerHTML=`Dinero total entre cuentas <button class="dzInfoButton" type="button" data-dz-v5-total-info>i</button>`;
    if(heroValue){
      heroValue.textContent=total===null?'Completa BBVA':euros(total);
      heroValue.classList.toggle('dzNeedsBalance',total===null);
    }
    let hint=hero?.querySelector('.dzV5TotalHint');
    if(!hint && hero){ hint=document.createElement('div'); hint.className='dzV5TotalHint'; hero.appendChild(hint); }
    if(hint) hint.textContent=total===null ? `Para que el total sea fiable, informa el saldo real de ${salary?.name||'la cuenta principal'}. Revolut conocido: ${euros(secondaryTotal)}.` : `${euros(primary)} en ${salary.name} + ${euros(secondaryTotal)} en cuentas secundarias.`;

    root.querySelector('[data-dz-v5-total-info]')?.addEventListener('click',()=>{
      simpleModal('Dinero total entre cuentas', total===null ? 'No lo mostramos como cifra exacta mientras falte el saldo real de la cuenta principal.' : 'Es la suma de los saldos actuales conocidos de todas tus cuentas. Corregir una carpeta no mueve dinero automáticamente entre bancos.', '', null, 'Cerrar');
    });

    // Make secondary account headline reflect the folder balances that are actually known.
    secondary.forEach(account=>{
      const card=[...root.querySelectorAll('.dzAccountWidget.secondary')].find(c=>c.querySelector('h3')?.textContent?.trim()===account.name);
      if(!card) return;
      const current=knownSecondaryBalance(account,summary.periodYm);
      const first=card.querySelector('.dzBalanceMetric strong');
      if(first){ first.textContent=euros(current); first.className=current>=0?'is-positive':'is-negative'; }
    });
  }

  function observeModals(){
    const observer=new MutationObserver(()=>{
      document.querySelectorAll('.dzV4Modal,.dzV3Modal,.modalCard').forEach(modal=>{
        if(modal.dataset.dzV5Enhanced==='1') return;
        modal.dataset.dzV5Enhanced='1';
        const close=modal.querySelector('#dzV4Close,#dzV3Close,#closeModalBtn,.btn.danger');
        if(close){ close.classList.add('dzV5Close'); close.textContent='×'; close.setAttribute('aria-label','Cerrar'); }
        boldFinancialNames(modal);
      });
    });
    observer.observe(document.body,{subtree:true,childList:true});
  }

  function boldFinancialNames(modal){
    const narrative=modal.querySelector('.dzV4Narrative');
    if(!narrative || narrative.dataset.dzBolded==='1') return;
    narrative.dataset.dzBolded='1';
    let html=escapeHtml(narrative.textContent||'');
    const names=new Set([
      ...(state.expenses||[]).map(x=>x.name).filter(Boolean),
      ...Object.values(state.monthAdjustments||{}).flatMap(a=>(a.oneOffExpenses||[]).map(x=>x.name)).filter(Boolean)
    ]);
    [...names].sort((a,b)=>b.length-a.length).forEach(name=>{
      const safe=escapeHtml(name);
      html=html.split(safe).join(`<strong>${safe}</strong>`);
    });
    narrative.innerHTML=html;
  }

  function observeSettings(){
    const observer=new MutationObserver(()=>injectSettingsPanels());
    observer.observe(document.body,{subtree:true,childList:true});
    injectSettingsPanels();
  }

  function injectSettingsPanels(){
    const tab=document.getElementById('tab-config');
    if(!tab || tab.querySelector('.dzV5SettingsPanel')) return;

    const panel=document.createElement('section');
    panel.className='panel dzV5SettingsPanel';
    panel.innerHTML=`<div class="section-title"><div><h2>Cuentas y carpetas</h2><div class="sub">Edita nombres, crea carpetas nuevas o elimina las que ya no usas.</div></div></div><div class="dzV5FolderManager"></div>`;
    tab.appendChild(panel);

    const log=document.createElement('section');
    log.className='panel dzV5ChangeLog';
    log.innerHTML=`<div class="section-title"><div><h2>Historial de cambios</h2><div class="sub">Cambios recientes de cuentas y carpetas. Puedes revertirlos.</div></div></div><div class="dzV5LogList"></div>`;
    tab.appendChild(log);
    renderFolderManager();
    renderChangeLog();
  }

  function renderFolderManager(){
    const host=document.querySelector('.dzV5FolderManager');
    if(!host) return;
    const organization=org();
    host.innerHTML=organization.accounts.map(account=>`<div class="dzV5AccountManage"><div class="dzV5AccountManageHead"><strong>${escapeHtml(account.name)}</strong>${account.id===organization.salaryAccountId?'<span>Principal</span>':''}</div><div class="dzV5FolderManageGrid">${(account.folders||[]).map(folder=>`<button type="button" data-dz-manage-folder="${escapeHtml(account.id)}|${escapeHtml(folder.id)}"><span>${escapeHtml(folder.name)}</span><small>Editar</small></button>`).join('')}<button type="button" class="add" data-dz-add-folder="${escapeHtml(account.id)}"><span>＋ Nueva carpeta</span></button></div></div>`).join('');

    host.querySelectorAll('[data-dz-manage-folder]').forEach(btn=>btn.onclick=()=>{
      const [accountId,folderId]=btn.dataset.dzManageFolder.split('|'); openFolderManager(accountId,folderId);
    });
    host.querySelectorAll('[data-dz-add-folder]').forEach(btn=>btn.onclick=()=>openAddFolder(btn.dataset.dzAddFolder));
  }

  function openFolderManager(accountId,folderId){
    const organization=org();
    const account=organization.accounts.find(a=>a.id===accountId);
    const folder=account?.folders.find(f=>f.id===folderId);
    if(!account||!folder) return;
    simpleModal('Editar carpeta','',`<div class="field"><label>Nombre</label><input id="dzV5FolderName" class="input" value="${escapeHtml(folder.name)}"></div><button id="dzV5DeleteFolder" class="btn danger" type="button" style="margin-top:14px">Eliminar carpeta</button>`,()=>{
      const before=clone(organization);
      folder.name=document.getElementById('dzV5FolderName').value.trim()||folder.name;
      state.moneyOrganization=organization;
      recordChange(`Carpeta renombrada a ${folder.name}`,before,organization);
      renderFolderManager();
    });
    document.getElementById('dzV5DeleteFolder').onclick=()=>{
      if(!confirm(`¿Eliminar la carpeta ${folder.name}?`)) return;
      const before=clone(organization);
      account.folders=account.folders.filter(f=>f.id!==folderId);
      Object.values(organization.assignments||{}).forEach(assignment=>{ if(assignment.accountId===accountId && assignment.folderId===folderId) assignment.folderId=''; });
      state.moneyOrganization=organization;
      recordChange(`Carpeta eliminada: ${folder.name}`,before,organization);
      closeModal(); renderFolderManager();
    };
  }

  function openAddFolder(accountId){
    const organization=org();
    const account=organization.accounts.find(a=>a.id===accountId);
    if(!account) return;
    simpleModal(`Nueva carpeta en ${account.name}`,'',`<div class="field"><label>Nombre</label><input id="dzV5NewFolderName" class="input" placeholder="Ej. Regalos"></div>`,()=>{
      const name=document.getElementById('dzV5NewFolderName').value.trim(); if(!name) return;
      const before=clone(organization);
      account.folders.push({id:uid(),name,actualBalance:null,balanceUpdatedAt:''});
      state.moneyOrganization=organization;
      recordChange(`Carpeta creada: ${name}`,before,organization);
      renderFolderManager();
    });
  }

  function renderChangeLog(){
    const host=document.querySelector('.dzV5LogList'); if(!host) return;
    const log=Array.isArray(getSpecial(CHANGE_LOG_KEY))?getSpecial(CHANGE_LOG_KEY):[];
    host.innerHTML=log.length?log.map(entry=>`<div class="dzV5LogRow"><div><strong>${escapeHtml(entry.label)}</strong><span>${new Date(entry.at).toLocaleString('es-ES')}</span></div><button type="button" data-dz-revert="${escapeHtml(entry.id)}">Revertir</button></div>`).join(''):'<div class="empty">Todavía no hay cambios registrados desde esta versión.</div>';
    host.querySelectorAll('[data-dz-revert]').forEach(btn=>btn.onclick=()=>{
      const currentLog=Array.isArray(getSpecial(CHANGE_LOG_KEY))?getSpecial(CHANGE_LOG_KEY):[];
      const entry=currentLog.find(x=>x.id===btn.dataset.dzRevert); if(!entry) return;
      if(!confirm(`¿Revertir “${entry.label}”?`)) return;
      state.moneyOrganization=normalizeMoneyOrganization(entry.beforeOrg);
      const nextLog=currentLog.filter(x=>x.id!==entry.id);
      saveSpecial(CHANGE_LOG_KEY,nextLog);
      touchState(); renderFolderManager(); renderChangeLog(); renderHomeDashboard();
    });
  }

  function simpleModal(title,subtitle,body,onSave,saveLabel='Guardar'){
    const root=document.getElementById('modalRoot'); root.className='modalRoot';
    root.innerHTML=`<div class="modalCard dzV5Modal"><div class="modalHead"><div><h3>${escapeHtml(title)}</h3>${subtitle?`<div class="sub">${escapeHtml(subtitle)}</div>`:''}</div><button id="dzV5Close" class="dzV5Close" type="button" aria-label="Cerrar">×</button></div>${body}${onSave?`<div class="btnRow" style="margin-top:18px"><button id="dzV5Save" class="btn primary" type="button">${escapeHtml(saveLabel)}</button></div>`:''}</div>`;
    document.getElementById('dzV5Close').onclick=closeModal;
    if(onSave) document.getElementById('dzV5Save').onclick=()=>{ onSave(); closeModal(); };
  }

  function injectStyles(){
    if(document.getElementById('dzUiV5Styles')) return;
    const style=document.createElement('style'); style.id='dzUiV5Styles';
    style.textContent=`
      .dzV5Close{position:absolute!important;right:14px!important;top:14px!important;width:36px!important;height:36px!important;padding:0!important;border-radius:50%!important;border:1px solid rgba(255,255,255,.12)!important;background:rgba(255,255,255,.08)!important;color:#fff!important;font-size:25px!important;line-height:1!important;display:grid!important;place-items:center!important}.modalCard{position:relative}.modalHead{padding-right:48px!important}.dzV4Narrative strong{color:#fff;font-weight:900}.dzV5TotalHint{margin-top:12px;color:var(--muted);font-size:12px;line-height:1.45}.dzNeedsBalance{font-size:30px!important;color:#fbbf24!important}
      .dzV5AccountManage{padding:13px;border-radius:16px;background:rgba(255,255,255,.025);border:1px solid var(--line);margin-top:10px}.dzV5AccountManageHead{display:flex;align-items:center;justify-content:space-between;gap:10px}.dzV5AccountManageHead span{font-size:10px;color:var(--muted);text-transform:uppercase}.dzV5FolderManageGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.dzV5FolderManageGrid button{min-width:0;padding:11px;border-radius:13px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:#fff;text-align:left;cursor:pointer}.dzV5FolderManageGrid button span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:800}.dzV5FolderManageGrid button small{display:block;margin-top:4px;color:var(--muted)}.dzV5FolderManageGrid button.add{border-style:dashed;color:#bff7ff}.dzV5LogList{display:grid;gap:8px;margin-top:12px}.dzV5LogRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 12px;border-radius:13px;background:rgba(255,255,255,.035)}.dzV5LogRow strong{display:block;font-size:12px}.dzV5LogRow span{display:block;margin-top:3px;color:var(--muted);font-size:10px}.dzV5LogRow button{border:1px solid rgba(255,255,255,.1);border-radius:999px;background:rgba(255,255,255,.06);color:#fff;padding:7px 10px;font-size:10px;font-weight:850;cursor:pointer}
      @media(max-width:650px){#dzUniversalAdd{position:fixed!important;right:18px!important;bottom:calc(18px + env(safe-area-inset-bottom))!important;z-index:260!important;width:54px!important;height:54px!important;box-shadow:0 16px 34px rgba(255,0,170,.38)!important}.dzUniversalMenu{position:fixed!important;right:14px!important;bottom:calc(82px + env(safe-area-inset-bottom))!important;top:auto!important;z-index:261!important}.dzV5FolderManageGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.dzV5Close{right:10px!important;top:10px!important}.modalHead{padding-right:44px!important}}
    `;
    document.head.appendChild(style);
  }

  window.addEventListener('load',install,{once:true});
  if(document.readyState==='complete') install();
})();