
function closeModal(){
 const mount=$('#modalMount');if(!mount)return;
 mount.hidden=true;mount.innerHTML='';openModalType='';formEntryId=null;
}
function renderModal(title,body,footer=''){
 const mount=$('#modalMount');
 mount.innerHTML='<div class="modal-backdrop" data-action="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="'+htmlSafe(title)+'">'+
 '<div class="modal-heading"><h2>'+htmlSafe(title)+'</h2><button type="button" class="modal-close" data-action="close-modal" aria-label="Cerrar">×</button></div>'+
 '<div class="modal-content">'+body+'</div>'+
 (footer?'<div class="modal-bottom">'+footer+'</div>':'')+'</div></div>';
 mount.hidden=false;
 mount.querySelector('input:not([type=hidden]),textarea,select,button')?.focus();
}
function openWeightModal(date=selectedDate){
 const current=weightForDay(date);openModalType='weight';
 const fields=METRICS.filter(m=>m.id!=='weight').map(m=>{
  const val=isNumber(current?.[m.id])?String(current[m.id]):'';
  return '<label>'+htmlSafe(m.name)+(m.unit?' ('+htmlSafe(m.unit)+')':'')+
   '<input type="number" name="'+m.id+'" min="0" max="'+m.max+'" step="any" inputmode="decimal" value="'+htmlSafe(val)+'" placeholder="Sin medir"></label>';
 }).join('');
 renderModal(current?'Editar medición':'Nueva medición',
 '<form id="weightForm" class="input-grid">'+
 '<label>Fecha<input type="date" name="date" value="'+htmlSafe(date)+'" required></label>'+
 '<label>Peso (kg)<input type="number" name="weight" min="20" max="500" step="any" value="'+(current?current.weight:'')+'" inputmode="decimal" required></label>'+
 '<label>Hora (opcional)<input type="time" name="time" value="'+htmlSafe(current?.time||'')+'"></label>'+
 '<div class="section-gap" style="grid-column:1/-1"><h3>Indicadores de la báscula</h3><p class="helper">Introduce solo los que hayas medido.</p></div>'+
 '<div class="metric-input-grid" style="grid-column:1/-1">'+fields+'</div>'+
 '<label style="grid-column:1/-1">Notas<textarea name="note" rows="2">'+htmlSafe(current?.note||'')+'</textarea></label>'+
 '<div class="tools" style="grid-column:1/-1;justify-content:flex-end"><button type="button" class="click" data-action="close-modal">Cancelar</button><button type="submit" class="click primary">Guardar medición</button></div></form>');
}
function readWeightForm(form){
 const data=new FormData(form),date=String(data.get('date')||''),kg=asNum(data.get('weight'));
 if(!dateValid(date)||!isNumber(kg)||kg<20||kg>500)throw Error('Revisa el peso y la fecha.');
 const previous=weightForDay(date);
 const next=previous?{...previous}:{id:uid(),date,approx:false,note:''};
 next.weight=kg;next.date=date;
 const t=String(data.get('time')||'');if(t)next.time=t;else delete next.time;
 const note=String(data.get('note')||'').trim();next.note=note.slice(0,500);
 for(const m of METRICS.filter(m=>m.id!=='weight')){
  const raw=String(data.get(m.id)||'').trim();
  if(!raw){delete next[m.id];continue;}
  const value=asNum(raw);
  if(!isNumber(value)||value<0||value>m.max)throw Error(m.name+': valor fuera del intervalo.');
  next[m.id]=value;
 }
 return next;
}
function saveWeightForm(form){
 const next=readWeightForm(form),old=weightForDay(next.date);
 const backup=state.weights;
 state.weights=backup.filter(w=>w.date!==next.date);
 state.weights.push(next);
 try{validateState(state)}catch(e){state.weights=backup;throw e}
 selectCalendarDay(next.date,false);closeModal();changed(old?'Medición actualizada.':'Medición añadida.');
}
function openFoodModal(recipeId,entryId=null){
 let recipe=RECIPES.find(x=>x.id===recipeId);
 let existing=entryId?(state.logs||[]).find(x=>x.id===entryId):null;
 if(!existing&&!recipe)throw Error('Alimento no encontrado.');
 const items=existing?existing.parts.map(x=>[x.foodId,x.qty]):recipe.parts;
 const title=existing?existing.title:recipe.name;
 const moment=existing?.meal||recipe?.meal||'Otro';
 openModalType='food';formEntryId=entryId;
 const lines=items.map(([id,qty],i)=>{
  const f=food(id);return '<label>'+htmlSafe(f?.name||id)+' ('+htmlSafe(f?.unit||'unidades')+')'+
   '<input type="number" name="qty_'+i+'" data-food-id="'+htmlSafe(id)+'" min="0.01" step="any" inputmode="decimal" value="'+htmlSafe(qty)+'" required></label>';
 }).join('');
 renderModal(existing?'Editar comida':title,
 '<form id="foodForm">'+
 '<div class="input-grid">'+
 '<label>Momento del día<select name="meal">'+['Desayuno','Comida','Merienda','Cena','Otro'].map(x=>'<option value="'+x+'" '+(x===moment?'selected':'')+'>'+x+'</option>').join('')+'</select></label>'+
 '<label>Fecha<input type="date" name="date" required value="'+htmlSafe(existing?.date||selectedDate)+'"></label>'+
 '</div><div class="input-grid section-gap">'+lines+'</div>'+
 '<div class="section-gap notice">Calorías estimadas: <strong id="foodEstimate">—</strong>. Puedes corregir las cantidades.</div>'+
 '<label class="section-gap">Observación (opcional)<textarea name="note" rows="2">'+htmlSafe(existing?.note||'')+'</textarea></label>'+
 '<div class="tools section-gap" style="justify-content:flex-end">'+
 (existing?'<button type="button" class="click danger" data-action="delete-food" data-id="'+htmlSafe(existing.id)+'">Eliminar</button>':'')+
 '<button type="button" class="click" data-action="close-modal">Cancelar</button><button type="submit" class="click primary">Guardar comida</button></div>'+
 '</form>');
 updateFoodEstimate();
}
function readFoodParts(form){
 const entries=[...form.querySelectorAll('[data-food-id]')];
 if(!entries.length)throw Error('No hay alimentos en esta entrada.');
 return entries.map(e=>{
  const qty=asNum(e.value);
  if(!isNumber(qty)||qty<=0||qty>100000)throw Error('Cantidad inválida.');
  return makePart(e.dataset.foodId,qty);
 });
}
function updateFoodEstimate(){
 const form=$('#foodForm'),el=$('#foodEstimate');if(!form||!el)return;
 try{el.textContent=locale(logTotal(readFoodParts(form)),0)+' kcal'}
 catch(e){el.textContent='Comprueba las cantidades';}
}
function saveFoodForm(form){
 const date=String(new FormData(form).get('date')||'');
 if(!dateValid(date))throw Error('Fecha no válida.');
 const parts=readFoodParts(form),values=new FormData(form);
 const recipe=RECIPES.find(x=>x.id===form.dataset.recipeId);
 const previous=formEntryId?state.logs.find(x=>x.id===formEntryId):null;
 const title=previous?.title||recipe?.name||'Comida';
 const next={id:previous?.id||uid(),date,meal:String(values.get('meal')||'Otro'),title,note:String(values.get('note')||'').trim().slice(0,500),parts};
 if(!['Desayuno','Comida','Merienda','Cena','Otro'].includes(next.meal))throw Error('Momento no válido.');
 state.logs=state.logs.filter(x=>x.id!==next.id).concat(next);
 selectCalendarDay(date,false);closeModal();changed('Comida guardada.');
}
function openActivityModal(){
 openModalType='activity';
 renderModal('Registrar actividad',
 '<form id="activityForm" class="input-grid">'+
 '<label>Fecha<input type="date" name="date" value="'+htmlSafe(selectedDate)+'" required></label>'+
 '<label>Actividad<select name="type"><option>Beat Saber</option><option>Pistol Whip</option><option>Caminar</option><option>Otra</option></select></label>'+
 '<label>Duración (min)<input type="number" name="minutes" step="0.5" min="0.5" max="240" value="7.5" required></label>'+
 '<label style="grid-column:1/-1">Notas<textarea name="note" rows="2"></textarea></label>'+
 '<div class="tools" style="grid-column:1/-1;justify-content:flex-end"><button type="button" class="click" data-action="close-modal">Cancelar</button><button type="submit" class="click primary">Registrar actividad</button></div></form>');
}
function saveActivity(form){
 const data=new FormData(form),date=String(data.get('date')),type=String(data.get('type')||''),minutes=asNum(data.get('minutes'));
 if(!dateValid(date)||!isNumber(minutes)||minutes<=0||minutes>240||!type)throw Error('Revisa los datos de la actividad.');
 if(!Array.isArray(state.activities))state.activities=[];
 state.activities.push({id:uid(),date,type,minutes,note:String(data.get('note')||'').slice(0,500)});
 selectCalendarDay(date,false);closeModal();changed('Actividad registrada.');
}
function saveProfile(form){
 const values=new FormData(form),name=String(values.get('profileName')||'').trim(),w=String(values.get('targetWeight')||'').trim();
 const h=String(values.get('height')||'').trim(),start=String(values.get('trackingStartDate')||'');
 if(!name||name.length>80)throw Error('Nombre inválido.');
 if(start&&!dateValid(start))throw Error('Fecha de inicio inválida.');
 if(w&&(!isNumber(asNum(w))||asNum(w)<20||asNum(w)>500))throw Error('Objetivo inválido.');
 if(h&&(!isNumber(asNum(h))||asNum(h)<100||asNum(h)>250))throw Error('Altura inválida.');
 state.profile.name=name;state.profile.targetWeight=w?asNum(w):null;state.profile.height=h?asNum(h):null;
 if(start)state.trackingStartDate=start;
 $('#identityName').textContent=name;$('#avatarLetter').textContent=name[0].toUpperCase();
 changed('Perfil actualizado.');
}
function exportJSON(){
 const file=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
 const a=document.createElement('a'),href=URL.createObjectURL(file);
 a.href=href;a.download='dinofit-copia-'+isoToday()+'.json';document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(href),20000);
}
async function importFromText(){
 const raw=$('#importJson')?.value.trim();
 if(!raw)return toast('Pega los datos JSON antes de importar.');
 try{
  const decoded=JSON.parse(raw),payload=Array.isArray(decoded)?{type:'dinofit-chat-import-v1',weights:decoded}:decoded;
  const parsed=normalizeImport(payload);
  if(!parsed)throw Error('Formato JSON no reconocido.');
  const count=mergeImport(parsed);
  render();const saved=await persistNow();
  if(saved){lastImportSummary=count+' fechas incorporadas y sincronizadas.';toast(lastImportSummary)}
  else toast('Los cambios siguen pendientes de sincronización; no cierres la página.');
 }catch(e){toast('Error de importación: '+e.message)}
}
async function logout(){
 if(dirty && !await persistNow()){toast('No se ha guardado: conserva la sesión abierta.');return;}
 const {error}=await db.auth.signOut({scope:'local'});
 if(error){toast('No se pudo cerrar la sesión.');return;}
 resetSession();saveMessage('Sesión cerrada.');$('#googleLogin').hidden=false;
}
async function actionHandler(event){
 const button=event.target.closest('[data-action]');
 if(!button)return;
 // Refresh the calendar before any click, including the first click after midnight.
 refreshCalendarDay();
 const action=button.dataset.action;
 if(action==='modal-backdrop'){if(event.target===button)closeModal();return;}
 try{
  switch(action){
   case 'view':activeView=button.dataset.view;if(activeView==='today')selectCalendarDay(isoToday());else render();break;
   case 'date-prev':selectCalendarDay(addDays(selectedDate,-1));break;
   case 'date-next':selectCalendarDay(addDays(selectedDate,1));break;
   case 'date-today':selectCalendarDay(isoToday());break;
   case 'dashboard-tab':
     if(['weight','composition','goal','nutrition'].includes(button.dataset.tab)){dashboardArea=button.dataset.tab;render();}
     break;
    case 'forecast-mode':
     if(['observed','active','both'].includes(button.dataset.mode)){forecastMode=button.dataset.mode;render();}
     break;
    case 'composition-all':compositionFocus='all';render();break;
    case 'composition-metric':
     compositionFocus=compositionFocus===button.dataset.id?'all':button.dataset.id;render();break;
    case 'chart-zoom':chartZoom=button.dataset.mode==='short'?'short':'full';render();break;
   case 'set-vr':vrMinutes=Number(button.dataset.minutes);render();break;
   case 'metric':selectedMetric=button.dataset.id;render();break;
   case 'weight-new':openWeightModal(selectedDate);break;
   case 'weight-edit':openWeightModal(button.dataset.date);break;
   case 'close-modal':closeModal();break;
   case 'add-food':
    openFoodModal(button.dataset.recipe);
    if($('#foodForm'))$('#foodForm').dataset.recipeId=button.dataset.recipe;
    break;
   case 'edit-food':openFoodModal(null,button.dataset.id);break;
   case 'delete-food':{
    const id=button.dataset.id;
    if(!confirm('¿Eliminar esta entrada de comida?'))return;
    state.logs=state.logs.filter(x=>x.id!==id);
    closeModal();changed('Entrada eliminada.');break;
   }
   case 'add-activity':openActivityModal();break;
   case 'delete-activity':{
    if(!confirm('¿Eliminar esta actividad?'))return;
    state.activities=(state.activities||[]).filter(x=>x.id!==button.dataset.id);changed('Actividad eliminada.');break;
   }
   case 'save':await persistNow()?toast('Sincronizado.'):toast('No se pudo sincronizar.');break;
   case 'import-paste':await importFromText();break;
   case 'export':exportJSON();break;
   case 'logout':await logout();break;
  }
 }catch(e){toast('No se completó: '+e.message)}
}
function formHandler(event){
 const form=event.target;if(!['weightForm','foodForm','activityForm','profileForm'].includes(form.id))return;
 event.preventDefault();
 try{
  if(form.id==='weightForm')saveWeightForm(form);
  else if(form.id==='foodForm')saveFoodForm(form);
  else if(form.id==='activityForm')saveActivity(form);
  else if(form.id==='profileForm')saveProfile(form);
 }catch(e){toast('No se guardó: '+e.message)}
}
function changeHandler(event){
 if(event.target.id==='globalDate'){
  const date=event.target.value;
  if(dateValid(date))selectCalendarDay(date);return;
 }
 if(event.target.id==='dayComplete'){
  const dates=new Set(state.completeDays||[]);
  if(event.target.checked)dates.add(selectedDate);else dates.delete(selectedDate);
  state.completeDays=[...dates];changed('Estado del día actualizado.');
 }
}
function keyHandler(event){
 if(event.key==='Escape'&&!$('#modalMount').hidden)closeModal();
}
async function boot(){
 const login=$('#googleLogin'),retry=$('#retryLoad');
 document.addEventListener('click',actionHandler);
 document.addEventListener('submit',formHandler);
 document.addEventListener('change',changeHandler);
 document.addEventListener('input',e=>{if(e.target.closest('#foodForm'))updateFoodEstimate()});
 document.addEventListener('keydown',keyHandler);
 window.addEventListener('online',()=>{if(dirty&&!conflict)persistNow()});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&dirty)persistNow();else if(document.visibilityState==='visible')refreshCalendarDay()});
 window.addEventListener('focus',()=>refreshCalendarDay());
 // A tab kept open across midnight must show the new day's empty diary immediately.
 window.setInterval(()=>refreshCalendarDay(),30000);
 try{capturePendingFromFragment()}catch(e){notice='No se pudo interpretar el enlace de importación.'}
 login.onclick=async()=>{
  if(!db)return saveMessage('No se ha cargado la conexión.');
  login.disabled=true;
  const {error}=await db.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+'/dinofit/',scopes:'email profile'}});
  if(error){saveMessage('No se pudo abrir Google.');login.disabled=false}
 };
 retry.onclick=async()=>{
  if(!db)return;const {data,error}=await db.auth.getSession();
  if(error)return saveMessage('No se pudo recuperar la sesión.');
  if(data?.session)await loadAccount(data.session.user);else login.hidden=false;
 };
 if(!window.supabase){saveMessage('No se ha podido cargar Supabase. Comprueba tu conexión.');login.hidden=false;return;}
 db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 db.auth.onAuthStateChange((event,session)=>setTimeout(()=>{
  if(session)loadAccount(session.user);
  else if(event==='SIGNED_OUT'){resetSession();login.hidden=false;saveMessage('Inicia sesión con Google.')}
 },0));
 try{
  const {data,error}=await db.auth.getSession();
  if(error)throw error;
  if(data?.session)await loadAccount(data.session.user);
  else{login.hidden=false;saveMessage(notice||'Entra con Google para consultar tu seguimiento.')}
 }catch(e){login.hidden=false;saveMessage('No se pudo recuperar tu sesión. Inténtalo de nuevo.')}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
