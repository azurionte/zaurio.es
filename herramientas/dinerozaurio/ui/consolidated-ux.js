(()=>{
  'use strict';

  const VERSION='consolidated-ux-1';
  if(window.__DINEROZAURIO_CONSOLIDATED_UX__===VERSION)return;
  window.__DINEROZAURIO_CONSOLIDATED_UX__=VERSION;

  const C=()=>window.DineroZaurioAccountingCore;
  const O=()=>normalizeMoneyOrganization(state.moneyOrganization);
  const S=()=>buildTodayFinancialSnapshot(new Date());
  const escape=value=>typeof escapeHtml==='function'?escapeHtml(String(value??'')):String(value??'');

  function resolve(){
    const s=S(),o=O();
    return C().resolveAccountState({
      organization:o,
      periodYm:s.periodYm,
      asOf:s.asOf||new Date(),
      events:s.snapshot?.events||[],
      futureEvents:s.upcomingCharges||[],
      monthAdjustments:state.monthAdjustments||{},
      potentialNow:s.potentialNow
    });
  }

  function fmtDate(value){return new Date(value).toLocaleDateString('es-ES',{day:'numeric',month:'short'});}
  function longDate(value){return new Date(value).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'});}
  function assignment(event,o){return o.assignments?.[event.itemId]||{accountId:o.salaryAccountId,folderId:''};}

  function folderHtml(entry){
    if(!entry.folders?.length)return'';
    return `<div class="dzCxFolders"><div class="dzCxMiniTitle">Carpetas</div><div class="dzCxFolderGrid">${entry.folders.map(folder=>`<button type="button" class="dzCxFolder" data-dz-cx-folder="${escape(folder.id)}"><span>${escape(folder.label)}</span><strong class="${folder.current>=0?'is-positive':'is-negative'}">${euros(folder.current)}</strong><small>${folder.observed!==null?'Actualizado por ti':'Según tus movimientos'}</small></button>`).join('')}</div></div>`;
  }

  function chargesHtml(entry,s,o){
    const rows=(s.upcomingCharges||[]).filter(event=>assignment(event,o).accountId===entry.account.id).slice(0,4);
    if(!rows.length)return'';
    return `<div class="dzCxCharges"><div class="dzCxMiniTitle">Próximos cargos</div>${rows.map(event=>`<div class="dzCxCharge"><span>${fmtDate(event.date)}</span><div><strong>${escape(event.name)}</strong><small>${escape(event.type||'Cargo')}</small></div><strong>−${euros(Math.abs(Number(event.amount||0)))}</strong></div>`).join('')}</div>`;
  }

  function accountCard(entry,s,o,isSalary){
    return `<article class="dzCxAccount ${isSalary?'salary':'secondary'}"><div class="dzCxAccountHead"><div><span class="dzCxEyebrow">${isSalary?'CUENTA PRINCIPAL':'CUENTA SECUNDARIA'}</span><h3>${escape(entry.account.name)}</h3></div></div><div class="dzCxMetrics"><div><span>${isSalary?'Saldo':`Saldo ${escape(entry.account.name)} total`}</span><strong class="${entry.current>=0?'is-positive':'is-negative'}">${euros(entry.current)}</strong></div><div><span>Antes de próxima nómina</span><strong class="${entry.projected>=0?'is-positive':'is-negative'}">${euros(entry.projected)}</strong></div></div>${!isSalary&&entry.general?`<div class="dzCxGeneral"><div class="dzCxMiniTitle">Disponible</div><div><span>Saldo libre</span><strong class="${entry.general.current>=0?'is-positive':'is-negative'}">${euros(entry.general.current)}</strong><small>Dinero sin asignar a carpetas</small></div></div>`:''}${folderHtml(entry)}${chargesHtml(entry,s,o)}</article>`;
  }

  function renderHome(){
    const root=document.getElementById('homeDashboard'),o=O();
    if(!root||!o.enabled)return;
    const s=S(),m=resolve();
    const hero=root.querySelector('.homeHero');
    if(hero){
      const label=hero.querySelector('.label'),value=hero.querySelector('.homeHeroValue'),sub=hero.querySelector('.sub'),mode=hero.querySelector('.modeIndicator');
      if(label)label.textContent='Dinero total estimado hoy';
      if(value)value.textContent=euros(m.total);
      if(sub)sub.textContent=`Periodo actual: ${longDate(s.periodStart)} — ${longDate(s.periodEnd)}`;
      if(mode){mode.textContent='Modo carpetas activado';mode.classList.add('dzCxModeBadge');}
    }
    const grid=root.querySelector('.homeGrid,.dzAccountWidgetGrid');
    if(grid){
      grid.className='dzCxAccountGrid';
      grid.innerHTML=[m.primary,...m.secondary].filter(Boolean).map((entry,index)=>accountCard(entry,s,o,index===0)).join('');
    }
    root.querySelector('.organizationSection')?.remove();
    root.querySelector('.reconcileBanner')?.remove();
    root.querySelectorAll('.panel').forEach(panel=>{if(panel.querySelector('h2')?.textContent?.trim()==='Próximos cargos')panel.remove();});
    renderShortfalls(root,s,o,m);
    bindFolderUpdates(root,o,m);
  }

  function renderShortfalls(root,s,o,m){
    root.querySelectorAll('.dzCxFundingAlert').forEach(node=>node.remove());
    m.secondary.forEach(entry=>{
      const shortfall=Math.max(0,-Number(entry.general?.projected||0));
      if(shortfall<=0.009)return;
      const card=[...root.querySelectorAll('.dzCxAccount.secondary')].find(node=>node.querySelector('h3')?.textContent?.trim()===entry.account.name);
      if(!card)return;
      const alert=document.createElement('div');
      alert.className='dzCxFundingAlert';
      alert.innerHTML=`<div><strong>Hay cargos sin dinero preparado</strong><span>Faltan ${euros(shortfall)} en el saldo libre proyectado.</span></div><button type="button">Resolver</button>`;
      card.appendChild(alert);
      alert.querySelector('button').onclick=()=>openFunding(entry,s,o,shortfall);
    });
  }

  function specialMap(ym,key){const value=state.monthAdjustments?.[ym]?.expenseOverrides?.[key];return value&&typeof value==='object'&&!Array.isArray(value)?cloneData(value):{};}
  function saveSpecial(ym,key,value){const adjustment=normalizeMonthAdjustmentShape(state.monthAdjustments?.[ym]||{},ym);if(value&&Object.keys(value).length)adjustment.expenseOverrides[key]=cloneData(value);else delete adjustment.expenseOverrides[key];state.monthAdjustments[ym]=adjustment;touchState();}
  function appendTransfer(ym,accountId,folderId,amount,source){const core=C(),key=folderId?core.KEYS.folderTransfers:core.KEYS.generalTransfers,id=folderId?`${accountId}|${folderId}`:accountId,map=specialMap(ym,key),entries=core.transferEntries(map[id]||{});entries.push({amount:core.round2(amount),confirmedAt:new Date().toISOString(),source});map[id]={entries,kind:'internal_transfer'};saveSpecial(ym,key,map);}
  function persist(){if(typeof persistAndRefresh==='function')persistAndRefresh().catch(console.error);else renderHomeDashboard();}

  function openFunding(entry,s,o,shortfall){
    const salary=o.accounts.find(a=>a.id===o.salaryAccountId),root=document.getElementById('modalRoot');
    root.className='modalRoot';
    root.innerHTML=`<div class="modalCard dzCxModal"><div class="modalHead"><div><span class="dzCxEyebrow">CUENTAS</span><h3>Preparar dinero para próximos cargos</h3><div class="sub">Confirma solo después de hacer la transferencia real desde ${escape(salary?.name||'la cuenta principal')} a ${escape(entry.account.name)}.</div></div><button class="dzCxClose" type="button">×</button></div><div class="dzCxFundingSummary"><div><span>Saldo libre ahora</span><strong>${euros(entry.general.current)}</strong></div><div><span>Saldo proyectado</span><strong class="is-negative">${euros(entry.general.projected)}</strong></div><div><span>Falta preparar</span><strong>${euros(shortfall)}</strong></div></div><div class="dzCxActions"><button class="btn primary" data-dz-cx-fund type="button">Ya transferí ${euros(shortfall)}</button></div></div>`;
    root.querySelector('.dzCxClose').onclick=closeModal;
    root.querySelector('[data-dz-cx-fund]').onclick=()=>{appendTransfer(s.periodYm,entry.account.id,'',shortfall,'funding_resolver');closeModal();persist();};
  }

  function bindFolderUpdates(root,o,m){
    root.querySelectorAll('[data-dz-cx-folder]').forEach(button=>{
      const bucket=m.secondary.flatMap(entry=>entry.folders||[]).find(item=>item.id===button.dataset.dzCxFolder);
      if(!bucket)return;
      button.onclick=()=>openFolderUpdate(bucket,o);
    });
  }

  function openFolderUpdate(bucket,o){
    const account=o.accounts.find(a=>a.id===bucket.accountId),folder=account?.folders.find(f=>f.id===bucket.folderId);if(!folder)return;
    const root=document.getElementById('modalRoot');root.className='modalRoot';
    root.innerHTML=`<div class="modalCard dzCxModal"><div class="modalHead"><div><span class="dzCxEyebrow">CARPETA</span><h3>Actualizar saldo · ${escape(bucket.label)}</h3><div class="sub">Ahora mismo hay ${euros(bucket.current)} según DineroZaurio.</div></div><button class="dzCxClose" type="button">×</button></div><div class="field"><label>Nuevo saldo de la carpeta</label><input id="dzCxFolderValue" class="input" type="number" step="0.01" min="0" value="${Number(bucket.current||0).toFixed(2)}"></div><div class="dzCxInfo">Actualizar el saldo describe la realidad observada; no mueve dinero entre cuentas.</div><div class="dzCxActions"><button class="btn primary" data-dz-cx-save-folder>Guardar</button></div></div>`;
    root.querySelector('.dzCxClose').onclick=closeModal;
    root.querySelector('[data-dz-cx-save-folder]').onclick=()=>{folder.actualBalance=C().round2(root.querySelector('#dzCxFolderValue').value);folder.balanceUpdatedAt=new Date().toISOString();state.moneyOrganization=o;touchState();closeModal();persist();};
  }

  function installUniversalAdd(){
    const root=document.getElementById('homeDashboard');if(!root)return;
    const old=root.querySelector('#addMissingExpensesBtn,#dzUniversalAdd');if(!old)return;
    const button=old.cloneNode(false);button.id='dzUniversalAdd';button.className='dzCxAdd';button.type='button';button.innerHTML='<span>+</span>';old.replaceWith(button);
    const menu=document.createElement('div');menu.className='dzUniversalMenu dzCxMenu';menu.innerHTML=`<button type="button" data-dz-add="expense"><i>↗</i><span><strong>Gasto</strong><small>Compra, recibo o presupuesto</small></span></button><button type="button" data-dz-add="income"><i>↘</i><span><strong>Ingreso</strong><small>Nómina u otra entrada</small></span></button><button type="button" data-dz-add="debt"><i>▤</i><span><strong>Deuda</strong><small>Préstamo o financiación pendiente</small></span></button><button type="button" data-dz-add="goal"><i>◎</i><span><strong>Ahorro</strong><small>Objetivo o aportación</small></span></button>`;button.parentElement?.appendChild(menu);
    button.onclick=()=>menu.classList.toggle('open');
    menu.querySelectorAll('[data-dz-add]').forEach(action=>action.onclick=()=>{menu.classList.remove('open');const type=action.dataset.dzAdd;if(typeof openCollectionManager==='function'){openCollectionManager(type);setTimeout(()=>document.getElementById('managerAddItemBtn')?.click(),0);}});
  }

  function styles(){
    if(document.getElementById('dzConsolidatedUxStyles'))return;
    const style=document.createElement('style');style.id='dzConsolidatedUxStyles';style.textContent=`
      .dzCxAccountGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:16px 0}.dzCxAccount{padding:20px;border-radius:22px;border:1px solid rgba(255,255,255,.11);background:linear-gradient(145deg,rgba(23,31,62,.96),rgba(11,15,35,.96));box-shadow:0 18px 44px rgba(0,0,0,.2)}.dzCxAccount.secondary{background:linear-gradient(145deg,rgba(10,43,58,.94),rgba(10,18,37,.98))}.dzCxAccountHead h3{margin:4px 0 5px;font-size:21px}.dzCxEyebrow{font-size:10px;letter-spacing:.12em;font-weight:900;color:#9fe8f5}.dzCxMetrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:17px}.dzCxMetrics>div{padding:15px;border-radius:16px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.065)}.dzCxMetrics span,.dzCxGeneral span{display:block;color:var(--muted);font-size:11px;font-weight:800}.dzCxMetrics strong{display:block;font-size:28px;margin-top:8px}.dzCxMiniTitle{font-size:10px;font-weight:900;color:rgba(255,255,255,.58);text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px}.dzCxGeneral,.dzCxFolders,.dzCxCharges{margin-top:15px;padding-top:13px;border-top:1px solid rgba(255,255,255,.08)}.dzCxGeneral>div:last-child{padding:10px;border-radius:14px;background:rgba(255,255,255,.035)}.dzCxGeneral strong{display:block;margin-top:4px;font-size:18px}.dzCxGeneral small{display:block;margin-top:4px;color:var(--muted);font-size:10px}.dzCxFolderGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.dzCxFolder{padding:11px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);color:#fff;text-align:left;cursor:pointer}.dzCxFolder span,.dzCxFolder strong,.dzCxFolder small{display:block}.dzCxFolder span{font-size:11px;font-weight:900}.dzCxFolder strong{font-size:18px;margin-top:5px}.dzCxFolder small{margin-top:4px;color:var(--muted);font-size:10px}.dzCxCharge{display:grid;grid-template-columns:62px minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 2px;border-bottom:1px solid rgba(255,255,255,.06)}.dzCxCharge>span,.dzCxCharge small{color:var(--muted);font-size:10px}.dzCxCharge div strong,.dzCxCharge div small{display:block}.dzCxFundingAlert{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;padding:11px 12px;border-radius:13px;background:rgba(251,191,36,.09);border:1px solid rgba(251,191,36,.18)}.dzCxFundingAlert strong{display:block;color:#ffe084;font-size:12px}.dzCxFundingAlert span{display:block;margin-top:4px;color:var(--muted);font-size:11px}.dzCxFundingAlert button{border:1px solid rgba(251,191,36,.25);border-radius:999px;background:rgba(251,191,36,.13);color:#ffe084;padding:8px 11px;font-size:10px;font-weight:900}.dzCxModeBadge{opacity:.82}.dzCxModal{width:min(760px,94vw)!important;background:linear-gradient(180deg,#111a39,#0b1126)!important;border:1px solid rgba(148,163,255,.22)!important;border-radius:26px!important}.dzCxClose{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.055);color:#fff;font-size:27px}.dzCxFundingSummary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.dzCxFundingSummary>div{padding:11px;border-radius:12px;background:rgba(255,255,255,.04)}.dzCxFundingSummary span{display:block;color:var(--muted);font-size:10px}.dzCxFundingSummary strong{display:block;margin-top:5px}.dzCxActions{display:flex;justify-content:flex-end;margin-top:18px}.dzCxInfo{margin-top:12px;padding:10px 12px;border-radius:12px;background:rgba(34,211,238,.07);color:#bff7ff;font-size:11px}.dzCxAdd{width:46px;height:46px;border-radius:50%;border:0;background:linear-gradient(135deg,var(--pink),var(--pink-2));color:#fff;font-size:30px;font-weight:700;cursor:pointer;box-shadow:0 12px 30px rgba(255,0,170,.32)}.dzCxMenu{position:absolute;right:0;top:54px;z-index:180;display:none;width:min(330px,86vw);padding:8px;border-radius:16px;background:#11182f;border:1px solid rgba(255,255,255,.12);box-shadow:0 20px 45px rgba(0,0,0,.35)}.dzCxMenu.open{display:grid;gap:6px}.dzCxMenu button{display:grid;grid-template-columns:32px 1fr;align-items:center;gap:10px;padding:11px 12px;border:0;border-radius:12px;background:rgba(255,255,255,.04);color:#fff;text-align:left}.dzCxMenu button i{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;font-style:normal;background:rgba(34,211,238,.08);color:#9fe8f5}.dzCxMenu strong,.dzCxMenu small{display:block}.dzCxMenu small{margin-top:3px;color:var(--muted);font-size:11px}.is-positive{color:#74f1a7!important}.is-negative{color:#ff7f9d!important}@media(max-width:900px){.dzCxAccountGrid{grid-template-columns:1fr}}@media(max-width:600px){.dzCxMetrics{grid-template-columns:repeat(2,minmax(0,1fr))}.dzCxFolderGrid{grid-template-columns:1fr}.dzCxFundingSummary{grid-template-columns:1fr}.dzCxAdd{position:fixed!important;right:max(18px,env(safe-area-inset-right))!important;bottom:calc(82px + env(safe-area-inset-bottom))!important;z-index:210!important;width:56px!important;height:56px!important}.dzCxMenu{position:fixed;right:max(14px,env(safe-area-inset-right));top:auto;bottom:calc(146px + env(safe-area-inset-bottom));width:min(340px,calc(100vw - 28px));z-index:209}}
    `;document.head.appendChild(style);
  }

  function install(){
    if(typeof renderHomeDashboard!=='function'||!C()||typeof normalizeMoneyOrganization!=='function')return setTimeout(install,60);
    styles();
    const base=renderHomeDashboard;
    renderHomeDashboard=function(...args){const result=base.apply(this,args);setTimeout(()=>{renderHome();installUniversalAdd();},0);return result;};
    if(document.getElementById('homeDashboard'))renderHomeDashboard();
    window.__DZ_ACCOUNTS_UI__='accounts-ui-7';
    window.__DZ_ACCOUNT_OBSERVED_ADAPTER__='consolidated-ux-1';
    window.__DINEROZAURIO_UI_PATCHES_READY__=true;
  }

  window.addEventListener('load',install,{once:true});
  if(document.readyState==='complete')install();
})();
