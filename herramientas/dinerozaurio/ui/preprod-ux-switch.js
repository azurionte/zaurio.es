(()=>{
  'use strict';

  const KEY='dinerozaurio_preprod_ux_mode_v1';
  const VALID=new Set(['legacy','consolidated']);
  const current=VALID.has(localStorage.getItem(KEY))?localStorage.getItem(KEY):'legacy';

  window.__DINEROZAURIO_PREPROD_UX_MODE__=current;
  window.setDineroZaurioPreprodUxMode=(mode)=>{
    if(!VALID.has(mode)) return;
    localStorage.setItem(KEY,mode);
    location.reload();
  };

  function inject(){
    const menu=document.querySelector('.dzUniversalMenu');
    if(!menu||menu.querySelector('[data-dz-preprod-ux-switch]')) return false;

    const divider=document.createElement('div');
    divider.style.cssText='height:1px;background:rgba(255,255,255,.08);margin:4px 6px';

    const button=document.createElement('button');
    button.type='button';
    button.dataset.dzPreprodUxSwitch='1';
    button.innerHTML=current==='legacy'
      ? '<i class="dzFlowIcon neutral" aria-hidden="true">⇄</i><span><strong>Probar UX consolidada</strong><small>Desactiva el stack UX actual y carga la candidata</small></span>'
      : '<i class="dzFlowIcon neutral" aria-hidden="true">↺</i><span><strong>Volver a UX actual</strong><small>Restaura todas las capas actuales</small></span>';
    button.addEventListener('click',()=>window.setDineroZaurioPreprodUxMode(current==='legacy'?'consolidated':'legacy'));
    menu.append(divider,button);
    return true;
  }

  if(!inject()){
    const observer=new MutationObserver(()=>{ if(inject()) observer.disconnect(); });
    observer.observe(document.documentElement,{subtree:true,childList:true});
  }
})();
