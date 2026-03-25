// App entry — wires everything together
import { S, setTheme, setCustomGradient, setDark, setMaterial, hydrateFromStorage, setStorageScope } from './state.js';
import { initAuth, getStorageScope, authState } from './auth.js';
const APP_VERSION = 'resume-app@2025.08.17-002';
console.log('[app.js] ' + APP_VERSION);
import { mountEditor } from '../editor/editor.js';
import { mountWelcome, mountWizard, loadDemoResume } from '../wizard/wizard.js';
import { ensureCanvas, getHeaderNode, getSideMain } from '../layouts/layouts.js';
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
  document.body.classList.toggle('print-has-side-summary', S.layout === 'side');
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
    const hasVisual = avatar.querySelector('img,canvas');
    if (!hasVisual && S.avatar?.src) {
      const img = document.createElement('img');
      img.src = S.avatar.src;
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
  return persistCanvasContent(stripInteractive(node.cloneNode(true)));
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
    'background:#fff'
  ].join(';');
  document.body.appendChild(root);
  return root;
}

function getExportStyles(){
  return `
    body{margin:0;background:#fff;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .print-export-root{display:grid;gap:0}
    .print-page{width:${PAGE_WIDTH}px;min-height:${PAGE_HEIGHT}px;padding:24px;box-sizing:border-box;background:#fff;color:#111;page-break-after:always;break-after:page;overflow:hidden}
    .print-page:last-child{page-break-after:auto;break-after:auto}
    .print-sidebar-page{display:grid;grid-template-columns:300px minmax(0,1fr);gap:18px;align-items:start}
    .print-main,.print-flow{display:grid;gap:16px;align-content:start;min-width:0}
    .print-summary{display:grid;gap:10px;border-radius:16px;padding:14px 16px;background:linear-gradient(135deg,var(--accent2),var(--accent));color:#111}
    .print-summary-head{display:flex;align-items:center;justify-content:space-between;gap:16px}
    .print-summary-name{font-weight:900;font-size:28px;line-height:1.05}
    .print-summary-chips{display:flex;flex-wrap:wrap;gap:10px}
    .print-summary-chip{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;background:#fff;border:1px solid rgba(0,0,0,.08);min-height:44px}
    .print-summary-chip i{width:16px;text-align:center}
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
    @page{size:A4;margin:0}
  `;
}

function createSummaryHeader(){
  const chips = [];
  if (S.contact?.phone) chips.push(`<span class="print-summary-chip"><i class="fa-solid fa-phone"></i><span>${S.contact.phone}</span></span>`);
  if (S.contact?.email) chips.push(`<span class="print-summary-chip"><i class="fa-solid fa-envelope"></i><span>${S.contact.email}</span></span>`);
  return `
    <div class="print-summary">
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
    if (header) main.appendChild(cloneClean(header));
    layout.appendChild(main);
    page.appendChild(layout);
  } else {
    const flow = document.createElement('div');
    flow.className = 'print-flow';
    flow.setAttribute('data-print-body', '');
    if (includeSummary) flow.insertAdjacentHTML('beforeend', createSummaryHeader());
    if (header) flow.appendChild(cloneClean(header));
    page.appendChild(flow);
  }
  return page;
}

function makeSectionShell(sectionNode){
  const full = cloneClean(sectionNode.querySelector('.section') || sectionNode);
  const body = full.querySelector('.sec-body');
  if (body) body.innerHTML = '';
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
  body.appendChild(container);
  return { config, container };
}

function measureFits(root, page, body, node){
  body.appendChild(node);
  const fits = page.scrollHeight <= PAGE_HEIGHT;
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
    while (itemIndex < sourceItems.length) {
      const shell = makeSectionShell(sectionNode);
      const { container } = createSectionContainer(sectionNode, shell);
      if (!container) {
        if (!measureFits(measureRoot, currentPage, currentBody, shell)) newPage();
        currentBody.appendChild(shell);
        break;
      }

      currentBody.appendChild(shell);
      let added = 0;
      while (itemIndex < sourceItems.length) {
        const next = sourceItems[itemIndex].cloneNode(true);
        container.appendChild(next);
        if (currentPage.scrollHeight > PAGE_HEIGHT) {
          container.removeChild(next);
          if (added === 0) {
            container.appendChild(next);
            itemIndex += 1;
            added += 1;
          }
          break;
        }
        itemIndex += 1;
        added += 1;
      }

      if (added === 0) {
        currentBody.removeChild(shell);
        newPage();
        continue;
      }

      if (itemIndex < sourceItems.length) {
        newPage();
      }
    }
  });

  return exportRoot;
}

function openPrintExportWindow(){
  try {
    const exportRoot = paginateExport();
    const styleMarkup = Array.from(document.querySelectorAll('style,link[rel="stylesheet"]'))
      .map(node => node.outerHTML)
      .join('\n');
    const bodyClass = document.body.className || '';
    const bodyTheme = document.body.getAttribute('data-theme') || '';
    const bodyDark = document.body.getAttribute('data-dark') || '';
    const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <base href="${window.location.origin}/">
        ${styleMarkup}
        <style>${getExportStyles()}</style>
      </head>
      <body class="${bodyClass}" data-theme="${bodyTheme}" data-dark="${bodyDark}">
        ${exportRoot.outerHTML}
      </body>
    </html>`;

    const existing = document.getElementById('printExportFrame');
    if (existing) existing.remove();
    const iframe = document.createElement('iframe');
    iframe.id = 'printExportFrame';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    iframe.onload = () => {
      const cleanup = () => setTimeout(() => iframe.remove(), 300);
      iframe.contentWindow?.addEventListener('afterprint', cleanup, { once:true });
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 120);
    };

    const doc = iframe.contentDocument;
    if (!doc) throw new Error('No se pudo preparar el documento de exportacion.');
    doc.open();
    doc.write(html);
    doc.close();
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
  window.addEventListener('emprezaurio:before-print', ensurePrintSidebarSummary);
  document.addEventListener('layout:changed', ensurePrintSidebarSummary);

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

  ensurePrintSidebarSummary();
}

boot();
