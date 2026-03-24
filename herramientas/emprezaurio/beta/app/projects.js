import { S, save as saveLocal } from './state.js';
import { authState } from './auth.js';
import { morphTo, applyContact } from '../layouts/layouts.js';
import { renderSkills, renderEdu, renderExp, renderBio } from '../modules/modules.js';

const TABLE = 'cv_projects';
const THEME_TONES = {
  coral: ['#ff7b54', '#ffd166'],
  sea: ['#4facfe', '#38d2ff'],
  city: ['#34d399', '#9ca3af'],
  magentaPurple: ['#c026d3', '#9333ea'],
  magentaPink: ['#ec4899', '#f97316'],
  blueGreen: ['#22c1c3', '#2ecc71'],
  grayBlack: ['#8892a6', '#414b57']
};

function cloneStatePayload(){
  return JSON.parse(JSON.stringify(S));
}

function resetState(){
  S.theme = 'magentaPurple';
  S.dark = false;
  S.material = 'paper';
  S.layout = null;
  S.project = { id:null, title:'Mi CV', locale:'es', updated_at:null };
  S.contact = { name:'', phone:'', email:'', address:'', linkedin:'' };
  S.avatar = null;
  S.skillsInSidebar = false;
  S.skills = [];
  S.edu = [];
  S.exp = [];
  S.bio = '';
}

function clearCanvas(){
  document.querySelectorAll('.node').forEach(node => node.remove());
}

function projectTitleFromState(){
  return S.project?.title || S.contact?.name || 'Mi CV';
}

export function applyStateToCanvas(payload){
  resetState();
  Object.assign(S, payload || {});
  if (!S.project) S.project = { id:null, title:'Mi CV', locale:'es', updated_at:null };

  clearCanvas();
  morphTo(`header-${S.layout || 'top'}`);
  applyContact();
  if (Array.isArray(S.skills) && S.skills.length) renderSkills(S.skills, { toRail: !!S.skillsInSidebar });
  if (Array.isArray(S.edu) && S.edu.length) renderEdu(S.edu);
  if (Array.isArray(S.exp) && S.exp.length) renderExp(S.exp);
  if (S.bio) renderBio(S.bio);
  document.getElementById('canvasAdd')?.style && (document.getElementById('canvasAdd').style.display = 'flex');
  saveLocal();
}

export async function listProjects(){
  if (!authState.client || !authState.session?.user?.id) return [];
  const { data, error } = await authState.client
    .from(TABLE)
    .select('*')
    .order('updated_at', { ascending:false });
  if (error) throw error;
  return data || [];
}

export async function saveCurrentProject(){
  if (!authState.client || !authState.session?.user?.id) return null;
  const payload = cloneStatePayload();
  const title = projectTitleFromState();
  const row = {
    id: S.project?.id || undefined,
    user_id: authState.session.user.id,
    title,
    locale: S.project?.locale || 'es',
    preview_name: S.contact?.name || '',
    layout: S.layout || 'top',
    payload,
    updated_at: new Date().toISOString()
  };
  const { data, error } = await authState.client
    .from(TABLE)
    .upsert(row)
    .select()
    .single();
  if (error) throw error;
  S.project = {
    id: data.id,
    title: data.title,
    locale: data.locale || 'es',
    updated_at: data.updated_at
  };
  saveLocal();
  return data;
}

