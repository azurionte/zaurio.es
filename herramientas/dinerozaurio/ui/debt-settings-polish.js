(()=>{'use strict';
const VERSION='debt-settings-polish-1';
let baseCollectionManager=null,baseDebtEditor=null,baseDebtCreateFlow=null,baseAssignableItems=null;
const esc=value=>typeof escapeHtml==='function'?escapeHtml(String(value??'')):String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
const money=value=>typeof euros==='function'?euros(Number(value||0)):`${Number(value||0).toFixed(2)} €`;
const monthLabel=value=>typeof prettyMonthLabel==='function'?prettyMonthLabel(value):String(value||'');
function debtPaidMonth(item){
  if(!item)return'';
  if(String(item.settledMonth||'').trim())return String(item.settledMonth).trim();
  try{return typeof getDebtPaidMonth==='function'?String(getDebtPaidMonth(item.id)||''):'';}catch(_err){return'';}
}
function isArchived(item){return !!debtPaidMonth(item);}
function activeDebts(){return (state.debts||[]).filter(item=>!isArchived(item));}
function archivedDebts(){return (state.debts||[]).filter(isArchived).sort((a,b)=>String(debtPaidMonth(b)).localeCompare(String(debtPaidMonth(a))));}
function debtName(item){try{return debtDisplayName(item);}catch(_err){return item?.name||item?.instrumentName||item?.entityName||'Deuda';}}
function debtEntity(item){try{return debtGroupTitle(item);}catch(_err){return item?.entityName||'Entidad sin nombre';}}
function debtKindLabel(item){
  const type=item?.instrumentType||item?.debtKind||'loan';
  if(type==='card'){
    const mode=item?.paymentMode||item?.cardSubtype||'revolving';
    if(mode==='pay_end_month')return'Tarjeta · fin de mes';
    if(mode==='installment')return'Tarjeta · compra aplazada';
    return'Tarjeta · revolving';
  }
  return'Préstamo';
}
function debtSummary(item){
  try{return debtDescription(item,typeof todayMonth==='function'?todayMonth():'');}catch(_err){}
  if(Number(item?.currentDebt||0)>0)return`Pendiente ${money(item.currentDebt)}`;
  if(Number(item?.monthlyPayment||0)>0)return`Cuota ${money(item.monthlyPayment)}`;
  if(Number(item?.currentPayment||0)>0)return`Cuota ${money(item.currentPayment)}`;
  return'Configuración activa';
}
function debtAmountMeta(item){
  const type=item?.instrumentType||item?.debtKind||'loan';
  const mode=item?.paymentMode||item?.cardSubtype||'';
  if(type==='loan'){
    if(Number(item.currentDebt||0)>0)return{label:'Capital pendiente',value:money(item.currentDebt)};
    if(Number(item.monthlyPayment||0)>0)return{label:'Cuota mensual',value:money(item.monthlyPayment)};
  }
  if(type==='card'&&mode==='revolving'){
    if(Number(item.currentDebt||0)>0)return{label:'Usado ahora',value:money(item.currentDebt)};
    if(Number(item.currentPayment||0)>0)return{label:'Cuota mensual',value:money(item.currentPayment)};
  }
  if(type==='card'&&mode==='pay_end_month'&&Number(item.amount||0)>0)return{label:'Importe previsto',value:money(item.amount)};
  if(Number(item.monthlyPayment||0)>0)return{label:'Cuota mensual',value:money(item.monthlyPayment)};
  return{label:'Estado',value:'Activa'};
}
function renderDebtCard(item){
  const meta=debtAmountMeta(item);
  return `<article class="dzDebtCard" data-dz-debt-card="${esc(item.id)}">
    <div class="dzDebtCardMain">
      <div class="dzDebtIcon" aria-hidden="true">${(item.instrumentType||item.debtKind)==='card'?'▰':'▤'}</div>
      <div class="dzDebtCardCopy">
        <div class="dzDebtCardTopline"><span class="dzDebtStatus active">Activa</span><span>${esc(debtKindLabel(item))}</span></div>
        <h4>${esc(item.instrumentName||debtName(item))}</h4>
        <p>${esc(debtSummary(item))}</p>
      </div>
    </div>
    <div class="dzDebtCardValue"><span>${esc(meta.label)}</span><strong>${esc(meta.value)}</strong></div>
    <div class="dzDebtCardActions">
      <button class="dzDebtPrimaryAction" type="button" data-dz-debt-edit="${esc(item.id)}">Editar</button>
      <details class="dzDebtMore">
        <summary aria-label="Más opciones">•••</summary>
        <div class="dzDebtMoreMenu">
          <button type="button" data-dz-debt-plan="${esc(item.id)}">Planificar liquidación</button>
          <button type="button" class="danger" data-dz-debt-delete="${esc(item.id)}">Eliminar deuda</button>
        </div>
      </details>
    </div>
  </article>`;
}
function groupActiveDebts(items){
  const groups=new Map();
  items.forEach(item=>{const key=debtEntity(item);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);});
  return Array.from(groups.entries()).map(([entityName,debts])=>({entityName,debts}));
}
function renderManager(){
  const active=activeDebts(),archived=archivedDebts(),groups=groupActiveDebts(active);
  const root=document.getElementById('modalRoot');if(!root)return;
  root.className='modalRoot';
  root.innerHTML=`<div class="modalCard managerModal dzDebtManager" role="dialog" aria-modal="true" aria-labelledby="dzDebtManagerTitle">
    <div class="modalHead dzDebtManagerHead">
      <div><span class="dzDebtKicker">Configuración</span><h3 id="dzDebtManagerTitle">Deudas</h3><p>Gestiona lo que todavía está activo. Cuando liquidas una deuda, pasa automáticamente al archivo.</p></div>
      <button id="dzDebtManagerClose" class="dzDebtClose" type="button" aria-label="Cerrar">×</button>
    </div>
    <div class="dzDebtToolbar">
      <div class="dzDebtStats"><div><strong>${active.length}</strong><span>activas</span></div><button type="button" id="dzArchivedDebtsBtn" ${archived.length?'':'disabled'}><strong>${archived.length}</strong><span>archivada${archived.length===1?'':'s'}</span></button></div>
      <button id="dzNewDebtBtn" class="dzDebtNew" type="button">+ Nueva deuda</button>
    </div>
    <div class="dzDebtManagerBody">
      ${groups.length?groups.map(group=>`<section class="dzDebtEntityGroup"><div class="dzDebtEntityHead"><div><span>Entidad</span><h4>${esc(group.entityName)}</h4></div><button type="button" data-dz-add-entity="${esc(group.entityName)}">+ Añadir aquí</button></div><div class="dzDebtCards">${group.debts.map(renderDebtCard).join('')}</div></section>`).join(''):`<div class="dzDebtEmpty"><div class="dzDebtEmptyIcon">✓</div><h4>No tienes deudas activas</h4><p>${archived.length?`Tus ${archived.length} deuda${archived.length===1?'':'s'} saldada${archived.length===1?' está':'s están'} guardada${archived.length===1?'':'s'} en el archivo.`:'Cuando añadas una deuda aparecerá aquí, separada por entidad.'}</p></div>`}
    </div>
  </div>`;
  root.querySelector('#dzDebtManagerClose').onclick=closeModal;
  root.querySelector('#dzNewDebtBtn').onclick=()=>openNewDebtLauncher();
  root.querySelector('#dzArchivedDebtsBtn').onclick=()=>openArchivedManager();
  root.querySelectorAll('[data-dz-add-entity]').forEach(button=>button.onclick=()=>baseDebtCreateFlow(button.dataset.dzAddEntity,'revolving',false));
  root.querySelectorAll('[data-dz-debt-edit]').forEach(button=>button.onclick=()=>{const item=(state.debts||[]).find(x=>x.id===button.dataset.dzDebtEdit);if(item)window.openDebtEditor(item,false);});
  root.querySelectorAll('[data-dz-debt-plan]').forEach(button=>button.onclick=()=>{if(typeof openDebtPlannerModal==='function')openDebtPlannerModal(button.dataset.dzDebtPlan,'prepay');});
  root.querySelectorAll('[data-dz-debt-delete]').forEach(button=>button.onclick=()=>deleteDebt(button.dataset.dzDebtDelete));
}
function deleteDebt(id){
  const item=(state.debts||[]).find(x=>x.id===id);if(!item)return;
  if(!confirm(`¿Eliminar ${debtName(item)}? Esta acción quita la deuda de tu configuración.`))return;
  const index=state.debts.findIndex(x=>x.id===id);if(index>=0)state.debts.splice(index,1);
  if(typeof touchState==='function')touchState();
  if(typeof kpis==='function')kpis();
  renderManager();
}
function openArchivedManager(){
  const items=archivedDebts(),root=document.getElementById('modalRoot');if(!root)return;
  root.className='modalRoot';
  root.innerHTML=`<div class="modalCard managerModal dzDebtManager dzDebtArchive" role="dialog" aria-modal="true" aria-labelledby="dzDebtArchiveTitle">
    <div class="modalHead dzDebtManagerHead"><div><span class="dzDebtKicker">Deudas</span><h3 id="dzDebtArchiveTitle">Archivadas</h3><p>Las deudas saldadas dejan de aparecer en tu configuración activa. Puedes restaurarlas si las necesitas otra vez.</p></div><button id="dzDebtArchiveClose" class="dzDebtClose" type="button" aria-label="Cerrar">×</button></div>
    <button id="dzDebtArchiveBack" class="dzDebtBack" type="button">← Volver a deudas activas</button>
    <div class="dzArchivedList">${items.length?items.map(item=>`<article class="dzArchivedDebt"><div class="dzArchivedDebtMain"><div class="dzDebtIcon archived" aria-hidden="true">✓</div><div><span>Saldada · ${esc(monthLabel(debtPaidMonth(item)))}</span><h4>${esc(debtName(item))}</h4><p>${esc(debtKindLabel(item))}</p></div></div><button type="button" data-dz-restore-debt="${esc(item.id)}">Restaurar</button></article>`).join(''):'<div class="dzDebtEmpty"><h4>No hay deudas archivadas</h4><p>Las deudas que liquides aparecerán aquí.</p></div>'}</div>
  </div>`;
  root.querySelector('#dzDebtArchiveClose').onclick=closeModal;
  root.querySelector('#dzDebtArchiveBack').onclick=renderManager;
  root.querySelectorAll('[data-dz-restore-debt]').forEach(button=>button.onclick=()=>restoreDebt(button.dataset.dzRestoreDebt));
}
function restoreDebt(id){
  const item=(state.debts||[]).find(x=>x.id===id);if(!item)return;
  item.settledMonth='';
  Object.keys(state.monthAdjustments||{}).forEach(monthKey=>{
    const month=state.monthAdjustments?.[monthKey];
    const override=month?.debtOverrides?.[id];
    if(override?.mode!=='paid')return;
    delete month.debtOverrides[id];
    if(typeof monthAdjustmentHasDataGlobal==='function'&&!monthAdjustmentHasDataGlobal(month))delete state.monthAdjustments[monthKey];
  });
  if(typeof touchState==='function')touchState();
  if(typeof persistAndRefresh==='function')persistAndRefresh().catch(console.error);
  openArchivedManager();
}
function openNewDebtLauncher(defaultEntity='',preferredCardMode='revolving',fromWizard=false){
  const archived=archivedDebts();
  if(!archived.length)return baseDebtCreateFlow(defaultEntity,preferredCardMode,fromWizard);
  const root=document.getElementById('modalRoot');if(!root)return;
  root.className='modalRoot';
  root.innerHTML=`<div class="modalCard dzDebtChoiceModal"><div class="modalHead"><div><span class="dzDebtKicker">Deudas</span><h3>¿Qué quieres hacer?</h3></div><button id="dzDebtChoiceClose" class="dzDebtClose" type="button" aria-label="Cerrar">×</button></div><div class="dzDebtChoiceGrid"><button id="dzCreateFreshDebt" type="button"><span class="dzDebtChoiceIcon">＋</span><strong>Crear una deuda nueva</strong><small>Añade una tarjeta, préstamo u otra financiación.</small></button><button id="dzRestoreOldDebt" type="button"><span class="dzDebtChoiceIcon archived">↺</span><strong>Restaurar una archivada</strong><small>${archived.length} deuda${archived.length===1?'':'s'} saldada${archived.length===1?'':'s'} disponible${archived.length===1?'':'s'}.</small></button></div></div>`;
  root.querySelector('#dzDebtChoiceClose').onclick=closeModal;
  root.querySelector('#dzCreateFreshDebt').onclick=()=>baseDebtCreateFlow(defaultEntity,preferredCardMode,fromWizard);
  root.querySelector('#dzRestoreOldDebt').onclick=openArchivedManager;
}
function polishDebtEditor(item){
  const card=document.querySelector('#modalRoot .modalCard');if(!card||card.dataset.dzDebtPolished==='1')return;
  const entity=document.getElementById('debtEntityName'),instrument=document.getElementById('debtInstrumentName'),kind=document.getElementById('debtKind');
  if(!entity||!instrument||!kind)return;
  card.dataset.dzDebtPolished='1';card.classList.add('dzDebtEditorModal');
  const head=card.querySelector('.modalHead');
  if(head){const h=head.querySelector('h3');if(h)h.textContent=item&&debtName(item)!=='Deuda sin nombre'?'Editar deuda':'Nueva deuda';const close=head.querySelector('#closeModalBtn');if(close){close.textContent='×';close.className='dzDebtClose';close.setAttribute('aria-label','Cerrar');}}
  const topGrid=entity.closest('.modalGrid');if(!topGrid)return;
  const identityFields=[entity,instrument,kind].map(el=>el.closest('.field')).filter(Boolean);
  const scheduleIds=['debtStart','debtCalendarRule','debtDueDay','debtCalendarConfidence','debtCalendarNote'];
  const scheduleFields=scheduleIds.map(id=>document.getElementById(id)?.closest('.field')).filter(Boolean);
  const paymentMode=document.getElementById('debtPaymentModeWrap');
  const dynamic=document.getElementById('debtDynamicFields');
  const makeSection=(title,copy,className)=>{const section=document.createElement('section');section.className=`dzDebtEditorSection ${className}`;section.innerHTML=`<div class="dzDebtSectionHead"><span>${esc(title)}</span><p>${esc(copy)}</p></div><div class="dzDebtSectionGrid"></div>`;return section;};
  const identity=makeSection('Identidad','Cómo reconocerás esta deuda en toda la app.','identity');
  const schedule=makeSection('Cobro','Cuándo empieza y qué fecha debe usar el calendario.','schedule');
  const finance=makeSection('Condiciones','Importes y condiciones que definen esta deuda.','finance');
  topGrid.insertAdjacentElement('beforebegin',identity);identityFields.forEach(field=>identity.querySelector('.dzDebtSectionGrid').appendChild(field));
  identity.insertAdjacentElement('afterend',schedule);scheduleFields.forEach(field=>schedule.querySelector('.dzDebtSectionGrid').appendChild(field));
  schedule.insertAdjacentElement('afterend',finance);if(paymentMode)finance.querySelector('.dzDebtSectionGrid').appendChild(paymentMode);if(dynamic)finance.appendChild(dynamic);
  topGrid.remove();
  const labels={
    debtEntityName:'Entidad o acreedor',debtInstrumentName:'Nombre del producto',debtKind:'Tipo de deuda',debtStart:'Empieza en',debtCalendarRule:'Fecha de cobro',debtDueDay:'Día previsto',debtCalendarConfidence:'Certeza de la fecha',debtCalendarNote:'Nota opcional',debtSubtype:'Forma de pago'
  };
  Object.entries(labels).forEach(([id,text])=>{const el=document.getElementById(id),label=el?.closest('.field')?.querySelector('label');if(label)label.textContent=text;});
  const replacements=new Map([['Total prestado','Importe original'],['Capital pendiente actual','Capital pendiente'],['Mes del capital pendiente','Saldo actualizado en'],['Comision cancelacion total %','Comisión por cancelación total %'],['Ultima cuota (opcional)','Última cuota (opcional)'],['Limite total','Límite total'],['Monto','Importe'],['Mes del proximo recibo','Mes del próximo recibo'],['Cada cuantos meses','Cada cuántos meses']]);
  card.querySelectorAll('label').forEach(label=>{if(replacements.has(label.textContent.trim()))label.textContent=replacements.get(label.textContent.trim());});
  const save=document.getElementById('saveDebtBtn');if(save){save.textContent='Guardar cambios';save.classList.add('dzDebtSave');}
  const syncHeader=()=>{const type=kind.value==='card'?'Tarjeta':'Préstamo';card.dataset.dzDebtKind=kind.value;let badge=card.querySelector('.dzDebtEditorBadge');if(!badge){badge=document.createElement('div');badge.className='dzDebtEditorBadge';head?.insertAdjacentElement('afterend',badge);}badge.textContent=type;};
  kind.addEventListener('change',()=>setTimeout(syncHeader,0));syncHeader();
}
function archivedIdSet(){return new Set(archivedDebts().map(item=>item.id));}
function scrubArchivedDebtOptions(scope=document){
  const ids=archivedIdSet();if(!ids.size)return;
  scope.querySelectorAll?.('select option[value]').forEach(option=>{if(ids.has(option.value))option.remove();});
}
function installObserver(){
  if(window.__DZ_DEBT_SETTINGS_OBSERVER__)return;window.__DZ_DEBT_SETTINGS_OBSERVER__=true;
  const observer=new MutationObserver(records=>{records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)scrubArchivedDebtOptions(node);}));});
  observer.observe(document.body,{subtree:true,childList:true});
  scrubArchivedDebtOptions(document);
}
function styles(){
  if(document.getElementById('dzDebtSettingsStyles'))return;
  const style=document.createElement('style');style.id='dzDebtSettingsStyles';style.textContent=`
  .dzDebtManager{width:min(920px,94vw);max-height:min(90vh,900px);overflow:auto;background:#0b1126!important;border:1px solid rgba(255,255,255,.11)!important;box-shadow:0 30px 90px rgba(0,0,0,.55)!important}.dzDebtManagerHead{align-items:flex-start!important}.dzDebtManagerHead h3,.dzDebtEditorModal h3{font-size:26px!important;margin:2px 0 4px!important}.dzDebtManagerHead p{margin:5px 0 0;color:rgba(235,241,255,.66);font-size:13px;line-height:1.55;max-width:620px}.dzDebtKicker{display:block;color:#9fe8f5;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.dzDebtClose{position:absolute;right:14px;top:14px;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:#fff;font-size:26px;line-height:1;display:grid;place-items:center;cursor:pointer}.dzDebtClose:hover{background:rgba(255,255,255,.13)}.dzDebtToolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:18px 0 20px;padding:14px;border-radius:18px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07)}.dzDebtStats{display:flex;align-items:stretch;gap:8px}.dzDebtStats>div,.dzDebtStats>button{min-width:86px;padding:8px 12px;border-radius:13px;border:0;background:rgba(255,255,255,.045);color:#fff;text-align:left}.dzDebtStats>button{cursor:pointer}.dzDebtStats>button:not(:disabled):hover{background:rgba(192,132,252,.11)}.dzDebtStats>button:disabled{opacity:.45;cursor:default}.dzDebtStats strong,.dzDebtStats span{display:block}.dzDebtStats strong{font-size:19px}.dzDebtStats span{margin-top:2px;color:rgba(235,241,255,.58);font-size:10px;text-transform:uppercase;font-weight:850;letter-spacing:.05em}.dzDebtNew{border:0;border-radius:999px;padding:11px 17px;background:linear-gradient(135deg,var(--pink),var(--pink-2));color:white;font-weight:900;cursor:pointer;box-shadow:0 10px 25px rgba(255,0,170,.2)}.dzDebtEntityGroup{padding:0;margin:0 0 22px}.dzDebtEntityHead{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:0 2px 9px;border-bottom:1px solid rgba(255,255,255,.08)}.dzDebtEntityHead span{display:block;color:rgba(235,241,255,.48);font-size:9px;text-transform:uppercase;font-weight:900;letter-spacing:.1em}.dzDebtEntityHead h4{margin:3px 0 0;font-size:16px}.dzDebtEntityHead button,.dzDebtBack{border:0;background:transparent;color:#9fe8f5;font-weight:850;font-size:12px;cursor:pointer;padding:7px}.dzDebtCards{display:grid;gap:9px;margin-top:9px}.dzDebtCard{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:14px;padding:14px 15px;border-radius:16px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.075);transition:.15s ease}.dzDebtCard:hover{background:rgba(255,255,255,.055);border-color:rgba(255,255,255,.12)}.dzDebtCardMain{display:flex;align-items:center;gap:12px;min-width:0}.dzDebtIcon{width:40px;height:40px;display:grid;place-items:center;flex:0 0 auto;border-radius:13px;background:rgba(34,211,238,.08);border:1px solid rgba(34,211,238,.16);color:#9fe8f5;font-weight:900}.dzDebtIcon.archived{background:rgba(74,222,128,.08);border-color:rgba(74,222,128,.18);color:#86efac}.dzDebtCardCopy{min-width:0}.dzDebtCardTopline{display:flex;align-items:center;gap:7px;color:rgba(235,241,255,.5);font-size:10px}.dzDebtStatus{padding:3px 6px;border-radius:999px;font-weight:900;text-transform:uppercase;letter-spacing:.05em}.dzDebtStatus.active{background:rgba(74,222,128,.09);color:#86efac}.dzDebtCard h4,.dzArchivedDebt h4{margin:4px 0 0;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dzDebtCard p,.dzArchivedDebt p{margin:4px 0 0;color:rgba(235,241,255,.58);font-size:11px;line-height:1.35}.dzDebtCardValue{text-align:right;min-width:105px}.dzDebtCardValue span,.dzDebtCardValue strong{display:block}.dzDebtCardValue span{color:rgba(235,241,255,.48);font-size:9px;text-transform:uppercase;font-weight:850}.dzDebtCardValue strong{margin-top:4px;font-size:14px}.dzDebtCardActions{display:flex;align-items:center;gap:7px}.dzDebtPrimaryAction{border:1px solid rgba(255,0,170,.28);background:rgba(255,0,170,.09);color:#ffc1e8;border-radius:999px;padding:8px 12px;font-weight:900;cursor:pointer}.dzDebtPrimaryAction:hover{background:rgba(255,0,170,.16)}.dzDebtMore{position:relative}.dzDebtMore summary{list-style:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.045);color:#fff;cursor:pointer;font-weight:900}.dzDebtMore summary::-webkit-details-marker{display:none}.dzDebtMoreMenu{position:absolute;right:0;top:40px;z-index:30;display:grid;min-width:190px;padding:7px;border-radius:13px;background:#151d38;border:1px solid rgba(255,255,255,.11);box-shadow:0 18px 45px rgba(0,0,0,.45)}.dzDebtMoreMenu button{border:0;border-radius:9px;background:transparent;color:#fff;padding:9px 10px;text-align:left;font-size:12px;cursor:pointer}.dzDebtMoreMenu button:hover{background:rgba(255,255,255,.07)}.dzDebtMoreMenu button.danger{color:#ff9ab2}.dzDebtEmpty{padding:42px 22px;text-align:center;border-radius:18px;background:rgba(255,255,255,.025);border:1px dashed rgba(255,255,255,.1)}.dzDebtEmptyIcon{width:46px;height:46px;margin:0 auto 12px;display:grid;place-items:center;border-radius:50%;background:rgba(74,222,128,.1);color:#86efac;font-size:21px}.dzDebtEmpty h4{margin:0}.dzDebtEmpty p{max-width:430px;margin:7px auto 0;color:rgba(235,241,255,.58);font-size:12px;line-height:1.5}.dzArchivedList{display:grid;gap:9px;margin-top:14px}.dzArchivedDebt{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px;border-radius:15px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)}.dzArchivedDebtMain{display:flex;align-items:center;gap:12px;min-width:0}.dzArchivedDebtMain>div:last-child{min-width:0}.dzArchivedDebt span{display:block;color:#86efac;font-size:10px;font-weight:850}.dzArchivedDebt>button{border:1px solid rgba(159,232,245,.22);background:rgba(159,232,245,.07);color:#bff7ff;border-radius:999px;padding:8px 12px;font-weight:850;cursor:pointer}.dzDebtChoiceModal{width:min(650px,94vw);background:#0b1126!important}.dzDebtChoiceGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.dzDebtChoiceGrid>button{display:grid;grid-template-columns:42px minmax(0,1fr);column-gap:12px;row-gap:2px;align-items:center;padding:17px;border-radius:17px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);color:#fff;text-align:left;cursor:pointer}.dzDebtChoiceGrid>button:hover{background:rgba(255,255,255,.06)}.dzDebtChoiceIcon{grid-row:1/3;width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:rgba(255,0,170,.09);color:#ff9edc;font-size:23px}.dzDebtChoiceIcon.archived{background:rgba(74,222,128,.08);color:#86efac}.dzDebtChoiceGrid strong{font-size:14px}.dzDebtChoiceGrid small{color:rgba(235,241,255,.58);font-size:11px;line-height:1.4}.dzDebtEditorModal{width:min(860px,94vw);max-height:min(90vh,900px);overflow:auto;background:#0b1126!important}.dzDebtEditorBadge{display:inline-flex;margin:0 0 14px;padding:5px 9px;border-radius:999px;background:rgba(34,211,238,.08);border:1px solid rgba(34,211,238,.17);color:#bff7ff;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.05em}.dzDebtEditorSection{margin-top:12px;padding:16px;border-radius:17px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.075)}.dzDebtSectionHead{margin-bottom:13px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.07)}.dzDebtSectionHead span{display:block;font-size:13px;font-weight:900;color:#fff}.dzDebtSectionHead p{margin:3px 0 0;color:rgba(235,241,255,.55);font-size:10px;line-height:1.45}.dzDebtSectionGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.dzDebtEditorSection.identity .dzDebtSectionGrid .field:nth-child(1),.dzDebtEditorSection.identity .dzDebtSectionGrid .field:nth-child(2){grid-column:auto}.dzDebtEditorSection .field label{color:rgba(235,241,255,.72);font-size:11px;font-weight:750}.dzDebtEditorSection .input,.dzDebtEditorSection .select{background:#0a1128!important;border-color:#2a355c!important}.dzDebtEditorSection .input:focus,.dzDebtEditorSection .select:focus{border-color:rgba(255,0,170,.48)!important;box-shadow:0 0 0 3px rgba(255,0,170,.08)}.dzDebtEditorSection #debtDynamicFields{margin-top:13px!important;padding-top:13px;border-top:1px solid rgba(255,255,255,.07)}.dzDebtEditorSection #debtDynamicFields .modalGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.dzDebtSave{min-width:180px!important;background:linear-gradient(135deg,var(--pink),var(--pink-2))!important;box-shadow:0 10px 24px rgba(255,0,170,.18)}
  @media(max-width:700px){.dzDebtManager,.dzDebtEditorModal,.dzDebtChoiceModal{width:100vw!important;max-width:none!important;max-height:92vh!important;margin-top:auto!important;border-radius:24px 24px 0 0!important}.dzDebtToolbar{align-items:stretch}.dzDebtStats{flex:1}.dzDebtStats>div,.dzDebtStats>button{min-width:0;flex:1}.dzDebtNew{white-space:nowrap}.dzDebtCard{grid-template-columns:minmax(0,1fr) auto;gap:10px}.dzDebtCardValue{grid-column:1/2;text-align:left;margin-left:52px;min-width:0}.dzDebtCardActions{grid-column:2;grid-row:1/3}.dzDebtCard h4{white-space:normal}.dzDebtChoiceGrid{grid-template-columns:1fr}.dzDebtSectionGrid,.dzDebtEditorSection #debtDynamicFields .modalGrid{grid-template-columns:1fr}.dzDebtEditorModal>.btnRow,.dzDebtEditorModal>.btnRow:last-child{position:sticky;bottom:-1px;margin:16px -16px -16px!important;padding:12px 16px calc(12px + env(safe-area-inset-bottom));background:linear-gradient(180deg,rgba(11,17,38,0),#0b1126 24%)}.dzDebtSave{width:100%!important}.dzArchivedDebt{align-items:flex-start}.dzArchivedDebt>button{flex:0 0 auto}}
  `;document.head.appendChild(style);
}
function install(){
  if(window.__DZ_DEBT_SETTINGS_POLISH__===VERSION)return;
  if(typeof openCollectionManager!=='function'||typeof openDebtEditor!=='function'||typeof openDebtCreateFlow!=='function'||!window.state)return setTimeout(install,80);
  window.__DZ_DEBT_SETTINGS_POLISH__=VERSION;
  baseCollectionManager=window.openCollectionManager;baseDebtEditor=window.openDebtEditor;baseDebtCreateFlow=window.openDebtCreateFlow;baseAssignableItems=window.organizationAssignableItems;
  window.openCollectionManager=function(type){if(type==='debt')return renderManager();return baseCollectionManager.apply(this,arguments);};
  window.openDebtEditor=function(item,fromWizard){const result=baseDebtEditor.call(this,item,fromWizard);setTimeout(()=>polishDebtEditor(item),0);return result;};
  window.openDebtCreateFlow=function(defaultEntity='',preferredCardMode='revolving',fromWizard=false){return openNewDebtLauncher(defaultEntity,preferredCardMode,fromWizard);};
  if(typeof baseAssignableItems==='function')window.organizationAssignableItems=function(){const archived=archivedIdSet();return baseAssignableItems.apply(this,arguments).filter(item=>!archived.has(item.id));};
  styles();installObserver();
}
window.addEventListener('load',install,{once:true});if(document.readyState==='complete')install();
})();
