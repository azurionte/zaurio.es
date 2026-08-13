(() => {
  'use strict';
  const VERSION='accounts-ui-3';
  const PERSONAL_LOANS='__personalLoans';
  let latestModel=null;
  let baseRender=null;

  function install(){
    if(window.__DZ_ACCOUNTS_UI__===VERSION)return;
    if(typeof renderHomeDashboard!=='function'||typeof buildTodayFinancialSnapshot!=='function'||typeof normalizeMoneyOrganization!=='function'||!window.DineroZaurioAccountingCore){setTimeout(install,60);return;}
    window.__DZ_ACCOUNTS_UI__=VERSION;
    baseRender=renderHomeDashboard;
    renderHomeDashboard=function(...args){const result=baseRender.apply(this,args);applyCanonicalUI();return result;};
    wrapEditors();injectStyles();
    if(document.getElementById('homeDashboard'))renderHomeDashboard();
  }

  function organization(){return normalizeMoneyOrganization(state.moneyOrganization);}
  function specialMap(ym,key){const raw=state.monthAdjustments?.[ym]?.expenseOverrides?.[key];return raw&&typeof raw==='object'&&!Array.isArray(raw)?cloneData(raw):{};}
  function saveSpecial(ym,key,value){const next=normalizeMonthAdjustmentShape(state.monthAdjustments?.[ym]||{},ym);if(value&&Object.keys(value).length)next.expenseOverrides[key]=cloneData(value);else delete next.expenseOverrides[key];state.monthAdjustments[ym]=next;touchState();}
  function currentSummary(){return buildTodayFinancialSnapshot(new Date());}
  function buildModel(){const summary=currentSummary(),org=organization();return DineroZaurioAccountingCore.resolveAccountState({organization:org,periodYm:summary.periodYm,asOf:summary.asOf||new Date(),events:summary.snapshot?.events||[],futureEvents:summary.upcomingCharges||[],monthAdjustments:state.monthAdjustments||{},potentialNow:summary.potentialNow});}

  function applyCanonicalUI(){
    const root=document.getElementById('homeDashboard');if(!root)return;
    const org=organization();if(!org.enabled)return;
    const summary=currentSummary();latestModel=DineroZaurioAccountingCore.resolveAccountState({organization:org,periodYm:summary.periodYm,asOf:summary.asOf||new Date(),events:summary.snapshot?.events||[],futureEvents:summary.upcomingCharges||[],monthAdjustments:state.monthAdjustments||{},potentialNow:summary.potentialNow});
    const hero=root.querySelector('.homeHeroValue');if(hero)hero.textContent=euros(latestModel.total);
    updateAccountCard(root,latestModel.primary);
    latestModel.secondary.forEach(model=>updateAccountCard(root,model));
    renderUniversalAdd(root);renderSavingsActions(root,summary,org);renderPersonalLoans(root,summary);renderHealth(root,summary);
    window.__DINEROZAURIO_ACCOUNTING_AUTHORITY__=latestModel.version;
    window.__DINEROZAURIO_ROUTING_AUTHORITY__=latestModel.version;
    window.__DINEROZAURIO_ACCOUNT_DIAGNOSTICS__=cloneData(latestModel.diagnostics);
  }

  function cardFor(root,model){return [...root.querySelectorAll('.accountSummaryCard')].find(node=>node.querySelector('.accountSummaryHead strong')?.textContent?.trim()===model?.account?.name);}
  function updateAccountCard(root,model){
    if(!model?.account)return;const card=cardFor(root,model);if(!card)return;
    const metrics=card.querySelectorAll('.accountSummaryMetric');setMetric(metrics[0],'Saldo estimado HOY',model.current);setMetric(metrics[1],'Antes de la próxima nómina',model.projected);
    if(model.general)setMetric(metrics[2],'Disponible sin carpeta',model.general.current);
    card.querySelector('.dzCanonicalBuckets')?.remove();if(!model.buckets?.length)return;
    const host=document.createElement('div');host.className='dzCanonicalBuckets';
    host.innerHTML=model.buckets.map(bucket=>`<div class="dzCanonicalBucket"><div><strong>${escapeHtml(bucket.label)}</strong><span>Ahora ${euros(bucket.current)} · proyección ${euros(bucket.projected)}</span></div><div class="dzBucketActions"><button type="button" data-dz-balance="${escapeHtml(bucket.id)}">Corregir saldo</button><button type="button" data-dz-transfer="${escapeHtml(bucket.id)}">Confirmar transferencia</button></div>${futureButtons(bucket)}</div>`).join('');
    card.appendChild(host);
    host.querySelectorAll('[data-dz-balance]').forEach(btn=>btn.onclick=()=>openBalanceEditor(btn.dataset.dzBalance));
    host.querySelectorAll('[data-dz-transfer]').forEach(btn=>btn.onclick=()=>openTransferEditor(btn.dataset.dzTransfer));
    host.querySelectorAll('[data-dz-future-item]').forEach(btn=>btn.onclick=()=>openRoutedItem(btn.dataset.dzFutureItem));
    const general=model.general;if(general?.futureEvents?.length&&general.projected<0){const alert=document.createElement('div');alert.className='dzCanonicalAlert';alert.innerHTML='<strong>Hay cargos pendientes sin cobertura suficiente.</strong><span>Revisa los próximos cargos o confirma una transferencia real.</span>';card.appendChild(alert);}
  }
  function futureButtons(bucket){if(!bucket.futureEvents?.length)return'';return `<div class="dzBucketFuture">${bucket.futureEvents.map(event=>`<button type="button" data-dz-future-item="${escapeHtml(event.itemId||'')}">${escapeHtml(event.name||'Cargo')} · ${euros(Math.abs(Number(event.amount||0)))}</button>`).join('')}</div>`;}
  function setMetric(node,label,value){if(!node)return;const caption=node.querySelector('.sub'),amount=node.querySelector('strong');if(caption)caption.textContent=label;if(amount){amount.textContent=euros(value);amount.className=value>=0?'kpi-green':'kpi-red';}}

  function openBalanceEditor(bucketId){
    const model=latestModel||buildModel();const bucket=model.secondary.flatMap(x=>x.buckets).find(x=>x.id===bucketId);if(!bucket)return;
    simpleModal(`Saldo · ${bucket.label}`,'Indica el saldo físico que ves ahora.',`<div class="field"><label>Saldo actual</label><input id="dzCanonicalBalance" class="input" type="number" step="0.01" value="${Number(bucket.current||0).toFixed(2)}"></div>`,()=>{
      const value=DineroZaurioAccountingCore.round2(document.getElementById('dzCanonicalBalance').value);const org=organization();const account=org.accounts.find(x=>x.id===bucket.accountId);if(!account)return;
      if(bucket.folderId){const folder=account.folders.find(x=>x.id===bucket.folderId);if(!folder)return;folder.actualBalance=value;folder.balanceUpdatedAt=new Date().toISOString();}
      else{const map=specialMap(model.periodYm,DineroZaurioAccountingCore.KEYS.generalBalances);map[account.id]={amount:value,updatedAt:new Date().toISOString(),kind:'preexisting_observed'};saveSpecial(model.periodYm,DineroZaurioAccountingCore.KEYS.generalBalances,map);}
      state.moneyOrganization=org;touchState();persistAndRefresh().catch(console.error);
    });
  }

  function openTransferEditor(bucketId){
    const model=latestModel||buildModel();const bucket=model.secondary.flatMap(x=>x.buckets).find(x=>x.id===bucketId);if(!bucket)return;
    simpleModal(`Transferencia · ${bucket.label}`,'Regístrala solo después de hacer el movimiento real entre tus cuentas.',`<div class="field"><label>Importe transferido</label><input id="dzCanonicalTransfer" class="input" type="number" min="0" step="0.01"></div>`,()=>{
      const amount=DineroZaurioAccountingCore.round2(document.getElementById('dzCanonicalTransfer').value);if(amount<=0)return;
      const key=bucket.folderId?DineroZaurioAccountingCore.KEYS.folderTransfers:DineroZaurioAccountingCore.KEYS.generalTransfers;const map=specialMap(model.periodYm,key);const record=map[bucket.folderId?`${bucket.accountId}|${bucket.folderId}`:bucket.accountId]||{};const entries=DineroZaurioAccountingCore.transferEntries(record);entries.push({amount,confirmedAt:new Date().toISOString()});map[bucket.folderId?`${bucket.accountId}|${bucket.folderId}`:bucket.accountId]={entries,kind:'internal_transfer'};saveSpecial(model.periodYm,key,map);persistAndRefresh().catch(console.error);
    });
  }

  function wrapEditors(){
    if(window.__DZ_CANONICAL_EDITORS__)return;window.__DZ_CANONICAL_EDITORS__=true;
    if(typeof openSimpleEditor==='function'){const base=openSimpleEditor;openSimpleEditor=function(kind,item){base(kind,item);injectRoutingSelector(item,kind,'saveSimpleBtn');};}
    if(typeof openDebtEditor==='function'){const base=openDebtEditor;openDebtEditor=function(item,fromWizard){base(item,fromWizard);injectRoutingSelector(item,'debt','saveDebtBtn');};}
    if(typeof openGoalEditor==='function'){const base=openGoalEditor;openGoalEditor=function(item,fromWizard){base(item,fromWizard);injectRoutingSelector(item,'goal','saveGoalBtn');};}
  }
  function injectRoutingSelector(item,kind,saveId){
    if(!item?.id)return;const modal=document.querySelector('#modalRoot .modalCard');if(!modal||modal.querySelector('[data-dz-routing-selector]'))return;const org=organization();if(!org.enabled||!org.accounts.length)return;
    const current=org.assignments?.[item.id]||{accountId:org.salaryAccountId,folderId:''};const field=document.createElement('div');field.className='field dzRoutingField';field.dataset.dzRoutingSelector='1';field.innerHTML=`<label>${kind==='income'?'Se recibe en':'Cuenta / carpeta'}</label><select class="select">${routingOptions(org,current)}</select>`;const grid=modal.querySelector('.modalGrid');(grid||modal).appendChild(field);
    document.getElementById(saveId)?.addEventListener('click',()=>{const [accountId,folderId='']=field.querySelector('select').value.split('|');const next=organization();if(accountId)next.assignments[item.id]={accountId,folderId};else delete next.assignments[item.id];state.moneyOrganization=next;touchState();},{capture:true});
  }
  function routingOptions(org,current){return org.accounts.flatMap(account=>[`<option value="${escapeHtml(account.id)}|" ${current.accountId===account.id&&!current.folderId?'selected':''}>${escapeHtml(account.name)} · general</option>`,...(account.folders||[]).map(folder=>`<option value="${escapeHtml(account.id)}|${escapeHtml(folder.id)}" ${current.accountId===account.id&&current.folderId===folder.id?'selected':''}>${escapeHtml(account.name)} · ${escapeHtml(folder.name)}</option>`)]).join('');}
  function openRoutedItem(itemId){const expense=(state.expenses||[]).find(x=>x.id===itemId);if(expense)return openSimpleEditor('expense',expense);const debt=(state.debts||[]).find(x=>x.id===itemId);if(debt)return openDebtEditor(debt,false);const goal=(state.goals||[]).find(x=>x.id===itemId);if(goal)return openGoalEditor(goal,false);const income=(state.incomes||[]).find(x=>x.id===itemId);if(income)return openSimpleEditor('income',income);}

  function renderUniversalAdd(root){
    const anchor=root.querySelector('#addMissingExpensesBtn');if(!anchor||root.querySelector('#dzUniversalAdd'))return;anchor.style.display='none';const wrap=document.createElement('div');wrap.className='dzUniversalWrap';wrap.innerHTML='<button id="dzUniversalAdd" class="dzUniversalAdd" type="button" aria-label="Añadir">+</button><div class="dzUniversalMenu"><button data-add="expense">Gasto</button><button data-add="income">Ingreso</button><button data-add="debt">Deuda</button><button data-add="goal">Ahorro</button><button data-add="personal">Préstamo personal</button></div>';anchor.parentElement?.appendChild(wrap);const menu=wrap.querySelector('.dzUniversalMenu');wrap.querySelector('#dzUniversalAdd').onclick=e=>{e.stopPropagation();menu.classList.toggle('open');};menu.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=()=>{menu.classList.remove('open');const type=btn.dataset.add;if(type==='personal')return openPersonalLoanCreate();openCollectionManager(type);setTimeout(()=>document.getElementById('managerAddItemBtn')?.click(),0);});
  }

  function personalLoans(ym){const raw=state.monthAdjustments?.[ym]?.expenseOverrides?.[PERSONAL_LOANS];return Array.isArray(raw)?cloneData(raw):[];}
  function savePersonalLoans(ym,loans){const next=normalizeMonthAdjustmentShape(state.monthAdjustments?.[ym]||{},ym);if(loans.length)next.expenseOverrides[PERSONAL_LOANS]=cloneData(loans);else delete next.expenseOverrides[PERSONAL_LOANS];state.monthAdjustments[ym]=next;touchState();persistAndRefresh().catch(console.error);}
  function openPersonalLoanCreate(){const ym=currentSummary().periodYm;simpleModal('Préstamo personal','Registra dinero entre personas sin confundirlo con una deuda bancaria.',`<div class="modalGrid"><div class="field"><label>Dirección</label><select id="dzLoanDirection" class="select"><option value="borrowed">Me han prestado</option><option value="lent">He prestado</option></select></div><div class="field"><label>Persona</label><input id="dzLoanPerson" class="input"></div><div class="field"><label>Importe</label><input id="dzLoanAmount" class="input" type="number" min="0" step="0.01"></div></div>`,()=>{const person=document.getElementById('dzLoanPerson').value.trim(),amount=DineroZaurioAccountingCore.round2(document.getElementById('dzLoanAmount').value);if(!person||amount<=0)return;const loans=personalLoans(ym);loans.push({id:uid(),direction:document.getElementById('dzLoanDirection').value,person,principal:amount,outstanding:amount,status:'open',createdAt:new Date().toISOString(),payments:[]});savePersonalLoans(ym,loans);});}
  function renderPersonalLoans(root,summary){root.querySelector('.dzPersonalLoansCard')?.remove();const loans=personalLoans(summary.periodYm).filter(x=>x.status!=='closed'&&Number(x.outstanding||0)>0);if(!loans.length)return;const card=document.createElement('section');card.className='panel dzPersonalLoansCard';card.innerHTML=`<div class="section-title"><div><div class="label">Préstamos personales</div><h2>Dinero entre personas</h2></div></div><div class="dzPersonalRows">${loans.map(loan=>`<div><span>${escapeHtml(loan.direction==='borrowed'?`Debo a ${loan.person}`:`${loan.person} me debe`)}</span><strong>${euros(loan.outstanding)}</strong></div>`).join('')}</div>`;root.appendChild(card);}

  function renderSavingsActions(root,summary,org){root.querySelector('.dzSavingsCanonical')?.remove();const goals=summary.snapshot?.goalItems||summary.snapshot?.goals||[];if(!goals.length)return;const actionable=goals.map(goal=>({goal,stage:DineroZaurioAccountingCore.savingsStage(goal.id,org,state.monthAdjustments||{},summary.periodYm)})).filter(x=>x.stage!=='movement_confirmed');if(!actionable.length)return;const section=document.createElement('section');section.className='panel dzSavingsCanonical';section.innerHTML=`<div class="section-title"><div><div class="label">Ahorro</div><h2>Movimientos pendientes</h2></div></div>${actionable.map(x=>`<div class="dzSavingsRow"><span>${escapeHtml(x.goal.name||'Ahorro')} · ${x.stage==='planned'?'sin destino':'destino definido'}</span><button type="button" data-save-goal="${escapeHtml(x.goal.id)}">${x.stage==='planned'?'Elegir destino':'Confirmar movimiento'}</button></div>`).join('')}`;root.appendChild(section);section.querySelectorAll('[data-save-goal]').forEach(btn=>btn.onclick=()=>handleSaving(btn.dataset.saveGoal,summary.periodYm));}
  function handleSaving(goalId,ym){const org=organization(),stage=DineroZaurioAccountingCore.savingsStage(goalId,org,state.monthAdjustments||{},ym);if(stage==='planned'){const goal=(state.goals||[]).find(x=>x.id===goalId);if(goal)openGoalEditor(goal,false);return;}const map=specialMap(ym,DineroZaurioAccountingCore.KEYS.savingsConfirmations);map[goalId]={moved:true,confirmedAt:new Date().toISOString()};saveSpecial(ym,DineroZaurioAccountingCore.KEYS.savingsConfirmations,map);persistAndRefresh().catch(console.error);}

  function renderHealth(root,summary){root.querySelector('.dzCanonicalHealth')?.remove();if(typeof buildForecastMonthSnapshot!=='function'||typeof addMonthsStr!=='function')return;const months=Array.from({length:6},(_,i)=>addMonthsStr(summary.periodYm,i));const card=document.createElement('section');card.className='panel dzCanonicalHealth';card.innerHTML=`<div class="section-title"><div><div class="label">Salud financiera</div><h2>Margen previsto</h2></div></div><div class="dzHealthRows">${months.map(month=>{const snapshot=buildForecastMonthSnapshot(month);return `<button type="button" data-health-month="${month}"><span>${escapeHtml(prettyMonthLabel(month))}</span><strong class="${Number(snapshot.net||0)>=0?'kpi-green':'kpi-red'}">${euros(snapshot.net||0)}</strong></button>`;}).join('')}</div>`;root.appendChild(card);card.querySelectorAll('[data-health-month]').forEach(btn=>btn.onclick=()=>{const snapshot=buildForecastMonthSnapshot(btn.dataset.healthMonth);simpleModal(`Salud · ${prettyMonthLabel(btn.dataset.healthMonth)}`,`Margen previsto: ${euros(snapshot.net||0)}.`,``,null,'Cerrar');});}

  function simpleModal(title,subtitle,body,onSave,saveLabel='Guardar'){const root=document.getElementById('modalRoot');root.className='modalRoot';root.innerHTML=`<div class="modalCard dzCanonicalModal"><div class="modalHead"><div><h3>${escapeHtml(title)}</h3>${subtitle?`<div class="sub">${escapeHtml(subtitle)}</div>`:''}</div><button id="dzCanonicalClose" class="btn danger" type="button">Cerrar</button></div>${body}${onSave?`<div class="btnRow" style="margin-top:16px"><button id="dzCanonicalSave" class="btn primary" type="button">${escapeHtml(saveLabel)}</button></div>`:''}</div>`;document.getElementById('dzCanonicalClose').onclick=closeModal;if(onSave)document.getElementById('dzCanonicalSave').onclick=()=>{onSave();closeModal();setTimeout(()=>renderHomeDashboard(),0);};}

  function injectStyles(){if(document.getElementById('dzCanonicalAccountStyles'))return;const style=document.createElement('style');style.id='dzCanonicalAccountStyles';style.textContent=`.dzCanonicalBuckets{display:grid;gap:8px;margin-top:12px}.dzCanonicalBucket{padding:11px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:rgba(255,255,255,.03)}.dzCanonicalBucket>div:first-child{display:flex;justify-content:space-between;gap:10px}.dzCanonicalBucket span{color:var(--muted);font-size:11px}.dzBucketActions{display:flex;gap:6px;margin-top:8px}.dzBucketActions button,.dzBucketFuture button,.dzSavingsRow button{border:1px solid rgba(34,211,238,.2);border-radius:999px;background:rgba(34,211,238,.08);color:#bff7ff;padding:6px 9px;font-size:10px;cursor:pointer}.dzBucketFuture{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.dzCanonicalAlert{margin-top:10px;padding:10px;border-radius:12px;background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.18)}.dzCanonicalAlert strong,.dzCanonicalAlert span{display:block}.dzCanonicalAlert span{margin-top:3px;color:var(--muted);font-size:11px}.dzUniversalWrap{position:relative}.dzUniversalAdd{width:48px;height:48px;border:0;border-radius:50%;background:linear-gradient(135deg,var(--pink),var(--pink-2));color:#fff;font-size:30px;cursor:pointer}.dzUniversalMenu{display:none;position:absolute;right:0;top:54px;z-index:80;width:190px;padding:7px;border-radius:14px;background:#10162f;border:1px solid rgba(255,255,255,.12)}.dzUniversalMenu.open{display:grid;gap:5px}.dzUniversalMenu button{padding:9px;border:0;border-radius:10px;background:rgba(255,255,255,.05);color:#fff;text-align:left;cursor:pointer}.dzPersonalRows,.dzHealthRows{display:grid;gap:7px}.dzPersonalRows>div,.dzHealthRows button,.dzSavingsRow{display:flex;justify-content:space-between;gap:10px;padding:9px;border-radius:11px;background:rgba(255,255,255,.035);color:#fff;border:0}.dzHealthRows button{cursor:pointer}.dzSavingsRow{align-items:center;margin-top:7px}.dzRoutingField{grid-column:1/-1}@media(max-width:650px){.dzCanonicalBucket>div:first-child,.dzSavingsRow{flex-direction:column}.dzBucketActions{flex-direction:column}.dzBucketActions button{width:100%}.dzUniversalMenu{position:fixed;right:14px;top:auto;bottom:80px}.dzHealthRows button{flex-direction:column;text-align:left}}`;document.head.appendChild(style);}

  window.addEventListener('load',install,{once:true});if(document.readyState==='complete')install();
})();