export async function deleteProject(id){
  if (!authState.client || !id) return;
  const { error } = await authState.client.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

export async function duplicateProject(project){
  if (!authState.client || !authState.session?.user?.id) return null;
  const row = {
    user_id: authState.session.user.id,
    title: `${project.title} copia`,
    locale: project.locale || 'es',
    preview_name: project.preview_name || '',
    layout: project.layout || 'top',
    payload: project.payload,
    updated_at: new Date().toISOString()
  };
  const { data, error } = await authState.client.from(TABLE).insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function createTranslatedVersion(project){
  if (!authState.client || !authState.session?.user?.id) return null;
  const payload = JSON.parse(JSON.stringify(project.payload || {}));
  payload.project = Object.assign({}, payload.project || {}, { title: `${project.title} EN`, locale:'en' });
  const row = {
    user_id: authState.session.user.id,
    title: `${project.title} EN`,
    locale: 'en',
    preview_name: project.preview_name || '',
    layout: project.layout || 'top',
    payload,
    updated_at: new Date().toISOString()
  };
  const { data, error } = await authState.client.from(TABLE).insert(row).select().single();
  if (error) throw error;
  return data;
}

function projectSummary(project){
  const payload = project.payload || {};
  const counts = [
    Array.isArray(payload.skills) ? `${payload.skills.length} skills` : null,
    Array.isArray(payload.edu) ? `${payload.edu.length} educacion` : null,
    Array.isArray(payload.exp) ? `${payload.exp.length} experiencia` : null
  ].filter(Boolean).join(' · ');
  return counts || 'Sin bloques aun';
}

function themeGradient(project){
  const key = project.payload?.theme || 'magentaPurple';
  const pair = THEME_TONES[key] || THEME_TONES.magentaPurple;
  return `linear-gradient(135deg,${pair[0]},${pair[1]})`;
}

export function showActionFeedback(anchor, message, tone = 'default'){
  const target = anchor?.getBoundingClientRect?.();
  const node = document.createElement('div');
  node.className = `micro-feedback ${tone}`;
  node.textContent = message;
  document.body.appendChild(node);

  const left = target ? Math.min(window.innerWidth - 220, Math.max(16, target.left + target.width / 2 - 90)) : window.innerWidth / 2 - 90;
  const top = target ? Math.max(16, target.top - 10) : 24;
  node.style.left = `${left}px`;
  node.style.top = `${top}px`;

  requestAnimationFrame(() => node.classList.add('is-live'));
  window.setTimeout(() => {
    node.classList.remove('is-live');
    window.setTimeout(() => node.remove(), 220);
  }, 1400);
}

function sparkleNode(anchor){
  const target = anchor?.getBoundingClientRect?.();
  if (!target) return;
  const node = document.createElement('div');
  node.className = 'sparkle-burst';
  node.style.left = `${target.left + target.width / 2}px`;
  node.style.top = `${target.top + target.height / 2}px`;
  document.body.appendChild(node);
  for (let i = 0; i < 8; i++) {
    const dot = document.createElement('span');
    dot.style.setProperty('--dx', `${Math.cos((Math.PI * 2 * i) / 8) * 30}px`);
    dot.style.setProperty('--dy', `${Math.sin((Math.PI * 2 * i) / 8) * 30}px`);
    node.appendChild(dot);
  }
  window.setTimeout(() => node.remove(), 700);
}

function renderProjectPreview(project){
  const payload = project.payload || {};
  const layout = project.layout || payload.layout || 'top';
  const name = project.preview_name || payload.contact?.name || project.title || 'Mi CV';
  const accent = themeGradient(project);
  const surface = payload.dark
    ? 'linear-gradient(180deg,#121826,#090d16)'
    : '#f7f4fb';
  const ink = payload.dark ? '#f7eff8' : '#12071b';
  const soft = payload.dark ? 'rgba(255,255,255,.14)' : 'rgba(18,7,27,.08)';

  if (layout === 'side') {
    return `
      <div class="mini-resume mini-side" style="background:${surface};color:${ink}">
        <div class="mini-rail" style="background:${accent}">
          <div class="mini-avatar"></div>
          <span class="mini-chip"></span>
          <span class="mini-chip short"></span>
        </div>
        <div class="mini-main">
          <div class="mini-name">${name}</div>
          <div class="mini-line wide" style="background:${soft}"></div>
          <div class="mini-grid">
            <span style="background:${soft}"></span><span style="background:${soft}"></span><span style="background:${soft}"></span><span style="background:${soft}"></span>
          </div>
        </div>
      </div>
    `;
  }

  if (layout === 'fancy') {
    return `
      <div class="mini-resume mini-fancy" style="background:${surface};color:${ink}">
        <div class="mini-hero" style="background:${accent}"></div>
        <div class="mini-avatar floating"></div>
        <div class="mini-name center">${name}</div>
        <div class="mini-line mid" style="background:${soft}"></div>
        <div class="mini-grid">
          <span style="background:${soft}"></span><span style="background:${soft}"></span><span style="background:${soft}"></span><span style="background:${soft}"></span>
        </div>
      </div>
    `;
  }

  return `
    <div class="mini-resume mini-top" style="background:${surface};color:${ink}">
      <div class="mini-hero" style="background:${accent}">
        <div class="mini-top-copy">
          <div class="mini-name">${name}</div>
          <div class="mini-line short" style="background:${payload.dark ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.5)'}"></div>
        </div>
        <div class="mini-avatar small"></div>
      </div>
      <div class="mini-grid">
        <span style="background:${soft}"></span><span style="background:${soft}"></span><span style="background:${soft}"></span><span style="background:${soft}"></span>
      </div>
    </div>
  `;
}

function projectMenuMarkup(id){
  return `
    <button data-action="edit" data-id="${id}" type="button">Editar</button>
    <button data-action="rename" data-id="${id}" type="button">Renombrar</button>
    <button data-action="duplicate" data-id="${id}" type="button">Duplicar</button>
    <button data-action="translate" data-id="${id}" type="button">Crear version traducida</button>
    <button data-action="delete" data-id="${id}" type="button">Eliminar</button>
  `;
}

export function mountProjectLibrary({ onNewProject, onEditProject }){
  if (document.getElementById('projectLibrary')) return;
  const wrap = document.createElement('div');
  wrap.id = 'projectLibrary';
  wrap.innerHTML = `
    <style>
      #projectLibrary{position:fixed;inset:0;display:none;place-items:center;background:rgba(6,3,10,.72);backdrop-filter:blur(14px);z-index:22000;padding:24px}
      #projectLibrary.open{display:grid}
      #projectLibrary .lib-shell{width:min(1240px,96vw);max-height:min(90dvh,920px);display:grid;gap:18px;padding:24px;border-radius:28px;border:1px solid rgba(255,255,255,.1);background:linear-gradient(180deg,rgba(31,10,42,.96),rgba(14,7,20,.96));box-shadow:0 34px 90px rgba(0,0,0,.42);overflow:hidden}
      .micro-feedback{position:fixed;z-index:23000;padding:10px 14px;border-radius:999px;background:rgba(28,11,40,.96);border:1px solid rgba(255,255,255,.12);color:#fff8fb;box-shadow:0 20px 40px rgba(0,0,0,.24);opacity:0;transform:translateY(8px) scale(.96);pointer-events:none;transition:opacity .18s ease, transform .18s ease}
      .micro-feedback.is-live{opacity:1;transform:translateY(-12px) scale(1)}
      .micro-feedback.success{background:linear-gradient(135deg,#ffd447,#ffb87c);color:#240b18}
      .micro-feedback.warn{background:linear-gradient(135deg,#f97316,#ef4444)}
      .micro-feedback.sparkle::after{content:"✦";margin-left:8px}
      .sparkle-burst{position:fixed;z-index:23001;pointer-events:none;transform:translate(-50%,-50%)}
      .sparkle-burst span{position:absolute;width:8px;height:8px;border-radius:999px;background:linear-gradient(135deg,#ffd447,#fff3b0);box-shadow:0 0 14px rgba(255,212,71,.5);animation:sparkle-pop .95s ease forwards}
      @keyframes sparkle-pop{0%{opacity:0;transform:translate(0,0) scale(.2)}20%{opacity:1}72%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.08)}}
      #projectLibrary .lib-head{display:flex;justify-content:space-between;gap:14px;align-items:start}
      #projectLibrary .lib-head h2{margin:0;font:800 2rem/1 "Bricolage Grotesque","Trebuchet MS",sans-serif;color:#fff8fb}
      #projectLibrary .lib-head p{margin:8px 0 0;color:rgba(255,255,255,.72)}
      #projectLibrary .lib-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
      #projectLibrary .lib-btn{appearance:none;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff8fb;padding:12px 16px;border-radius:999px;font-weight:700;cursor:pointer;transition:transform .16s ease, box-shadow .16s ease, border-color .16s ease, background .16s ease}
      #projectLibrary .lib-btn.primary{background:linear-gradient(135deg,#ffd447,#ffb87c);color:#240b18}
      #projectLibrary .lib-btn:hover{transform:translateY(-2px);box-shadow:0 16px 30px rgba(0,0,0,.22);border-color:rgba(255,255,255,.24)}
      #projectLibrary .lib-btn:active{transform:translateY(0) scale(.98)}
      #projectLibrary .lib-close{width:46px;height:46px;border-radius:16px;padding:0;font-size:1.4rem;line-height:1}
      #projectLibrary .lib-grid{display:grid;grid-template-columns:repeat(auto-fit,280px);justify-content:center;gap:18px;overflow:auto;padding-right:6px}
      #projectLibrary .project-card{position:relative;display:grid;gap:14px;width:280px;min-height:410px;padding:18px;border-radius:24px;border:1px solid rgba(255,255,255,.1);background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.03));transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease}
      #projectLibrary .project-card:hover{transform:translateY(-4px);box-shadow:0 20px 50px rgba(0,0,0,.24);border-color:rgba(255,212,71,.24)}
      #projectLibrary .project-card.is-deleting{border:2px dashed rgba(239,68,68,.92);box-shadow:0 0 0 4px rgba(239,68,68,.08) inset, 0 22px 44px rgba(0,0,0,.22);background:linear-gradient(180deg,rgba(120,16,24,.16),rgba(255,255,255,.03));overflow:hidden}
      #projectLibrary .project-card.is-deleting .project-preview,
      #projectLibrary .project-card.is-deleting .project-meta,
      #projectLibrary .project-card.is-deleting .project-open{opacity:.36;transition:opacity .42s ease, filter .42s ease;filter:saturate(.55)}
      #projectLibrary .project-card.is-deleting .project-preview{filter:saturate(.54) blur(.8px)}
      #projectLibrary .project-card.is-deleting .trash-pop{position:absolute;left:50%;top:50%;width:84px;height:84px;margin:-42px 0 0 -42px;pointer-events:none;border-radius:999px;background:radial-gradient(circle,rgba(239,68,68,.24),rgba(239,68,68,0) 72%);box-shadow:0 0 48px rgba(239,68,68,.24);animation:trash-bye 1.15s ease forwards}
      #projectLibrary .project-card.is-deleting .trash-pop::before{content:"";position:absolute;left:20px;right:20px;bottom:16px;height:34px;border:3px solid rgba(255,246,246,.98);border-top:0;border-radius:0 0 12px 12px;background:rgba(239,68,68,.24);box-shadow:0 12px 26px rgba(0,0,0,.18)}
      #projectLibrary .project-card.is-deleting .trash-pop::after{content:"";position:absolute;left:20px;right:20px;top:16px;height:10px;border-radius:10px;background:rgba(255,246,246,.98);transform-origin:10px 100%;animation:trash-lid 1.15s ease forwards}
      #projectLibrary .project-card.is-deleting .trash-pop .trash-handle{position:absolute;left:30px;right:30px;top:10px;height:7px;border:3px solid rgba(255,246,246,.98);border-bottom:0;border-radius:8px 8px 0 0}
      @keyframes trash-lid{0%,16%{transform:rotate(0deg)}30%{transform:rotate(-32deg)}50%{transform:rotate(6deg)}68%,100%{transform:rotate(0deg)}}
      @keyframes trash-bye{0%{opacity:0;transform:translateY(12px) scale(.82)}16%{opacity:1;transform:translateY(0) scale(1)}76%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-12px) scale(.76)}}
      #projectLibrary .project-preview{display:grid;align-items:center;justify-items:center;gap:10px;padding:12px;height:190px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}
      #projectLibrary .mini-resume{display:grid;gap:10px;width:100%;height:100%;padding:12px;border-radius:16px;background:#f7f4fb;color:#12071b;overflow:hidden}
      #projectLibrary .mini-hero{border-radius:12px;background:linear-gradient(135deg,#ffba4a,#ff6aa7);min-height:34px}
      #projectLibrary .mini-name{font-weight:800;font-size:.8rem;line-height:1.05;word-break:break-word}
      #projectLibrary .mini-name.center{text-align:center}
      #projectLibrary .mini-line{height:8px;border-radius:999px;background:rgba(18,7,27,.18)}
      #projectLibrary .mini-line.wide{width:76%}
      #projectLibrary .mini-line.mid{width:56%;margin:0 auto}
      #projectLibrary .mini-line.short{width:48%}
      #projectLibrary .mini-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;align-content:start}
      #projectLibrary .mini-grid span{display:block;height:34px;border-radius:12px;background:rgba(18,7,27,.08)}
      #projectLibrary .mini-avatar{width:34px;height:34px;border-radius:50%;background:#e0d7ec;border:3px solid #fff;box-shadow:0 8px 16px rgba(0,0,0,.14)}
      #projectLibrary .mini-avatar.small{width:30px;height:30px}
      #projectLibrary .mini-avatar.floating{margin:-18px auto 0}
      #projectLibrary .mini-top .mini-hero{display:flex;justify-content:space-between;align-items:flex-start;padding:12px;min-height:60px}
      #projectLibrary .mini-top-copy{display:grid;gap:8px}
      #projectLibrary .mini-side{grid-template-columns:72px minmax(0,1fr);gap:10px}
      #projectLibrary .mini-rail{border-radius:14px;background:linear-gradient(160deg,#6c7fca,#3b4b93);padding:10px;display:grid;justify-items:center;align-content:start;gap:10px}
      #projectLibrary .mini-chip{display:block;width:100%;height:8px;border-radius:999px;background:rgba(255,255,255,.84)}
      #projectLibrary .mini-chip.short{width:72%}
      #projectLibrary .mini-main{display:grid;align-content:start;gap:10px;padding-top:4px}
      #projectLibrary .mini-fancy .mini-hero{min-height:52px}
      #projectLibrary .mini-fancy .mini-name{margin-top:2px}
      #projectLibrary .project-meta h3{margin:0;color:#fff8fb;font-size:1.2rem}
      #projectLibrary .project-meta p{margin:6px 0 0;color:rgba(255,255,255,.7);line-height:1.5}
      #projectLibrary .project-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      #projectLibrary .project-open{margin-top:auto}
      #projectLibrary .project-open button{width:100%}
      #projectLibrary .project-menu-wrap{position:relative}
      #projectLibrary .project-menu-btn{width:40px;height:40px;border-radius:14px;padding:0;font-size:1.3rem;line-height:1}
      #projectLibrary .project-menu{position:absolute;top:46px;right:0;display:none;min-width:220px;padding:8px;border-radius:18px;background:#12071b;border:1px solid rgba(255,255,255,.1);box-shadow:0 24px 60px rgba(0,0,0,.35)}
      #projectLibrary .project-menu.open{display:grid;gap:6px}
      #projectLibrary .project-menu button{appearance:none;border:0;background:rgba(255,255,255,.04);color:#fff8fb;padding:10px 12px;border-radius:12px;text-align:left;cursor:pointer;transition:background .16s ease, transform .16s ease}
      #projectLibrary .project-menu button:hover{background:rgba(255,255,255,.1);transform:translateX(2px)}
      #projectLibrary .rename-inline{display:grid;gap:8px;padding:10px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}
      #projectLibrary .rename-inline input{width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff8fb}
      #projectLibrary .rename-actions{display:flex;gap:8px}
      #projectLibrary .rename-actions button{flex:1 1 auto}
      #projectLibrary .project-add{display:grid;place-items:center;text-align:center;gap:12px;border:2px dashed rgba(255,255,255,.16);cursor:pointer;width:220px;min-height:410px;justify-self:center}
      #projectLibrary .project-add:hover{border-color:rgba(255,212,71,.34);background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.04))}
      #projectLibrary .project-add .plus{width:72px;height:72px;border-radius:24px;display:grid;place-items:center;background:rgba(255,255,255,.06);font-size:2rem;font-weight:800;transition:transform .16s ease, background .16s ease}
      #projectLibrary .project-add:hover .plus{transform:scale(1.06);background:rgba(255,212,71,.14)}
      #projectLibrary .project-add h3{color:#ffd447}
      #projectLibrary .empty{padding:28px;border-radius:22px;border:1px dashed rgba(255,255,255,.14);color:rgba(255,255,255,.72);text-align:center}
      @media (max-width:700px){
        #projectLibrary{padding:12px}
        #projectLibrary .lib-shell{width:min(100vw - 12px,560px);padding:18px;max-height:min(96dvh,980px);border-radius:24px}
        #projectLibrary .lib-head{display:grid;grid-template-columns:1fr auto;align-items:start}
        #projectLibrary .lib-head h2{font-size:1.5rem}
        #projectLibrary .lib-head p{font-size:.96rem;line-height:1.45}
        #projectLibrary .lib-actions{width:auto}
        #projectLibrary .lib-grid{grid-template-columns:minmax(0,1fr);justify-content:stretch;gap:14px}
        #projectLibrary .project-card,
        #projectLibrary .project-add{width:100%;min-height:auto}
        #projectLibrary .project-preview{height:168px}
        #projectLibrary .project-row{align-items:center}
        #projectLibrary .project-meta h3{font-size:1.08rem}
        #projectLibrary .project-meta p{font-size:.96rem}
      }
    </style>
    <div class="lib-shell">
      <div class="lib-head">
        <div>
          <h2>Mis CVs</h2>
          <p>Entra a uno existente o crea otro desde cero sin perder tus proyectos guardados.</p>
        </div>
        <div class="lib-actions">
          <button class="lib-btn lib-close" id="libCloseBtn" type="button" aria-label="Cerrar">×</button>
        </div>
      </div>
      <div class="lib-grid" id="libGrid"></div>
    </div>
  `;
  document.body.appendChild(wrap);

  const grid = wrap.querySelector('#libGrid');
  const renderCards = async () => {
    grid.innerHTML = '<div class="empty">Cargando tus CVs...</div>';
    const projects = await listProjects();
    const cards = [];
    if (!projects.length) {
      cards.push(`<div class="empty">Todavia no tienes CVs guardados. Crea el primero desde esta biblioteca.</div>`);
    } else {
      projects.forEach(project => {
        cards.push(`
          <article class="project-card" data-id="${project.id}">
            <div class="project-row">
              <div class="project-preview">${renderProjectPreview(project)}</div>
              <div class="project-menu-wrap">
                <button class="lib-btn project-menu-btn" data-menu-btn="${project.id}" type="button" aria-label="Mas opciones">⋯</button>
                <div class="project-menu" data-menu="${project.id}">
                  ${projectMenuMarkup(project.id)}
                </div>
              </div>
            </div>
            <div class="project-meta">
              <h3><span class="project-title-text" data-title-text="${project.id}">${project.title}</span></h3>
              <p>${projectSummary(project)}</p>
              <p>${project.preview_name || 'Sin nombre visible'} · ${project.layout || 'top'} · ${(project.locale || 'es').toUpperCase()}</p>
            </div>
            <div class="project-open">
              <button class="lib-btn primary" data-action="edit" data-id="${project.id}" type="button">Abrir CV</button>
            </div>
          </article>
        `);
      });
    }
    cards.push(`
      <article class="project-card project-add" data-action="new">
        <div class="plus">+</div>
        <h3>Crear nuevo CV</h3>
        <p>Arranca un curriculum nuevo con wizard, demo o modo manual.</p>
      </article>
    `);
    grid.innerHTML = cards.join('');
  };

  wrap.querySelector('#libCloseBtn').onclick = () => wrap.classList.remove('open');

  grid.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-action], [data-menu-btn]');
    if (!trigger) return;

    const menuBtn = trigger.getAttribute('data-menu-btn');
    if (menuBtn) {
      grid.querySelectorAll('.project-menu').forEach(menu => menu.classList.remove('open'));
      grid.querySelector(`[data-menu="${menuBtn}"]`)?.classList.toggle('open');
      return;
    }

    const action = trigger.getAttribute('data-action');
    if (action === 'new') return onNewProject?.();

    const id = trigger.getAttribute('data-id');
    const projects = await listProjects();
    const project = projects.find(item => item.id === id);
    if (!project) return;

    if (action === 'edit') return onEditProject?.(project);
    if (action === 'rename') {
      const menu = grid.querySelector(`[data-menu="${project.id}"]`);
      if (!menu) return;
      menu.innerHTML = `
        <div class="rename-inline">
          <input type="text" value="${project.title.replace(/"/g, '&quot;')}" data-rename-input="${project.id}" />
          <div class="rename-actions">
            <button data-action="rename-save" data-id="${project.id}" type="button">Guardar</button>
            <button data-action="rename-cancel" data-id="${project.id}" type="button">Cancelar</button>
          </div>
        </div>
      `;
      menu.classList.add('open');
      menu.querySelector('input')?.focus();
      return;
    }
    if (action === 'rename-cancel') {
      const menu = grid.querySelector(`[data-menu="${project.id}"]`);
      if (!menu) return;
      menu.innerHTML = projectMenuMarkup(project.id);
      menu.classList.remove('open');
      return;
    }
    if (action === 'rename-save') {
      const input = grid.querySelector(`[data-rename-input="${project.id}"]`);
      const nextTitle = input?.value?.trim();
      if (!nextTitle) return;
      const { error } = await authState.client
        .from(TABLE)
        .update({ title: nextTitle, updated_at: new Date().toISOString() })
        .eq('id', project.id);
      if (!error) {
        const titleNode = grid.querySelector(`[data-title-text="${project.id}"]`);
        if (titleNode) {
          titleNode.textContent = nextTitle;
          titleNode.animate(
            [
              { transform:'scale(1)', filter:'drop-shadow(0 0 0 rgba(255,212,71,0))' },
              { transform:'scale(1.045)', filter:'drop-shadow(0 0 18px rgba(255,212,71,.52))', offset:.45 },
              { transform:'scale(1)', filter:'drop-shadow(0 0 0 rgba(255,212,71,0))' }
            ],
            { duration: 980, easing:'ease-out' }
          );
          sparkleNode(titleNode);
        }
        showActionFeedback(trigger, 'Renombrado', 'success sparkle');
        sparkleNode(trigger);
        const menu = grid.querySelector(`[data-menu="${project.id}"]`);
        if (menu) {
          window.setTimeout(() => {
            menu.innerHTML = projectMenuMarkup(project.id);
            menu.classList.remove('open');
          }, 180);
        }
        return;
      }
      return;
    }
    if (action === 'duplicate') {
      await duplicateProject(project);
      showActionFeedback(trigger, 'Duplicado', 'success');
      return renderCards();
    }
    if (action === 'translate') {
      await createTranslatedVersion(project);
      showActionFeedback(trigger, 'Version traducida creada', 'success');
      return renderCards();
    }
    if (action === 'delete') {
      const card = grid.querySelector(`.project-card[data-id="${project.id}"]`);
      showActionFeedback(trigger, 'CV eliminado', 'warn');
      if (card) {
        card.classList.add('is-deleting');
        if (!card.querySelector('.trash-pop')) {
          const trash = document.createElement('span');
          trash.className = 'trash-pop';
          trash.innerHTML = '<span class="trash-handle"></span>';
          card.appendChild(trash);
        }
        window.setTimeout(async () => {
          await deleteProject(project.id);
          card.animate(
            [
              { opacity:1, transform:'scale(1)', filter:'blur(0px)' },
              { opacity:.72, transform:'scale(.985)', filter:'blur(.2px)', offset:.45 },
              { opacity:0, transform:'scale(.94)', filter:'blur(1.4px)' }
            ],
            { duration:480, easing:'ease-in', fill:'forwards' }
          );
          window.setTimeout(() => renderCards(), 500);
        }, 1080);
        return;
      }
      await deleteProject(project.id);
      return renderCards();
    }
  });

  document.addEventListener('click', (event) => {
    if (!wrap.classList.contains('open')) return;
    if (!wrap.contains(event.target)) return;
    if (!event.target.closest('.project-menu-wrap')) {
      wrap.querySelectorAll('.project-menu').forEach(menu => menu.classList.remove('open'));
    }
  });

  return {
    open: async () => { wrap.classList.add('open'); await renderCards(); },
    close: () => wrap.classList.remove('open'),
    refresh: async () => renderCards()
  };
}
