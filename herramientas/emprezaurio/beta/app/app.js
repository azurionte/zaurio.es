// App entry — wires everything together
import { S, setTheme, setCustomGradient, setDark, setMaterial, hydrateFromStorage, setStorageScope } from './state.js';
import { initAuth, getStorageScope, authState } from './auth.js';
const APP_VERSION = 'resume-app@2026.03.27-1938';
console.log('[app.js] ' + APP_VERSION);
import { mountEditor } from '../editor/editor.js';
import { mountWelcome, mountWizard, loadDemoResume } from '../wizard/wizard.js';
import { ensureCanvas, getHeaderNode, getSideMain, getRailHolder, stabilizeLayoutNow } from '../layouts/layouts.js';
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
    const rail = getRailHolder();
    const all = [];
    if (main) {
      Array.from(main.children).forEach(el => {
        if (el?.querySelector?.('.section')) all.push(el);
      });
    }
    if (rail) {
      Array.from(rail.children).forEach(el => {
        if (el?.querySelector?.('.section')) all.push(el);
      });
    }
    const orderedKeys = Array.isArray(S.sectionOrder) ? S.sectionOrder : [];
    const keyed = new Map();
    all.forEach(el => {
      const key = el.querySelector('.section')?.dataset?.section || el.dataset?.section;
      if (key && !keyed.has(key)) keyed.set(key, el);
    });
    const ordered = orderedKeys.map(key => keyed.get(key)).filter(Boolean);
    const leftovers = all.filter(el => !ordered.includes(el));
    return [...ordered, ...leftovers];
  }
  const stack = document.getElementById('stack');
  if (!stack) return [];
  return Array.from(stack.children).filter(el => el.querySelector?.('.section'));
}

function getRailSectionKeysForExport(){
  if (S.layout !== 'side') return new Set();
  const rail = getRailHolder();
  if (!rail) return new Set();
  return new Set(
    Array.from(rail.children)
      .map(el => el.querySelector('.section')?.dataset?.section || el.dataset?.section)
      .filter(Boolean)
  );
}

function svgStarPrint(on){
  return `
    <svg class="star" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.6"
            d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>`;
}

const PRINT_CONTACT_FIELDS = {
  phone: { icon: 'fa-phone' },
  phone2: { icon: 'fa-phone' },
  email: { icon: 'fa-envelope' },
  idDoc: { icon: 'fa-id-card' },
  address: { icon: 'fa-location-dot' },
  linkedin: { icon: 'fa-linkedin' },
  info1: { icon: 'fa-circle-info' },
  info2: { icon: 'fa-circle-info' },
  info3: { icon: 'fa-circle-info' },
  info4: { icon: 'fa-circle-info' },
  info5: { icon: 'fa-circle-info' },
  info6: { icon: 'fa-circle-info' },
  info7: { icon: 'fa-circle-info' }
};

function getPrintContactOrder(){
  const contact = S.contact || {};
  const fallback = ['phone', 'phone2', 'email', 'idDoc', 'address', 'linkedin', 'info1', 'info2', 'info3', 'info4', 'info5', 'info6', 'info7'];
  const active = fallback.filter(key => String(contact[key] || '').trim());
  const current = Array.isArray(S.contactOrder) ? S.contactOrder : [];
  const ordered = [];
  current.forEach(key => {
    if (active.includes(key) && !ordered.includes(key)) ordered.push(key);
  });
  active.forEach(key => {
    if (!ordered.includes(key)) ordered.push(key);
  });
  return ordered;
}

function collectSidebarRailSkills(rail){
  const liveSection =
    rail?.querySelector?.('[data-rail-sections] .section[data-section="skills"]') ||
    rail?.querySelector?.('.section[data-section="skills"]') ||
    document.querySelector('.sidebar-layout [data-rail-sections] .section[data-section="skills"]');
  if (liveSection) {
    const parsed = Array.from(liveSection.querySelectorAll('.skill-row')).map(row => {
      const label = String(row.querySelector('.name')?.textContent || '').trim() || 'Skill';
      const range = row.querySelector('input[type="range"], .meter');
      if (range) {
        const rawValue =
          typeof range.value !== 'undefined' ? range.value :
          range.getAttribute?.('value') ||
          range.style?.getPropertyValue?.('--val') ||
          '60';
        const value = Number.parseInt(String(rawValue).replace('%', ''), 10);
        return { type:'slider', label, value: Number.isFinite(value) ? value : 60 };
      }
      const stars = row.querySelectorAll('.star path[fill="currentColor"]').length;
      return { type:'star', label, stars };
    }).filter(item => String(item.label || '').trim());
    if (parsed.length) return parsed;
  }
  return Array.isArray(S.skills) ? S.skills : [];
}

