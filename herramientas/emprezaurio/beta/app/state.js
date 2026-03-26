// Central state + helpers
console.log('[state.js] v1.0.2');
export const S = {
  theme: 'magentaPurple',
  dark: false,
  material: 'paper', // 'glass' | 'paper'
  layout: null,      // 'side' | 'fancy' | 'top'
  project: { id:null, title:'Mi CV', locale:'es', updated_at:null },
  contact: { name:'', phone:'', phone2:'', email:'', idDoc:'', address:'', linkedin:'', info1:'', info2:'', info3:'', info4:'', info5:'', info6:'', info7:'' },
  contactOrder: [],
  avatar: null,      // dataURL (so it survives morph)
  skillsInSidebar: false,
  sectionOrder: [],
  skills: [],        // {type:'star'|'slider', label, value}
  edu: [],           // {kind:'course'|'degree', title, year, academy}
  exp: [],           // {dates, role, org, desc}
  bio: ''            // free text
};

let storageKey = 'emprezaurio-beta:guest:state';

// Backwards-compatible alias: some modules expect `S.mat` while S uses `material`.
Object.defineProperty(S, 'mat', {
  enumerable: true,
  get() { return S.material; },
  set(v) { S.material = v; save(); document.body.setAttribute('data-mat', v); }
});

// --- persistence
export function setStorageScope(scope) {
  storageKey = `${scope}:state`;
}

export function getStorageScopeKey(){
  return storageKey;
}
export function save() {
  try {
    // Ensure the persisted object always contains `material` (and allow older callers to read `mat`).
    const copy = Object.assign({}, S, { material: S.material });
    localStorage.setItem(storageKey, JSON.stringify(copy));
  } catch {}
}
export function hydrateFromStorage() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    const obj = JSON.parse(raw);
    // Support both legacy `mat` and current `material` keys.
    if (obj.mat && !obj.material) obj.material = obj.mat;
    Object.assign(S, obj);
  } catch {}
}

// --- theme setters (also reflect on body)
export function setTheme(k){
  S.theme = k; save();
  document.body.setAttribute('data-theme', k);
  const themes = {
    coral:['#ff7b54','#ffd166'], sea:['#4facfe','#38d2ff'], city:['#34d399','#9ca3af'],
    magentaPurple:['#c026d3','#9333ea'], magentaPink:['#ec4899','#f97316'], blueGreen:['#22c1c3','#2ecc71'], grayBlack:['#8892a6','#414b57']
  };
  const pair = themes[k] || ['#8b5cf6', '#d946ef'];
  document.documentElement.style.setProperty('--accent', pair[0]);
  document.documentElement.style.setProperty('--accent2', pair[1]);
  document.documentElement.style.setProperty('--chipBg', pair[0]);
}
export function setCustomGradient(a,b){
  document.documentElement.style.setProperty('--accent', a);
  document.documentElement.style.setProperty('--accent2', b);
}
export function setDark(on){
  S.dark = on; save();
  document.body.setAttribute('data-dark', on ? '1' : '0');
  if (on){
    document.documentElement.style.setProperty('--secBg', '#0f1420');
    document.documentElement.style.setProperty('--cardBg', '#0c1222');
    document.documentElement.style.setProperty('--cardBorder', 'rgba(255,255,255,0.08)');
  } else {
    document.documentElement.style.setProperty('--secBg', '#ffffff');
    document.documentElement.style.setProperty('--cardBg', 'rgba(0,0,0,0.03)');
    document.documentElement.style.setProperty('--cardBorder', 'rgba(0,0,0,0.08)');
  }
}
export function setMaterial(m){
  S.material = m; save();
  document.body.setAttribute('data-mat', m);
}
