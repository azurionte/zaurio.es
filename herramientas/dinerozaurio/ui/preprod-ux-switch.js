(()=>{
  'use strict';

  const KEY='dinerozaurio_preprod_ux_mode_v1';
  const VALID=new Set(['legacy','consolidated']);
  const current=VALID.has(localStorage.getItem(KEY))?localStorage.getItem(KEY):'legacy';

  window.__DINEROZAURIO_PREPROD_UX_MODE__=current;
  window.setDineroZaurioPreprodUxMode=(mode)=>{
    if(!VALID.has(mode))return;
    localStorage.setItem(KEY,mode);
    location.reload();
  };

  function injectInto(menu){
    if(!menu||menu.querySelector('[data-dz-preprod-ux-switch]'))return;

    const divider=document.createElement('div');
    divider.dataset.dzPreprodUxDivider='1';
    divider.style.cssText='height:1px;background:rgba(255,255,255,.10);margin:5px 6px';

    const mode=document.createElement('div');
    mode.dataset.dzPreprodUxMode='1';
    mode.style.cssText='padding:7px 12px 3px;color:#9fe8f5;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase';
    mode.textContent=`PREPROD · ${current==='legacy'?'UX actual':'UX consolidada'}`;

    const button=document.createElement('button');
    button.type='button';
    button.dataset.dzPreprodUxSwitch='1';
    button.innerHTML=current==='legacy'
      ? '<i class="dzFlowIcon neutral" aria-hidden="true">⇄</i><span><strong>Probar UX consolidada</strong><small>Apaga las capas UX actuales y carga la candidata</small></span>'
      : '<i class="dzFlowIcon neutral" aria-hidden="true">↺</i><span><strong>Volver a UX actual</strong><small>Apaga la candidata y restaura las capas actuales</small></span>';
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      window.setDineroZaurioPreprodUxMode(current==='legacy'?'consolidated':'legacy');
    });

    menu.append(divider,mode,button);
  }

  function sync(){
    document.querySelectorAll('.dzUniversalMenu').forEach(injectInto);
  }

  let queued=false;
  const schedule=()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      sync();
    });
  };

  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('click',schedule,true);
  window.addEventListener('load',schedule,{once:true});
  sync();
})();
