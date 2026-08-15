(()=>{'use strict';
const VERSION='debt-editor-wizard-1';
const STEP_META=[
  {key:'identity',title:'Identidad',copy:'Define la entidad, el nombre y el tipo de deuda.'},
  {key:'schedule',title:'Cobro',copy:'Indica cuándo empieza y cómo debe aparecer en el calendario.'},
  {key:'finance',title:'Condiciones',copy:'Completa los importes y condiciones financieras.'}
];

function setupWizard(card){
  if(!card||card.dataset.dzDebtWizard==='1')return false;
  const sections=STEP_META.map(step=>card.querySelector(`.dzDebtEditorSection.${step.key}`));
  if(sections.some(section=>!section))return false;
  const save=document.getElementById('saveDebtBtn');
  if(!save||!card.contains(save))return false;

  card.dataset.dzDebtWizard='1';
  card.classList.add('dzDebtWizardModal');

  const nav=document.createElement('nav');
  nav.className='dzDebtWizardNav';
  nav.setAttribute('aria-label','Pasos del formulario');
  nav.innerHTML=STEP_META.map((step,index)=>`<button type="button" class="dzDebtWizardStep" data-dz-wizard-step="${index}" aria-label="Paso ${index+1}: ${step.title}"><span>${index+1}</span><strong>${step.title}</strong></button>`).join('');
  sections[0].insertAdjacentElement('beforebegin',nav);

  const intro=document.createElement('div');
  intro.className='dzDebtWizardIntro';
  nav.insertAdjacentElement('afterend',intro);

  const controls=document.createElement('div');
  controls.className='dzDebtWizardControls';
  controls.innerHTML='<button type="button" class="btn ghost dzDebtWizardBack">← Anterior</button><div class="dzDebtWizardProgress" aria-live="polite"></div><div class="dzDebtWizardNextWrap"><button type="button" class="btn primary dzDebtWizardNext">Siguiente →</button></div>';
  sections[sections.length-1].insertAdjacentElement('afterend',controls);

  const back=controls.querySelector('.dzDebtWizardBack');
  const next=controls.querySelector('.dzDebtWizardNext');
  const progress=controls.querySelector('.dzDebtWizardProgress');
  const nextWrap=controls.querySelector('.dzDebtWizardNextWrap');
  const oldFooter=save.closest('.btnRow');
  nextWrap.appendChild(save);
  save.classList.add('dzDebtWizardSave');
  if(oldFooter&&oldFooter!==controls&&oldFooter.children.length===0)oldFooter.remove();

  let current=0;
  function show(index,{focus=false}={}){
    current=Math.max(0,Math.min(STEP_META.length-1,index));
    sections.forEach((section,i)=>{
      const active=i===current;
      section.hidden=!active;
      section.setAttribute('aria-hidden',active?'false':'true');
    });
    nav.querySelectorAll('[data-dz-wizard-step]').forEach((button,i)=>{
      button.classList.toggle('active',i===current);
      button.classList.toggle('done',i<current);
      button.setAttribute('aria-current',i===current?'step':'false');
    });
    const meta=STEP_META[current];
    intro.innerHTML=`<span>Paso ${current+1} de ${STEP_META.length}</span><h4>${meta.title}</h4><p>${meta.copy}</p>`;
    progress.textContent=`${current+1} / ${STEP_META.length}`;
    back.disabled=current===0;
    next.hidden=current===STEP_META.length-1;
    save.hidden=current!==STEP_META.length-1;
    card.dataset.dzDebtWizardStep=String(current+1);
    if(focus){
      const target=sections[current].querySelector('input:not([type="hidden"]),select,textarea,button');
      if(target)requestAnimationFrame(()=>target.focus({preventScroll:true}));
    }
    const modalBody=card.closest('.modalRoot')||card;
    if(modalBody.scrollTo)requestAnimationFrame(()=>modalBody.scrollTo({top:0,behavior:'smooth'}));
  }

  back.addEventListener('click',()=>show(current-1,{focus:true}));
  next.addEventListener('click',()=>show(current+1,{focus:true}));
  nav.querySelectorAll('[data-dz-wizard-step]').forEach(button=>button.addEventListener('click',()=>show(Number(button.dataset.dzWizardStep),{focus:true})));
  card.addEventListener('keydown',event=>{
    if(event.key!=='Enter'||event.shiftKey||event.ctrlKey||event.metaKey||event.altKey)return;
    const target=event.target;
    if(target?.tagName==='TEXTAREA'||target?.tagName==='BUTTON')return;
    if(current<STEP_META.length-1){event.preventDefault();show(current+1,{focus:true});}
  });

  show(0);
  return true;
}

function enhance(){
  document.querySelectorAll('#modalRoot .dzDebtEditorModal').forEach(setupWizard);
}
function install(){
  if(window.__DZ_DEBT_EDITOR_WIZARD__===VERSION)return;
  window.__DZ_DEBT_EDITOR_WIZARD__=VERSION;
  const style=document.createElement('style');
  style.id='dzDebtEditorWizardStyles';
  style.textContent=`
    .dzDebtWizardModal{width:min(760px,94vw)!important}
    .dzDebtWizardNav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:4px 0 14px;padding:6px;border-radius:16px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.065)}
    .dzDebtWizardStep{position:relative;display:flex;align-items:center;justify-content:center;gap:7px;min-width:0;padding:9px 8px;border:0;border-radius:11px;background:transparent;color:rgba(235,241,255,.5);cursor:pointer;font-size:11px;font-weight:850;transition:.15s ease}
    .dzDebtWizardStep span{width:22px;height:22px;display:grid;place-items:center;flex:0 0 auto;border-radius:50%;background:rgba(255,255,255,.07);font-size:10px}
    .dzDebtWizardStep strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .dzDebtWizardStep.active{background:rgba(255,0,170,.09);color:#ffd0ed}
    .dzDebtWizardStep.active span{background:linear-gradient(135deg,var(--pink),var(--pink-2));color:#fff}
    .dzDebtWizardStep.done{color:#9fe8f5}.dzDebtWizardStep.done span{background:rgba(34,211,238,.11);color:#9fe8f5}
    .dzDebtWizardIntro{margin:0 0 13px;padding:2px 2px 9px;border-bottom:1px solid rgba(255,255,255,.07)}
    .dzDebtWizardIntro span{display:block;color:#9fe8f5;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
    .dzDebtWizardIntro h4{margin:4px 0 2px;font-size:17px}.dzDebtWizardIntro p{margin:0;color:rgba(235,241,255,.56);font-size:11px;line-height:1.45}
    .dzDebtWizardModal .dzDebtEditorSection{margin-top:0}
    .dzDebtWizardModal .dzDebtEditorSection[hidden]{display:none!important}
    .dzDebtWizardControls{position:sticky;bottom:-1px;z-index:4;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;margin:16px -16px -16px;padding:13px 16px calc(13px + env(safe-area-inset-bottom,0px));background:linear-gradient(180deg,rgba(11,17,38,.9),#0b1126 28%);border-top:1px solid rgba(255,255,255,.08);backdrop-filter:blur(12px)}
    .dzDebtWizardControls .dzDebtWizardBack{justify-self:start}.dzDebtWizardNextWrap{justify-self:end;display:flex}.dzDebtWizardProgress{color:rgba(235,241,255,.42);font-size:10px;font-weight:850;letter-spacing:.08em}
    .dzDebtWizardSave[hidden],.dzDebtWizardNext[hidden]{display:none!important}
    @media(max-width:620px){
      .dzDebtWizardModal{width:100%!important;max-height:92vh!important;border-radius:22px 22px 0 0!important;align-self:end}
      .dzDebtWizardNav{gap:4px}.dzDebtWizardStep{padding:8px 4px}.dzDebtWizardStep strong{display:none}.dzDebtWizardStep span{width:26px;height:26px}
      .dzDebtWizardControls{grid-template-columns:auto 1fr auto}.dzDebtWizardProgress{justify-self:center}.dzDebtWizardControls .btn{min-width:0;padding-left:13px;padding-right:13px}
      .dzDebtWizardModal .dzDebtSectionGrid,.dzDebtWizardModal .dzDebtEditorSection #debtDynamicFields .modalGrid{grid-template-columns:1fr!important}
    }
  `;
  document.head.appendChild(style);
  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance();});};
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  enhance();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
