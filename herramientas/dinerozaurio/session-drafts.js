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
  root.innerHTML=`<div class="modalCard dzDraftRecoveryModal"><div class="modalHead"><div><span class="dzDraftRecoveryKicker">Recuperación</span><h3>Hay datos sin guardar de tu última sesión</h3></div></div><p class="dzDraftRecoveryLead">Encontramos ${count} cambio${count===1?'':'s'} pendiente${count===1?'':'s'} guardado${count===1?'':'s'} temporalmente en ${escapeHtml(when)}.</p><p class="muted">Puedes descartarlos o revisarlos antes de decidir qué guardar definitivamente.</p><div class="btnRow dzDraftRecoveryActions"><button id="dzDiscardRecoveredDraft" class="btn danger" type="button">Descartar</button><button id="dzReviewRecoveredDraft" class="btn primary" type="button">Revisar</button></div></div>`;
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
function styles(){
  if(document.getElementById('dzDraftRecoveryStyles'))return;
  const style=document.createElement('style');
  style.id='dzDraftRecoveryStyles';
  style.textContent='.dzDraftRecoveryModal{width:min(520px,94vw)}.dzDraftRecoveryKicker{display:block;color:var(--pink-2);font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;margin-bottom:5px}.dzDraftRecoveryLead{font-size:15px;line-height:1.6;margin:18px 0 8px}.dzDraftRecoveryActions{margin-top:20px;justify-content:flex-end}@media(max-width:600px){.dzDraftRecoveryModal{width:100vw;max-width:none;margin-top:auto;border-radius:24px 24px 0 0}.dzDraftRecoveryActions{display:grid;grid-template-columns:1fr 1fr}.dzDraftRecoveryActions .btn{width:100%}}';
  document.head.appendChild(style);
}
function install(){
  if(installing)return;installing=true;styles();keepBrandNavigationInSession();
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