function createSidebarRailSkillsSection(rail){
  const list = collectSidebarRailSkills(rail);
  const section = document.createElement('div');
  section.className = 'section';
  section.dataset.section = 'skills';
  section.style.width = '100%';
  section.style.boxSizing = 'border-box';
  const rows = list.map(skill => {
    const label = skill?.label || 'Skill';
    const valueMarkup = skill?.type === 'slider'
      ? `<div class="val"><div class="print-meter" style="--val:${Math.max(0, Math.min(100, Number(skill?.value ?? 60)))}%"><span></span></div></div>`
      : `<div class="val"><div class="stars">${[1,2,3,4,5].map(i => svgStarPrint((skill?.stars || 0) >= i)).join('')}</div></div>`;
    return `<div class="skill-row"><div class="name">${label}</div>${valueMarkup}</div>`;
  }).join('');
  section.innerHTML = `
    <div class="sec-head">
      <div class="sec-title">Skills</div>
      <div class="sec-underline"></div>
    </div>
    <div class="sec-body">
      <div class="skills-wrap">${rows}</div>
    </div>`;
  return section;
}

function createSidebarPrintRail(rail){
  const railPrint = document.createElement('div');
  railPrint.className = 'rail';
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  if (S.avatar?.src) {
    const img = document.createElement('img');
    img.src = S.avatar.src;
    img.alt = '';
    avatar.appendChild(img);
  } else {
    avatar.setAttribute('data-empty', '1');
  }
  railPrint.appendChild(avatar);

  const nameBlock = document.createElement('div');
  nameBlock.className = 'name-block';
  nameBlock.innerHTML = `<h2 class="name">${S.contact?.name || S.project?.title || 'Mi CV'}</h2>`;
  railPrint.appendChild(nameBlock);

  const chipWrap = document.createElement('div');
  chipWrap.className = 'chip-wrap';
  const chips = document.createElement('div');
  chips.className = 'chips';
  getPrintContactOrder().forEach(key => {
    const value = String(S.contact?.[key] || '').trim();
    if (!value) return;
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.style.minHeight = '46px';
    chip.style.padding = '10px 14px';
    chip.style.borderRadius = '999px';
    chip.style.background = '#fff';
    chip.style.border = '1px solid rgba(0,0,0,.08)';
    chip.style.color = '#1a2030';
    chip.style.display = 'flex';
    chip.style.alignItems = 'center';
    chip.style.gap = '10px';
    chip.style.width = '100%';
    chip.style.boxSizing = 'border-box';
    chip.innerHTML = `<i class="fa-solid ${PRINT_CONTACT_FIELDS[key]?.icon || 'fa-circle-info'}"></i><span>${value}</span>`;
    chips.appendChild(chip);
  });
  chipWrap.appendChild(chips);
  railPrint.appendChild(chipWrap);

  const secHolder = document.createElement('div');
  secHolder.className = 'sec-holder';
  secHolder.setAttribute('data-rail-sections', '');
  secHolder.style.width = '100%';
  secHolder.style.display = 'grid';
  secHolder.style.gap = '16px';
  secHolder.style.alignContent = 'start';
  const liveRailHasSkills =
    !!rail?.querySelector?.('[data-rail-sections] .section[data-section="skills"]') ||
    !!rail?.querySelector?.('.section[data-section="skills"]') ||
    !!document.querySelector('.sidebar-layout [data-rail-sections] .section[data-section="skills"]');
  const stateHasSkills = Array.isArray(S.skills) && S.skills.length;
  if ((stateHasSkills || liveRailHasSkills) && (S.skillsInSidebar || liveRailHasSkills)) {
    const railSkillsSection = createSidebarRailSkillsSection(rail);
    railSkillsSection.style.display = 'block';
    railSkillsSection.style.visibility = 'visible';
    railSkillsSection.style.opacity = '1';
    secHolder.appendChild(railSkillsSection);
  }
  railPrint.appendChild(secHolder);
  return railPrint;
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
    .print-export-root,
    .print-export-runtime{display:grid;gap:0;background:#fff}
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
    .print-page .sidebar-layout .rail{
      display:flex !important;
      flex-direction:column !important;
      align-items:flex-start !important;
      min-height:920px !important;
      overflow:hidden !important;
    }
    .print-page .sidebar-layout .rail{
      position:relative !important;
    }
    .print-page .sidebar-layout .rail .chip-wrap{
      flex:0 0 auto !important;
      width:100% !important;
      align-self:stretch !important;
      padding:0 !important;
    }
    .print-page .sidebar-layout .rail [data-rail-sections]{
      flex:0 0 auto !important;
      width:100% !important;
      display:grid !important;
      gap:16px !important;
      align-content:start !important;
      margin-top:12px !important;
      position:relative !important;
      z-index:2 !important;
    }
    .print-export-mobile .print-page .sidebar-layout .rail{
      background:linear-gradient(180deg,var(--accent2),var(--accent)) !important;
      -webkit-mask-image:none !important;
      mask-image:none !important;
    }
    .print-export-mobile .print-page .fancy .hero,
    .print-export-mobile .print-page .topbar{
      background:linear-gradient(135deg,var(--accent2),var(--accent)) !important;
    }
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
    .print-page .sidebar-layout .rail .name-block{
      width:100% !important;
      text-align:center !important;
      margin:0 0 6px !important;
      align-self:stretch !important;
    }
    .print-page .sidebar-layout .rail .name{
      color:#fff !important;
      font-size:22px !important;
      font-weight:900 !important;
      line-height:1.08 !important;
      text-align:center !important;
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
      min-height:46px !important;
      padding:10px 14px !important;
      padding-right:28px !important;
      font-size:14px !important;
      line-height:1.2 !important;
      gap:10px !important;
    }
    .print-page .sidebar-layout .rail .chip span,
    .print-page .sidebar-layout .rail .chip .chip-input{
      font-size:14px !important;
      line-height:1.2 !important;
      width:100% !important;
      max-width:100% !important;
      text-align:left !important;
      white-space:nowrap !important;
      overflow:hidden !important;
      text-overflow:ellipsis !important;
    }
    .print-page .sidebar-layout .rail .chip i{width:16px !important;font-size:14px !important}
    .print-page .sidebar-layout [data-rail-sections]{
      display:grid !important;
      gap:16px !important;
      width:100% !important;
      align-content:start !important;
      min-width:0 !important;
    }
    .print-page .sidebar-layout [data-rail-sections] > .section{
      width:100% !important;
      max-width:100% !important;
      min-width:0 !important;
      justify-self:stretch !important;
      box-sizing:border-box !important;
    }
    .print-page .sidebar-layout [data-rail-sections] .section[data-section="skills"]{
      padding:12px 12px 14px !important;
      border-radius:18px !important;
      background:rgba(255,255,255,.92) !important;
      border:1px solid rgba(0,0,0,.08) !important;
      color:#1a2030 !important;
      overflow:visible !important;
    }
    .print-page .sidebar-layout [data-rail-sections] .section[data-section="skills"] .sec-head{
      margin-bottom:4px !important;
    }
    .print-page .sidebar-layout [data-rail-sections] .section[data-section="skills"] .sec-title{
      font-size:14px !important;
      font-weight:800 !important;
      color:#1a2030 !important;
    }
    .print-page .sidebar-layout [data-rail-sections] .section[data-section="skills"] .sec-underline{
      width:94px !important;
      height:3px !important;
      margin-top:5px !important;
    }
    .print-page .sidebar-layout [data-rail-sections] .section[data-section="skills"] .sec-add-anchor{
      display:none !important;
    }
    .print-page .sidebar-layout [data-rail-sections] .section[data-section="skills"] .skills-wrap{
      display:grid !important;
      grid-template-columns:1fr !important;
      gap:10px !important;
      width:100% !important;
    }
    .print-page .sidebar-layout [data-rail-sections] .section[data-section="skills"] .skill-row{
      display:grid !important;
      grid-template-columns:minmax(0,1fr) !important;
      grid-template-areas:
        "name"
        "val" !important;
      gap:6px !important;
      align-items:start !important;
      padding:11px 12px !important;
      border-radius:16px !important;
      min-height:0 !important;
      width:100% !important;
    }
    .print-page .sidebar-layout [data-rail-sections] .section[data-section="skills"] .skill-row .name{
      grid-area:name !important;
      font-size:14px !important;
      font-weight:600 !important;
      color:#243041 !important;
      line-height:1.28 !important;
      white-space:normal !important;
      overflow:visible !important;
      text-overflow:clip !important;
      word-break:break-word !important;
    }
    .print-page .sidebar-layout [data-rail-sections] .section[data-section="skills"] .skill-row .val{
      grid-area:val !important;
      display:flex !important;
      justify-content:center !important;
      align-items:center !important;
      min-width:0 !important;
      width:100% !important;
    }
    .print-page .sidebar-layout [data-rail-sections] .section[data-section="skills"] .skill-row .meter{
      width:100% !important;
      max-width:126px !important;
      margin:0 auto !important;
    }
    .print-page .sidebar-layout [data-rail-sections] .section[data-section="skills"] .stars{
      display:inline-grid !important;
      grid-auto-flow:column !important;
      justify-content:center !important;
      gap:5px !important;
      width:100% !important;
      color:var(--accent) !important;
    }
    .print-page .sec-underline{
      display:block !important;
      opacity:1 !important;
      visibility:visible !important;
      height:4px !important;
      width:120px !important;
      border-radius:999px !important;
      background:linear-gradient(135deg,var(--accent2),var(--accent)) !important;
      margin-top:6px !important;
    }
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
    .print-page .print-titled-continuation .sec-head{margin-bottom:10px !important}
    .print-page .print-titled-continuation .sec-remove,
    .print-page .print-titled-continuation .ctrl-circle{display:none !important}
    .print-page .print-mini-sec-head{
      display:grid !important;
      justify-items:center !important;
      gap:6px !important;
      margin:0 0 10px !important;
    }
    .print-page .print-mini-sec-title{
      font-weight:900 !important;
      font-size:15px !important;
      line-height:1.1 !important;
      color:#111 !important;
    }
    .print-page .print-mini-sec-line{
      width:112px !important;
      height:4px !important;
      border-radius:999px !important;
      background:linear-gradient(90deg,var(--accent2),var(--accent)) !important;
    }
    .print-page .print-compact-section{
      padding:10px !important;
    }
    .print-page .print-compact-section .sec-head{
      margin-bottom:4px !important;
    }
    .print-page .print-compact-section .sec-underline{
      width:104px !important;
      margin-top:4px !important;
    }
    .print-page .print-compact-section .sec-body{
      gap:10px !important;
    }
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
    if (rail) {
      const railClone = createSidebarPrintRail(rail);
      layout.appendChild(railClone);
    }
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

function makeCompactSectionShell(sectionNode){
  const shell = makeSectionShell(sectionNode);
  shell.classList.add('print-compact-section');
  return shell;
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

function createTitledContinuation(sectionNode){
  const config = getSectionSplitConfig(sectionNode);
  if (!config) return null;
  const shell = document.createElement('div');
  shell.className = 'print-continuation print-titled-continuation';
  shell.style.height = 'auto';
  shell.style.minHeight = '0';
  shell.style.maxHeight = 'none';
  const titleText =
    sectionNode.querySelector('.sec-title')?.textContent?.trim() ||
    sectionNode.querySelector('.sec-head h3, .sec-head h2, .sec-head h4')?.textContent?.trim() ||
    '';
  if (titleText) {
    const head = document.createElement('div');
    head.className = 'print-mini-sec-head';
    head.innerHTML = `
      <div class="print-mini-sec-title">${titleText}</div>
      <div class="print-mini-sec-line" aria-hidden="true"></div>
    `;
    shell.appendChild(head);
  }
  const source = sectionNode.querySelector(config.containerSelector);
  const container = source ? source.cloneNode(false) : document.createElement('div');
  if (!source) container.className = config.containerSelector.replace('.', '');
  container.style.height = 'auto';
  container.style.minHeight = '0';
  container.style.maxHeight = 'none';
  shell.appendChild(container);
  return { shell, container };
}

function measureFits(root, page, body, node){
  const CONTENT_LIMIT = PAGE_HEIGHT - 48;
  body.appendChild(node);
  const fits = body.scrollHeight <= CONTENT_LIMIT;
  body.removeChild(node);
  return fits;
}

function fillContainerUntilFull(sourceItems, startIndex, container, measureRoot, currentPage, currentBody, shell){
  let itemIndex = startIndex;
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
  return { itemIndex, added };
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
  const railSectionKeys = getRailSectionKeysForExport();

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
  sections
    .filter(sectionNode => {
      const key = sectionNode.querySelector('.section')?.dataset?.section || sectionNode.dataset?.section || '';
      return !(S.layout === 'side' && railSectionKeys.has(key));
    })
    .forEach(sectionNode => {
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

      let result = fillContainerUntilFull(sourceItems, itemIndex, container, measureRoot, currentPage, currentBody, shell);
      let added = result.added;
      itemIndex = result.itemIndex;

      if (added === 0) {
        if (firstShellForSection) {
          const compactShell = makeCompactSectionShell(sectionNode);
          const compactContainer = createSectionContainer(sectionNode, compactShell)?.container;
          if (compactContainer) {
            result = fillContainerUntilFull(sourceItems, itemIndex, compactContainer, measureRoot, currentPage, currentBody, compactShell);
            if (result.added > 0) {
              currentBody.appendChild(compactShell);
              itemIndex = result.itemIndex;
              firstShellForSection = false;
              if (itemIndex < sourceItems.length) newPage();
              continue;
            }
          }
          const titledFallback = createTitledContinuation(sectionNode);
          if (titledFallback) {
            result = fillContainerUntilFull(sourceItems, itemIndex, titledFallback.container, measureRoot, currentPage, currentBody, titledFallback.shell);
            if (result.added > 0) {
              currentBody.appendChild(titledFallback.shell);
              itemIndex = result.itemIndex;
              firstShellForSection = false;
              if (itemIndex < sourceItems.length) newPage();
              continue;
            }
          }
          const fallback = createContinuationContainer(sectionNode);
          if (fallback) {
            result = fillContainerUntilFull(sourceItems, itemIndex, fallback, measureRoot, currentPage, currentBody, fallback);
            if (result.added > 0) {
              currentBody.appendChild(fallback);
              itemIndex = result.itemIndex;
              firstShellForSection = false;
              if (itemIndex < sourceItems.length) newPage();
              continue;
            }
          }
        }
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
    const hasRailContent = !!page.querySelector('.sidebar-layout [data-rail-sections] .section, .sidebar-layout .rail .chip, .sidebar-layout .rail .name');
    if ((!hasSection && !hasRailContent) || (!hasSectionContent && !hasRailContent)) page.remove();
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
        <div class="print-export-runtime print-export-mobile" style="${exportVars}">
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

function escapeHtml(value){
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getAlternateExportAccentPair(){
  const rootStyles = getComputedStyle(document.documentElement);
  const accent = String(rootStyles.getPropertyValue('--accent') || '').trim() || '#c026d3';
  const accent2 = String(rootStyles.getPropertyValue('--accent2') || '').trim() || '#9333ea';
  return { accent, accent2 };
}

function getAlternateExportContactKeys(){
  const preferred = Array.isArray(S.contactOrder) ? S.contactOrder : [];
  const fallback = ['phone','phone2','email','idDoc','address','linkedin','info1','info2','info3','info4','info5','info6','info7'];
  const ordered = [];
  preferred.forEach(key => {
    if (!ordered.includes(key) && String(S.contact?.[key] || '').trim()) ordered.push(key);
  });
  fallback.forEach(key => {
    if (!ordered.includes(key) && String(S.contact?.[key] || '').trim()) ordered.push(key);
  });
  return ordered;
}

function renderAlternateExportContactItems(){
  return getAlternateExportContactKeys().map(key => {
    const value = String(S.contact?.[key] || '').trim();
    if (!value) return '';
    return `<div class="alt-chip"><i class="fa-solid ${PRINT_CONTACT_FIELDS[key]?.icon || 'fa-circle-info'}"></i><span>${escapeHtml(value)}</span></div>`;
  }).filter(Boolean).join('');
}

function renderAlternateExportSkills(){
  const list = Array.isArray(S.skills) ? S.skills : [];
  if (!list.length) return '';
  const rows = list.map(skill => {
    const label = escapeHtml(skill?.label || 'Skill');
    const valueMarkup = skill?.type === 'slider'
      ? `<div class="alt-skill-meter"><span style="width:${Math.max(0, Math.min(100, Number(skill?.value ?? 60)))}%"></span></div>`
      : `<div class="alt-skill-stars">${[1,2,3,4,5].map(i => `<span class="${(skill?.stars || 0) >= i ? 'on' : ''}">&#9733;</span>`).join('')}</div>`;
    return `<div class="alt-skill-row"><div class="alt-skill-name">${label}</div><div class="alt-skill-val">${valueMarkup}</div></div>`;
  }).join('');
  return `
    <section class="alt-section alt-skills">
      <div class="alt-section-head">
        <h3>Skills</h3>
        <div class="alt-section-line"></div>
      </div>
      <div class="alt-skills-list">${rows}</div>
    </section>
  `;
}

function renderAlternateExportEdu(){
  const items = Array.isArray(S.edu) ? S.edu : [];
  if (!items.length) return '';
  const cards = items.map(item => `
    <article class="alt-card">
      ${item?.year ? `<div class="alt-pill">${escapeHtml(item.year)}</div>` : ''}
      ${item?.title ? `<div class="alt-card-title">${escapeHtml(item.title)}</div>` : ''}
      ${item?.academy ? `<div class="alt-card-sub">${escapeHtml(item.academy)}</div>` : ''}
    </article>
  `).join('');
  return `
    <section class="alt-section">
      <div class="alt-section-head">
        <h3>Education</h3>
        <div class="alt-section-line"></div>
      </div>
      <div class="alt-card-grid">${cards}</div>
    </section>
  `;
}

function renderAlternateExportExp(){
  const items = Array.isArray(S.exp) ? S.exp : [];
  if (!items.length) return '';
  const cards = items.map(item => `
    <article class="alt-card">
      ${item?.dates ? `<div class="alt-pill">${escapeHtml(item.dates)}</div>` : ''}
      ${item?.role ? `<div class="alt-card-title">${escapeHtml(item.role)}</div>` : ''}
      ${item?.org ? `<div class="alt-card-sub">${escapeHtml(item.org)}</div>` : ''}
      ${item?.desc ? `<div class="alt-copy">${escapeHtml(item.desc)}</div>` : ''}
    </article>
  `).join('');
  return `
    <section class="alt-section">
      <div class="alt-section-head">
        <h3>Experience</h3>
        <div class="alt-section-line"></div>
      </div>
      <div class="alt-stack-list">${cards}</div>
    </section>
  `;
}

function renderAlternateExportBio(){
  const text = String(S.bio || '').trim();
  if (!text) return '';
  return `
    <section class="alt-section">
      <div class="alt-section-head">
        <h3>Profile</h3>
        <div class="alt-section-line"></div>
      </div>
      <div class="alt-copy">${escapeHtml(text)}</div>
    </section>
  `;
}

function getAlternateExportSections(){
  const renderers = {
    skills: renderAlternateExportSkills,
    edu: renderAlternateExportEdu,
    exp: renderAlternateExportExp,
    bio: renderAlternateExportBio
  };
  const available = Object.keys(renderers).filter(key => {
    if (key === 'skills') return Array.isArray(S.skills) && S.skills.length;
    if (key === 'edu') return Array.isArray(S.edu) && S.edu.length;
    if (key === 'exp') return Array.isArray(S.exp) && S.exp.length;
    return !!String(S.bio || '').trim();
  });
  const ordered = [];
  (Array.isArray(S.sectionOrder) ? S.sectionOrder : []).forEach(key => {
    if (available.includes(key) && !ordered.includes(key)) ordered.push(key);
  });
  available.forEach(key => {
    if (!ordered.includes(key)) ordered.push(key);
  });
  return ordered.map(key => ({ key, html: renderers[key]() })).filter(item => item.html);
}

function buildAlternateExportDocument(){
  const { accent, accent2 } = getAlternateExportAccentPair();
  const isDark = !!S.dark;
  const name = escapeHtml(S.contact?.name || S.project?.title || 'Mi CV');
  const contacts = renderAlternateExportContactItems();
  const avatar = S.avatar?.src
    ? `<div class="alt-avatar"><img src="${S.avatar.src}" alt=""></div>`
    : `<div class="alt-avatar alt-avatar-empty"></div>`;
  const sections = getAlternateExportSections();
  const sidebarSections = S.layout === 'side' && S.skillsInSidebar
    ? sections.filter(section => section.key === 'skills')
    : [];
  const mainSections = S.layout === 'side' && S.skillsInSidebar
    ? sections.filter(section => section.key !== 'skills')
    : sections;

  const sideBody = `
    <div class="alt-page alt-page-side">
      <aside class="alt-sidebar">
        ${avatar}
        <div class="alt-sidebar-name">${name}</div>
        ${contacts ? `<div class="alt-sidebar-chips">${contacts}</div>` : ''}
        ${sidebarSections.map(section => section.html).join('')}
      </aside>
      <main class="alt-main">
        ${mainSections.map(section => section.html).join('')}
      </main>
    </div>
  `;

  const topBody = `
    <div class="alt-page alt-page-top">
      <header class="alt-hero ${S.layout === 'fancy' ? 'is-fancy' : ''}">
        <div class="alt-hero-band"></div>
        <div class="alt-hero-content">
          <div class="alt-hero-copy">
            <h1>${name}</h1>
            ${contacts ? `<div class="alt-hero-chips">${contacts}</div>` : ''}
          </div>
          ${avatar}
        </div>
      </header>
      <main class="alt-main alt-main-top">
        ${mainSections.map(section => section.html).join('')}
      </main>
    </div>
  `;

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>${name}</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
      <style>
        :root{
          --alt-accent:${accent};
          --alt-accent2:${accent2};
          --alt-ink:${isDark ? '#f8f4ff' : '#160f1f'};
          --alt-ink-soft:${isDark ? 'rgba(248,244,255,.76)' : 'rgba(22,15,31,.72)'};
          --alt-paper:${isDark ? '#0f0d14' : '#fffdfd'};
          --alt-panel:${isDark ? '#17131f' : '#fff'};
          --alt-card:${isDark ? '#1d1826' : '#fff'};
          --alt-line:${isDark ? 'rgba(255,255,255,.09)' : 'rgba(22,15,31,.09)'};
          --alt-shadow:${isDark ? '0 18px 40px rgba(0,0,0,.34)' : '0 18px 40px rgba(62,32,78,.08)'};
        }
        *{box-sizing:border-box}
        html,body{margin:0;padding:0;background:${isDark ? '#09070d' : '#efe8f6'};color:var(--alt-ink);font-family:"Segoe UI",sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        body{padding:24px}
        .alt-page{width:210mm;min-height:297mm;margin:0 auto;background:var(--alt-paper);box-shadow:var(--alt-shadow);overflow:hidden}
        .alt-page-side{display:grid;grid-template-columns:74mm minmax(0,1fr)}
        .alt-sidebar{display:grid;align-content:start;gap:16px;padding:24px 18px 28px;background:linear-gradient(180deg,var(--alt-accent2),var(--alt-accent));color:#fff;min-height:297mm}
        .alt-sidebar-name{font:900 28px/1.02 "Trebuchet MS",sans-serif;text-align:center}
        .alt-sidebar-chips{display:grid;gap:10px}
        .alt-main{display:grid;align-content:start;gap:16px;padding:24px;background:var(--alt-paper)}
        .alt-main-top{padding-top:18px}
        .alt-avatar{width:132px;height:132px;margin:0 auto;border-radius:50%;overflow:hidden;border:4px solid rgba(255,255,255,.88);background:rgba(255,255,255,.2)}
        .alt-avatar img{width:100%;height:100%;object-fit:cover;display:block}
        .alt-avatar-empty::before{content:"";display:block;width:100%;height:100%;background:radial-gradient(circle at 50% 35%, rgba(255,255,255,.75), rgba(255,255,255,.22))}
        .alt-chip{display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:999px;background:rgba(255,255,255,.94);color:#1b1423;font-size:13px;line-height:1.2;min-width:0}
        .alt-chip span{display:-webkit-box;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:normal;word-break:break-word;line-height:1.2;-webkit-box-orient:vertical;-webkit-line-clamp:2}
        .alt-hero{padding:18px 18px 0;background:var(--alt-paper)}
        .alt-hero-band{height:86px;border-radius:26px;background:linear-gradient(135deg,var(--alt-accent2),var(--alt-accent))}
        .alt-hero-content{display:grid;grid-template-columns:minmax(0,1fr) 132px;gap:18px;align-items:end;margin-top:-34px;padding:0 8px}
        .alt-hero.is-fancy .alt-hero-content{grid-template-columns:1fr;justify-items:center;text-align:center}
        .alt-hero.is-fancy .alt-avatar{margin-top:-10px}
        .alt-hero-copy h1{margin:0;font:900 34px/1.02 "Trebuchet MS",sans-serif;color:var(--alt-ink)}
        .alt-hero-chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
        .alt-section{display:grid;gap:12px;padding:16px;border:1px solid var(--alt-line);border-radius:22px;background:var(--alt-panel);break-inside:avoid-page;page-break-inside:avoid}
        .alt-section-head{display:grid;gap:6px}
        .alt-section-head h3{margin:0;font:900 18px/1 "Trebuchet MS",sans-serif;color:var(--alt-ink)}
        .alt-section-line{width:110px;height:4px;border-radius:999px;background:linear-gradient(90deg,var(--alt-accent2),var(--alt-accent))}
        .alt-copy{color:var(--alt-ink-soft);line-height:1.65;white-space:pre-wrap}
        .alt-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
        .alt-stack-list{display:grid;gap:12px}
        .alt-card{display:grid;gap:8px;padding:14px;border-radius:18px;background:var(--alt-card);border:1px solid var(--alt-line);break-inside:avoid-page;page-break-inside:avoid}
        .alt-pill{display:inline-flex;justify-self:start;padding:7px 10px;border-radius:999px;background:linear-gradient(135deg,var(--alt-accent2),var(--alt-accent));color:#fff;font-size:12px;font-weight:800}
        .alt-card-title{font-weight:800;font-size:18px;line-height:1.25}
        .alt-card-sub{color:var(--alt-ink-soft);line-height:1.45}
        .alt-skills-list{display:grid;gap:10px}
        .alt-skill-row{display:grid;gap:7px;padding:12px;border-radius:16px;background:rgba(255,255,255,.92);color:#1b1423;border:1px solid rgba(0,0,0,.07)}
        .alt-main .alt-skill-row{background:var(--alt-card);color:var(--alt-ink);border-color:var(--alt-line)}
        .alt-skill-name{display:-webkit-box;font-size:14px;font-weight:700;line-height:1.3;word-break:break-word;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2}
        .alt-skill-val{display:flex;justify-content:center}
        .alt-skill-meter{position:relative;width:100%;max-width:160px;height:8px;border-radius:999px;background:rgba(27,20,35,.14);overflow:hidden}
        .alt-skill-meter span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--alt-accent2),var(--alt-accent))}
        .alt-skill-stars{display:flex;justify-content:center;gap:5px;font-size:15px;color:rgba(27,20,35,.22)}
        .alt-main .alt-skill-stars{color:rgba(22,15,31,.18)}
        .alt-skill-stars .on{color:var(--alt-accent)}
        @media print{
          body{padding:0;background:#fff}
          .alt-page{width:auto;min-height:auto;box-shadow:none}
        }
      </style>
    </head>
    <body>
      ${S.layout === 'side' ? sideBody : topBody}
      <script>
        window.addEventListener('load', function(){
          setTimeout(function(){ window.print(); }, 120);
        });
      </script>
    </body>
  </html>`;
}

async function openAlternatePrintExportWindow(){
  try {
    const html = buildAlternateExportDocument();
    const existing = document.getElementById('altPrintExportHost');
    if (existing) existing.remove();
    const host = document.createElement('div');
    host.id = 'altPrintExportHost';
    host.style.position = 'fixed';
    host.style.left = '-200vw';
    host.style.top = '-200vh';
    host.style.width = '1px';
    host.style.height = '1px';
    host.style.overflow = 'hidden';
    host.style.opacity = '0';
    host.style.pointerEvents = 'none';
    document.body.appendChild(host);
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = '0';
    host.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.addEventListener('afterprint', () => setTimeout(() => host.remove(), 300), { once:true });
    };
    iframe.srcdoc = html;
  } catch (error) {
    console.error('[Emprezaurio alt print export]', error);
    alert('No se pudo preparar la descarga alternativa del CV.');
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
    onPrintExport: openPrintExportWindow,
    onAltPrintExport: openAlternatePrintExportWindow
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
