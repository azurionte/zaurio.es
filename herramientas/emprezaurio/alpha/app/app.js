// App entry — wires everything together
import { S, setTheme, setCustomGradient, setDark, setMaterial, hydrateFromStorage } from './state.js';
const APP_VERSION = 'resume-app@2025.08.17-002';
console.log('[app.js] ' + APP_VERSION);
import { mountEditor } from '../editor/editor.js';
import { mountWelcome } from '../wizard/wizard.js';
import { ensureCanvas } from '../layouts/layouts.js';
import '../modules/modules.js'; // side-effect: registers custom styles for modules

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

// Apply the full visual state through the real setters so dependent CSS vars stay in sync.
setTheme(S.theme);
setDark(S.dark);
setMaterial(S.material);

// Show welcome/wizard
mountWelcome();
