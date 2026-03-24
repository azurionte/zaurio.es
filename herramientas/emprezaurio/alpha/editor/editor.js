// /resume/editor/editor.js
// [editor.js] v1.8.0 - emprezaurio branding + mobile menu toggle
console.log('[editor.js] v1.8.0');

import { S, save } from '../app/state.js';
import { morphTo } from '../layouts/layouts.js';
import { openAddMenu } from '../modules/modules.js';

const A1 = { coral:'#ff7b54', sea:'#4facfe', city:'#34d399', magentaPurple:'#c026d3', magentaPink:'#ec4899', blueGreen:'#22c1c3', grayBlack:'#8892a6' };
const A2 = { coral:'#ffd166', sea:'#38d2ff', city:'#9ca3af', magentaPurple:'#9333ea', magentaPink:'#f97316', blueGreen:'#2ecc71', grayBlack:'#414b57' };

export function mountEditor({ onThemePick, onDarkToggle, onMaterialPick, onCustomGradient }){
  const top = document.getElementById('topbar-root');
  top.innerHTML = `
    <div class="nav" id="alphaNav">
      <div class="brand-suite">
        <a class="zaurio-link" href="/herramientas/" aria-label="Volver a Zaurio Herramientas">
          <img src="https://zaurio.es/shared/assets/brand/favicon-32x32.png" alt="Zaurio">
        </a>
        <a class="brand" href="/emprezaurio/" aria-label="Ir a Emprezaurio">
          <img class="brand-mark" src="https://zaurio.es/shared/assets/brand/emprezaurio-icono.png" alt="Emprezaurio">
          <span class="brand-copy">
            <span class="brand-title">Emprezaurio</span>
            <span class="brand-sub">alpha builder oficial</span>
          </span>
        </a>
        <button class="menu-toggle" id="btnMobileMenu" aria-expanded="false" aria-label="Mostrar opciones">
          <span class="menu-toggle-arrow" aria-hidden="true"></span>
        </button>
      </div>
      <div class="menu" id="alphaMenu">
        <div class="dropdown" id="ddFile">
          <button class="mbtn">Proyecto</button>
          <div class="dropdown-menu">
            <button id="btnSave" class="mbtn"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
            <button id="btnLoad" class="mbtn"><i class="fa-solid fa-folder-open"></i> Cargar</button>
            <button id="btnScratch" class="mbtn"><i class="fa-solid fa-eraser"></i> Empezar de cero</button>
          </div>
        </div>

        <div class="dropdown" id="ddLayout">
          <button class="mbtn">Layouts</button>
          <div class="dropdown-menu" style="width:340px">
            <div id="layoutQuick" style="display:grid;gap:10px">
              ${mock('header-side')}
              ${mock('header-fancy')}
              ${mock('header-top')}
            </div>
          </div>
        </div>

        <div class="dropdown" id="ddTheme">
          <button class="mbtn">Estilo</button>
          <div class="dropdown-menu theme-pop">
            <div class="theme-row" style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px">
              ${['coral','sea','city','magentaPurple','magentaPink','blueGreen','grayBlack']
                .map(k => `<div class="swatch" data-k="${k}" title="${k}"
                     style="height:42px;border-radius:12px;border:1px solid #2b324b;cursor:pointer;
                            background:linear-gradient(135deg,${A1[k]},${A2[k]})"></div>`).join('')}
            </div>
            <div class="k-row" style="margin-top:12px"><span>Modo oscuro</span><div id="darkToggle" class="switch ${S.dark?'on':''}"></div></div>
            <div class="k-row"><span>Material</span>
              <button class="mbtn" data-mat="paper">Papel</button>
              <button class="mbtn" data-mat="glass">Cristal</button>
            </div>
            <div style="border-top:1px solid #23283b;margin:10px 0"></div>
            <div class="k-row"><span>Gradiente</span>
              <input type="color" id="c1" value="${A1[S.theme]||'#ffba4a'}">
              <input type="color" id="c2" value="${A2[S.theme]||'#ff6aa7'}">
              <button class="mbtn" id="applyGrad">Aplicar</button>
            </div>
          </div>
        </div>

        <button id="btnPrint" class="mbtn"><i class="fa-solid fa-download"></i> Descargar</button>
        <button id="btnPreview" class="mbtn">Vista previa</button>
      </div>
    </div>
  `;

  const dds = [...top.querySelectorAll('.dropdown')];
  dds.forEach(dd => {
    const trigger = dd.querySelector('.mbtn');
    if (trigger) trigger.onclick = () => dd.classList.toggle('open');
  });
  document.addEventListener('click', e => dds.forEach(dd => { if(!dd.contains(e.target)) dd.classList.remove('open'); }));

  const nav = top.querySelector('#alphaNav');
  const menu = top.querySelector('#alphaMenu');
  const menuToggle = top.querySelector('#btnMobileMenu');
  const syncMobileMenu = () => {
    const mobile = window.innerWidth <= 700;
    if (!mobile) {
      nav.classList.remove('menu-open');
      menu.hidden = false;
      menuToggle.setAttribute('aria-expanded', 'false');
      return;
    }
    const open = nav.classList.contains('menu-open');
    menu.hidden = !open;
    menuToggle.setAttribute('aria-expanded', String(open));
  };
  menuToggle.onclick = () => {
    const open = nav.classList.toggle('menu-open');
    menu.hidden = !open && window.innerWidth <= 700;
    menuToggle.setAttribute('aria-expanded', String(open));
  };
  syncMobileMenu();
  window.addEventListener('resize', syncMobileMenu, { passive: true });

  top.querySelector('#btnSave').onclick = () => {
    save();
    const blob = new Blob([localStorage.getItem('erb3-state')||'{}'], {type:'application/json'});
    const a = document.createElement('a');
    a.download = 'emprezaurio-project.json';
    a.href = URL.createObjectURL(blob);
    a.click();
  };

  top.querySelector('#btnLoad').onclick = async () => {
    const ipt = document.createElement('input');
    ipt.type='file';
    ipt.accept='application/json';
    ipt.onchange = () => {
      const f = ipt.files?.[0];
      if(!f) return;
      const r = new FileReader();
      r.onload = () => { try { const obj = JSON.parse(String(r.result || '{}')); Object.assign(S,obj); location.reload(); } catch {} };
      r.readAsText(f);
    };
    ipt.click();
  };

  top.querySelector('#btnScratch').onclick = () => {
    localStorage.removeItem('erb3-state');
    location.reload();
  };

  top.querySelectorAll('.swatch').forEach(s => s.onclick = () => onThemePick(s.dataset.k));
  top.querySelector('#darkToggle').onclick = e => {
    const on = e.currentTarget.classList.toggle('on');
    onDarkToggle(on);
    document.body.setAttribute('data-dark', on ? '1' : '0');
  };
  top.querySelectorAll('[data-mat]').forEach(b => b.onclick = () => onMaterialPick(b.dataset.mat));
  top.querySelector('#applyGrad').onclick = () => onCustomGradient(
    top.querySelector('#c1').value,
    top.querySelector('#c2').value
  );

  top.querySelector('#btnPreview').onclick = () => {
    const on = !document.body.classList.contains('preview');
    document.body.classList.toggle('preview', on);
    top.querySelector('#btnPreview').textContent = on ? 'Salir de vista previa' : 'Vista previa';
  };

  top.querySelector('#btnPrint').onclick = () => {
    const was = document.body.classList.contains('preview');
    document.body.classList.add('preview');
    setTimeout(() => {
      window.print();
      if(!was) document.body.classList.remove('preview');
    }, 60);
  };

  const root = document.getElementById('canvas-root');
  root.innerHTML = `
    <div class="page" id="page"><div id="sheet">
      <div class="stack" id="stack">
        <div class="add-squircle" id="canvasAdd"><div class="add-dot" id="dotAdd">+</div></div>
      </div>
    </div></div>
    <div class="pop" id="addMenu" aria-hidden="true"><div class="tray" id="addTray"></div></div>
  `;

  root.querySelector('#dotAdd').onclick = (e) => openAddMenu(e.currentTarget);

  top.querySelector('#layoutQuick').addEventListener('click', e => {
    const k = e.target.closest('[data-layout]')?.dataset.layout;
    if(!k) return;
    morphTo(k);
    top.querySelector('#ddLayout').classList.remove('open');
  });
}

function mock(layoutKey){
  const kind = layoutKey.split('-')[1];
  const hero = (kind==='side')
    ? `<div style="position:absolute;inset:12px auto 12px 12px;width:32%;border-radius:10px;background:linear-gradient(135deg,#ffba4a,#ff6aa7)"></div>
       <div style="position:absolute;left:30px;top:30px;width:42px;height:42px;border-radius:50%;background:#fff3fb;border:3px solid #fff"></div>
       <div style="position:absolute;left:40%;right:20px;top:24px;display:grid;gap:8px">
         <div style="height:8px;border-radius:999px;background:#53206c;width:60%"></div>
         <div style="height:8px;border-radius:999px;background:#53206c;width:40%"></div>
       </div>`
    : kind==='fancy'
    ? `<div style="height:60px;margin:8px;border-radius:10px;background:linear-gradient(135deg,#ffba4a,#ff6aa7)"></div>
       <div style="position:absolute;left:50%;transform:translateX(-50%);top:58px;width:56px;height:56px;border-radius:50%;background:#fff3fb;border:3px solid #fff"></div>
       <div style="position:absolute;left:24px;right:24px;top:120px;display:grid;gap:8px">
         <div style="height:8px;border-radius:999px;background:#53206c;width:70%"></div>
         <div style="height:8px;border-radius:999px;background:#53206c;width:48%"></div>
       </div>`
    : `<div style="height:60px;margin:8px;border-radius:10px;background:linear-gradient(135deg,#ffba4a,#ff6aa7)"></div>
       <div style="position:absolute;right:31px;top:22px;width:56px;height:56px;border-radius:50%;background:#fff3fb;border:3px solid #fff"></div>
       <div style="position:absolute;left:24px;right:120px;top:28px;display:grid;gap:8px">
         <div style="height:8px;border-radius:999px;background:#53206c;width:60%"></div>
         <div style="height:8px;border-radius:999px;background:#53206c;width:40%"></div>
       </div>`;
  return `<div class="mock" data-layout="${layoutKey}" style="position:relative;min-height:130px;border:1px solid #4c215f;border-radius:14px;padding:10px;background:#1b0a27">${hero}</div>`;
}
