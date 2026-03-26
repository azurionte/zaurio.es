// [layouts.js] v2.5.0 — canvas hosts + contact chips + rehome on morph
console.log('[layouts.js] v2.5.19');

import { S, save } from '../app/state.js';

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

(function ensureLayoutStyles(){
  if (document.getElementById('layouts-style')) return;
  const st = document.createElement('style');
  st.id = 'layouts-style';
  st.textContent = `
  .page{display:grid;place-items:start;padding:28px}
  /* The visual card is the #sheet; .page should be a transparent container */
  #sheet{width:var(--page-w);max-width:100%;background:#fff;border-radius:16px;box-shadow:0 18px 60px rgba(0,0,0,.25);padding:22px;margin:0 auto}
  /* dark mode for the sheet */
  body[data-dark="1"] #sheet{ background:#0d1220; color:var(--ink); box-shadow:0 18px 60px rgba(0,0,0,.45) }
    .stack{display:grid;gap:16px;align-content:start}
    .add-squircle{width:100%;min-height:128px;border:2px dashed #a6b0ff55;border-radius:20px;display:none;align-items:center;justify-content:center;position:relative}
    .add-dot{width:40px;height:40px;border-radius:12px;background:#0b1022;color:#fff;display:grid;place-items:center;font-weight:900;box-shadow:0 8px 24px rgba(0,0,0,.35)}
    /* Sidebar layout */
    .sidebar-layout{
      display:grid;grid-template-columns: var(--rail) minmax(0,1fr);gap:18px;align-items:start;
      width:100%;
    }
    .sidebar-layout .rail{
      background:linear-gradient(180deg,var(--accent2),var(--accent));border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:12px;min-height:920px;position:relative;overflow:hidden;
      -webkit-mask-image:linear-gradient(180deg,#000 0 78%, rgba(0,0,0,.96) 84%, rgba(0,0,0,.72) 90%, rgba(0,0,0,.36) 95%, transparent 100%);
      mask-image:linear-gradient(180deg,#000 0 78%, rgba(0,0,0,.96) 84%, rgba(0,0,0,.72) 90%, rgba(0,0,0,.36) 95%, transparent 100%);
    }
    .sidebar-layout .rail::after{
      content:none;
    }
    .sidebar-layout [data-zone="main"]{
  display:grid;grid-template-columns: repeat(12,minmax(0,1fr));gap:16px;align-content:start;min-width:0;
  justify-items:stretch; align-items:start; /* ensure children stretch to full column width */
    }
    .sidebar-layout [data-zone="main"] > .section,
    .sidebar-layout [data-zone="main"] > #canvasAdd{ grid-column: 1 / -1; width:100%; max-width:none !important }

    /* Force section children to stretch across the main column and avoid intrinsic-width shrinking */
    .sidebar-layout [data-zone="main"] > .section{ display:block; justify-self:stretch; min-width:0 }

    /* Header variants */
    .topbar{border-radius:14px;background:linear-gradient(135deg,var(--accent2),var(--accent));padding:14px 16px}
    .topbar > div{position:relative;display:block !important;min-height:120px}
    .topbar > div > div:first-child{position:relative;padding-right:156px;min-height:120px;display:flex;flex-direction:column;justify-content:flex-start;align-items:flex-start}
    .topbar .name{margin:0 0 12px}
    .topbar .chips{gap:10px;position:relative;align-items:center}
    .topbar .avatar{
      position:absolute;
      right:0;
      top:50%;
      transform:translateY(-50%);
      align-self:auto;
      justify-self:auto;
      margin:0;
    }
    .topbar #chipAddBtn{
      position:absolute !important;
      right:0;
      bottom:0;
      transform:none;
      margin:0 !important;
      display:grid;
      place-items:center;
      width:44px;
      height:44px;
      border-radius:12px;
      background:#0b1022 !important;
      color:#fff !important;
      border:0;
      box-shadow:0 8px 20px rgba(11,16,34,.28);
      font-weight:800;
      z-index:5;
    }
    .topbar .chips > #chipAddBtn{
      position:static !important;
      right:auto !important;
      bottom:auto !important;
      top:auto !important;
      left:auto !important;
      transform:none !important;
      margin:0 0 0 2px !important;
      flex:0 0 44px;
      align-self:center;
      z-index:2;
    }
    .topbar[data-chip-count="1"],
    .topbar[data-chip-count="2"],
    .topbar[data-chip-count="3"],
    .topbar[data-chip-count="4"],
    .topbar[data-chip-count="5"]{padding-bottom:12px}
    .topbar[data-chip-count="5"] #chipAddBtn{right:156px;bottom:8px}
    .topbar .avatar{
      inline-size:120px;
      block-size:120px;
      min-inline-size:120px;
      min-block-size:120px;
      max-inline-size:120px;
      max-block-size:120px;
      width:120px;
      height:120px;
      aspect-ratio:1 / 1;
      border-radius:999px;
      align-self:center;
      justify-self:center;
    }
    .fancy{position:relative;padding-bottom:72px}
    .fancy .hero{position:relative;border-radius:14px;padding:20px 18px 86px;min-height:214px;background:linear-gradient(135deg,var(--accent2),var(--accent));display:flex;flex-direction:column;align-items:center;justify-content:flex-start}
    .fancy .hero .avatar{
      position:absolute;
      left:50%;
      bottom:-70px;
      transform:translateX(-50%);
      z-index:4;
      width:146px;
      height:146px;
      min-width:146px;
      min-height:146px;
      max-width:146px;
      max-height:146px;
      inline-size:146px;
      block-size:146px;
      aspect-ratio:1 / 1;
      border-width:4px;
      border-radius:999px;
    }
    .fancy .hero .name{text-align:center;margin:8px 0 0;position:relative;z-index:3;width:min(100%,520px);padding:0 12px}
    .fancy .chip-grid{position:absolute;left:22px;right:22px;top:94px;bottom:14px;display:grid;grid-template-columns:minmax(0,1fr) 146px minmax(0,1fr);grid-template-rows:auto 1fr;column-gap:10px;row-gap:10px;align-items:start;pointer-events:none}
    .fancy .chip-grid .chips{display:flex;min-width:0;pointer-events:auto}
    .fancy .chip-grid [data-info-top]{grid-column:1 / 4;grid-row:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-items:start;justify-items:center}
    .fancy .chip-grid [data-info-left]{grid-column:1;grid-row:2;display:flex;flex-direction:column;gap:10px;align-items:flex-end;justify-self:stretch;width:100%;min-width:0}
    .fancy .chip-grid [data-info-right]{grid-column:3;grid-row:2;display:flex;flex-direction:column;gap:10px;align-items:flex-start;justify-self:stretch;width:100%;min-width:0}
    .fancy .chip-grid [data-info-top] > .chip,
    .fancy .chip-grid [data-info-left] > .chip,
    .fancy .chip-grid [data-info-right] > .chip{width:min(100%,286px);max-width:286px;min-height:46px}
    .fancy .chip-grid [data-info-left] > .chip[data-lane="outer"]{align-self:flex-start;margin-right:auto}
    .fancy .chip-grid [data-info-right] > .chip[data-lane="outer"]{align-self:flex-end;margin-left:auto}
    .fancy[data-chip-count="1"] .hero,
    .fancy[data-chip-count="2"] .hero{min-height:170px}
    .fancy[data-chip-count="1"] .chip-grid,
    .fancy[data-chip-count="2"] .chip-grid{top:110px;bottom:18px}
    .fancy[data-chip-count="3"] .hero{min-height:228px}
    .fancy[data-chip-count="3"] .chip-grid{grid-template-columns:minmax(0,1fr) 204px minmax(0,1fr);bottom:20px}
    .fancy[data-chip-count="4"] .hero{min-height:226px}
    .fancy[data-chip-count="4"] .chip-grid{grid-template-columns:minmax(0,1fr) 132px minmax(0,1fr);bottom:18px}
    .fancy[data-chip-count="4"] .chip-grid [data-info-left] > .chip[data-lane="outer"]{
      width:min(100%,228px);
      max-width:228px;
    }
    .fancy[data-chip-count="5"] .hero{min-height:248px}
    .fancy[data-chip-count="5"] .chip-grid{grid-template-columns:minmax(0,1fr) 132px minmax(0,1fr);bottom:18px}
    .fancy[data-chip-count="6"] .hero{min-height:292px;padding-bottom:102px}
    .fancy[data-chip-count="7"] .hero{min-height:316px;padding-bottom:108px}
    .fancy[data-chip-count="3"] .chip-grid,
    .fancy[data-chip-count="4"] .chip-grid,
    .fancy[data-chip-count="5"] .chip-grid,
    .fancy[data-chip-count="6"] .chip-grid,
    .fancy[data-chip-count="7"] .chip-grid{top:94px;bottom:14px}
    .fancy[data-chip-count="5"] .hero .avatar{bottom:-72px}
    .fancy[data-chip-count="6"] .hero .avatar{bottom:-84px}
    .fancy[data-chip-count="7"] .hero .avatar{bottom:-90px}
    .fancy[data-chip-count="6"] .chip-grid,
    .fancy[data-chip-count="7"] .chip-grid{grid-template-columns:minmax(0,1fr) 118px minmax(0,1fr)}
    .fancy[data-chip-count="6"] .chip-grid{top:88px;bottom:18px}
    .fancy[data-chip-count="7"] .chip-grid{top:88px;bottom:22px}

    /* Avatar + chips */
    .avatar{border-radius:999px;overflow:hidden;background:#d1d5db;position:relative;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.18);border:5px solid #fff;width:140px;height:140px;aspect-ratio:1 / 1;display:grid;place-items:center;flex:0 0 auto}
    .avatar input{display:none}
    .avatar[data-empty="1"]::after{content:'+';position:absolute;inset:0;display:grid;place-items:center;color:#111;font-weight:900;font-size:30px;background:rgba(255,255,255,.6)}
    .avatar canvas{width:100%;height:100%;display:block;border-radius:50%;aspect-ratio:1 / 1}

    #avatarEditor{position:fixed;inset:0;display:grid;place-items:center;background:rgba(5,3,10,.72);backdrop-filter:blur(12px);z-index:26000;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .26s ease,visibility .26s ease}
    #avatarEditor.is-open{opacity:1;visibility:visible;pointer-events:auto}
    #avatarEditor .ae-shell{width:min(780px,94vw);display:grid;grid-template-columns:minmax(320px,1fr) 250px;gap:22px;padding:24px;border-radius:26px;border:1px solid rgba(255,255,255,.1);background:linear-gradient(180deg,rgba(23,10,33,.97),rgba(10,7,18,.97));box-shadow:0 34px 90px rgba(0,0,0,.42);transform:translateY(20px) scale(.98);opacity:0;transition:transform .3s cubic-bezier(.2,.75,.2,1), opacity .3s ease}
    #avatarEditor.is-open .ae-shell{transform:translateY(0) scale(1);opacity:1}
    #avatarEditor .ae-stage-wrap{display:grid;gap:14px}
    #avatarEditor .ae-stage{position:relative;width:min(100%,380px);aspect-ratio:1 / 1;justify-self:center;border-radius:28px;background:radial-gradient(circle at 50% 30%,rgba(255,255,255,.08),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.1);overflow:hidden;touch-action:none;cursor:grab}
    #avatarEditor .ae-stage.is-dragging{cursor:grabbing}
    #avatarEditor .ae-grid{position:absolute;inset:0;background:
      linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px) 0 0 / 33.333% 33.333%,
      linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px) 0 0 / 33.333% 33.333%;
      opacity:.5;pointer-events:none}
    #avatarEditor .ae-circle{position:absolute;inset:18px;border-radius:999px;border:2px solid rgba(255,255,255,.92);box-shadow:0 0 0 999px rgba(8,3,12,.44), inset 0 0 0 1px rgba(255,255,255,.18);pointer-events:none}
    #avatarEditor .ae-image{position:absolute;left:0;top:0;transform-origin:top left;will-change:transform;user-select:none;-webkit-user-drag:none;pointer-events:none}
    #avatarEditor .ae-side{display:grid;gap:14px;align-content:start}
    #avatarEditor .ae-title{margin:0;color:#fff8fb;font:800 1.5rem/1.05 "Bricolage Grotesque","Trebuchet MS",sans-serif}
    #avatarEditor .ae-copy{margin:0;color:rgba(255,255,255,.72);line-height:1.45}
    #avatarEditor .ae-range-wrap{display:grid;gap:8px;padding:12px 14px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}
    #avatarEditor .ae-range-wrap label{font-weight:700;color:#fff8fb}
    #avatarEditor .ae-range{width:100%}
    #avatarEditor .ae-hint{font-size:.92rem;color:rgba(255,255,255,.64);line-height:1.45}
    #avatarEditor .ae-actions{display:grid;gap:10px;margin-top:6px}
    #avatarEditor .ae-btn{appearance:none;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff8fb;padding:12px 14px;border-radius:16px;font-weight:700;cursor:pointer;transition:transform .16s ease, box-shadow .16s ease, border-color .16s ease, background .16s ease}
    #avatarEditor .ae-btn:hover{transform:translateY(-2px);box-shadow:0 16px 30px rgba(0,0,0,.22);border-color:rgba(255,255,255,.22)}
    #avatarEditor .ae-btn.primary{background:linear-gradient(135deg,#ffd447,#ffb87c);color:#240b18}
    #avatarEditor .ae-btn.ghost{background:rgba(255,255,255,.03)}
    #avatarEditor .ae-top{display:flex;justify-content:space-between;gap:12px;align-items:start}
    #avatarEditor .ae-close{width:42px;height:42px;padding:0;border-radius:14px}
    @media (max-width:700px){
      #avatarEditor{padding:12px}
      #avatarEditor .ae-shell{width:min(100vw - 12px,560px);grid-template-columns:1fr;padding:18px;border-radius:24px}
      #avatarEditor .ae-stage{width:min(100%,340px)}
    }

  .chips{display:flex;flex-wrap:wrap;gap:10px}
  .chip{display:flex;align-items:center;gap:10px;border-radius:999px;padding:10px 14px;border:1px solid rgba(0,0,0,.08);margin-bottom:0;min-width:0;min-height:46px;box-sizing:border-box}
    .chip i{width:16px;text-align:center}
    .chip[contenteditable="true"]{outline:none}
    .chip span{display:block;min-width:0;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .chip .chip-input{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  /* scope text color to the sheet (canvas) only */
  #sheet{ color: #111 }
  body[data-dark="1"] #sheet{ color: #fff }

  /* chip add pop (pill) */
  #chipAddPop{position:absolute;z-index:20060;display:none}
  #chipAddPop.open{display:block}
  #chipAddPop .pill{display:inline-flex;gap:8px;padding:8px;border-radius:999px;background:var(--chipPopBg,#071827);box-shadow:0 10px 30px rgba(2,10,18,.6)}
  #chipAddPop .sq-btn{width:36px;height:36px;border-radius:10px;background:transparent;border:1px solid rgba(255,255,255,.08);display:grid;place-items:center;color:#fff;cursor:pointer}
  #chipAddPop .sq-btn.hidden{display:none}

  /* style the header name and place the add button statically below the name */
  .sidebar-layout .rail{ position:relative }
  .sidebar-layout .rail .avatar{ margin-bottom:2px }
  .sidebar-layout .rail .name{ text-align:center; font-weight:900; font-size:22px; line-height:1.08; margin:0; padding:0 6px; color:#fff; letter-spacing:.01em }
  .sidebar-layout .rail .name[contenteditable]{ outline:none; border:none; background:transparent }
  .sidebar-layout .rail .name:focus{ outline:none; box-shadow:none }
  /* name block anchors the add button so it's always centered under the name */
  .sidebar-layout .rail .name-block{ position:relative; width:100%; display:block; text-align:center; margin-top:-4px; margin-bottom:2px }
  /* explicit wrapper for chips + add button to ensure the add button is centered */
  .sidebar-layout .rail .chip-wrap {
    display:flex !important;
    flex-direction:column;
    gap:10px;
    align-items:center !important;
    justify-content:flex-start !important;
    width:100% !important;
    box-sizing:border-box;
    position:relative;
    padding:0;
    text-align:center;
  }
  .sidebar-layout .rail .chip-wrap .chips {
    width:100%;
    max-width:100%;
    display:flex;
    flex-wrap:wrap;
    gap:10px;
    justify-content:flex-start;
    align-items:flex-start;
  }
  .sidebar-layout .rail .chip-wrap .chip{
    flex:1 1 100%;
    width:100%;
    max-width:100%;
    min-height:46px;
    padding-right:28px;
    justify-content:flex-start;
    position:relative;
    left:auto;
    transform:none;
    margin:0;
    align-items:center;
  }
  .sidebar-layout .rail .chip-wrap .chip span,
  .sidebar-layout .rail .chip-wrap .chip .chip-input{
    width:100%;
    max-width:100%;
    text-align:left;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    line-height:1.2;
  }
  .sidebar-layout .rail .chip-wrap #chipAddBtn {
    display:flex !important;
    justify-content:center;
    align-items:center;
    margin:0 !important;
    left:50% !important;
    right:auto !important;
    bottom:-52px !important;
    transform:translateX(-50%) !important;
    position:absolute !important;
  }
  /* place the add button in-flow after the chips so it naturally sits below the latest chip
    while remaining centered across the full rail width */
  /* In sidebar layout, chips are single-column (one per row) */
  .sidebar-layout .rail .chips{ width:100%; display:flex; flex-wrap:wrap; gap:10px }
  .sidebar-layout .rail #chipAddBtn{ display:grid; place-items:center; width:44px; height:44px; border-radius:12px; background:#0b1022 !important; color:#fff !important; border:0; box-shadow:0 8px 20px rgba(11,16,34,.28); font-weight:800; z-index:40 }
  .sidebar-layout .rail #chipAddBtn:hover{ filter:brightness(1.03) }
  .fancy .hero #chipAddBtn{position:absolute !important;right:20px;top:20px;left:auto !important;bottom:auto !important;transform:none !important;margin:0 !important;display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:#0b1022 !important;color:#fff !important;border:0;box-shadow:0 8px 20px rgba(11,16,34,.28);font-weight:800;z-index:5}
  /* prevent the browser "editing" container from showing an ugly border/outline */
  .sidebar-layout .rail .name[contenteditable]{ caret-color: #fff; }
  .sidebar-layout .rail .name[contenteditable]:focus{ outline:none !important; box-shadow:none !important; border:none !important }
  .sidebar-layout .rail .name::selection{ background: rgba(255,255,255,0.12); color: #fff }
  /* Removed duplicated/conflicting rule that used #0b7285 */

  /* small floating chip remove */
  .chip{position:relative}
  .chip .chip-rm{position:absolute;right:-8px;top:-8px;width:20px;height:20px;border-radius:999px;padding:0;border:0;font-size:12px;background:#fff;color:#111;box-shadow:0 6px 14px rgba(0,0,0,.12);cursor:pointer}
  .chip .chip-rm{user-select:none;-webkit-user-select:none}

  /* Make editable chip text visually clean (no focus outline or border) */
  .chip span[contenteditable]{ outline:none !important; box-shadow:none !important; border:none !important }
  .chip span[contenteditable]:focus{ outline:none !important; box-shadow:none !important; border:none !important }

  /* section delete (prominent red) and header controls */
  .sec-head{position:relative}
  .sec-remove{position:absolute;right:12px;top:12px;background:#ff4d4f;color:#fff;border:0;width:28px;height:28px;padding:0;border-radius:999px;display:grid;place-items:center;cursor:pointer;font-size:12px}
  .sec-head .ctrl-circle.move-rail{position:absolute;right:56px;top:10px}

  /* card controls and smaller ctrl-circles floating near the edge */
  .card-controls{position:absolute;right:8px;top:8px;display:flex;gap:6px}
  .card-controls .ctrl-circle{width:28px;height:28px;border-radius:999px;font-size:12px}

  .layout-morph-hide{opacity:0 !important; visibility:hidden !important}
  .layout-morph-ghost{
    position:fixed;left:0;top:0;z-index:25000;pointer-events:none;
    transform-origin:top left;
    will-change:transform,opacity,border-radius;
    box-shadow:0 18px 44px rgba(0,0,0,.18);
  }
  .layout-morph-ghost.layout-morph-hero{z-index:25000}
  .layout-morph-ghost.layout-morph-avatar{
    z-index:25020;
    border-radius:999px;
    overflow:hidden;
  }
  .layout-morph-fade{
    will-change:opacity,transform;
  }

  `;
  document.head.appendChild(st);
})();

