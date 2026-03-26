// App entry — wires everything together
import { S, setTheme, setCustomGradient, setDark, setMaterial, hydrateFromStorage, setStorageScope } from './state.js';
import { initAuth, getStorageScope, authState } from './auth.js';
const APP_VERSION = 'resume-app@2025.08.17-002';
console.log('[app.js] ' + APP_VERSION);
import { mountEditor } from '../editor/editor.js';
import { mountWelcome, mountWizard, loadDemoResume } from '../wizard/wizard.js';
import { ensureCanvas, getHeaderNode, getSideMain, stabilizeLayoutNow } from '../layouts/layouts.js';
import { mountProjectLibrary, applyStateToCanvas, saveCurrentProject, showActionFeedback } from './projects.js';
import '../modules/modules.js'; // side-effect: registers custom styles for modules

const PAGE_WIDTH = 860;
const PAGE_HEIGHT = 1120;
const MOBILE_BREAKPOINT = 700;
const MIN_USER_ZOOM = 0.72;
const MAX_USER_ZOOM = 2.6;
let mobileFitScale = 1;
let mobileUserZoom = 1;
let pinchState = null;
let lastEffectiveScale = 1;

function clamp(v, min, max){
  return Math.min(max, Math.max(min, v));
}

function isMobileCanvasMode(){
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function syncMobileCanvasViewport(){
  const root = document.getElementById('canvas-root');
  const nav = document.getElementById('topbar-root');
  if (!root) return;

  if (!isMobileCanvasMode()){
    root.style.height = '';
    return;
  }

  const navHeight = nav?.getBoundingClientRect().height || 0;
  root.style.height = `${Math.max(220, window.innerHeight - navHeight)}px`;
}

function pinchDistance(touches){
  const [a, b] = touches;
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

function syncCanvasScale(options = {}){
  const page = document.querySelector('.page');
  const sheet = document.getElementById('sheet');
  const root = document.getElementById('canvas-root');
  if (!page || !sheet) return;
  const { preserveFocus = null, resetScroll = false } = options;
  const previousScale = lastEffectiveScale || 1;

  if (window.innerWidth > MOBILE_BREAKPOINT){
    document.documentElement.style.setProperty('--mobile-canvas-scale', '1');
    mobileFitScale = 1;
    mobileUserZoom = 1;
    lastEffectiveScale = 1;
    page.style.width = '';
    page.style.height = '';
    page.style.minHeight = '';
    if (root) root.scrollLeft = 0;
    return;
  }

  const availableWidth = Math.max(280, window.innerWidth - 8);
  mobileFitScale = Math.min(1, availableWidth / PAGE_WIDTH);
  const effectiveScale = mobileFitScale * mobileUserZoom;
  const scaledHeight = Math.ceil(sheet.scrollHeight * effectiveScale);
  const scaledWidth = Math.ceil(PAGE_WIDTH * effectiveScale);

  document.documentElement.style.setProperty('--mobile-canvas-scale', effectiveScale.toFixed(4));
  page.style.width = `${scaledWidth}px`;
  page.style.height = `${scaledHeight}px`;
  page.style.minHeight = `${scaledHeight}px`;
  page.style.margin = '0 auto';
  lastEffectiveScale = effectiveScale;
  if (root) {
    if (preserveFocus){
      const contentX = (root.scrollLeft + preserveFocus.x) / previousScale;
      const contentY = (root.scrollTop + preserveFocus.y) / previousScale;
      root.scrollLeft = Math.max(0, contentX * effectiveScale - preserveFocus.x);
      root.scrollTop = Math.max(0, contentY * effectiveScale - preserveFocus.y);
    } else if (resetScroll) {
      root.scrollLeft = Math.max(0, (scaledWidth - root.clientWidth) / 2);
      root.scrollTop = 0;
    }
  }
}

function setMobileUserZoom(nextZoom){
  const clamped = clamp(nextZoom, MIN_USER_ZOOM, MAX_USER_ZOOM);
  if (Math.abs(clamped - mobileUserZoom) < 0.001) return;
  mobileUserZoom = clamped;
}

function touchCenter(touches){
  const [a, b] = touches;
  return {
    x: (a.clientX + b.clientX) / 2,
    y: (a.clientY + b.clientY) / 2
  };
}

function mountMobileCanvasGestures(){
  const root = document.getElementById('canvas-root');
  if (!root) return;

  root.addEventListener('touchstart', e => {
    if (!isMobileCanvasMode() || e.touches.length !== 2) return;
    pinchState = {
      distance: pinchDistance(e.touches),
      userZoom: mobileUserZoom,
      center: touchCenter(e.touches)
    };
  }, { passive: true });

  root.addEventListener('touchmove', e => {
    if (!isMobileCanvasMode() || e.touches.length !== 2 || !pinchState) return;
    const distance = pinchDistance(e.touches);
    if (!distance || !pinchState.distance) return;
    e.preventDefault();
    const ratio = distance / pinchState.distance;
    const center = touchCenter(e.touches);
    setMobileUserZoom(pinchState.userZoom * ratio);
    const rect = root.getBoundingClientRect();
    syncCanvasScale({
      preserveFocus: {
        x: center.x - rect.left,
        y: center.y - rect.top
      }
    });
  }, { passive: false });

  const endPinch = () => { pinchState = null; };
  root.addEventListener('touchend', endPinch, { passive: true });
  root.addEventListener('touchcancel', endPinch, { passive: true });
}

function mountCanvasScaleSync(){
  syncMobileCanvasViewport();
  syncCanvasScale({ resetScroll: true });
  window.addEventListener('resize', () => {
    syncMobileCanvasViewport();
    syncCanvasScale({ resetScroll: true });
  }, { passive: true });
  window.addEventListener('orientationchange', () => {
    syncMobileCanvasViewport();
    syncCanvasScale({ resetScroll: true });
  }, { passive: true });

  const sheet = document.getElementById('sheet');
  if (!sheet || typeof ResizeObserver === 'undefined') return;

  const ro = new ResizeObserver(() => syncCanvasScale());
  ro.observe(sheet);
}

function ensurePrintSidebarSummary(){
  let node = document.getElementById('printSidebarSummary');
  if (!node) {
    node = document.createElement('div');
    node.id = 'printSidebarSummary';
    node.setAttribute('aria-hidden', 'true');
    document.body.appendChild(node);
  }
  const name = S.contact?.name || 'Mi CV';
  const phone = S.contact?.phone || '';
  const email = S.contact?.email || '';
  node.innerHTML = `
    <div class="pss-bar">
      <div class="pss-name">${name}</div>
      <div class="pss-chips">
        ${phone ? `<span class="pss-chip"><i class="fa-solid fa-phone"></i><span>${phone}</span></span>` : ''}
        ${email ? `<span class="pss-chip"><i class="fa-solid fa-envelope"></i><span>${email}</span></span>` : ''}
      </div>
    </div>
  `;
}

function stripInteractive(node){
  if (!node) return node;
  node.querySelectorAll([
    '#canvasAdd',
    '.add-squircle',
    '.add-dot',
    '.sec-remove',
    '.chip-rm',
    '.ctrl-circle',
    '.drag-handle',
    '.skill-handle',
    '.card-controls',
    '#chipAddBtn',
    '#chipAddPop',
    '.pop',
    '.add-pop'
  ].join(',')).forEach(el => el.remove());
  node.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
  return node;
}

function persistCanvasContent(node){
  if (!node) return node;
  node.querySelectorAll('input[type="range"]').forEach(range => {
    const value = Number(range.value || 0);
    const wrap = document.createElement('div');
    wrap.className = 'print-meter';
    wrap.style.width = range.style.width || '120px';
    wrap.style.height = '6px';
    wrap.style.borderRadius = '999px';
    wrap.style.background = '#2f3440';
    wrap.style.position = 'relative';
    wrap.style.alignSelf = 'center';
    const fill = document.createElement('span');
    fill.style.position = 'absolute';
    fill.style.left = '0';
    fill.style.top = '0';
    fill.style.bottom = '0';
    fill.style.width = `${Math.max(0, Math.min(100, value))}%`;
    fill.style.borderRadius = '999px';
    fill.style.background = 'var(--accent)';
    const knob = document.createElement('span');
    knob.style.position = 'absolute';
    knob.style.left = `calc(${Math.max(0, Math.min(100, value))}% - 6px)`;
    knob.style.top = '50%';
    knob.style.width = '12px';
    knob.style.height = '12px';
    knob.style.borderRadius = '50%';
    knob.style.transform = 'translateY(-50%)';
    knob.style.background = 'var(--accent)';
    knob.style.boxShadow = '0 0 0 2px rgba(255,255,255,.92)';
    wrap.appendChild(fill);
    wrap.appendChild(knob);
    range.replaceWith(wrap);
  });
  node.querySelectorAll('canvas').forEach(canvas => {
    try {
      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/png');
      img.alt = '';
      img.width = canvas.width || canvas.clientWidth || 0;
      img.height = canvas.height || canvas.clientHeight || 0;
      img.style.cssText = canvas.getAttribute('style') || '';
      img.style.width = canvas.style.width || `${canvas.clientWidth || canvas.width}px`;
      img.style.height = canvas.style.height || `${canvas.clientHeight || canvas.height}px`;
      img.style.display = 'block';
      img.style.borderRadius = canvas.style.borderRadius || '50%';
      canvas.replaceWith(img);
    } catch (_) {}
  });
  node.querySelectorAll('.avatar').forEach(avatar => {
    const src = S.avatar?.src || '';
    if (src) {
      avatar.querySelectorAll('img,canvas').forEach(el => el.remove());
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.display = 'block';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '50%';
      avatar.appendChild(img);
    }
  });
  return node;
}

function cloneClean(node){
  if (!node) return null;
  const clone = node.cloneNode(true);
  stripInteractive(clone);
  const sourceCanvases = Array.from(node.querySelectorAll('canvas'));
  const cloneCanvases = Array.from(clone.querySelectorAll('canvas'));
  sourceCanvases.forEach((sourceCanvas, index) => {
    const targetCanvas = cloneCanvases[index];
    if (!targetCanvas) return;
    try {
      const img = document.createElement('img');
      img.src = sourceCanvas.toDataURL('image/png');
      img.alt = '';
      img.width = sourceCanvas.width || sourceCanvas.clientWidth || 0;
      img.height = sourceCanvas.height || sourceCanvas.clientHeight || 0;
      img.style.cssText = targetCanvas.getAttribute('style') || sourceCanvas.getAttribute('style') || '';
      img.style.width = targetCanvas.style.width || sourceCanvas.style.width || `${sourceCanvas.clientWidth || sourceCanvas.width}px`;
      img.style.height = targetCanvas.style.height || sourceCanvas.style.height || `${sourceCanvas.clientHeight || sourceCanvas.height}px`;
      img.style.display = 'block';
      img.style.objectFit = 'cover';
      img.style.borderRadius = targetCanvas.style.borderRadius || sourceCanvas.style.borderRadius || '50%';
      targetCanvas.replaceWith(img);
    } catch (_) {}
  });
  clone.querySelectorAll('.skill-row').forEach(row => {
    row.style.display = 'grid';
    row.style.gridTemplateColumns = 'minmax(0,1fr) 118px';
    row.style.gap = '10px';
    row.style.alignItems = 'center';
    row.querySelectorAll('.skill-handle,.ctrl-circle,.drag-handle').forEach(el => el.remove());
    const name = row.querySelector('.name');
    if (name) {
      name.style.minWidth = '0';
      name.style.overflow = 'hidden';
      name.style.whiteSpace = 'nowrap';
      name.style.textOverflow = 'ellipsis';
      name.style.display = 'block';
    }
    const val = row.querySelector('.val');
    if (val) {
      val.style.minWidth = '118px';
      val.style.width = '118px';
      val.style.justifyContent = 'flex-end';
    }
  });
  clone.querySelectorAll('.chip').forEach(chip => {
    chip.style.margin = '0';
  });
  const sourceSkillWraps = Array.from(node.querySelectorAll('.skills-wrap'));
  const cloneSkillWraps = Array.from(clone.querySelectorAll('.skills-wrap'));
  sourceSkillWraps.forEach((sourceWrap, index) => {
    const targetWrap = cloneSkillWraps[index];
    if (!targetWrap) return;
    const styles = getComputedStyle(sourceWrap);
    targetWrap.style.display = styles.display;
    targetWrap.style.gridTemplateColumns = styles.gridTemplateColumns;
    targetWrap.style.gap = styles.gap;
    targetWrap.style.rowGap = styles.rowGap;
    targetWrap.style.columnGap = styles.columnGap;
  });
  const sourceEduGrids = Array.from(node.querySelectorAll('.edu-grid'));
  const cloneEduGrids = Array.from(clone.querySelectorAll('.edu-grid'));
  sourceEduGrids.forEach((sourceGrid, index) => {
    const targetGrid = cloneEduGrids[index];
    if (!targetGrid) return;
    const styles = getComputedStyle(sourceGrid);
    targetGrid.style.display = styles.display;
    targetGrid.style.gridTemplateColumns = styles.gridTemplateColumns;
    targetGrid.style.gap = styles.gap;
    targetGrid.style.rowGap = styles.rowGap;
    targetGrid.style.columnGap = styles.columnGap;
  });
  clone.querySelectorAll('[style]').forEach(el => {
    if (el.matches('.avatar, .avatar *, img, .print-meter, .print-meter *, .topbar, .fancy .hero, .sidebar-layout .rail')) return;
    el.style.removeProperty('height');
    el.style.removeProperty('min-height');
    el.style.removeProperty('max-height');
  });
  clone.querySelectorAll('*').forEach(el => {
    if (!el.matches('.avatar, .avatar *, img, canvas, .print-meter, .print-meter *')) {
      el.style.height = 'auto';
      el.style.minHeight = '0';
      el.style.maxHeight = 'none';
    }
  });
  clone.querySelectorAll('.section,.sec-body,.skills-wrap,.edu-grid,.exp-list,.card,.profile-copy,.print-continuation').forEach(el => {
    el.style.height = 'auto';
    el.style.minHeight = '0';
    el.style.maxHeight = 'none';
  });
  clone.querySelectorAll('.section,.sec-body,.skills-wrap,.edu-grid,.exp-list,.card,.skill-row,.profile-copy,.print-continuation').forEach(el => {
    el.style.width = '100%';
    el.style.maxWidth = 'none';
    el.style.minWidth = '0';
  });
  clone.querySelectorAll('.topbar,.fancy .hero,.sidebar-layout .rail').forEach(el => {
    el.style.maxHeight = 'none';
  });
  return persistCanvasContent(clone);
}

function cloneHeaderForExport(node){
  const clone = cloneClean(node);
  const sourceHeader = node?.matches?.('[data-header]') ? node : node?.querySelector?.('[data-header]');
  const targetHeader = clone?.matches?.('[data-header]') ? clone : clone?.querySelector?.('[data-header]');
  if (!sourceHeader || !targetHeader) return clone;

  const sourceName = sourceHeader.querySelector('.name');
  const targetName = targetHeader.querySelector('.name');
  if (sourceName && targetName) targetName.textContent = sourceName.textContent;

  const sourceAvatar = sourceHeader.querySelector('.avatar');
  const targetAvatar = targetHeader.querySelector('.avatar');
  if (sourceAvatar && targetAvatar) {
    const avatarRect = sourceAvatar.getBoundingClientRect();
    const size = Math.round(avatarRect.width);
    targetAvatar.style.width = `${size}px`;
    targetAvatar.style.height = `${size}px`;
    targetAvatar.style.minWidth = `${size}px`;
    targetAvatar.style.minHeight = `${size}px`;
    targetAvatar.style.maxWidth = `${size}px`;
    targetAvatar.style.maxHeight = `${size}px`;
  }

  if (sourceHeader.classList.contains('fancy')) {
    const sourceHero = sourceHeader.querySelector('.hero');
    const targetHero = targetHeader.querySelector('.hero');
    const sourceGrid = sourceHeader.querySelector('.chip-grid');
    const targetGrid = targetHeader.querySelector('.chip-grid');
    if (sourceHero && targetHero) {
      const heroRect = sourceHero.getBoundingClientRect();
      const heroStyles = getComputedStyle(sourceHero);
      targetHeader.setAttribute('data-chip-count', sourceHeader.getAttribute('data-chip-count') || '0');
      targetHero.style.height = `${Math.round(heroRect.height)}px`;
      targetHero.style.minHeight = `${Math.round(heroRect.height)}px`;
      targetHero.style.paddingTop = heroStyles.paddingTop;
      targetHero.style.paddingRight = heroStyles.paddingRight;
      targetHero.style.paddingBottom = heroStyles.paddingBottom;
      targetHero.style.paddingLeft = heroStyles.paddingLeft;
      targetHero.style.background = heroStyles.background;
    }
    if (sourceAvatar && targetAvatar && sourceHero && targetHero) {
      const heroRect = sourceHero.getBoundingClientRect();
      const avatarRect = sourceAvatar.getBoundingClientRect();
      const bottom = heroRect.bottom - avatarRect.bottom;
      targetAvatar.style.left = '50%';
      targetAvatar.style.transform = 'translateX(-50%)';
      targetAvatar.style.bottom = `${Math.round(bottom)}px`;
    }
    if (sourceGrid && targetGrid) {
      const gridStyles = getComputedStyle(sourceGrid);
      targetGrid.style.gridTemplateColumns = gridStyles.gridTemplateColumns;
      targetGrid.style.top = gridStyles.top;
      targetGrid.style.bottom = gridStyles.bottom;
      targetGrid.style.left = gridStyles.left;
      targetGrid.style.right = gridStyles.right;
      targetGrid.style.columnGap = gridStyles.columnGap;
      targetGrid.style.rowGap = gridStyles.rowGap;
      ['[data-info-top]','[data-info-left]','[data-info-right]'].forEach(selector => {
        const sourceGroup = sourceGrid.querySelector(selector);
        const targetGroup = targetGrid.querySelector(selector);
        if (!sourceGroup || !targetGroup) return;
        const groupStyles = getComputedStyle(sourceGroup);
        targetGroup.style.display = groupStyles.display;
        targetGroup.style.gridTemplateColumns = groupStyles.gridTemplateColumns;
        targetGroup.style.justifyContent = groupStyles.justifyContent;
        targetGroup.style.justifyItems = groupStyles.justifyItems;
        targetGroup.style.alignItems = groupStyles.alignItems;
        targetGroup.style.justifySelf = groupStyles.justifySelf;
        targetGroup.style.alignSelf = groupStyles.alignSelf;
        targetGroup.style.width = groupStyles.width;
        targetGroup.style.gap = groupStyles.gap;
        const sourceChips = Array.from(sourceGroup.querySelectorAll('.chip'));
        const targetChips = Array.from(targetGroup.querySelectorAll('.chip'));
        sourceChips.forEach((sourceChip, idx) => {
          const targetChip = targetChips[idx];
          if (!targetChip) return;
          const chipRect = sourceChip.getBoundingClientRect();
          targetChip.style.width = `${Math.round(chipRect.width)}px`;
          targetChip.style.maxWidth = `${Math.round(chipRect.width)}px`;
        });
      });
    }
  }

  return clone;
}

function getSectionNodesForExport(){
  if (S.layout === 'side') {
    const main = getSideMain();
    if (!main) return [];
    return Array.from(main.children).filter(el => el.querySelector?.('.section'));
  }
  const stack = document.getElementById('stack');
  if (!stack) return [];
  return Array.from(stack.children).filter(el => el.querySelector?.('.section'));
}

function getSectionSplitConfig(sectionNode){
  const section = sectionNode.querySelector('.section') || sectionNode;
  const key = section?.dataset?.section;
  if (key === 'skills') return { selector: '.skills-wrap > .skill-row', containerSelector: '.skills-wrap' };
  if (key === 'edu') return { selector: '.edu-grid > .card', containerSelector: '.edu-grid' };
  if (key === 'exp') return { selector: '.exp-list > .card', containerSelector: '.exp-list' };
  return null;
}

function createPrintMeasureRoot(){
  let root = document.getElementById('printMeasureRoot');
  if (root) return root;
  root = document.createElement('div');
  root.id = 'printMeasureRoot';
  root.style.cssText = [
    'position:fixed',
    'left:-20000px',
    'top:0',
    'width:900px',
    'padding:0',
    'margin:0',
    'visibility:hidden',
    'pointer-events:none',
    'z-index:-1',
    'background:transparent'
  ].join(';');
  document.body.appendChild(root);
  return root;
}

function getExportStyles(){
  return `
    html,body{margin:0;background:transparent !important;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .print-export-root{display:grid;gap:0}
    .print-page{width:${PAGE_WIDTH}px;height:${PAGE_HEIGHT}px;min-height:${PAGE_HEIGHT}px;padding:24px;box-sizing:border-box;background:#fff;color:#111;page-break-after:always;break-after:page;overflow:hidden}
    .print-page:last-child{page-break-after:auto;break-after:auto}
    .print-sidebar-page{display:grid;grid-template-columns:300px minmax(0,1fr);gap:18px;align-items:start}
    .print-main,.print-flow{display:grid;gap:16px;align-content:start;align-items:start;justify-items:stretch;min-width:0}
    .print-main > *,
    .print-flow > *{width:100% !important;max-width:none !important;justify-self:stretch !important}
    .print-summary{display:grid;gap:10px;border-radius:16px;padding:14px 16px;background:linear-gradient(135deg,var(--accent2),var(--accent));color:#111}
    .print-summary-head{display:flex;align-items:center;justify-content:space-between;gap:16px}
    .print-summary-name{font-weight:900;font-size:28px;line-height:1.05}
    .print-summary-chips{display:flex;flex-wrap:wrap;gap:10px}
    .print-summary-chip{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border-radius:999px;background:#fff;border:1px solid rgba(0,0,0,.08);min-height:34px;font-size:11px;line-height:1.1}
    .print-summary-chip i{width:14px;text-align:center;font-size:12px}
    .print-page .sidebar-layout .rail{display:flex !important;flex-direction:column !important;align-items:flex-start !important}
    .print-page .sidebar-layout .rail .avatar{
      display:block !important;
      margin:18px auto 14px !important;
      align-self:center !important;
      justify-self:center !important;
      left:auto !important;
      right:auto !important;
      top:auto !important;
      bottom:auto !important;
      transform:none !important;
      width:132px !important;
      height:132px !important;
      min-width:132px !important;
      min-height:132px !important;
      max-width:132px !important;
      max-height:132px !important;
      aspect-ratio:1 / 1 !important;
      border-radius:50% !important;
    }
    .print-page .sidebar-layout .rail .chip-wrap{
      width:100% !important;
      display:flex !important;
      flex-direction:column !important;
      align-items:center !important;
      gap:8px !important;
    }
    .print-page .sidebar-layout .rail .chip-wrap .chips{
      width:100% !important;
      display:flex !important;
      flex-wrap:wrap !important;
      gap:8px !important;
    }
    .print-page .sidebar-layout .rail .chip-wrap .chip,
    .print-page .sidebar-layout .rail > .chips .chip{
      flex:1 1 100% !important;
      width:100% !important;
      max-width:100% !important;
      min-height:24px !important;
      padding:3px 7px !important;
      font-size:9px !important;
      line-height:1.05 !important;
      gap:6px !important;
    }
    .print-page .sidebar-layout .rail .chip span,
    .print-page .sidebar-layout .rail .chip .chip-input{
      font-size:9px !important;
      line-height:1.05 !important;
    }
    .print-page .sidebar-layout .rail .chip i{width:12px !important;font-size:10px !important}
    .print-page .add-squircle,
    .print-page .add-dot,
    .print-page .sec-remove,
    .print-page .chip-rm,
    .print-page .ctrl-circle,
    .print-page .drag-handle,
    .print-page .skill-handle,
    .print-page .card-controls,
    .print-page #chipAddBtn,
    .print-page #chipAddPop{display:none !important}
    .print-page .avatar img,
    .print-page .avatar canvas{width:100% !important;height:100% !important;display:block !important;object-fit:cover !important;border-radius:50% !important}
    .print-page .section,
    .print-page .print-continuation{width:100% !important;max-width:none !important;justify-self:stretch !important}
    .print-page .section{break-inside:auto !important;page-break-inside:auto !important}
    .print-page .card,
    .print-page .skill-row,
    .print-page .profile-copy{break-inside:avoid !important;page-break-inside:avoid !important}
    .print-page .section,
    .print-page .sec-body,
    .print-page .skills-wrap,
    .print-page .edu-grid,
    .print-page .exp-list,
    .print-page .card,
    .print-page .profile-copy{height:auto !important;min-height:0 !important;max-height:none !important}
    .print-page .skills-wrap{display:grid !important;gap:12px !important}
    .print-page .skill-row{display:grid !important;grid-template-columns:minmax(0,1fr) 118px !important;gap:10px !important;align-items:center !important}
    .print-page .skill-row .name{display:block !important;min-width:0 !important;overflow:hidden !important;white-space:nowrap !important;text-overflow:ellipsis !important}
    .print-page .skill-row .val{display:flex !important;align-items:center !important;justify-content:flex-end !important;min-width:118px !important;width:118px !important}
    .print-page .skill-row .stars{display:inline-grid !important;grid-auto-flow:column !important;gap:4px !important;justify-content:end !important}
    .print-page .skill-row .print-meter{width:110px !important}
    .print-page .chip{margin:0 !important}
    @page{size:A4;margin:0}
  `;
}

function createSummaryHeader(){
  const headerRoot = getHeaderNode();
  const headerBase =
    headerRoot?.querySelector('.hero') ||
    headerRoot?.querySelector('.rail') ||
    headerRoot;
  const baseStyles = headerBase ? getComputedStyle(headerBase) : null;
  const chipBase = headerBase?.querySelector('.chip');
  const chipStyles = chipBase ? getComputedStyle(chipBase) : null;
  const summaryBg = baseStyles?.backgroundImage || 'linear-gradient(135deg,var(--accent2),var(--accent))';
  const summaryInk = baseStyles?.color || '#111';
  const chipBg = chipStyles?.backgroundColor || '#fff';
  const chipBorder = chipStyles?.border || '1px solid rgba(0,0,0,.08)';
  const chipColor = chipStyles?.color || '#111';
  const chips = [];
  if (S.contact?.phone) chips.push(`<span class="print-summary-chip" style="background:${chipBg};border:${chipBorder};color:${chipColor}"><i class="fa-solid fa-phone"></i><span>${S.contact.phone}</span></span>`);
  if (S.contact?.email) chips.push(`<span class="print-summary-chip" style="background:${chipBg};border:${chipBorder};color:${chipColor}"><i class="fa-solid fa-envelope"></i><span>${S.contact.email}</span></span>`);
  return `
    <div class="print-summary" style="background:${summaryBg};color:${summaryInk}">
      <div class="print-summary-head">
        <div class="print-summary-name">${S.contact?.name || 'Mi CV'}</div>
        <div class="print-summary-chips">${chips.join('')}</div>
      </div>
    </div>
  `;
}

function createMeasurePage({ sidebar = false, includeSummary = false, rail = null, header = null } = {}){
  const page = document.createElement('div');
  page.className = 'print-page';
  if (sidebar) {
    const layout = document.createElement('div');
    layout.className = 'print-sidebar-page sidebar-layout';
    if (rail) layout.appendChild(cloneClean(rail));
    const main = document.createElement('div');
    main.className = 'print-main';
    main.setAttribute('data-zone', 'main');
    main.setAttribute('data-print-body', '');
    if (header) main.appendChild(cloneHeaderForExport(header));
    layout.appendChild(main);
    page.appendChild(layout);
  } else {
    const flow = document.createElement('div');
    flow.className = 'print-flow';
    flow.setAttribute('data-print-body', '');
    if (includeSummary) flow.insertAdjacentHTML('beforeend', createSummaryHeader());
    if (header) flow.appendChild(cloneHeaderForExport(header));
    page.appendChild(flow);
  }
  return page;
}

function makeSectionShell(sectionNode){
  const full = cloneClean(sectionNode.querySelector('.section') || sectionNode);
  full.style.height = 'auto';
  full.style.minHeight = '0';
  full.style.maxHeight = 'none';
  const body = full.querySelector('.sec-body');
  if (body) {
    body.innerHTML = '';
    body.style.height = 'auto';
    body.style.minHeight = '0';
    body.style.maxHeight = 'none';
  }
  return full;
}

function createSectionContainer(sectionNode, shell){
  const config = getSectionSplitConfig(sectionNode);
  if (!config) return { config: null, container: null };
  const body = shell.querySelector('.sec-body');
  if (!body) return { config: null, container: null };
  const source = sectionNode.querySelector(config.containerSelector);
  const container = source ? source.cloneNode(false) : document.createElement('div');
  if (!source) container.className = config.containerSelector.replace('.', '');
  container.style.height = 'auto';
  container.style.minHeight = '0';
  container.style.maxHeight = 'none';
  body.appendChild(container);
  return { config, container };
}

function createContinuationContainer(sectionNode){
  const config = getSectionSplitConfig(sectionNode);
  if (!config) return null;
  const source = sectionNode.querySelector(config.containerSelector);
  const container = source ? source.cloneNode(false) : document.createElement('div');
  if (!source) container.className = config.containerSelector.replace('.', '');
  container.classList.add('print-continuation');
  container.style.height = 'auto';
  container.style.minHeight = '0';
  container.style.maxHeight = 'none';
  return container;
}

function measureFits(root, page, body, node){
  const CONTENT_LIMIT = PAGE_HEIGHT - 48;
  body.appendChild(node);
  const fits = body.scrollHeight <= CONTENT_LIMIT;
  body.removeChild(node);
  return fits;
}

function paginateExport(){
  const measureRoot = createPrintMeasureRoot();
  measureRoot.innerHTML = '';
  const exportRoot = document.createElement('div');
  exportRoot.className = 'print-export-root';
  exportRoot.innerHTML = `<style>${getExportStyles()}</style>`;
  measureRoot.appendChild(exportRoot);

  const headerNode = getHeaderNode()?.closest('.node') || getHeaderNode();
  const railNode = S.layout === 'side' ? getHeaderNode()?.closest('.sidebar-layout')?.querySelector('.rail') : null;
  const sections = getSectionNodesForExport();

  let isFirstPage = true;
  let currentPage = createMeasurePage({
    sidebar: S.layout === 'side',
    includeSummary: false,
    rail: railNode,
    header: S.layout === 'side' ? null : headerNode
  });
  exportRoot.appendChild(currentPage);
  let currentBody = currentPage.querySelector('[data-print-body]');

  if (S.layout === 'side' && currentBody && headerNode) {
    currentBody.style.minHeight = '0';
  }

  const newPage = () => {
    const page = createMeasurePage({
      sidebar: false,
      includeSummary: true,
      rail: null,
      header: null
    });
    exportRoot.appendChild(page);
    currentPage = page;
    currentBody = page.querySelector('[data-print-body]');
    isFirstPage = false;
  };

  const CONTENT_LIMIT = PAGE_HEIGHT - 48;
  sections.forEach(sectionNode => {
    const config = getSectionSplitConfig(sectionNode);
    if (!config) {
      const clone = cloneClean(sectionNode.querySelector('.section') || sectionNode);
      if (!measureFits(measureRoot, currentPage, currentBody, clone)) newPage();
      currentBody.appendChild(clone);
      return;
    }

    const sourceItems = Array.from(sectionNode.querySelectorAll(config.selector)).map(item => cloneClean(item));
    let itemIndex = 0;
    let firstShellForSection = true;
    while (itemIndex < sourceItems.length) {
      const isContinuation = !firstShellForSection;
      const shell = isContinuation ? createContinuationContainer(sectionNode) : makeSectionShell(sectionNode);
      const { container } = isContinuation
        ? { container: shell }
        : createSectionContainer(sectionNode, shell);
      if (!container || !shell) {
        if (!measureFits(measureRoot, currentPage, currentBody, sectionNode)) newPage();
        currentBody.appendChild(cloneClean(sectionNode.querySelector('.section') || sectionNode));
        break;
      }

      let added = 0;
      while (itemIndex < sourceItems.length) {
        const next = sourceItems[itemIndex].cloneNode(true);
        container.appendChild(next);
        if (!measureFits(measureRoot, currentPage, currentBody, shell)) {
          container.removeChild(next);
          break;
        }
        itemIndex += 1;
        added += 1;
      }

      if (added === 0) {
        newPage();
        continue;
      }

      currentBody.appendChild(shell);
      firstShellForSection = false;

      if (itemIndex < sourceItems.length) {
        newPage();
      }
    }
  });

  Array.from(exportRoot.querySelectorAll('.print-page')).forEach(page => {
    const body = page.querySelector('[data-print-body]');
    page.querySelectorAll('.section').forEach(section => {
      const body = section.querySelector('.sec-body');
      const hasRealContent = !!body?.querySelector('.skill-row, .card, .profile-copy, .year-chip, .card-title');
      if (!hasRealContent) section.remove();
    });
    const directBlocks = body ? Array.from(body.children).filter(el => el.classList?.contains('section') || el.classList?.contains('print-continuation')) : [];
    const hasSection = directBlocks.length > 0;
    const hasSectionContent = !!page.querySelector('.skill-row, .card, .profile-copy, .year-chip, .card-title');
    if (!hasSection || !hasSectionContent) page.remove();
  });

  const html = exportRoot.outerHTML;
  measureRoot.innerHTML = '';
  measureRoot.remove();
  return html;
}

async function openPrintExportWindow(){
  try {
    stabilizeLayoutNow();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const exportMarkup = paginateExport();
    const styleMarkup = Array.from(document.querySelectorAll('style,link[rel="stylesheet"]'))
      .map(node => {
        if (node.tagName === 'LINK') {
          const href = node.href || node.getAttribute('href') || '';
          if (!href) return '';
          return `<link rel="stylesheet" href="${href}">`;
        }
        return node.outerHTML;
      })
      .filter(Boolean)
      .join('\n');
    const htmlClass = document.documentElement.className || '';
    const htmlTheme = document.documentElement.getAttribute('data-theme') || '';
    const htmlDark = document.documentElement.getAttribute('data-dark') || '';
    const htmlMaterial = document.documentElement.getAttribute('data-mat') || '';
    const bodyClass = document.body.className || '';
    const bodyTheme = document.body.getAttribute('data-theme') || '';
    const bodyDark = document.body.getAttribute('data-dark') || '';
    const bodyMaterial = document.body.getAttribute('data-mat') || '';
    const rootStyles = getComputedStyle(document.documentElement);
    const bodyStyles = getComputedStyle(document.body);
    const sheetStyles = getComputedStyle(document.getElementById('sheet') || document.body);
    const exportVars = [
      '--accent',
      '--accent2',
      '--chipBg',
      '--secBg',
      '--cardBg',
      '--card',
      '--cardBorder',
      '--ink',
      '--ink-d',
      '--bg',
      '--panel',
      '--line',
      '--shadow',
      '--rail',
      '--page-w',
      '--mobile-canvas-scale'
    ]
      .map(name => `${name}:${rootStyles.getPropertyValue(name) || bodyStyles.getPropertyValue(name) || sheetStyles.getPropertyValue(name) || ''}`)
      .join(';');
    if (isMobileCanvasMode()) {
      const existingMobile = document.getElementById('mobilePrintExportOverlay');
      if (existingMobile) existingMobile.remove();
      const overlay = document.createElement('div');
      overlay.id = 'mobilePrintExportOverlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML = `
        <style>${getExportStyles()}</style>
        <div class="print-export-runtime" style="${exportVars}">
          ${exportMarkup}
        </div>
      `;
      document.body.appendChild(overlay);
      document.body.classList.add('mobile-print-export-active');
      let cleaned = false;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        document.body.classList.remove('mobile-print-export-active');
        overlay.remove();
      };
      window.addEventListener('afterprint', cleanup, { once:true });
      window.addEventListener('focus', () => setTimeout(cleanup, 120), { once:true });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') setTimeout(cleanup, 120);
      }, { once:true });
      setTimeout(() => {
        window.print();
      }, 80);
      return;
    }
    const html = `<!doctype html>
    <html class="${htmlClass}" data-theme="${htmlTheme}" data-dark="${htmlDark}" data-mat="${htmlMaterial}" style="${exportVars}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        ${styleMarkup}
        <style>${getExportStyles()}</style>
      </head>
      <body class="${bodyClass}" data-theme="${bodyTheme}" data-dark="${bodyDark}" data-mat="${bodyMaterial}" style="${exportVars}">
        ${exportMarkup}
      </body>
    </html>`;

    const existing = document.getElementById('printExportHost');
    if (existing) existing.remove();
    const host = document.createElement('div');
    host.id = 'printExportHost';
    host.style.position = 'fixed';
    host.style.left = '-200vw';
    host.style.top = '-200vh';
    host.style.width = '1px';
    host.style.height = '1px';
    host.style.overflow = 'hidden';
    host.style.opacity = '0';
    host.style.pointerEvents = 'none';
    host.style.background = 'transparent';
    host.style.contain = 'strict';
    document.body.appendChild(host);
    const iframe = document.createElement('iframe');
    iframe.id = 'printExportFrame';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'absolute';
    iframe.style.left = '0';
    iframe.style.top = '0';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.visibility = 'hidden';
    iframe.style.background = 'transparent';
    iframe.style.pointerEvents = 'none';
    iframe.style.clipPath = 'inset(100%)';
    iframe.style.contain = 'strict';
    host.appendChild(iframe);

    iframe.onload = () => {
      const cleanup = () => setTimeout(() => host.remove(), 300);
      iframe.contentWindow?.addEventListener('afterprint', cleanup, { once:true });
      const frameDoc = iframe.contentDocument;
      const linkPromises = Array.from(frameDoc?.querySelectorAll('link[rel="stylesheet"]') || []).map(link => {
        if (link.sheet) return Promise.resolve();
        return new Promise(resolve => {
          const done = () => resolve();
          link.addEventListener('load', done, { once:true });
          link.addEventListener('error', done, { once:true });
          setTimeout(done, 2500);
        });
      });
      const fontsReady = frameDoc?.fonts?.ready || Promise.resolve();
      Promise.all([...linkPromises, fontsReady]).then(() => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }, 120);
      });
    };

    iframe.srcdoc = html;
  } catch (error) {
    console.error('[Emprezaurio print export]', error);
    alert('No se pudo preparar la descarga del CV.');
  }
}

async function boot(){
  const auth = await initAuth();
  setStorageScope(getStorageScope());

  // Initial theme + state
  // By default a page refresh starts with a clean state. To restore persisted state explicitly
  // add ?resume_restore=1 to the URL or set sessionStorage['resume:restore']=1 from the console.
  const params = new URLSearchParams(window.location.search);
  const doRestore =
    params.get('resume_restore') === '1' ||
    params.get('mode') === 'guest' ||
    auth.mode === 'google' ||
    sessionStorage.getItem('resume:restore') === '1';
  if (doRestore) hydrateFromStorage();

  let library = null;
  const openProjectLibrary = async () => {
    if (!library) {
      library = mountProjectLibrary({
        onNewProject: () => {
          library.close();
          applyStateToCanvas({
            theme: 'magentaPurple',
            dark: false,
            material: 'paper',
            layout: null,
            project: { id:null, title:'Mi CV', locale:'es', updated_at:null },
            contact: { name:'', phone:'', email:'', address:'', linkedin:'' },
            avatar: null,
            skillsInSidebar: false,
            skills: [],
            edu: [],
            exp: [],
            bio: ''
          });
          mountWelcome();
        },
        onEditProject: (project) => {
          library.close();
          applyStateToCanvas(project.payload);
          S.project = {
            id: project.id,
            title: project.title,
            locale: project.locale || 'es',
            updated_at: project.updated_at
          };
        }
      });
    }
    await library.open();
  };

  // Mount the editor (top bar + empty page)
  mountEditor({
    onThemePick: setTheme,
    onDarkToggle: setDark,
    onMaterialPick: setMaterial,
    onCustomGradient: setCustomGradient,
    onSaveProject: async (anchor) => {
      if (auth.mode === 'google' && auth.session?.user?.id) {
        await saveCurrentProject();
        showActionFeedback(anchor, 'CV guardado', 'success');
        return;
      }
      sessionStorage.setItem('resume:restore', '1');
      const blob = new Blob([JSON.stringify(S, null, 2)], {type:'application/json'});
      const a = document.createElement('a');
      a.download = 'emprezaurio-project.json';
      a.href = URL.createObjectURL(blob);
      a.click();
      showActionFeedback(anchor, 'JSON exportado', 'success');
    },
    onOpenLibrary: openProjectLibrary,
    canOpenLibrary: auth.mode === 'google' && !!auth.session?.user?.id,
    canAdmin: !!authState.isOwner,
    onAdminDemo: () => loadDemoResume(),
    onAdminWelcome: () => {
      mountWelcome();
      mountWizard();
    },
    onPrintExport: openPrintExportWindow
  });

  // Make sure a clean page exists
  ensureCanvas();
  mountCanvasScaleSync();
  mountMobileCanvasGestures();
  // Apply the full visual state through the real setters so dependent CSS vars stay in sync.
  setTheme(S.theme);
  setDark(S.dark);
  setMaterial(S.material);

  // Show welcome/wizard or project library
  if (auth.mode === 'google' && auth.session?.user?.id) {
    await openProjectLibrary();
  } else {
    mountWelcome();
  }

}

boot();
