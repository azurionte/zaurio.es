(()=>{'use strict';
const VERSION='configuration-modal-polish-1';
const CONFIG_TITLE=/(gasto|ingreso|ahorro|objetivo|préstamo personal|prestamo personal|devolución|devolucion|movimiento|cuenta|carpeta|presupuesto|servicio|suscripción|suscripcion)/i;

function titleOf(card){return card.querySelector('.modalHead h3,h3')?.textContent?.trim()||'';}
function isConfigCard(card){
  if(!card||card.classList.contains('dzDebtEditorModal')||card.classList.contains('dzDebtManager')||card.classList.contains('dzDebtChoiceModal'))return false;
  const title=titleOf(card);
  if(CONFIG_TITLE.test(title))return true;
  if(card.classList.contains('managerModal'))return true;
  if(card.querySelector('#managerAddItemBtn'))return true;
  return false;
}
function actionFooter(card){
  const rows=Array.from(card.querySelectorAll('.btnRow')).filter(row=>row.querySelector('button'));
  return rows.at(-1)||null;
}
function polishCard(card){
  if(!isConfigCard(card)||card.dataset.dzConfigPolished==='1')return;
  card.dataset.dzConfigPolished='1';
  card.classList.add('dzConfigModal');

  const head=card.querySelector('.modalHead');
  if(head){
    head.classList.add('dzConfigModalHead');
    const heading=head.querySelector('h3');
    if(heading&&!head.querySelector('.dzConfigKicker')){
      const kicker=document.createElement('span');
      kicker.className='dzConfigKicker';
      kicker.textContent='Configuración';
      heading.insertAdjacentElement('beforebegin',kicker);
    }
    const close=head.querySelector('#closeModalBtn,[data-close-modal],button[aria-label="Cerrar"]');
    if(close&&!close.classList.contains('dzDebtClose')){
      close.classList.add('dzConfigClose');
      if(close.id==='closeModalBtn'||/cerrar/i.test(close.getAttribute('aria-label')||''))close.textContent='×';
      close.setAttribute('aria-label','Cerrar');
    }
  }

  card.querySelectorAll('.modalGrid,.dzFormGrid').forEach((grid,index)=>{
    grid.classList.add('dzConfigGrid');
    if(grid.closest('.dzConfigSection'))return;
    if(card.querySelectorAll('.modalGrid,.dzFormGrid').length<2)return;
    const section=document.createElement('section');
    section.className='dzConfigSection';
    section.dataset.dzConfigSection=String(index+1);
    grid.insertAdjacentElement('beforebegin',section);
    section.appendChild(grid);
  });

  card.querySelectorAll('.field').forEach(field=>field.classList.add('dzConfigField'));
  const footer=actionFooter(card);
  if(footer)footer.classList.add('dzConfigActions');

  const primary=footer?.querySelector('.btn.primary,.btn.good,#saveItemBtn,#managerSaveBtn');
  if(primary)primary.classList.add('dzConfigPrimary');
  footer?.querySelectorAll('.btn.danger').forEach(button=>button.classList.add('dzConfigDanger'));
}
function enhance(root=document.getElementById('modalRoot')){
  if(!root)return;
  root.querySelectorAll('.modalCard').forEach(polishCard);
}
function install(){
  if(window.__DZ_CONFIGURATION_MODAL_POLISH__===VERSION)return;
  window.__DZ_CONFIGURATION_MODAL_POLISH__=VERSION;
  const style=document.createElement('style');
  style.id='dzConfigurationModalPolishStyles';
  style.textContent=`
    .dzConfigModal{width:min(760px,94vw)!important;max-height:min(88vh,900px);overflow:auto;background:linear-gradient(180deg,#111a39 0%,#0b1126 100%)!important;border:1px solid rgba(148,163,255,.22)!important;border-radius:26px!important;box-shadow:0 28px 80px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.025) inset!important;padding:22px!important}
    .dzConfigModalHead{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:18px!important;margin-bottom:18px!important;padding-bottom:15px!important;border-bottom:1px solid rgba(255,255,255,.075)!important}
    .dzConfigKicker{display:block;margin-bottom:5px;color:#9fe8f5;font-size:9px;font-weight:950;letter-spacing:.11em;text-transform:uppercase}
    .dzConfigModalHead h3{margin:0!important;font-size:22px!important;line-height:1.15!important;letter-spacing:-.025em}
    .dzConfigModalHead p,.dzConfigModal .muted,.dzConfigModal .legendNote{color:rgba(235,241,255,.62)!important}
    .dzConfigClose{width:38px!important;height:38px!important;min-width:38px!important;display:grid!important;place-items:center!important;padding:0!important;border-radius:50%!important;border:1px solid rgba(255,255,255,.12)!important;background:rgba(255,255,255,.055)!important;color:#fff!important;font-size:27px!important;font-weight:400!important;line-height:1!important}
    .dzConfigClose:hover{background:rgba(255,255,255,.1)!important;transform:none!important}
    .dzConfigSection{margin:12px 0;padding:15px;border-radius:18px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.065)}
    .dzConfigGrid{display:grid;gap:13px!important;min-width:0}
    .dzConfigField{min-width:0}
    .dzConfigField label{display:block;margin:0 0 6px;color:rgba(235,241,255,.68);font-size:10px!important;font-weight:850!important;letter-spacing:.045em}
    .dzConfigModal .input,.dzConfigModal .select,.dzConfigModal input:not([type="checkbox"]):not([type="radio"]),.dzConfigModal select,.dzConfigModal textarea{max-width:100%!important;min-width:0!important;width:100%!important;background:#091126!important;border:1px solid rgba(109,128,196,.42)!important;border-radius:13px!important;color:#fff!important;box-shadow:0 1px 0 rgba(255,255,255,.025) inset!important}
    .dzConfigModal .input:focus,.dzConfigModal .select:focus,.dzConfigModal input:focus,.dzConfigModal select:focus,.dzConfigModal textarea:focus{border-color:rgba(255,76,198,.75)!important;box-shadow:0 0 0 3px rgba(255,0,170,.11)!important;outline:none!important}
    .dzConfigActions{position:sticky;bottom:-22px;z-index:5;margin:18px -22px -22px!important;padding:14px 22px calc(14px + env(safe-area-inset-bottom,0px))!important;display:flex!important;justify-content:flex-end!important;align-items:center!important;gap:10px!important;background:linear-gradient(180deg,rgba(11,17,38,.84),#0b1126 28%)!important;border-top:1px solid rgba(255,255,255,.08)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
    .dzConfigActions .btn{min-height:42px;padding:10px 17px!important}
    .dzConfigActions .dzConfigPrimary,.dzConfigActions .btn.primary{order:10;background:linear-gradient(135deg,var(--pink),var(--pink-2))!important;box-shadow:0 8px 24px rgba(255,0,170,.17)}
    .dzConfigActions .btn.ghost{background:transparent!important;border:1px solid rgba(255,255,255,.13)!important;color:rgba(255,255,255,.82)!important}
    .dzConfigActions .dzConfigDanger{background:transparent!important;border:1px solid rgba(255,91,127,.34)!important;color:#ff91aa!important;box-shadow:none!important}
    .dzConfigModal.managerModal .itemCard,.dzConfigModal.managerModal .row{background:rgba(255,255,255,.028)!important;border:1px solid rgba(255,255,255,.07)!important;border-radius:16px!important}
    @media(max-width:620px){
      .dzConfigModal{width:100%!important;max-height:92vh!important;align-self:end;border-radius:24px 24px 0 0!important;padding:18px!important}
      .dzConfigModalHead{margin-bottom:14px!important;padding-bottom:13px!important}.dzConfigModalHead h3{font-size:20px!important}
      .dzConfigGrid,.dzConfigModal .modalGrid,.dzConfigModal .dzFormGrid{grid-template-columns:1fr!important}
      .dzConfigActions{bottom:-18px;margin:16px -18px -18px!important;padding:13px 18px calc(13px + env(safe-area-inset-bottom,0px))!important;display:grid!important;grid-template-columns:1fr 1fr!important}
      .dzConfigActions .btn{width:100%!important;min-width:0!important;padding-left:10px!important;padding-right:10px!important}
      .dzConfigActions .btn:only-child{grid-column:1/-1}
    }
  `;
  document.head.appendChild(style);
  const root=document.getElementById('modalRoot');
  if(root){
    let queued=false;
    const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance(root);});};
    new MutationObserver(schedule).observe(root,{subtree:true,childList:true});
    enhance(root);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