/* ========== Canvas bootstrap ========== */
function stackEl(){ return $('#stack'); }

export function ensureCanvas(){
  if (!$('#stack')){
    const root = $('#canvas-root') || document.body;
    const page = document.createElement('div');
    page.className = 'page';
    page.innerHTML = `
      <div id="sheet">
        <div id="stack" class="stack">
          <div class="add-squircle" id="canvasAdd"><div class="add-dot" id="dotAdd">+</div></div>
        </div>
      </div>`;
    root.appendChild(page);
  }
  ensureAddAnchor(true);
  // ensure observer is running to sanitize late style changes
  try{ startLayoutObserver(); }catch(e){}
  return { stack: $('#stack'), addWrap: $('#canvasAdd'), add: $('#canvasAdd') };
}

export function getHeaderNode(){
  const headers = $$('[data-header]').filter(node => node?.isConnected);
  const visible = headers.filter(node => !node.classList.contains('layout-morph-hide'));
  return visible[visible.length - 1] || headers[headers.length - 1] || null;
}
function getHeaderNodeWrapper(){ return getHeaderNode()?.closest('.node') || null; }

export function isSidebarActive(){
  const head = getHeaderNode();
  return (S.layout === 'side') || !!head?.closest('.sidebar-layout');
}

export function getRailHolder(){
  const head = getHeaderNode();
  if (!head) return null;
  if (head.closest('.sidebar-layout')) return head.querySelector('[data-rail-sections]');
  return null;
}

