import { SupabaseV3Repository } from './data/supabase-repository.js';
import { buildPeriodView, answerCanIBuy } from './application/financial-service.js';
import { minorToMajor, majorToMinor } from './core/money.js';

const repo=new SupabaseV3Repository();
let state=null,view=null,currentEvent=null;
const $=id=>document.getElementById(id);
const money=minor=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(minorToMajor(Number(minor||0)));
const dateLabel=value=>new Date(`${String(value).slice(0,10)}T12:00:00`).toLocaleDateString('es-ES',{day:'2-digit',month:'short'});
const monthLabel=ym=>{const[y,m]=ym.split('-').map(Number);return new Date(y,m-1,1).toLocaleDateString('es-ES',{month:'long',year:'numeric'});};
function addMonth(ym,delta){const[y,m]=ym.split('-').map(Number),d=new Date(y,m-1+delta,1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
function sourceName(event){const all=[...(state?.incomeRules||[]),...(state?.expenseRules||[]),...(state?.debts||[]),...(state?.savingsGoals||[])];return all.find(x=>x.id===event.sourceId)?.name||event.name||event.metadata?.name||event.sourceType||'Movimiento';}
function eventDay(event){return String(event.occurredAt||event.scheduledAt||'').slice(0,10);}
function toast(text){const el=$('toast');el.textContent=text;el.classList.remove('hidden');setTimeout(()=>el.classList.add('hidden'),2800);}
function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

async function init(){
  bind();
  const session=await repo.session();
  if(!session){showAuth();return;}
  await load();
}
function showAuth(){$('authView').classList.remove('hidden');$('appView').classList.add('hidden');$('logoutBtn').classList.add('hidden');}
async function load(){
  const plan=await repo.getPlanForCurrentUser();
  if(!plan){$('authView').innerHTML='<div><h1>V3 todavía no tiene un plan para este usuario.</h1><p class="muted">La migración debe ejecutarse antes de entrar.</p></div>';showAuth();return;}
  state=await repo.loadPlanState(plan.id);
  $('authView').classList.add('hidden');$('appView').classList.remove('hidden');$('logoutBtn').classList.remove('hidden');
  let month=$('monthPicker').value||new Date().toISOString().slice(0,7);
  for(let i=0;i<4;i+=1){try{buildPeriodView(state,month);break;}catch{month=addMonth(month,1);}}
  $('monthPicker').value=month;
  $('purchaseDate').value=new Date().toISOString().slice(0,10);
  render();
}
function render(){
  try{view=buildPeriodView(state,$('monthPicker').value);renderView();}
  catch(error){console.error(error);toast(error.message);}
}
function totals(){const t=view.summary.totalsByType||{};return{income:Math.max(0,Number(t.income||0)),expense:Math.abs(Number(t.expense||0)+Number(t.adjustment||0)),debt:Math.abs(Number(t.debt_payment||0)),saving:Math.abs(Number(t.saving_reservation||0))};}
function renderView(){
  $('engineBadge').textContent=view.engineVersion;
  $('periodCaption').textContent=`${monthLabel(view.labelMonth)} · ${dateLabel(view.period.start)} — ${dateLabel(view.period.end)} · ${state.plan.salaryFundingStrategy==='funds_next_month'?'la nómina recibida al final financia este periodo':'financiación del mismo mes'}`;
  const t=totals();
  $('incomeValue').textContent=money(t.income);$('expenseValue').textContent=money(t.expense);$('debtValue').textContent=money(t.debt);$('savingValue').textContent=money(t.saving);
  $('netValue').textContent=money(view.summary.netMinor);$('netValue').className=view.summary.netMinor>=0?'positive':'negative';
  const actualCount=view.summary.events.filter(e=>['actual','confirmed'].includes(e.status)).length;
  $('truthCaption').textContent=`${actualCount} hechos confirmados · el resto es previsión`;
  renderExplanation();renderRisks();renderEvents();renderAccounts();renderForecast();
}
function renderExplanation(){
  const rows=[...view.summary.events].sort((a,b)=>Math.abs(b.amountMinor)-Math.abs(a.amountMinor)).slice(0,8);
  $('explainList').innerHTML=rows.map(e=>`<div class="row"><div class="rowMain"><strong>${escapeHtml(sourceName(e))}</strong><small>${dateLabel(eventDay(e))} · ${escapeHtml(e.eventType)}</small></div><strong class="${e.amountMinor>=0?'positive':'negative'}">${money(e.amountMinor)}</strong></div>`).join('')||'<p class="muted">Sin movimientos.</p>';
}
function renderRisks(){
  const risks=view.fundingRisks||[];
  $('riskList').innerHTML=risks.length?risks.map(r=>`<div class="risk"><strong>Falta preparar ${money(Math.abs(r.amountMinor||0))}</strong><p class="muted">La cuenta secundaria no tiene confirmada la transferencia necesaria${r.firstRiskDate?` antes del ${dateLabel(r.firstRiskDate)}`:''}. DineroZaurio no la considera realizada.</p></div>`).join(''):'<div class="row"><div class="rowMain"><strong class="positive">Sin desajustes operativos detectados</strong><small>No hay transferencias vencidas sin confirmar para este periodo.</small></div></div>';
}
function pill(e){const cls=e.evidenceLevel==='bank_actual'?'actual':e.evidenceLevel==='user_confirmed'?'confirmed':'';const text=e.evidenceLevel==='bank_actual'?'Banco':e.evidenceLevel==='user_confirmed'?'Confirmado':'Previsto';return`<span class="statePill ${cls}">${text}</span>`;}
function renderEvents(){
  const rows=[...view.summary.events].sort((a,b)=>eventDay(a).localeCompare(eventDay(b)));
  $('eventList').innerHTML=rows.map(e=>{const editable=e.status==='expected'&&['expense','debt_payment','saving_reservation'].includes(e.eventType)&&e.sourceId;const confirmable=e.status==='expected'&&eventDay(e)<=new Date().toISOString().slice(0,10);return`<div class="event"><span class="eventDate">${dateLabel(eventDay(e))}</span><div class="eventMain"><strong>${escapeHtml(sourceName(e))}</strong><small>${escapeHtml(e.eventType)} · ${escapeHtml(e.sourceType||'')}</small></div><strong class="${e.amountMinor>=0?'positive':'negative'}">${money(e.amountMinor)}</strong><div class="eventActions">${pill(e)}${editable?`<button class="ghost" data-edit="${escapeHtml(e.id)}">Editar</button>`:''}${confirmable?`<button class="ghost" data-confirm="${escapeHtml(e.id)}">Confirmar</button>`:''}</div></div>`;}).join('');
  $('eventList').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openEdit(rows.find(e=>e.id===b.dataset.edit)));
  $('eventList').querySelectorAll('[data-confirm]').forEach(b=>b.onclick=()=>confirmEvent(rows.find(e=>e.id===b.dataset.confirm)));
}
function renderAccounts(){
  $('accountList').innerHTML=(view.accounting.accounts||[]).map(a=>`<article class="card accountCard"><span class="eyebrow">${a.isPrimary?'CUENTA PRINCIPAL':'CUENTA SECUNDARIA'}</span><h2>${escapeHtml(a.name)}</h2><div class="accountBalance ${a.totalMinor>=0?'positive':'negative'}">${money(a.totalMinor)}</div><div class="bucket"><span>Saldo libre</span><strong>${money(a.freeMinor)}</strong></div>${a.buckets.map(b=>`<div class="bucket"><span>${escapeHtml(b.name)}</span><strong>${money(b.balanceMinor)}</strong></div>`).join('')}</article>`).join('');
}
async function renderForecast(){
  const base=$('monthPicker').value,items=[];
  for(let i=0;i<6;i+=1){const ym=addMonth(base,i);try{const x=buildPeriodView(state,ym);items.push({ym,net:x.summary.netMinor});}catch(error){items.push({ym,error});}}
  $('forecastList').innerHTML=items.map(x=>`<div class="forecastItem"><span>${escapeHtml(monthLabel(x.ym))}</span>${x.error?'<strong>—</strong>':`<strong class="${x.net>=0?'positive':'negative'}">${money(x.net)}</strong>`}</div>`).join('');
}
function openEdit(event){currentEvent=event;$('editTitle').textContent=sourceName(event);$('editDate').value=event.originalScheduledAt||event.scheduledAt;$('editAmount').value=Math.abs(minorToMajor(event.amountMinor)).toFixed(2);$('editDialog').showModal();}
async function saveOccurrence(event){event.preventDefault();if(!currentEvent)return;const amount=majorToMinor(Number($('editAmount').value||0)),date=$('editDate').value;await repo.saveEventOverride({plan_id:state.plan.id,source_type:currentEvent.sourceType,source_id:currentEvent.sourceId,original_scheduled_at:currentEvent.originalScheduledAt||currentEvent.scheduledAt,override_type:'replace',new_scheduled_at:date,new_amount_minor:amount,reason:'Editado por el usuario desde DineroZaurio v3',metadata:{ui:'v3'}});$('editDialog').close();toast('Ocurrencia actualizada');await reloadState();}
async function confirmEvent(event){if(!confirm(`Confirmar que ${sourceName(event)} ocurrió por ${money(Math.abs(event.amountMinor))}?`))return;await repo.confirmFinancialEvent({plan_id:state.plan.id,source_type:event.sourceType,source_id:event.sourceId,event_type:event.eventType,scheduled_at:event.originalScheduledAt||event.scheduledAt,occurred_at:new Date().toISOString(),amount_minor:event.amountMinor,currency:event.currency||'EUR',account_id:event.accountId||null,bucket_id:event.bucketId||null,status:'confirmed',evidence_level:'user_confirmed',metadata:{name:sourceName(event),confirmedFrom:'v3_ui'}});toast('Movimiento confirmado');await reloadState();}
async function reloadState(){state=await repo.loadPlanState(state.plan.id);render();}
async function evaluate(){try{const amount=majorToMinor(Number($('purchaseAmount').value||0));if(amount<=0)throw new Error('Indica un importe');const result=answerCanIBuy({state,labelMonth:$('monthPicker').value,amountMinor:amount,purchaseDate:$('purchaseDate').value,safetyFloorMinor:majorToMinor(Number($('safetyFloor').value||0))});const el=$('decisionResult');el.classList.remove('hidden','danger');if(!result.affordable)el.classList.add('danger');el.innerHTML=`<h3>${result.affordable?'Sí, encaja en la proyección':'No es una compra segura con los datos actuales'}</h3><p>Margen mínimo después de comprar: <strong>${money(result.minimumProjectedBalanceMinor)}</strong>. Dinero libre estimado con el colchón elegido: <strong>${money(result.safeSpendableMinor)}</strong>.</p>${result.fundingRisks.length?`<p>Además hay ${result.fundingRisks.length} transferencia${result.fundingRisks.length===1?'':'s'} pendiente${result.fundingRisks.length===1?'':'s'} que afecta${result.fundingRisks.length===1?'':'n'} a la seguridad operativa.</p>`:''}<p class="muted">Decisión: ${escapeHtml(result.engineVersion)} · simulación, no modifica tus datos.</p>`;}catch(error){toast(error.message);}}
function bind(){
  $('loginBtn').onclick=()=>repo.signInWithGoogle(location.href);$('logoutBtn').onclick=async()=>{await repo.signOut();showAuth();};
  $('monthPicker').onchange=render;$('prevMonth').onclick=()=>{$('monthPicker').value=addMonth($('monthPicker').value,-1);render();};$('nextMonth').onclick=()=>{$('monthPicker').value=addMonth($('monthPicker').value,1);render();};
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.tabPanel').forEach(x=>x.classList.add('hidden'));$(`tab-${b.dataset.tab}`).classList.remove('hidden');});
  $('saveOccurrenceBtn').onclick=saveOccurrence;$('evaluateBtn').onclick=e=>{e.preventDefault();evaluate();};
  $('explainBtn').onclick=()=>{$('explainDialogList').innerHTML=$('eventList').innerHTML;$('explainDialog').showModal();};
}
init().catch(error=>{console.error(error);toast(error.message);showAuth();});
