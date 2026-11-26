'use strict';

const SUPABASE_URL = 'https://adpjitccwwvlydrtvvqk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_D8CL0HI8vLfD5L3g5ZgUGg_HOM6Ixdk';
const DATE_ZONE = 'Europe/Madrid';
const METRICS = [
 {id:'weight',name:'Peso',unit:'kg',decimals:1,max:500},
 {id:'bodyFat',name:'Grasa corporal',unit:'%',decimals:1,max:100},
 {id:'bmi',name:'IMC',unit:'',decimals:1,max:100},
 {id:'skeletalMuscle',name:'Músculo esquelético',unit:'%',decimals:1,max:100},
 {id:'muscleMass',name:'Masa muscular',unit:'kg',decimals:1,max:500},
 {id:'protein',name:'Proteína',unit:'%',decimals:1,max:100},
 {id:'bmr',name:'Metabolismo basal',unit:'kcal',decimals:0,max:10000},
 {id:'fatFreeMass',name:'Masa libre de grasa',unit:'kg',decimals:1,max:500},
 {id:'subcutaneousFat',name:'Grasa subcutánea',unit:'%',decimals:1,max:100},
 {id:'visceralFat',name:'Grasa visceral (índice)',unit:'',decimals:0,max:100},
 {id:'bodyWater',name:'Agua corporal',unit:'%',decimals:1,max:100},
 {id:'boneMass',name:'Masa ósea',unit:'kg',decimals:2,max:30}
];
const RECIPES = [
 {id:'coffee',group:'usual',name:'Café con leche desnatada',emoji:'☕',hint:'1 café + 120 ml de leche',meal:'Desayuno',parts:[['coffee',1],['milk',120]]},
 {id:'cola',group:'usual',name:'Coca-Cola Zero',emoji:'🥤',hint:'330 ml · estimación 0 kcal',meal:'Otro',parts:[['cola',330]]},
 {id:'cacaolat',group:'usual',name:'Vaso de Cacaolat 0%',emoji:'🥛',variant:'200 ml',meal:'Otro',parts:[['cacaolat-0',200]]},
 {id:'cheese',group:'usual',name:'Loncha de queso light',emoji:'🧀',hint:'1 loncha · 25 g',meal:'Otro',parts:[['cheese',1]]},
 {id:'flan',group:'usual',name:'Flan proteico',emoji:'🍮',hint:'1 unidad · 100 g',meal:'Otro',parts:[['flan',1]]},
 {id:'yopro',group:'usual',name:'YoPRO',emoji:'🥛',hint:'1 unidad · 120 g',meal:'Otro',parts:[['yopro',1]]},
 {id:'yopro-stracciatella',group:'usual',name:'YoPRO Stracciatella',emoji:'🥛',hint:'1 unidad · 120 g',meal:'Otro',parts:[['yopro-stracciatella',1]]},
 {id:'yopro-fresa',group:'usual',name:'YoPRO Fresa',emoji:'🥛',hint:'1 unidad · 120 g',meal:'Otro',parts:[['yopro-fresa',1]]},
 {id:'activia',group:'usual',name:'Activia cereales',emoji:'🥣',hint:'1 unidad · 115 g',meal:'Otro',parts:[['activia-cereales',1]]},
 {id:'mixed-chicken',group:'mixed',name:'Pechuga + salteados',emoji:'🥘',hint:'≈350 kcal · aceite incluido',meal:'Comida',parts:[['chicken',145],['saute-chicken',56.25],['saute-frank',56.25],['oil',7]]},
 {id:'mixed-beef',group:'mixed',name:'Ternera + salteados',emoji:'🥘',hint:'≈430 kcal · aceite incluido',meal:'Comida',parts:[['beef',150],['saute-chicken',56.25],['saute-frank',56.25],['oil',7]]},
 {id:'mixed-chickenburgers',group:'mixed',name:'2 burgers de pollo + salteados',emoji:'🍔',hint:'≈450–460 kcal · 2 burgers',meal:'Comida',parts:[['burger-chicken',2],['saute-chicken',56.25],['saute-frank',56.25],['oil',7]]},
 {id:'mixed-beefburgers',group:'mixed',name:'2 burgers de ternera + salteados',emoji:'🍔',hint:'≈560 kcal · 2 burgers',meal:'Comida',parts:[['burger-beef',2],['saute-chicken',56.25],['saute-frank',56.25],['oil',7]]},
 {id:'chicken',group:'plain',name:'Solo pechuga de pollo',emoji:'🍗',hint:'≈165 kcal · 150 g orientativos',meal:'Comida',parts:[['chicken',150]]},
 {id:'beef',group:'plain',name:'Solo filete de ternera',emoji:'🥩',hint:'≈240 kcal · 150 g orientativos',meal:'Comida',parts:[['beef',150]]},
 {id:'chickenburgers',group:'plain',name:'Solo 2 burgers de pollo',emoji:'🍔',hint:'≈265 kcal · 2 unidades',meal:'Comida',parts:[['burger-chicken',2]]},
 {id:'beefburgers',group:'plain',name:'Solo 2 burgers de ternera',emoji:'🍔',hint:'≈375 kcal · 2 unidades',meal:'Comida',parts:[['burger-beef',2]]}
];
const $ = q => document.querySelector(q);
const $$ = q => [...document.querySelectorAll(q)];
const htmlSafe = v => String(v == null ? '' : v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const locale = (v,n=0) => Number(v).toLocaleString('es-ES',{minimumFractionDigits:n,maximumFractionDigits:n});
const isoToday = () => new Intl.DateTimeFormat('sv-SE',{timeZone:DATE_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const utcDay = d => Date.parse(d+'T12:00:00Z');
const addDays = (d,n) => new Date(utcDay(d)+Math.round(n)*86400000).toISOString().slice(0,10);
const dayDiff = (a,b) => Math.round((utcDay(b)-utcDay(a))/86400000);
const dateValid = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(utcDay(x)) && new Date(utcDay(x)).toISOString().slice(0,10) === x;
const readableDate = d => dateValid(d) ? new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(utcDay(d))) : '—';
const shortDate = d => dateValid(d) ? new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(utcDay(d))) : '—';
const uid = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'id-'+Math.random().toString(36).slice(2);
const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
const rawCatalog = () => JSON.parse($('#catalog-data').textContent);
const isNumber = x => typeof x === 'number' && Number.isFinite(x);
const asNum = x => typeof x === 'string' ? Number(x.replace(',','.')) : Number(x);
let db=null,account=null,state=null,revision=null,activeView='today',selectedDate=isoToday(),selectedMetric='bodyFat',chartZoom='full',vrMinutes=0;
let authEpoch=0,loadingUser=null,saveTimeout=null,savePromise=null,changeCount=0,dirty=false,saving=false,conflict=false,saveError='',openModalType='',formEntryId=null;
// Dashboard UI state is session-only. Never store navigation or chart choices in the health record.
let dashboardArea='weight',compositionFocus='all',forecastMode='both';
 // The day on screen follows Madrid's calendar only while the user is viewing today.
let lastObservedToday=isoToday(),followCurrentDay=true;
function selectCalendarDay(date,rerender=true){
 if(!dateValid(date))return false;
 const today=isoToday();
 lastObservedToday=today;
 selectedDate=date;
 followCurrentDay=date===today;
 if(rerender&&state&&account)render();
 return true;
}
function refreshCalendarDay(current=isoToday()){
 if(!dateValid(current)||current===lastObservedToday)return false;
 const priorToday=lastObservedToday;
 lastObservedToday=current;
 // Don't carry yesterday's food into today in a tab left open overnight.
 // Respect explicit historical selection, including during midnight rollover.
 if(followCurrentDay&&selectedDate===priorToday)selectedDate=current;
 else followCurrentDay=selectedDate===current;
 if(state&&account)render();
 return true;
}

const PENDING_IMPORT_KEY='dinofit_chat_import_pending_v3';
let importInProgress=false,notice='',lastImportSummary='';

function toast(msg){
 const el=$('#toast');if(!el)return;
 el.textContent=msg;el.hidden=false;
 clearTimeout(toast.timer);
 toast.timer=setTimeout(()=>{el.hidden=true},4600);
}
function food(id){
 return state && state.foods ? state.foods.find(x=>x.id===id) : null;
}
function normalizeCatalog(){
 const catalog=rawCatalog();
 if(!Array.isArray(state.foods))state.foods=[];
 let added=0;
 for(const f of catalog.foods){if(!state.foods.some(x=>x.id===f.id)){state.foods.push({...f});added++;}}
 return added;
}
function defaultDocument(user){
 const cat=rawCatalog();
 return {schemaVersion:1,appVersion:'3.1',profile:{
   name:user.user_metadata?.given_name||user.user_metadata?.full_name||'Mi cuenta',
   age:null,height:null,startDate:isoToday(),startWeight:null,targetWeight:null,reference:'',historySource:''
  },foods:cat.foods,stocks:cat.stocks,logs:[],weights:[],unallocated:[],
  history:[],activities:[],batch:{yield:1800},completeDays:[],pantry:{version:1,inventory:{},shopping:[],batches:[]},savedAt:null};
}
function validateState(d){
 if(!d||d.schemaVersion!==1||!d.profile||!Array.isArray(d.weights)||!Array.isArray(d.logs)||!Array.isArray(d.history)||!Array.isArray(d.foods))throw Error('Formato del seguimiento no válido.');
 const dates=new Set();
 for(const w of d.weights){
  if(!dateValid(w.date)||!isNumber(w.weight)||w.weight<20||w.weight>500||dates.has(w.date))throw Error('Peso o fecha repetidos en '+String(w.date));
  dates.add(w.date);
  if(Array.isArray(w.alternates))for(const alt of w.alternates){
   if(!alt||!isNumber(alt.weight)||alt.weight<20||alt.weight>500)throw Error('Pesada adicional no válida en '+w.date);
   if(alt.time!==undefined&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(alt.time))throw Error('Hora adicional no válida.');
   for(const m of METRICS)if(alt[m.id]!==undefined&&(!isNumber(alt[m.id])||alt[m.id]<0||alt[m.id]>m.max))throw Error('Indicador adicional no válido: '+m.name);
  }
  for(const m of METRICS){
   if(w[m.id] == null)continue;
   if(!isNumber(w[m.id])||w[m.id]<0||w[m.id]>m.max)throw Error('Indicador no válido: '+m.name+' en '+w.date);
  }
 }
 for(const entry of d.logs)if(!dateValid(entry.date)||!Array.isArray(entry.parts))throw Error('Registro de comida no válido.');
 if(d.profile.targetWeight!=null&&(!isNumber(d.profile.targetWeight)||d.profile.targetWeight<20||d.profile.targetWeight>500))throw Error('Objetivo no válido.');
 if(d.activities && !Array.isArray(d.activities))throw Error('Actividades no válidas.');
 if(d.pantry && (typeof d.pantry!=='object'||!d.pantry.inventory||!Array.isArray(d.pantry.shopping)||!Array.isArray(d.pantry.batches)))throw Error('Despensa no válida.');
 return true;
}
function sortedWeights(){
 return (state?.weights||[]).slice().sort((a,b)=>a.date.localeCompare(b.date));
}
function weightsUntil(d=selectedDate){
 return sortedWeights().filter(w=>w.date<=d);
}
function weightForDay(d=selectedDate){
 return (state?.weights||[]).find(w=>w.date===d)||null;
}
function latestWeight(d=selectedDate){
 return weightsUntil(d).at(-1)||null;
}
function trackingStart(){
 return dateValid(state?.trackingStartDate)?state.trackingStartDate:(sortedWeights()[0]?.date||isoToday());
}
function dayLogs(d=selectedDate){
 return (state?.logs||[]).filter(x=>x.date===d).slice();
}
// Infer the meal occasion from the food type and entries already saved for this date.
// No clock-time assumptions: meals may be entered retrospectively or on a night schedule.
function foodKind(parts=[],recipe=null){
 const ids=(parts||[]).map(part=>Array.isArray(part)?part[0]:part?.foodId).filter(Boolean);
 if(recipe?.group==='mixed'||recipe?.group==='plain'||ids.some(id=>id==='chicken'||id==='beef'||id.startsWith('burger-')||id.startsWith('saute-')))return 'main';
 const eggs=(parts||[]).reduce((total,p)=>total+((Array.isArray(p)?p[0]:p?.foodId)==='egg'?Number(Array.isArray(p)?p[1]:p?.qty)||0:0),0);
 if(eggs>=2)return 'main';
 if(ids.some(id=>['coffee','milk','cheese','flan','yopro','yopro-fresa','yopro-stracciatella','activia-cereales','yogurt','yogurt-berries','yogurt-pineapple','egg'].includes(id)))return 'light';
 return 'extra';
}
function inferFoodMeal(date,parts,recipe=null,excludeId=null){
 if(!dateValid(date))return 'Otro';
 const kind=foodKind(parts,recipe);
 if(kind==='extra')return 'Otro';
 const prior=dayLogs(date).filter(e=>e.id!==excludeId);
 if(kind==='main')return prior.some(e=>foodKind(e.parts)==='main'||e.meal==='Comida')?'Cena':'Comida';
 // A first coffee, yoghurt or dessert is breakfast unless a meal was recorded earlier.
 // Later light foods are snacks, or extras when dinner is already registered.
 if(prior.some(e=>e.meal==='Cena'))return 'Otro';
 const priorMeaningful=prior.some(e=>foodKind(e.parts)!=='extra'||e.meal==='Desayuno'||e.meal==='Comida');
 return priorMeaningful?'Merienda':'Desayuno';
}
function logTotal(parts){
 return parts.reduce((n,p)=>n+(isNumber(p.kcal)?p.kcal:0),0);
}
function makePart(id,qty){
 const f=food(id);
 if(!f)throw Error('Alimento no disponible: '+id);
 const factor=(isNumber(f.factor)&&f.factor>0?f.factor:1);
 const size=qty*factor/100;
 return {foodId:id,qty,kcal:+(size*f.kcal).toFixed(2),min:+(size*f.min).toFixed(2),max:+(size*f.max).toFixed(2)};
}
function setSaveUI(){
 const el=$('#saveStatus');if(!el)return;
 const busy=saving?'Guardando…':conflict?'Conflicto de edición':saveError?'Sin sincronizar':dirty?'Pendiente de guardar':'Guardado en tu cuenta';
 el.innerHTML='<span class="save-dot'+(conflict||saveError?' fail':dirty||saving?' pending':'')+'"></span>'+htmlSafe(busy);
}
function changed(message){
 dirty=true;changeCount++;setSaveUI();render();
 if(message)toast(message);
 clearTimeout(saveTimeout);
 if(!conflict)saveTimeout=setTimeout(()=>{persistNow()},800);
}
async function persistNow(){
 clearTimeout(saveTimeout);
 if(!state||!account||conflict)return false;
 if(savePromise){await savePromise;if(dirty&&!saveError&&!conflict)return persistNow();return !dirty;}
 if(!dirty){setSaveUI();return true;}
 let payload;try{validateState(state);payload=structuredClone(state)}catch(e){saveError=e.message;setSaveUI();toast(saveError);return false;}
 payload.savedAt=new Date().toISOString();
 const owner=account.id,epoch=authEpoch,seq=changeCount;
 saving=true;saveError='';setSaveUI();
 savePromise=(async()=>{
  try{
   const {data,error}=await db.from('dinofit_documents').update({document:payload}).eq('user_id',owner).eq('revision',revision).select('revision,updated_at');
   if(epoch!==authEpoch)return false;
   if(error)throw error;
   if(!data||data.length!==1){conflict=true;saveError='Otro dispositivo modificó los datos. Recarga antes de continuar.';return false;}
   revision=data[0].revision;state.savedAt=payload.savedAt;
   if(seq===changeCount)dirty=false;return true;
  }catch(e){if(epoch===authEpoch)saveError='No se pudieron sincronizar los cambios.';return false}
  finally{if(epoch===authEpoch){saving=false;setSaveUI()}}
 })();
 const ok=await savePromise;savePromise=null;
 if(dirty&&!conflict&&!saveError){clearTimeout(saveTimeout);saveTimeout=setTimeout(()=>persistNow(),600)}
 return ok;
}
function saveMessage(text){
 const el=$('#authMessage');if(el)el.textContent=text;
}
function resetSession(){
 authEpoch++;clearTimeout(saveTimeout);
 state=null;account=null;revision=null;loadingUser=null;appleDayCache=null;appleDayLoad=null;
 dirty=false;saving=false;conflict=false;saveError='';savePromise=null;changeCount=0;
 $('#privatePage').hidden=true;$('#authGate').hidden=false;
}
async function loadAccount(user){
 if(!user||!user.id||loadingUser===user.id||(account?.id===user.id&&state))return;
 loadingUser=user.id;const epoch=authEpoch;saveMessage('Cargando tus datos…');
 try{
  let {data,error}=await db.from('dinofit_documents').select('document,revision').eq('user_id',user.id).maybeSingle();
  if(error)throw error;
  if(!data){
   const initial=defaultDocument(user);
   let result=await db.from('dinofit_documents').insert({user_id:user.id,document:initial}).select('document,revision').single();
   if(result.error?.code==='23505')result=await db.from('dinofit_documents').select('document,revision').eq('user_id',user.id).single();
   if(result.error)throw result.error;data=result.data;
  }
  if(epoch!==authEpoch)return;
  validateState(data.document);
  account=user;state=data.document;revision=data.revision;loadingUser=null;
  $('#privatePage').hidden=false;$('#authGate').hidden=true;
  $('#identityName').textContent=state.profile.name||'Mi cuenta';
  $('#avatarLetter').textContent=(state.profile.name||'M').slice(0,1).toUpperCase();
  lastObservedToday=isoToday();selectedDate=lastObservedToday;followCurrentDay=true;activeView='today';
  const seeded=normalizeCatalog()+Number(normalizePantry());if(seeded){dirty=true;changeCount++}
  await applyPendingChatImport();
  render();
  if(dirty&&!saveError)persistNow();
 }catch(e){
  loadingUser=null;saveMessage('No se pudo cargar tu seguimiento. Intenta de nuevo.');
  $('#retryLoad').hidden=false;$('#googleLogin').hidden=false;
 }
}
function capturePendingFromFragment(){
 const hash=window.location.hash||'';
 const match=hash.match(/(?:^#|[&#])import=([A-Za-z0-9_-]{30,10000})/);
 if(!match)return;
 try{
  const payload=decodeBase64UrlJson(match[1]);
  if(payload?.type==='dinofit-chat-import-v1'&&Array.isArray(payload.weights)){
   sessionStorage.setItem(PENDING_IMPORT_KEY,JSON.stringify(payload));
   history.replaceState(null,'',location.pathname+location.search);
   notice='Importación preparada; se aplicará al entrar con Google.';
  }
 }catch(e){notice='El enlace de importación no es válido.';}
}
function decodeBase64UrlJson(s){
 const normalized=s.replace(/-/g,'+').replace(/_/g,'/');
 const bytes=atob(normalized+'='.repeat((4-normalized.length%4)%4));
 const chars=Uint8Array.from(bytes,c=>c.charCodeAt(0));
 return JSON.parse(new TextDecoder().decode(chars));
}
function normalizeImport(input){
 if(!input||input.type!=='dinofit-chat-import-v1'||!Array.isArray(input.weights)||input.weights.length>100)return null;
 const weights=[],seen=new Set();
 for(const w of input.weights){
  if(!w||!dateValid(w.date)||seen.has(w.date))throw Error('Fechas inválidas o duplicadas.');
  const normalized={date:w.date};seen.add(w.date);
  for(const m of METRICS){
   const v=w[m.id];
   if(v===undefined||v===null||v==='')continue;
   const n=asNum(v);
   if(!Number.isFinite(n)||n<0||n>m.max||(m.id==='weight'&&n<20))throw Error('Dato inválido: '+m.name);
   normalized[m.id]=n;
  }
  if(w.alternates!==undefined){
   if(!Array.isArray(w.alternates)||w.alternates.length>10)throw Error('Demasiadas pesadas adicionales.');
   normalized.alternates=w.alternates.map(a=>{
    if(!a||!isNumber(a.weight)||a.weight<20||a.weight>500||a.time!==undefined&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(a.time))throw Error('Pesada adicional inválida.');
    const alt={weight:a.weight};if(a.time)alt.time=a.time;
    for(const m of METRICS.filter(m=>m.id!=='weight')){
      if(a[m.id]!==undefined&&a[m.id]!==null){if(!isNumber(a[m.id])||a[m.id]<0||a[m.id]>m.max)throw Error('Métrica adicional no válida.');alt[m.id]=a[m.id]}
    }
    return alt;
   });
  }
  if(w.note!==undefined){if(typeof w.note!=='string'||w.note.length>500)throw Error('Nota demasiado larga.');normalized.note=w.note;}
  if(w.time!==undefined){if(typeof w.time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(w.time))throw Error('Hora no válida.');normalized.time=w.time;}
  weights.push(normalized);
 }
 if(input.targetWeight!==undefined&&(!isNumber(input.targetWeight)||input.targetWeight<20||input.targetWeight>500))throw Error('Objetivo no válido.');
 if(input.trackingStartDate!==undefined&&!dateValid(input.trackingStartDate))throw Error('Periodo de seguimiento no válido.');
 const logs=Array.isArray(input.logs)?input.logs:[];
 if(logs.length>100)throw Error('Demasiados registros de comida.');
 for(const l of logs){
  if(!l||!dateValid(l.date)||typeof l.importKey!=='string'||!/^chat-[a-zA-Z0-9_-]{3,90}$/.test(l.importKey)||
      typeof l.title!=='string'||l.title.length>120||
      !['Desayuno','Comida','Merienda','Cena','Otro'].includes(l.meal)||
      !Array.isArray(l.parts)||l.parts.length<1||l.parts.length>12)throw Error('Comida importada inválida.');
  for(const p of l.parts)if(!p||typeof p.foodId!=='string'||typeof p.qty!=='number'||!Number.isFinite(p.qty)||p.qty<=0||p.qty>100000)throw Error('Cantidad de comida importada inválida.');
 }
 const activities=Array.isArray(input.activities)?input.activities:[];
 if(activities.length>100)throw Error('Demasiadas actividades.');
 for(const a of activities)if(!dateValid(a.date)||!isNumber(a.minutes)||a.minutes<=0||a.minutes>240||typeof a.type!=='string')throw Error('Actividad no válida.');
 return {weights,activities,logs,targetWeight:input.targetWeight,trackingStartDate:input.trackingStartDate};
}
function mergeImport(imported){
 const dates=new Map(sortedWeights().map(w=>[w.date,{...w}]));
 for(const w of imported.weights){
  const old=dates.get(w.date);
  if(!old&&!isNumber(w.weight))throw Error('Falta el peso para '+w.date);
  dates.set(w.date,old?{...old,...w}:{id:uid(),approx:false,note:'',...w});
 }
 const nextWeights=[...dates.values()].sort((a,b)=>a.date.localeCompare(b.date));
 const acts=new Map((state.activities||[]).map(a=>[a.date+'|'+a.type,a]));
 for(const a of imported.activities)acts.set(a.date+'|'+a.type,{...acts.get(a.date+'|'+a.type),id:acts.get(a.date+'|'+a.type)?.id||uid(),...a});
 const nextLogs=(state.logs||[]).slice();
 for(const l of imported.logs||[]){
  const parts=l.parts.map(p=>makePart(p.foodId,p.qty));
  const same=nextLogs.find(x=>x.importKey===l.importKey||
   x.date===l.date&&x.title===l.title&&x.parts.length===parts.length&&x.parts.every((p,i)=>p.foodId===parts[i].foodId&&p.qty===parts[i].qty));
  if(!same)nextLogs.push({id:uid(),date:l.date,meal:l.meal,title:l.title,parts,note:l.note||'Registro anotado en conversación',importKey:l.importKey});
 }
 const next={...state,weights:nextWeights,activities:[...acts.values()],logs:nextLogs};
 if(imported.targetWeight!==undefined)next.profile={...next.profile,targetWeight:imported.targetWeight};
 if(imported.trackingStartDate)next.trackingStartDate=imported.trackingStartDate;
 validateState(next);
 state=next;dirty=true;changeCount++;
 return imported.weights.length;
}
async function applyPendingChatImport(){
 if(importInProgress||!state||!account)return;
 const raw=sessionStorage.getItem(PENDING_IMPORT_KEY);if(!raw)return;
 importInProgress=true;
 try{
  const imported=normalizeImport(JSON.parse(raw));if(!imported)throw Error('Importación no reconocida.');
  const count=mergeImport(imported);selectCalendarDay(isoToday(),false);
  const ok=await persistNow();
  if(ok){sessionStorage.removeItem(PENDING_IMPORT_KEY);lastImportSummary=count+' mediciones incorporadas a tu cuenta';toast(lastImportSummary)}
  else{notice='La importación está preparada pero aún no se ha sincronizado.';toast(notice)}
 }catch(e){notice='Error al cargar las mediciones: '+e.message;toast(notice)}
 finally{importInProgress=false}
}


const dfNutrients=[
 ['energy','Energía','kcal'],['fat','Grasas','g'],['saturated','Saturadas','g'],
 ['carbs','Hidratos de carbono','g'],['sugars','Azúcares','g'],['fibre','Fibra','g'],
 ['protein','Proteínas','g'],['salt','Sal','g'],['calcium','Calcio','mg'],
 ['magnesium','Magnesio','mg'],['folate','Vitamina B9','µg'],['vitaminD','Vitamina D','µg']
];
let dfNutritionIndex;
function dfNutritionProfile(f){
 if(!f)return null;
 if(f.nutrition?.values)return f.nutrition;
 if(!dfNutritionIndex)dfNutritionIndex=new Map((rawCatalog().foods||[]).filter(x=>x.nutrition).map(x=>[x.id,x.nutrition]));
 return dfNutritionIndex.get(f.id)||null;
}
function dfNutritionPart(part){
 const f=food(part.foodId),n=dfNutritionProfile(f);
 if(!n||!isNumber(part.qty)||part.qty<=0||!isNumber(n.amount)||n.amount<=0)return {};
 const quantity=f.unit===n.unit?part.qty:
  f.unit==='ud'&&n.unit==='g'&&isNumber(f.factor)&&f.factor>0?part.qty*f.factor:null;
 if(quantity===null)return {};
 return Object.fromEntries(dfNutrients.filter(([k])=>isNumber(n.values[k])&&n.values[k]>=0).map(([k])=>[k,n.values[k]*quantity/n.amount]));
}
function dfNutritionSummary(parts,extras=0){
 const values=parts.map(dfNutritionPart),count=parts.length+extras;
 return dfNutrients.filter(([k])=>k!=='energy').map(([key,label,unit])=>{
  const known=values.filter(v=>isNumber(v[key]));
  return {key,label,unit,total:known.length?known.reduce((s,v)=>s+v[key],0):null,known:known.length,count};
 });
}
function dfNutritionTotalsMarkup(parts,extras=0,title='Información nutricional'){
 if(!parts.length&&!extras)return '';
 const rows=dfNutritionSummary(parts,extras);
 return '<details class="section pantry3-nutrition"><summary>'+htmlSafe(title)+'</summary><p>Los subtotales solo incluyen los ingredientes con ficha. Si te interesa un valor pendiente, abre la ficha del producto en Despensa. Las calorías del diario no cambian.</p><dl>'+
  rows.map(r=>'<div><dt>'+htmlSafe(r.label)+'</dt><dd>'+(r.total===null?'Sin dato':
   htmlSafe(locale(r.total,2)+' '+r.unit)+(r.known===r.count?'':' <small>· parcial ('+r.known+'/'+r.count+')</small>'))+'</dd></div>').join('')+'</dl></details>';
}
function dfNutritionProductMarkup(f){
 const n=dfNutritionProfile(f),esc=htmlSafe;
 if(!n)return '<p><strong>Pendiente: identificar la variedad y verificar su etiqueta.</strong> Envía al chat una foto del envase y de su tabla nutricional o el código de barras. Puedes registrar la compra igualmente.</p>';
 let url=null;try{const u=new URL(n.source);if(u.protocol==='https:')url=u.href}catch{}
 return '<p>Por '+esc(locale(n.amount,0)+' '+n.unit)+(n.variant?' · '+esc(n.variant):'')+'</p><dl>'+
  dfNutrients.map(([k,l,u])=>'<div><dt>'+esc(l)+'</dt><dd>'+(isNumber(n.values[k])?esc(locale(n.values[k],2)+' '+u):isNumber(n.upper?.[k])?esc('Menos de '+locale(n.upper[k],2)+' '+u):'Pendiente')+'</dd></div>').join('')+
  '</dl><small>'+esc((n.kind||'Fuente')+(n.checked?' · revisada '+n.checked:''))+(url?' · <a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Ver fuente</a>':'')+'</small>';
}

let appleDayCache=null,appleDayLoad=null;
async function loadAppleDay(force=false){
 if(!db||!account||!state)return;
 const owner=account.id,date=selectedDate,scope=owner+'/'+date,now=Date.now();
 if(appleDayLoad===scope||(!force&&appleDayCache?.scope===scope&&now-appleDayCache.at<25000))return;
 appleDayLoad=scope;
 try{
  const {data,error}=await db.from('dinofit_apple_workouts').select('external_id,label,minutes,active_kcal').eq('owner_id',owner).eq('local_day',date).order('started_at');
  if(account?.id!==owner||selectedDate!==date)return;
  appleDayCache={scope,at:Date.now(),rows:error?[]:(data||[]),error:!!error};
  if(activeView==='today'&&dashboardArea==='goal')render();
 }catch{
  if(account?.id!==owner||selectedDate!==date)return;
  appleDayCache={scope,at:Date.now(),rows:[],error:true};
  if(activeView==='today'&&dashboardArea==='goal')render();
 }finally{if(appleDayLoad===scope)appleDayLoad=null;}
}