export function getSideMain(){
  const head = getHeaderNode();
  if (isSidebarActive() && head) return head.querySelector('[data-zone="main"]');
  return stackEl();
}

function getSectionWrappers(){
  return Array.from(document.querySelectorAll('.node'))
    .filter(w => w.querySelector && w.querySelector('.section'))
    .filter(w => !w.hasAttribute('data-locked'));
}

// Sanitize .node wrappers inside the main zone by removing inline width styles
export function sanitizeMainNodes(){
  try{
    const main = getSideMain(); if(!main) return;
    Array.from(main.querySelectorAll('.node')).forEach(n=>{
      try{ n.style.width=''; n.style.maxWidth=''; n.style.minWidth=''; n.style.removeProperty('width'); n.style.removeProperty('max-width'); }catch(e){}
      // also clear inline width on immediate children (like .section or .card)
      Array.from(n.querySelectorAll('[style]')).forEach(c=>{ try{ c.style.width=''; c.style.maxWidth=''; c.style.minWidth=''; }catch(e){} });
    });
    // Diagnostic: after sanitizing, log any .node that remains narrower than the main container
    try{
      const mainRect = main.getBoundingClientRect();
      Array.from(main.querySelectorAll('.node')).forEach(n=>{
        try{
          const r = n.getBoundingClientRect();
          if (r.width < Math.max(0, mainRect.width - 8)){
            const cs = window.getComputedStyle(n);
            console.group('[layout-diagnostic] Narrow .node detected');
            console.log('node:', n);
            console.log('node rect:', r);
            console.log('main rect:', mainRect);
            console.log('computed width:', cs.width, 'display:', cs.display, 'box-sizing:', cs.boxSizing);
            console.log('inline style:', n.getAttribute('style'));
            // list ancestors up to main
            let a = n.parentElement; const list=[];
            while(a && a!==document.body){ list.push({el:a, rect:a.getBoundingClientRect(), style:a.getAttribute('style'), cs:window.getComputedStyle(a)}); if(a===main) break; a=a.parentElement; }
            console.log('ancestor chain:', list);
            console.log('stack trace:', new Error().stack);
            console.groupEnd();
          }
        }catch(e){}
      });
    }catch(e){}
  }catch(e){}
}

// Start a MutationObserver that watches for nodes being added or style attribute changes
// and sanitizes .node wrappers inside the active main zone. This catches late inline
// widths set by other code (drag placeholders, copy from mocks, etc.).
let __layoutObserver = null;
function startLayoutObserver(){
  if(__layoutObserver) return;
  const cb = (mutations)=>{
    let saw=false;
    for(const m of mutations){
      if(m.type==='childList' && m.addedNodes.length){
        for(const n of m.addedNodes){ if(n.nodeType===1 && (n.classList.contains('node') || n.querySelector && n.querySelector('.node'))) saw=true; }
      }
      if(m.type==='attributes' && m.attributeName==='style'){
        const t=m.target; if(t && (t.classList && (t.classList.contains('node') || t.classList.contains('section') || t.classList.contains('card')))) saw=true;
      }
    }
    if(saw){
      // debounce/defensive: run sanitize on next microtask
      Promise.resolve().then(()=>{ try{ sanitizeMainNodes(); }catch(e){} });
    }
  };
  __layoutObserver = new MutationObserver(cb);
  __layoutObserver.observe(document.body, { subtree:true, childList:true, attributes:true, attributeFilter:['style'] });
}

