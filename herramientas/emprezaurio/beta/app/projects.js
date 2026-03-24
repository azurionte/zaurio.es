import { S, save as saveLocal } from './state.js';
import { authState } from './auth.js';
import { morphTo, applyContact } from '../layouts/layouts.js';
import { renderSkills, renderEdu, renderExp, renderBio } from '../modules/modules.js';

const TABLE = 'cv_projects';

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

export function mountProjectLibrary({ onNewProject, onEditProject }){
  if (document.getElementById('projectLibrary')) return;
  const wrap = document.createElement('div');
  wrap.id = 'projectLibrary';
  wrap.innerHTML = `
    <style>
      #projectLibrary{position:fixed;inset:0;display:none;place-items:center;background:rgba(6,3,10,.72);backdrop-filter:blur(14px);z-index:22000;padding:24px}
      #projectLibrary.open{display:grid}
      #projectLibrary .lib-shell{width:min(1180px,96vw);max-height:min(90dvh,920px);display:grid;gap:18px;padding:24px;border-radius:28px;border:1px solid rgba(255,255,255,.1);background:linear-gradient(180deg,rgba(31,10,42,.96),rgba(14,7,20,.96));box-shadow:0 34px 90px rgba(0,0,0,.42);overflow:hidden}
      #projectLibrary .lib-head{display:flex;justify-content:space-between;gap:14px;align-items:end}
      #projectLibrary .lib-head h2{margin:0;font:800 2rem/1 "Bricolage Grotesque","Trebuchet MS",sans-serif;color:#fff8fb}
      #projectLibrary .lib-head p{margin:8px 0 0;color:rgba(255,255,255,.72)}
      #projectLibrary .lib-actions{display:flex;gap:10px;flex-wrap:wrap}
      #projectLibrary .lib-btn{appearance:none;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff8fb;padding:12px 16px;border-radius:999px;font-weight:700;cursor:pointer}
      #projectLibrary .lib-btn.primary{background:linear-gradient(135deg,#ffd447,#ffb87c);color:#240b18}
      #projectLibrary .lib-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;overflow:auto;padding-right:6px}
      #projectLibrary .project-card{position:relative;display:grid;gap:14px;min-height:220px;padding:18px;border-radius:24px;border:1px solid rgba(255,255,255,.1);background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.03))}
      #projectLibrary .project-preview{display:grid;gap:10px;padding:16px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}
      #projectLibrary .project-lines{display:grid;gap:8px}
      #projectLibrary .project-lines span{display:block;height:10px;border-radius:999px;background:linear-gradient(135deg,rgba(255,212,71,.9),rgba(134,239,255,.72))}
      #projectLibrary .project-lines span:nth-child(2){width:78%}
      #projectLibrary .project-lines span:nth-child(3){width:58%}
      #projectLibrary .project-meta h3{margin:0;color:#fff8fb;font-size:1.2rem}
      #projectLibrary .project-meta p{margin:6px 0 0;color:rgba(255,255,255,.7);line-height:1.5}
      #projectLibrary .project-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      #projectLibrary .project-open{margin-top:auto}
      #projectLibrary .project-open button{width:100%}
      #projectLibrary .project-menu-wrap{position:relative}
      #projectLibrary .project-menu-btn{width:40px;height:40px;border-radius:14px;padding:0}
      #projectLibrary .project-menu{position:absolute;top:46px;right:0;display:none;min-width:220px;padding:8px;border-radius:18px;background:#12071b;border:1px solid rgba(255,255,255,.1);box-shadow:0 24px 60px rgba(0,0,0,.35)}
      #projectLibrary .project-menu.open{display:grid;gap:6px}
      #projectLibrary .project-menu button{appearance:none;border:0;background:rgba(255,255,255,.04);color:#fff8fb;padding:10px 12px;border-radius:12px;text-align:left;cursor:pointer}
      #projectLibrary .project-add{display:grid;place-items:center;text-align:center;gap:12px;border:2px dashed rgba(255,255,255,.16)}
      #projectLibrary .project-add .plus{width:72px;height:72px;border-radius:24px;display:grid;place-items:center;background:rgba(255,255,255,.06);font-size:2rem;font-weight:800}
      #projectLibrary .empty{padding:28px;border-radius:22px;border:1px dashed rgba(255,255,255,.14);color:rgba(255,255,255,.72);text-align:center}
      @media (max-width:700px){
        #projectLibrary{padding:12px}
        #projectLibrary .lib-shell{padding:18px;max-height:min(94dvh,980px)}
        #projectLibrary .lib-head{grid-template-columns:1fr;align-items:start}
        #projectLibrary .lib-head h2{font-size:1.5rem}
        #projectLibrary .lib-actions{width:100%}
        #projectLibrary .lib-actions .lib-btn{flex:1 1 100%}
      }
    </style>
    <div class="lib-shell">
      <div class="lib-head">
        <div>
          <h2>Mis CVs</h2>
          <p>Entra a uno existente o crea otro desde cero sin perder tus proyectos guardados.</p>
        </div>
        <div class="lib-actions">
          <button class="lib-btn" id="libRefreshBtn" type="button">Actualizar</button>
          <button class="lib-btn primary" id="libNewBtn" type="button">Nuevo CV</button>
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
    cards.push(`
      <article class="project-card project-add" data-action="new">
        <div class="plus">+</div>
        <h3>Crear otro CV</h3>
        <p>Arranca un curriculum nuevo con wizard, demo o modo manual.</p>
      </article>
    `);
    if (!projects.length) {
      cards.push(`<div class="empty">Todavia no tienes CVs guardados. Crea el primero desde esta biblioteca.</div>`);
    } else {
      projects.forEach(project => {
        cards.push(`
          <article class="project-card" data-id="${project.id}">
            <div class="project-row">
              <div class="project-preview">
                <div class="project-lines">
                  <span style="width:86%"></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div class="project-menu-wrap">
                <button class="lib-btn project-menu-btn" data-menu-btn="${project.id}" type="button">⋯</button>
                <div class="project-menu" data-menu="${project.id}">
                  <button data-action="edit" data-id="${project.id}" type="button">Editar</button>
                  <button data-action="duplicate" data-id="${project.id}" type="button">Duplicar</button>
                  <button data-action="translate" data-id="${project.id}" type="button">Crear version traducida</button>
                  <button data-action="delete" data-id="${project.id}" type="button">Eliminar</button>
                </div>
              </div>
            </div>
            <div class="project-meta">
              <h3>${project.title}</h3>
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
    grid.innerHTML = cards.join('');
  };

  wrap.querySelector('#libRefreshBtn').onclick = () => renderCards();
  wrap.querySelector('#libNewBtn').onclick = () => onNewProject?.();

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
    if (action === 'duplicate') {
      await duplicateProject(project);
      return renderCards();
    }
    if (action === 'translate') {
      await createTranslatedVersion(project);
      return renderCards();
    }
    if (action === 'delete') {
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
