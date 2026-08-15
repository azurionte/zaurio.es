(()=>{'use strict';
const TABLE='dinerozaurio_temporary_drafts';
const SESSION_KEY='dz_session_draft_id_v1';
const WRITE_DELAY=150;
let recoveryChecked=false;
let recoveryChecking=false;
let recoveryPromptOpen=false;
let nextRecoveryRetryAt=0;
let writeTimer=null;
let writeGeneration=0;
let lastSerialized='';
let installing=false;

function sessionId(){
  let id=sessionStorage.getItem(SESSION_KEY);
  if(!id){id=crypto.randomUUID();sessionStorage.setItem(SESSION_KEY,id);}
  return id;
}
function ready(){
  return !!(window.dzSupabase&&state?.session?.user?.id&&state?.planId&&savedBaseline&&typeof snapshotPersistableState==='function'&&typeof buildStateChanges==='function');
}
function compactChanges(changes){
  return (changes||[]).map(change=>({
    id:change.id,
    kind:change.kind,
    groupKey:change.groupKey||'',
    groupTitle:change.groupTitle||'',
    title:change.title||'',
    desc:change.desc||''
  }));
}
async function deleteDraft(){
  if(!ready())return;
  const generation=++writeGeneration;
  clearTimeout(writeTimer);writeTimer=null;lastSerialized='';
  const {error}=await window.dzSupabase.from(TABLE).delete().eq('user_id',state.session.user.id).eq('plan_id',state.planId);
  if(error&&generation===writeGeneration)console.error('DineroZaurio: no se pudo eliminar el borrador temporal',error);
}
async function writeDraftNow(){
  if(!recoveryChecked||!ready()||recoveryPromptOpen)return;
  const changes=buildStateChanges();
  if(!changes.length){await deleteDraft();return;}
  const snapshot=snapshotPersistableState();
  const payload={
    user_id:state.session.user.id,
    plan_id:state.planId,
    snapshot,
    changes:compactChanges(changes),
    change_count:changes.length,
    client_session_id:sessionId(),
    updated_at:new Date().toISOString()
  };
  const serialized=JSON.stringify([payload.plan_id,payload.snapshot,payload.changes]);
  if(serialized===lastSerialized)return;
  lastSerialized=serialized;
  const generation=++writeGeneration;
  const {error}=await window.dzSupabase.from(TABLE).upsert(payload,{onConflict:'user_id,plan_id'});
  if(error&&generation===writeGeneration){lastSerialized='';console.error('DineroZaurio: no se pudo guardar el borrador temporal',error);}
}
function scheduleDraftWrite(){
  if(!recoveryChecked||recoveryPromptOpen||!ready())return;
  clearTimeout(writeTimer);
  const generation=++writeGeneration;
  writeTimer=setTimeout(()=>{if(generation!==writeGeneration)return;writeTimer=null;writeDraftNow().catch(console.error);},WRITE_DELAY);
}
function restoreSavedBaseline(){
  if(!savedBaseline)return;
  assignPersistableState(savedBaseline);
  cacheLocal();
  renderManualLists();
  renderForecast();
  if(typeof setSaveStatus==='function')setSaveStatus('idle');
}
function closeRecoveryPrompt(){
  recoveryPromptOpen=false;
  const root=document.getElementById('modalRoot');
  if(root){root.innerHTML='';root.className='hidden';}
}
async function discardRecoveredDraft(){
  restoreSavedBaseline();
  await deleteDraft();
  closeRecoveryPrompt();
}
function reviewRecoveredDraft(draft){
  recoveryPromptOpen=false;
  assignPersistableState(draft.snapshot||{});
  cacheLocal();
  renderManualLists();
  renderForecast();
  if(typeof setSaveStatus==='function')setSaveStatus('idle');
  closeRecoveryPrompt();
  setTimeout(()=>{if(typeof openSaveModal==='function')openSaveModal();},0);
}
function showRecoveryPrompt(draft){
  recoveryPromptOpen=true;
  const count=Math.max(1,Number(draft.change_count||draft.changes?.length||1));
  const updated=draft.updated_at?new Date(draft.updated_at):null;
  const when=updated&&!Number.isNaN(updated.getTime())?updated.toLocaleString('es-ES',{dateStyle:'medium',timeStyle:'short'}):'tu última sesión';
  const root=document.getElementById('modalRoot');
  if(!root)return;
  root.className='modalRoot';
  root.innerHTML=`<div class="modalCard">
    <div class="modalHead">
      <div>
        <div class="sub">Recuperación de sesión</div>
        <h3 style="margin:4px 0 0">Hay cambios pendientes</h3>
      </div>
    </div>
    <p style="margin:0 0 14px;line-height:1.55">DineroZaurio encontró ${count} cambio${count===1?'':'s'} sin guardar de tu última sesión.</p>
    <div class="legendNote">
      <span class="legendDot"></span>
      <span>Última copia temporal: ${escapeHtml(when)}. Puedes revisarla antes de decidir qué guardar definitivamente.</span>
    </div>
    <div class="btnRow" style="margin-top:18px;justify-content:flex-end;align-items:center">
      <button id="dzDiscardRecoveredDraft" class="btn ghost" type="button" style="color:var(--danger);border-color:rgba(255,91,127,.45)">Descartar cambios</button>
      <button id="dzReviewRecoveredDraft" class="btn primary" type="button">Revisar cambios</button>
    </div>
  </div>`;
  document.getElementById('dzDiscardRecoveredDraft').onclick=()=>discardRecoveredDraft().catch(console.error);
  document.getElementById('dzReviewRecoveredDraft').onclick=()=>reviewRecoveredDraft(draft);
}
async function checkRecovery(){
  if(recoveryChecked||recoveryChecking||Date.now()<nextRecoveryRetryAt||!ready())return false;
  recoveryChecking=true;
  const {data,error}=await window.dzSupabase.from(TABLE).select('snapshot,changes,change_count,updated_at,client_session_id').eq('user_id',state.session.user.id).eq('plan_id',state.planId).maybeSingle();
  recoveryChecking=false;
  if(error){nextRecoveryRetryAt=Date.now()+1500;console.error('DineroZaurio: no se pudo comprobar el borrador temporal',error);return false;}
  recoveryChecked=true;
  if(!data||!data.snapshot||Number(data.change_count||0)<=0){scheduleDraftWrite();return false;}
  restoreSavedBaseline();
  showRecoveryPrompt(data);
  return true;
}
function wrapSaveUi(){
  if(typeof window.updateSaveUi!=='function'||window.updateSaveUi.__dzDraftWrapped)return false;
  const base=window.updateSaveUi;
  const wrapped=function(...args){const result=base.apply(this,args);scheduleDraftWrite();return result;};
  wrapped.__dzDraftWrapped=true;
  window.updateSaveUi=wrapped;
  return true;
}
function keepBrandNavigationInSession(){
  document.addEventListener('click',event=>{
    const brand=event.target.closest?.('.dzAppBrand');
    if(!brand)return;
    const home=document.querySelector('.tab[data-tab="home"]');
    if(!home)return;
    event.preventDefault();
    home.click();
    window.scrollTo({top:0,behavior:'smooth'});
  },true);
}
function install(){
  if(installing)return;installing=true;keepBrandNavigationInSession();
  const wait=()=>{
    wrapSaveUi();
    if(ready())checkRecovery().catch(console.error);
    if(!recoveryChecked||typeof window.updateSaveUi!=='function'||!window.updateSaveUi.__dzDraftWrapped)setTimeout(wait,120);
  };
  wait();
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&recoveryChecked)writeDraftNow().catch(console.error);});
  window.addEventListener('pagehide',()=>{if(recoveryChecked)writeDraftNow().catch(console.error);});
}
window.__DZ_SESSION_DRAFTS__={table:TABLE,checkRecovery,writeDraftNow,deleteDraft};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