function normalizeAvatarState(value){
  if (!value) return null;
  if (typeof value === 'string') return { src:value, zoom:1, panX:0, panY:0 };
  return {
    src: value.src || '',
    zoom: Number.isFinite(value.zoom) ? value.zoom : 1,
    panX: Number.isFinite(value.panX) ? value.panX : 0,
    panY: Number.isFinite(value.panY) ? value.panY : 0
  };
}

function getAvatarSource(value){
  return normalizeAvatarState(value)?.src || '';
}

const CONTACT_FIELDS = {
  phone: { icon:'fa-solid fa-phone', placeholder:'+34 600 123 456', wrap:false },
  phone2: { icon:'fa-solid fa-phone', placeholder:'+34 611 222 333', wrap:false },
  email: { icon:'fa-solid fa-envelope', placeholder:'tu@correo.com', wrap:false },
  idDoc: { icon:'fa-regular fa-id-card', placeholder:'DNI 12345678Z', wrap:false },
  address: { icon:'fa-solid fa-location-dot', placeholder:'Madrid, España', wrap:false },
  linkedin: { icon:'fa-brands fa-linkedin', placeholder:'tu-handle', wrap:false },
  info: { icon:'fa-solid fa-circle-info', placeholder:'Información extra', wrap:false }
};
const INFO_SLOT_KEYS = ['info1','info2','info3','info4','info5','info6','info7'];

function fitAvatarPlacement(img, size, avatarState){
  const state = normalizeAvatarState(avatarState) || { zoom:1, panX:0, panY:0 };
  const base = Math.max(size / img.width, size / img.height);
  const minBleed = size * 0.08;
  const coverWithBleed = Math.max(
    (size + minBleed * 2) / img.width,
    (size + minBleed * 2) / img.height
  );
  const scale = Math.max(base, coverWithBleed) * Math.max(.6, state.zoom || 1);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const maxOffsetX = Math.max(0, (dw - size) / 2);
  const maxOffsetY = Math.max(0, (dh - size) / 2);
  const centeredX = (size - dw) / 2;
  const centeredY = (size - dh) / 2;
  const dx = centeredX + Math.max(-maxOffsetX, Math.min(maxOffsetX, (state.panX || 0) * size));
  const dy = centeredY + Math.max(-maxOffsetY, Math.min(maxOffsetY, (state.panY || 0) * size));
  return { dx, dy, dw, dh };
}

function drawAvatarInto(canvas, src){
  if (!canvas || !src) return;
  const ctx = canvas.getContext('2d', { willReadFrequently:true });
  const img = new Image();
  img.onload = ()=>{
    const size = Math.max(64, Math.round(Math.min(canvas.parentElement?.clientWidth || 140, canvas.parentElement?.clientHeight || 140)));
    canvas.width = size;
    canvas.height = size;
    const fit = fitAvatarPlacement(img, size, src);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, canvas.width/2, 0, Math.PI*2);
    ctx.clip();
    ctx.imageSmoothingQuality='high';
    ctx.drawImage(img,fit.dx,fit.dy,fit.dw,fit.dh);
    ctx.restore();
    canvas.parentElement?.setAttribute('data-empty','0');
  };
  img.src = getAvatarSource(src);
}

export function renderAllAvatars(){
  $$('[data-avatar]').forEach(w => {
    const canvas = w.querySelector('canvas');
    if (!canvas) return;
    drawAvatarInto(canvas, S.avatar);
  });
}

let avatarEditor = null;
let avatarEditorState = null;
let avatarEditorImage = null;
const AVATAR_EDITOR_INSET = 18;

function closeAvatarEditor(){
  const modal = document.getElementById('avatarEditor');
  if (!modal) return;
  modal.classList.remove('is-open');
}

