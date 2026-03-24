// App entry — wires everything together
import { S, setTheme, setCustomGradient, setDark, setMaterial, hydrateFromStorage, setStorageScope } from './state.js';
import { initAuth, getStorageScope } from './auth.js';
const APP_VERSION = 'resume-app@2025.08.17-002';
console.log('[app.js] ' + APP_VERSION);
import { mountEditor } from '../editor/editor.js';
import { mountWelcome } from '../wizard/wizard.js';
import { ensureCanvas } from '../layouts/layouts.js';
import { mountProjectLibrary, applyStateToCanvas, saveCurrentProject, showActionFeedback } from './projects.js';
import '../modules/modules.js'; // side-effect: registers custom styles for modules

const PAGE_WIDTH = 860;
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
    canOpenLibrary: auth.mode === 'google' && !!auth.session?.user?.id
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
