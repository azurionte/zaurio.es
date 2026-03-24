// App entry — wires everything together
import { S, setTheme, setCustomGradient, setDark, setMaterial, hydrateFromStorage } from './state.js';
const APP_VERSION = 'resume-app@2025.08.17-002';
console.log('[app.js] ' + APP_VERSION);
import { mountEditor } from '../editor/editor.js';
import { mountWelcome } from '../wizard/wizard.js';
import { ensureCanvas } from '../layouts/layouts.js';
import '../modules/modules.js'; // side-effect: registers custom styles for modules

const PAGE_WIDTH = 860;
const MOBILE_BREAKPOINT = 700;
const MIN_USER_ZOOM = 0.72;
const MAX_USER_ZOOM = 2.6;
let mobileFitScale = 1;
let mobileUserZoom = 1;
let pinchState = null;

function clamp(v, min, max){
  return Math.min(max, Math.max(min, v));
}

function isMobileCanvasMode(){
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function pinchDistance(touches){
  const [a, b] = touches;
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

function syncCanvasScale(){
  const page = document.querySelector('.page');
  const sheet = document.getElementById('sheet');
  const root = document.getElementById('canvas-root');
  if (!page || !sheet) return;

  if (window.innerWidth > MOBILE_BREAKPOINT){
    document.documentElement.style.setProperty('--mobile-canvas-scale', '1');
    mobileFitScale = 1;
    mobileUserZoom = 1;
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
  if (root) {
    root.scrollLeft = 0;
    root.style.justifyContent = 'center';
  }
}

function setMobileUserZoom(nextZoom){
  const clamped = clamp(nextZoom, MIN_USER_ZOOM, MAX_USER_ZOOM);
  if (Math.abs(clamped - mobileUserZoom) < 0.001) return;
  mobileUserZoom = clamped;
  syncCanvasScale();
}

function mountMobileCanvasGestures(){
  const root = document.getElementById('canvas-root');
  if (!root) return;

  root.addEventListener('touchstart', e => {
    if (!isMobileCanvasMode() || e.touches.length !== 2) return;
    pinchState = {
      distance: pinchDistance(e.touches),
      userZoom: mobileUserZoom
    };
  }, { passive: true });

  root.addEventListener('touchmove', e => {
    if (!isMobileCanvasMode() || e.touches.length !== 2 || !pinchState) return;
    const distance = pinchDistance(e.touches);
    if (!distance || !pinchState.distance) return;
    e.preventDefault();
    const ratio = distance / pinchState.distance;
    setMobileUserZoom(pinchState.userZoom * ratio);
  }, { passive: false });

  const endPinch = () => { pinchState = null; };
  root.addEventListener('touchend', endPinch, { passive: true });
  root.addEventListener('touchcancel', endPinch, { passive: true });
}

function mountCanvasScaleSync(){
  syncCanvasScale();
  window.addEventListener('resize', syncCanvasScale, { passive: true });
  window.addEventListener('orientationchange', syncCanvasScale, { passive: true });

  const sheet = document.getElementById('sheet');
  if (!sheet || typeof ResizeObserver === 'undefined') return;

  const ro = new ResizeObserver(() => syncCanvasScale());
  ro.observe(sheet);
}

// Initial theme + state
// By default a page refresh starts with a clean state. To restore persisted state explicitly
// add ?resume_restore=1 to the URL or set sessionStorage['resume:restore']=1 from the console.
const params = new URLSearchParams(window.location.search);
const doRestore = params.get('resume_restore') === '1' || sessionStorage.getItem('resume:restore') === '1';
if (doRestore) hydrateFromStorage();

// Mount the editor (top bar + empty page)
mountEditor({
  onThemePick: setTheme,
  onDarkToggle: setDark,
  onMaterialPick: setMaterial,
  onCustomGradient: setCustomGradient
});

// Make sure a clean page exists
ensureCanvas();
mountCanvasScaleSync();
mountMobileCanvasGestures();

// Apply the full visual state through the real setters so dependent CSS vars stay in sync.
setTheme(S.theme);
setDark(S.dark);
setMaterial(S.material);

// Show welcome/wizard
mountWelcome();