function ensureAvatarEditor(){
  if (avatarEditor) return avatarEditor;
  const modal = document.createElement('div');
  modal.id = 'avatarEditor';
  modal.innerHTML = `
    <div class="ae-shell">
      <div class="ae-stage-wrap">
        <div class="ae-stage" id="aeStage">
          <img class="ae-image" id="aeImage" alt="Preview avatar">
          <div class="ae-grid"></div>
          <div class="ae-circle"></div>
        </div>
      </div>
      <div class="ae-side">
        <div class="ae-top">
          <div>
            <h3 class="ae-title">Foto de perfil</h3>
            <p class="ae-copy">Arrastra para recolocar. Usa zoom con la rueda, el deslizador o pellizco en movil.</p>
          </div>
          <button class="ae-btn ghost ae-close" id="aeClose" type="button" aria-label="Cerrar">×</button>
        </div>
        <div class="ae-range-wrap">
          <label for="aeZoom">Zoom</label>
          <input id="aeZoom" class="ae-range" type="range" min="1" max="3" step="0.01" value="1">
        </div>
        <div class="ae-hint">Consejo: deja los ojos cerca del tercio superior y usa dos dedos para pellizcar en movil.</div>
        <div class="ae-actions">
          <button class="ae-btn" id="aeChoose" type="button">Elegir foto</button>
          <button class="ae-btn primary" id="aeAccept" type="button">Aceptar</button>
        </div>
        <input id="aeInput" type="file" accept="image/*" hidden>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const stage = modal.querySelector('#aeStage');
  const image = modal.querySelector('#aeImage');
  const zoom = modal.querySelector('#aeZoom');
  const input = modal.querySelector('#aeInput');
  let drag = null;
  let pinch = null;

  function updateImageTransform(){
    if (!avatarEditorState || !avatarEditorImage) return;
    const cropSize = Math.max(120, stage.clientWidth - AVATAR_EDITOR_INSET * 2);
    const fit = fitAvatarPlacement(avatarEditorImage, cropSize, avatarEditorState);
    image.style.width = `${fit.dw}px`;
    image.style.height = `${fit.dh}px`;
    image.style.transform = `translate(${AVATAR_EDITOR_INSET + fit.dx}px, ${AVATAR_EDITOR_INSET + fit.dy}px)`;
    zoom.value = String(avatarEditorState.zoom);
  }

  function setFromFile(file){
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      avatarEditorState = { src:String(reader.result || ''), zoom:1, panX:0, panY:0 };
      loadImage();
    };
    reader.readAsDataURL(file);
  }

  function loadImage(){
    if (!avatarEditorState?.src) return;
    const img = new Image();
    img.onload = () => {
      avatarEditorImage = img;
      image.src = avatarEditorState.src;
      image.draggable = false;
      updateImageTransform();
    };
    img.src = avatarEditorState.src;
  }

  function applyPan(deltaX, deltaY){
    if (!avatarEditorState || !avatarEditorImage) return;
    const cropSize = Math.max(120, stage.clientWidth - AVATAR_EDITOR_INSET * 2);
    avatarEditorState.panX += deltaX / cropSize;
    avatarEditorState.panY += deltaY / cropSize;
    updateImageTransform();
  }

  stage.addEventListener('pointerdown', e => {
    if (!avatarEditorState?.src) return;
    e.preventDefault();
    drag = { x:e.clientX, y:e.clientY };
    stage.classList.add('is-dragging');
    stage.setPointerCapture?.(e.pointerId);
  });
  stage.addEventListener('pointermove', e => {
    if (!drag) return;
    applyPan(e.clientX - drag.x, e.clientY - drag.y);
    drag = { x:e.clientX, y:e.clientY };
  });
  const endDrag = () => {
    drag = null;
    stage.classList.remove('is-dragging');
  };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('dragstart', e => e.preventDefault());
  image.addEventListener('dragstart', e => e.preventDefault());
  stage.addEventListener('wheel', e => {
    if (!avatarEditorState?.src) return;
    e.preventDefault();
    avatarEditorState.zoom = Math.max(1, Math.min(3, avatarEditorState.zoom + (e.deltaY < 0 ? 0.08 : -0.08)));
    updateImageTransform();
  }, { passive:false });
  stage.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      const [a,b] = e.touches;
      pinch = {
        distance: Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY),
        zoom: avatarEditorState?.zoom || 1
      };
    }
  }, { passive:true });
  stage.addEventListener('touchmove', e => {
    if (e.touches.length === 2 && pinch && avatarEditorState) {
      e.preventDefault();
      const [a,b] = e.touches;
      const distance = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      avatarEditorState.zoom = Math.max(1, Math.min(3, pinch.zoom * (distance / pinch.distance)));
      updateImageTransform();
    }
  }, { passive:false });
  stage.addEventListener('touchend', () => { pinch = null; }, { passive:true });

  zoom.addEventListener('input', () => {
    if (!avatarEditorState) return;
    avatarEditorState.zoom = Number(zoom.value);
    updateImageTransform();
  });
  modal.querySelector('#aeChoose').onclick = () => input.click();
  input.addEventListener('change', () => setFromFile(input.files?.[0]));
  modal.querySelector('#aeClose').onclick = () => closeAvatarEditor();
  modal.addEventListener('click', e => { if (e.target === modal) closeAvatarEditor(); });
  modal.querySelector('#aeAccept').onclick = () => {
    if (!avatarEditorState?.src) return;
    S.avatar = {
      src: avatarEditorState.src,
      zoom: avatarEditorState.zoom,
      panX: avatarEditorState.panX,
      panY: avatarEditorState.panY
    };
    save();
    renderAllAvatars();
    closeAvatarEditor();
  };

  avatarEditor = { modal, stage, image, zoom, input, loadImage };
  return avatarEditor;
}

function openAvatarEditor(){
  const editor = ensureAvatarEditor();
  avatarEditorState = normalizeAvatarState(S.avatar) || { src:'', zoom:1, panX:0, panY:0 };
  avatarEditorImage = null;
  editor.image.removeAttribute('src');
  editor.zoom.value = String(avatarEditorState.zoom || 1);
  if (avatarEditorState.src) editor.loadImage();
  editor.modal.classList.add('is-open');
}

/* Avatar */
function initAvatars(root){
  $$('[data-avatar]', root).forEach(w=>{
    if (w._inited) return; w._inited = true;
    const input = w.querySelector('input[type=file]');
    const canvas = document.createElement('canvas');
    w.appendChild(canvas);
    if (S.avatar) drawAvatarInto(canvas, S.avatar);

    w.addEventListener('click', e=>{ if (e.target !== input) openAvatarEditor(); });
    input?.remove();
  });
}

/* Chips + contact */
/* Chips + contact */
function normalizeLinkedinHandle(value){
  return String(value || '')
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i, '')
    .replace(/^\/?in\//i, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '');
}

function sanitizeContactValue(key, value){
  const text = String(value || '').trim();
  if (!text) return '';
  if (key === 'linkedin') return normalizeLinkedinHandle(text);
  return text;
}

function getDisplayedContactValue(key, value){
  if (!value) return '';
  return key === 'linkedin' ? `/in/${normalizeLinkedinHandle(value)}` : String(value);
}

function removeContactKey(key){
  if (!S.contact) return;
  S.contact[key] = '';
  if (Array.isArray(S.contactOrder)) {
    S.contactOrder = S.contactOrder.filter(item => item !== key);
  }
  save();
  applyContact();
}

function getContactOrder(contact = S.contact || {}){
  const fallback = ['phone', 'phone2', 'email', 'idDoc', 'address', 'linkedin', ...INFO_SLOT_KEYS];
  const active = fallback.filter(key => sanitizeContactValue(key, contact[key]));
  const current = Array.isArray(S.contactOrder) ? S.contactOrder : [];
  const ordered = [];
  current.forEach(key => {
    if (active.includes(key) && !ordered.includes(key)) ordered.push(key);
  });
  active.forEach(key => {
    if (!ordered.includes(key)) ordered.push(key);
  });
  if (!Array.isArray(S.contactOrder) || current.length !== ordered.length || current.some((key, idx) => key !== ordered[idx])) {
    S.contactOrder = ordered;
  }
  return ordered;
}

function getContactLayoutMax(head = getHeaderNode()){
  if (!head) return 7;
  if (head.matches('.topbar')) return 6;
  if (head.matches('.fancy')) return 7;
  if (head.matches('.sidebar-layout')) return 7;
  return 7;
}

function getCurrentContactCount(contact = S.contact || {}){
  return ['phone','phone2','email','idDoc','address','linkedin', ...INFO_SLOT_KEYS]
    .reduce((count, key) => count + (sanitizeContactValue(key, contact[key]) ? 1 : 0), 0);
}

function resolveContactSlot(requestedKey, contact = S.contact || {}, head = getHeaderNode()){
  const maxCount = getContactLayoutMax(head);
  const currentCount = getCurrentContactCount(contact);
  if (requestedKey === 'phone') {
    if (!contact.phone) return 'phone';
    if (!contact.phone2 && currentCount < maxCount) return 'phone2';
    return null;
  }
  if (requestedKey === 'info') {
    if (currentCount >= maxCount) return null;
    return INFO_SLOT_KEYS.find(key => !sanitizeContactValue(key, contact[key])) || null;
  }
  if (currentCount >= maxCount && !sanitizeContactValue(requestedKey, contact[requestedKey])) return null;
  return requestedKey;
}

function getAvailableContactActions(contact = S.contact || {}, head = getHeaderNode()){
  const actions = [];
  const maxCount = getContactLayoutMax(head);
  const currentCount = getCurrentContactCount(contact);
  if ((!contact.phone || !contact.phone2) && currentCount < maxCount) actions.push('phone');
  ['email', 'idDoc', 'address', 'linkedin'].forEach(key => {
    if (!contact[key] && currentCount < maxCount) actions.push(key);
  });
  if (currentCount < maxCount && INFO_SLOT_KEYS.some(key => !sanitizeContactValue(key, contact[key]))) actions.push('info');
  return actions;
}

function findChipEditableByKey(head, key){
  return head?.querySelector(`.chip[data-key="${key}"] .chip-input, .chip[data-key="${key}"] .chip-text`) || null;
}

function chip(icon, text, key, { wrap = false } = {}){
  const el = document.createElement('div');
  el.className = 'chip';
  el.dataset.key = key;
  if (wrap) el.dataset.wrap = '1';
  el.innerHTML = `<i class="${icon}"></i><span></span><button class="chip-rm" title="Remove" aria-label="Remove contact" tabindex="-1" role="button" contenteditable="false" style="margin-left:8px;border-radius:8px;padding:2px 6px">&times;</button>`;
  const rm = el.querySelector('.chip-rm');
  rm.addEventListener('click', ()=> removeContactKey(key));
  rm.addEventListener('keydown', e => { e.preventDefault(); e.stopPropagation(); });

  const span = el.querySelector('span');
  const maxLength = wrap ? 52 : 38;
  let editable;
  const persist = () => {
    if (!S.contact) S.contact = {};
    const raw = editable.tagName === 'INPUT' ? editable.value : editable.textContent;
    S.contact[key] = sanitizeContactValue(key, raw);
    save();
  };

  if (wrap) {
    editable = document.createElement('input');
    editable.type = 'text';
    editable.value = text;
    editable.maxLength = maxLength;
    editable.className = 'chip-text chip-input';
    editable.spellcheck = false;
    editable.setAttribute('autocomplete', 'off');
    editable.setAttribute('aria-label', 'Contact info');
    editable.style.width = '100%';
    editable.style.border = 'none';
    editable.style.background = 'transparent';
    editable.style.font = 'inherit';
    editable.style.outline = 'none';
    editable.style.padding = '0 8px';
    editable.style.textAlign = 'left';
    editable.style.lineHeight = '1.25';
    editable.style.minHeight = '40px';
    editable.addEventListener('focusout', ()=>{
      persist();
      if (!sanitizeContactValue(key, editable.value)) applyContact();
    });
    editable.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        editable.blur();
      }
    });
  } else {
    editable = document.createElement('span');
    editable.textContent = text;
    editable.contentEditable = true;
    editable.spellcheck = false;
    editable.className = 'chip-text';
    editable.addEventListener('focusout', ()=>{
      persist();
      if (!sanitizeContactValue(key, editable.textContent)) applyContact();
    });
    editable.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        editable.blur();
      }
    });
  }

  span.innerHTML = '';
  span.appendChild(editable);
  styleOneChip(el);
  return el;
}
export function restyleContactChips(scope=document){
  const head=getHeaderNode(); if(!head) return;
  $$('.chip', head).forEach(styleOneChip);
}

// chip add menu: opens a small pop with icons to add phone/email/address/linkedin
// Chips rendering utility (fix for missing setChips)
function styleOneChip(el){
  el.style.background=''; el.style.color=''; el.style.border=''; el.style.backdropFilter='';
  const isGlass=(S && S.mat==='glass'), isDark=!!(S && S.dark);
  if (isGlass){
    el.style.background='rgba(255,255,255,.10)'; el.style.border='1px solid #ffffff28'; el.style.backdropFilter='blur(6px)';
    el.style.color=(['grayBlack','magentaPurple'].includes(S.theme)?'#fff':'#111');
  } else if (isDark){
    el.style.background='#0c1324'; el.style.border='1px solid #1f2a44'; el.style.color='#e6ecff';
  } else {
    el.style.background='#fff'; el.style.border='1px solid rgba(0,0,0,.08)'; el.style.color='#111';
  }
  const ic = el.querySelector('i'); if (ic) ic.style.color='var(--accent)';
}
function setChips(containers, items){
  containers.forEach(c=>c.innerHTML='');
  items.forEach(it => it.removeAttribute('data-lane'));
  containers.forEach(c => {
    if (c?.dataset) c.dataset.count = '0';
    if (c?.hasAttribute?.('data-info-top')) {
      c.style.display = '';
      c.style.justifyContent = '';
      c.style.gridTemplateColumns = '';
      c.style.width = '';
      c.style.justifySelf = '';
    }
  });
  if (!items.length) return;
  if (containers.length === 1){
    items.forEach(it => containers[0].appendChild(it));
    return;
  }
  if (containers.length === 2){
    const [left, right] = containers;
    if (items.length <= 3){
      items.forEach((it, i)=> (i % 2 === 0 ? left : right).appendChild(it));
    } else {
      items.forEach((it,i)=> {
        const target = i < 3 ? left : right;
        target.appendChild(it);
      });
    }
    return;
  }

  const [top, left, right] = containers;
  const total = items.length;
  let topCount = 0;
  if (total === 3) topCount = 1;
  else if (total >= 4) topCount = 3;

  const topItems = items.slice(0, topCount);
  const lowerItems = items.slice(topCount);
  topItems.forEach(it => top.appendChild(it));
  top.dataset.count = String(topItems.length);
  left.dataset.count = '0';
  right.dataset.count = '0';

  if (topItems.length === 1) {
    top.style.display = 'flex';
    top.style.justifyContent = 'center';
  }

  if (lowerItems.length === 1){
    lowerItems[0].dataset.lane = 'outer';
    left.appendChild(lowerItems[0]);
    left.dataset.count = '1';
    return;
  }
  if (lowerItems.length === 2){
    left.appendChild(lowerItems[0]);
    right.appendChild(lowerItems[1]);
    left.dataset.count = '1';
    right.dataset.count = '1';
    return;
  }
  if (lowerItems.length === 3){
    lowerItems[0].dataset.lane = 'inner';
    lowerItems[1].dataset.lane = 'outer';
    lowerItems[2].dataset.lane = 'inner';
    left.appendChild(lowerItems[0]);
    left.appendChild(lowerItems[1]);
    right.appendChild(lowerItems[2]);
    left.dataset.count = '2';
    right.dataset.count = '1';
    return;
  }

  lowerItems.forEach((it, i)=> {
    if (i % 2 === 0) {
      if (i >= 2) it.dataset.lane = 'outer';
      left.appendChild(it);
    } else {
      if (i >= 3) it.dataset.lane = 'outer';
      right.appendChild(it);
    }
  });
  left.dataset.count = String(left.children.length);
  right.dataset.count = String(right.children.length);
}

// chip add menu: opens a small pop with icons to add phone/email/address/linkedin
function openChipMenu(anchor){
  let pop = document.getElementById('chipAddPop');
  if (!pop){
    pop = document.createElement('div'); pop.id='chipAddPop'; pop.className='pop';
    const html = `<div class="pill">`+
      `<button class="sq-btn" data-k="phone" title="Phone"><i class='fa-solid fa-phone' style='color:#fff'></i></button>`+
      `<button class="sq-btn" data-k="email" title="Email"><i class='fa-solid fa-envelope' style='color:#fff'></i></button>`+
      `<button class="sq-btn" data-k="idDoc" title="Documento"><i class='fa-regular fa-id-card' style='color:#fff'></i></button>`+
      `<button class="sq-btn" data-k="address" title="Address"><i class='fa-solid fa-location-dot' style='color:#fff'></i></button>`+
      `<button class="sq-btn" data-k="linkedin" title="LinkedIn"><i class='fa-brands fa-linkedin' style='color:#fff'></i></button>`+
      `<button class="sq-btn" data-k="info" title="Info"><i class='fa-solid fa-circle-info' style='color:#fff'></i></button>`+
    `</div>`;
    pop.innerHTML = html;
    document.body.appendChild(pop);
    pop.addEventListener('click', e=>{
      const btn = e.target.closest('button');
      const k = btn?.dataset.k;
      if(!k) return;
      S.contact = S.contact || {};
      const slotKey = resolveContactSlot(k, S.contact, getHeaderNode());
      if (!slotKey) {
        pop.classList.remove('open');
        pop._anchor = null;
        return;
      }
      const fieldKey = INFO_SLOT_KEYS.includes(slotKey) ? 'info' : slotKey;
      S.contact[slotKey] = CONTACT_FIELDS[fieldKey]?.placeholder || '';
      S.contactOrder = Array.isArray(S.contactOrder) ? S.contactOrder.filter(key => key !== slotKey) : [];
      S.contactOrder.push(slotKey);
      save();
      applyContact();
      Promise.resolve().then(()=>{
        const head=getHeaderNode(); if(!head) return;
        const target = findChipEditableByKey(head, slotKey);
        if(target){
          target.focus();
          if (target.tagName === 'INPUT') {
            target.setSelectionRange?.(0, target.value.length);
          } else {
            const range = document.createRange();
            range.selectNodeContents(target);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      });
      pop.classList.remove('open');
      pop._anchor = null;
    });
  }
  if (pop.classList.contains('open') && pop._anchor === anchor) {
    pop.classList.remove('open');
    pop._anchor = null;
    return;
  }
  if (!pop._outsideBound) {
    pop._outsideBound = true;
    document.addEventListener('pointerdown', e => {
      if (!pop.classList.contains('open')) return;
      const clickedAnchor = pop._anchor && (e.target === pop._anchor || pop._anchor.contains(e.target));
      if (clickedAnchor) return;
      if (pop.contains(e.target)) return;
      pop.classList.remove('open');
      pop._anchor = null;
    });
  }
  const available = new Set(getAvailableContactActions(S.contact || {}, getHeaderNode()));
  pop.querySelectorAll('.sq-btn').forEach(btn => {
    btn.classList.toggle('hidden', !available.has(btn.dataset.k));
  });
  const r = anchor.getBoundingClientRect();
  pop.style.left = `${Math.round(r.left + (r.width/2))}px`;
  pop.style.top  = `${Math.round(r.top  - 12)}px`;
  pop.style.transform = `translate(-50%,-100%)`;
  pop._anchor = anchor;
  pop.classList.add('open');
}
export function applyContact(){
  const head=getHeaderNode(); if(!head) return;
  const nm=head.querySelector('.name');
  if(nm){
    const stateName = resolveDisplayName();
    const liveName = String(nm.textContent || '').trim();
    if (!stateName && liveName && liveName !== 'YOUR NAME') {
      S.contact = S.contact || {};
      S.contact.name = liveName;
      save();
    } else if (stateName && document.activeElement !== nm && liveName !== stateName) {
      nm.textContent = stateName;
    } else if (!stateName && !liveName) {
      nm.textContent = 'YOUR NAME';
    }
  }

  const c=S.contact||{};
  const items=[];
  getContactOrder(c).forEach(key => {
    const value = sanitizeContactValue(key, c[key]);
    if (!value) return;
    const field = CONTACT_FIELDS[INFO_SLOT_KEYS.includes(key) ? 'info' : key];
    const display = getDisplayedContactValue(key, value);
    const el = chip(field.icon, display, key, { wrap: !!field.wrap });
    el.title = display;
    items.push(el);
  });

  const holders=[ head.querySelector('[data-info]'),
                  head.querySelector('[data-info-top]'),
                  head.querySelector('[data-info-left]'),
                  head.querySelector('[data-info-right]') ].filter(Boolean);
  setChips(holders, items);
  head.setAttribute('data-chip-count', String(items.length));
  restyleContactChips();
  try{
    const availableActions = getAvailableContactActions(c, head);
    let addBtn = head.querySelector('#chipAddBtn');
    if (availableActions.length) {
      if (!addBtn) {
        addBtn = document.createElement('button');
        addBtn.id = 'chipAddBtn';
        addBtn.title = 'Add contact';
        addBtn.className = 'add-dot';
        addBtn.textContent = '+';
      }
      try {
        const chipWrap = head.querySelector('.chip-wrap');
        const nameBlock = head.querySelector('.name-block');
        const fancyHero = head.matches('.fancy') ? head.querySelector('.hero') : null;
        const topbarInner = head.matches('.topbar') ? head.firstElementChild : null;
        const genericHolder = head.querySelector('[data-info]') || head.querySelector('[data-info-left]')?.parentElement;
        if (fancyHero) {
          if (addBtn.parentElement !== fancyHero) fancyHero.appendChild(addBtn);
        } else if (chipWrap){
          if (addBtn.parentElement !== chipWrap) chipWrap.appendChild(addBtn);
        } else if (topbarInner) {
          const topInfoBlock = topbarInner.firstElementChild;
          const topChipHolder = head.querySelector('[data-info]');
          if ((items||[]).length === 5 && topChipHolder) {
            if (addBtn.parentElement !== topChipHolder) topChipHolder.appendChild(addBtn);
          } else if (topInfoBlock && addBtn.parentElement !== topInfoBlock) {
            topInfoBlock.appendChild(addBtn);
          }
        } else if ((items||[]).length === 0 && nameBlock){
          if (addBtn.parentElement !== nameBlock) nameBlock.appendChild(addBtn);
        } else if (genericHolder){
          if (addBtn.parentElement !== genericHolder) genericHolder.appendChild(addBtn);
        }
        addBtn.style.position = '';
        addBtn.style.left = '';
        addBtn.style.transform = '';
        addBtn.style.margin = '';
        addBtn.style.display = 'block';
      }catch(e){}
      addBtn.onclick = function(){
        openChipMenu(addBtn);
      };
    } else if (addBtn && addBtn.parentElement) {
      addBtn.parentElement.removeChild(addBtn);
    }
  }catch(e){}
}
/* Build headers + morph */
function buildHeader(kind){
  const node=document.createElement('div');
  node.className='node';
  node.setAttribute('data-locked','1');
  const initialName = resolveDisplayName() || 'YOUR NAME';

  if(kind==='header-side'){
    node.innerHTML=`
      <div class="sidebar-layout" data-header data-hero="side">
        <div class="rail">
          <label class="avatar" data-avatar data-empty="1"><input type="file" accept="image/*"></label>
          <div class="name-block">
            <h2 class="name" contenteditable>${initialName}</h2>
          </div>
          <div class="chip-wrap">
            <div class="chips" data-info></div>
            <button id="chipAddBtn" title="Add contact" class="add-dot">+</button>
          </div>
          <div class="sec-holder" data-rail-sections></div>
        </div>
        <div data-zone="main"></div>
      </div>`;
  }
  if(kind==='header-fancy'){
    node.innerHTML=`
      <div class="fancy" data-header>
        <div class="hero">
          <label class="avatar" data-avatar data-empty="1" style="width:120px;height:120px;border-width:4px">
            <input type="file" accept="image/*">
          </label>
          <h1 class="name" contenteditable>${initialName}</h1>
          <div class="chip-grid"><div class="chips" data-info-top></div><div class="chips" data-info-left></div><div class="chips" data-info-right></div></div>
          <button id="chipAddBtn" title="Add contact" class="add-dot">+</button>
        </div>
        <div class="below"></div>
      </div>`;
  }
  if(kind==='header-top'){
    node.innerHTML=`
      <div class="topbar" data-header>
        <div style="display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center">
          <div>
            <h1 class="name" contenteditable>${initialName}</h1>
            <div class="chips" data-info></div>
            <button id="chipAddBtn" title="Add contact" class="add-dot">+</button>
          </div>
          <label class="avatar" data-avatar data-empty="1" style="width:120px;height:120px;border-width:4px">
            <input type="file" accept="image/*">
          </label>
        </div>
      </div>`;
  }

  const bindNameField = () => {
    const nameNode = node.querySelector('.name');
    if (!nameNode || nameNode.dataset.boundName === '1') return;
    nameNode.dataset.boundName = '1';
    const commitName = () => {
      const value = String(nameNode.textContent || '').trim();
      S.contact = S.contact || {};
      S.contact.name = value;
      if (!value) nameNode.textContent = 'YOUR NAME';
      save();
    };
    nameNode.addEventListener('focus', () => {
      if (String(nameNode.textContent || '').trim() === 'YOUR NAME') {
        nameNode.textContent = '';
      }
    });
    nameNode.addEventListener('input', () => {
      S.contact = S.contact || {};
      S.contact.name = String(nameNode.textContent || '').trim();
      save();
    });
    nameNode.addEventListener('blur', commitName);
  };

  const s=stackEl();
  const firstSection = Array.from(s.children).find(ch => ch.classList?.contains('node') && !ch.hasAttribute('data-locked')) || null;
  if (firstSection) s.insertBefore(node, firstSection);
  else s.prepend(node);
  bindNameField();
  initAvatars(node);
  S.layout=(kind==='header-side')?'side':(kind==='header-fancy')?'fancy':'top';
  // reflect current layout on body so global styles can react (e.g. sheet width)
  document.body.setAttribute('data-layout', S.layout);
  if (S.theme) document.body.setAttribute('data-theme', S.theme);
  document.body.setAttribute('data-dark', S.dark?'1':'0');
  document.body.setAttribute('data-mat',  S.mat||'paper');

  normalizeCanvasForCurrentLayout({ showAdd: true });
  applyContact();
  queueMicrotask(()=> document.dispatchEvent(new CustomEvent('layout:changed', { detail:{ kind:S.layout } })));
  return node;
}

/* ---- Re-home existing sections when layout changes ---- */
function adoptSectionsToCurrentLayout(main, rail, add){
  if (!main) return;
  const mainAnchor = add && add.parentElement === main ? add : null;

  let wrappers = getSectionWrappers();
  if (Array.isArray(S.sectionOrder) && S.sectionOrder.length) {
    const orderMap = new Map(S.sectionOrder.map((key, index) => [key, index]));
    wrappers = wrappers.slice().sort((a, b) => {
      const ai = orderMap.has(a.dataset.section) ? orderMap.get(a.dataset.section) : Number.MAX_SAFE_INTEGER;
      const bi = orderMap.has(b.dataset.section) ? orderMap.get(b.dataset.section) : Number.MAX_SAFE_INTEGER;
      return ai - bi;
    });
  }
  const mainWrappers = [];
  const railWrappers = [];
  wrappers.forEach(wrapper => {
    const isSkills = wrapper.dataset.section === 'skills';
    if (isSkills && rail && S?.skillsInSidebar) railWrappers.push(wrapper);
    else mainWrappers.push(wrapper);
  });

  mainWrappers.forEach(wrapper => {
    main.insertBefore(wrapper, mainAnchor);
  });

  railWrappers.forEach(wrapper => {
    if (wrapper.parentElement !== rail) rail.appendChild(wrapper);
  });
}

export function normalizeCanvasForCurrentLayout({ showAdd } = {}){
  const stack = stackEl();
  const main = isSidebarActive() ? getSideMain() : stack;
  const rail = getRailHolder();
  const add = $('#canvasAdd');

  if (!stack || !main || !add) return null;

  adoptSectionsToCurrentLayout(main, rail, add);

  if (add.parentElement !== main) main.appendChild(add);
  if (typeof showAdd === 'boolean') add.style.display = showAdd ? 'flex' : 'none';

  sanitizeMainNodes();
  return { stack, main, rail, add };
}

function getHeroPiece(wrapper){
  if (!wrapper) return null;
  return wrapper.querySelector('.sidebar-layout .rail, .fancy .hero, .topbar');
}

function getAvatarPiece(wrapper){
  return wrapper?.querySelector('.avatar') || null;
}

function getHeroMorphData(wrapper){
  if (!wrapper) return null;
  const hero = getHeroPiece(wrapper);
  if (!hero) return null;
  const rect = hero.getBoundingClientRect();
  const cs = getComputedStyle(hero);
  return {
    rect: {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    },
    background: cs.background,
    borderRadius: cs.borderRadius,
    boxShadow: cs.boxShadow,
    border: cs.border
  };
}

function makeHeroGhost(data){
  if (!data) return null;
  const ghost = document.createElement('div');
  ghost.className = 'layout-morph-ghost layout-morph-hero';
  ghost.style.width = `${data.rect.width}px`;
  ghost.style.height = `${data.rect.height}px`;
  ghost.style.left = `${data.rect.left}px`;
  ghost.style.top = `${data.rect.top}px`;
  ghost.style.margin = '0';
  ghost.style.background = data.background;
  ghost.style.borderRadius = data.borderRadius;
  ghost.style.boxShadow = data.boxShadow;
  ghost.style.border = data.border;
  ghost.style.transform = 'translate(0,0) scale(1,1)';
  document.body.appendChild(ghost);
  return { ghost, rect: data.rect, borderRadius: data.borderRadius };
}

function makeAvatarGhost(el){
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const ghost = document.createElement('div');
  ghost.className = 'layout-morph-ghost layout-morph-avatar';
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  ghost.style.left = `${rect.left}px`;
  ghost.style.top = `${rect.top}px`;
  ghost.style.margin = '0';
  ghost.style.borderRadius = '999px';
  ghost.style.overflow = 'hidden';
  ghost.style.background = cs.background;
  ghost.style.border = cs.border;
  ghost.style.boxShadow = cs.boxShadow;
  const sourceCanvas = el.querySelector('canvas');
  if (sourceCanvas) {
    const canvas = document.createElement('canvas');
    canvas.width = sourceCanvas.width || rect.width;
    canvas.height = sourceCanvas.height || rect.height;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    try { ctx.drawImage(sourceCanvas, 0, 0); } catch(_){}
    ghost.appendChild(canvas);
  }
  document.body.appendChild(ghost);
  return { ghost, rect };
}

function collectFadeTargets(wrapper){
  if (!wrapper) return [];
  const set = new Set();
  const header = wrapper.querySelector('[data-header]');
  if (header){
    Array.from(header.children).forEach(child => {
      if (!child.closest('.hero, .topbar, .rail') || !getHeroPiece(wrapper)?.contains(child)) set.add(child);
    });
    const hero = getHeroPiece(wrapper);
    if (hero){
      Array.from(hero.children).forEach(child => {
        if (!child.classList?.contains('avatar')) set.add(child);
      });
    }
  }
  const main = wrapper.querySelector('[data-zone="main"], .below');
  if (main){
    Array.from(main.children).forEach(child => set.add(child));
  }
  const railSections = wrapper.querySelector('[data-rail-sections]');
  if (railSections){
    Array.from(railSections.children).forEach(child => set.add(child));
  }
  return Array.from(set).filter(Boolean);
}

function animateFadeTargets(targets, keyframes, options){
  targets.forEach(el => {
    el.classList.add('layout-morph-fade');
    el.animate(keyframes, options);
  });
}

function resolveDisplayName(){
  return String(S?.contact?.name || S?.project?.title || '').trim();
}

function syncLiveHeaderState(){
  const head = getHeaderNode();
  if (!head) return;
  const nameNode = head.querySelector('.name');
  if (nameNode) {
    const liveName = String(nameNode.textContent || '').trim();
    if (liveName && liveName !== 'YOUR NAME') {
      S.contact = S.contact || {};
      S.contact.name = liveName;
    }
  }
  const avatar = head.querySelector('.avatar img');
  if (avatar?.src) {
    S.avatar = S.avatar || {};
    S.avatar.src = avatar.src;
  }
  save();
}

export function morphTo(kind){
  syncLiveHeaderState();
  const currentKind =
    S.layout === 'side' ? 'header-side' :
    S.layout === 'fancy' ? 'header-fancy' :
    S.layout === 'top' ? 'header-top' :
    null;
  if (currentKind === kind && getHeaderNodeWrapper()){
    normalizeCanvasForCurrentLayout({ showAdd: true });
    return;
  }

  const oldWrap=getHeaderNodeWrapper();
  const oldHeader = oldWrap?.querySelector('[data-header]');
  const oldHero = getHeroPiece(oldWrap);
  const oldHeroData = getHeroMorphData(oldWrap);
  const oldAvatar = getAvatarPiece(oldWrap);
  const avatarGhostData = oldAvatar ? makeAvatarGhost(oldAvatar) : null;
  const oldFadeTargets = collectFadeTargets(oldWrap);
  const sectionTargets = getSectionWrappers();
  const add = $('#canvasAdd');

  if (oldHeader) oldHeader.removeAttribute('data-header');
  const temp=buildHeader(kind);
  $$('.node[data-locked]').forEach(node => { if (node !== temp && node !== oldWrap) node.remove(); });

  normalizeCanvasForCurrentLayout({ showAdd: true });

  const newHero = getHeroPiece(temp);
  const newHeroData = getHeroMorphData(temp);
  const newAvatar = getAvatarPiece(temp);
  const newFadeTargets = collectFadeTargets(temp);

  if (!oldWrap || !oldHero || !newHero || !oldHeroData || !newHeroData){
    if (oldWrap) oldWrap.remove();
    normalizeCanvasForCurrentLayout({ showAdd: true });
    return;
  }

  const heroGhostData = makeHeroGhost(oldHeroData);

  oldHero.classList.add('layout-morph-hide');
  if (oldAvatar) oldAvatar.classList.add('layout-morph-hide');
  newHero.classList.add('layout-morph-hide');
  if (newAvatar) newAvatar.classList.add('layout-morph-hide');

  animateFadeTargets(
    [...oldFadeTargets, ...sectionTargets, ...(add ? [add] : [])],
    [
      { opacity:1, filter:'blur(0px)' },
      { opacity:0, filter:'blur(3px)' }
    ],
    { duration:180, easing:'ease-in', fill:'forwards' }
  );

  window.setTimeout(() => {
    oldWrap.remove();
    normalizeCanvasForCurrentLayout({ showAdd: true });

    const settledNewHero = getHeroPiece(temp);
    const settledNewHeroData = getHeroMorphData(temp);
    const settledNewAvatar = getAvatarPiece(temp);
    const newHeroRect = settledNewHeroData?.rect;
    const newAvatarRect = settledNewAvatar?.getBoundingClientRect();

    if (heroGhostData && newHeroRect && settledNewHero && settledNewHeroData){
      const dx = newHeroRect.left - heroGhostData.rect.left;
      const dy = newHeroRect.top - heroGhostData.rect.top;
      const sx = newHeroRect.width / heroGhostData.rect.width;
      const sy = newHeroRect.height / heroGhostData.rect.height;
      heroGhostData.ghost.animate(
        [
          { transform:'translate(0,0) scale(1,1)', borderRadius:heroGhostData.borderRadius, opacity:1 },
          { transform:`translate(${dx}px,${dy}px) scale(${sx},${sy})`, borderRadius:settledNewHeroData.borderRadius, opacity:1 }
        ],
        { duration:560, easing:'cubic-bezier(.18,1,.24,1)', fill:'forwards' }
      );
    }

    if (avatarGhostData && newAvatarRect){
      const dx = newAvatarRect.left - avatarGhostData.rect.left;
      const dy = newAvatarRect.top - avatarGhostData.rect.top;
      const sx = newAvatarRect.width / avatarGhostData.rect.width;
      const sy = newAvatarRect.height / avatarGhostData.rect.height;
      avatarGhostData.ghost.animate(
        [
          { transform:'translate(0,0) scale(1,1)', opacity:1 },
          { transform:`translate(${dx}px,${dy}px) scale(${sx},${sy})`, opacity:1 }
        ],
        { duration:560, easing:'ease-in-out', fill:'forwards' }
      );
    }

    window.setTimeout(() => {
      settledNewHero?.classList.remove('layout-morph-hide');
      if (settledNewAvatar) settledNewAvatar.classList.remove('layout-morph-hide');

      animateFadeTargets(
        [...newFadeTargets, ...sectionTargets, ...(add ? [add] : [])],
        [
          { opacity:0, filter:'blur(3px)', transform:'translateY(8px)' },
          { opacity:1, filter:'blur(0px)', transform:'translateY(0px)' }
        ],
        { duration:240, easing:'ease-out', fill:'forwards' }
      );

      window.setTimeout(() => {
        heroGhostData?.ghost.remove();
        avatarGhostData?.ghost.remove();
        normalizeCanvasForCurrentLayout({ showAdd: true });
      }, 250);
    }, 565);
  }, 190);
}

/* ---- Add anchor owner (SINGLE SOURCE) ---- */
export function ensureAddAnchor(show){
  return normalizeCanvasForCurrentLayout({ showAdd: show })?.add || null;
}

export function stabilizeLayoutNow(){
  syncLiveHeaderState();
  $$('.layout-morph-ghost').forEach(el => el.remove());
  $$('.layout-morph-hide').forEach(el => el.classList.remove('layout-morph-hide'));
  applyContact();
}
