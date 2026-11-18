
function renderCalendar(){
 const el=$('#calendarBar');if(!el)return;
 const today=isoToday(),isNow=selectedDate===today;
 el.innerHTML='<button class="arrow" data-action="date-prev" type="button" aria-label="Día anterior">‹</button>'+
  '<span class="date-info"><strong>'+htmlSafe(readableDate(selectedDate))+'</strong><small>'+(isNow?'Hoy':'Fecha seleccionada')+'</small></span>'+
  '<input type="date" id="globalDate" aria-label="Elegir día" value="'+htmlSafe(selectedDate)+'">'+
  '<button class="arrow" data-action="date-next" type="button" aria-label="Día siguiente">›</button>'+
  '<button class="today" data-action="date-today" type="button">Hoy</button>';
}
function timeLine(){
 const values=weightsUntil().filter(w=>w.date>=trackingStart());
 return values;
}
function metricData(id){
 return timeLine().filter(w=>isNumber(w[id])).map(w=>({date:w.date,value:w[id]}));
}
function bestFit(list){
 if(list.length<3)return null;
 const x0=list[0].date,xx=list.map(w=>dayDiff(x0,w.date)),yy=list.map(w=>w.weight);
 const n=list.length,meanX=xx.reduce((a,b)=>a+b,0)/n,meanY=yy.reduce((a,b)=>a+b,0)/n;
 const sum=xx.reduce((acc,v,i)=>acc+(v-meanX)*(yy[i]-meanY),0);
 const div=xx.reduce((acc,v)=>acc+(v-meanX)**2,0);
 if(div===0)return null;
 return sum/div;
}
function projections(){
 const actual=timeLine(),anchor=actual.at(-1),goal=state?.profile?.targetWeight;
 if(!anchor||!isNumber(goal)||goal>=anchor.weight)return {emp:[],adjusted:[],slope:null,empDate:null,adjDate:null};
 const recent=actual.filter(w=>dayDiff(w.date,anchor.date)>=-14);
 const slope=bestFit(recent);
 if(slope===null||slope>=0)return {emp:[],adjusted:[],slope,empDate:null,adjDate:null};
 const emp=[],adjusted=[],endDay=Math.ceil((anchor.weight-goal)/-slope);
 if(endDay>0&&endDay<=3650){
  for(let d=0;d<=endDay;d+=Math.max(1,Math.ceil(endDay/80)))emp.push({date:addDays(anchor.date,d),value:Math.max(goal,anchor.weight+slope*d)});
  emp.push({date:addDays(anchor.date,endDay),value:goal});
 }
 let weight=anchor.weight,adjDate=null;
 for(let d=0;d<=1825;d++){
  if(d%12===0||d===0||weight<=goal)adjusted.push({date:addDays(anchor.date,d),value:+weight.toFixed(3)});
  if(weight<=goal+1e-6){adjDate=addDays(anchor.date,d);break}
  const residual= Math.abs(slope)*Math.pow(weight/anchor.weight,1.3)*Math.exp(-d/510);
  const kcalExtra=vrMinutes?3*3.5*weight/200*vrMinutes*4/7:0;
  weight=Math.max(goal,weight-residual-(kcalExtra/7700));
 }
 return {emp,adjusted,slope,empDate:emp.length?emp.at(-1).date:null,adjDate};
}
function svgLine(series,{small=false,unit='kg',yBounds=null,showGoal=null}={}){
 const all=series.flatMap(s=>s.points||[]);
 if(!all.length)return '<div class="empty">Todavía no hay datos para mostrar.</div>';
 const W=small?220:1080,H=small?65:405;
 const margin=small?{l:3,r:3,t:6,b:6}:{l:66,r:28,t:22,b:48};
 const timestamps=all.map(p=>utcDay(p.date));
 const first=Math.min(...timestamps),last=Math.max(...timestamps),duration=Math.max(86400000,last-first);
 const vv=all.map(p=>p.value),lowest=Math.min(...vv,showGoal??Infinity),highest=Math.max(...vv,showGoal??-Infinity);
 const range=Math.max(.2,highest-lowest);
 const lo=yBounds?yBounds[0]:lowest-range*.06,hi=yBounds?yBounds[1]:highest+range*.08;
 const xp=d=>margin.l+(utcDay(d)-first)/duration*(W-margin.l-margin.r);
 const yp=v=>margin.t+((hi-v)/Math.max(0.01,hi-lo))*(H-margin.t-margin.b);
 const val=(v)=>locale(v,unit==='kcal'?0:1);
 let out='<svg class="chart-svg '+(small?'chart-small':'chart-large')+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Eje horizontal: fechas. Eje vertical: '+htmlSafe(unit)+'. Gráfico de evolución.">';
 if(!small){
  for(let k=0;k<=5;k++){
   const v=lo+(hi-lo)*k/5,y=yp(v);
   out+='<line x1="'+margin.l+'" y1="'+y.toFixed(2)+'" x2="'+(W-margin.r)+'" y2="'+y.toFixed(2)+'" stroke="#304158" stroke-width="1"/>'+
   '<text x="'+(margin.l-9)+'" y="'+(y+4).toFixed(2)+'" fill="#a0b3cd" font-size="12" text-anchor="end">'+val(v)+'</text>';
  }
  for(let k=0;k<=4;k++){
   const t=new Date(first+(last-first)*k/4).toISOString().slice(0,10),x=xp(t);
   out+='<text x="'+x.toFixed(2)+'" y="'+(H-13)+'" fill="#a0b3cd" font-size="12" text-anchor="'+(k===0?'start':k===4?'end':'middle')+'">'+htmlSafe(shortDate(t))+'</text>';
  }
  if(isNumber(showGoal)&&showGoal>=lo&&showGoal<=hi)out+='<line x1="'+margin.l+'" y1="'+yp(showGoal)+'" x2="'+(W-margin.r)+'" y2="'+yp(showGoal)+'" stroke="#6c8296" stroke-dasharray="3 7" stroke-width="1.2"/>';
 }
 for(const s of series){
  if(!s.points.length)continue;
  const pts=s.points.map(p=>xp(p.date).toFixed(2)+','+yp(p.value).toFixed(2)).join(' ');
  out+='<polyline points="'+pts+'" fill="none" stroke="'+(s.color||'#64dfc5')+'" stroke-width="'+(small?2.8:s.dash?2.6:3.5)+'" stroke-linecap="round" stroke-linejoin="round"'+(s.dash?' stroke-dasharray="'+s.dash+'"':'')+'/>';
  if(!small&&!s.dash){
   for(const p of s.points)out+='<circle cx="'+xp(p.date).toFixed(2)+'" cy="'+yp(p.value).toFixed(2)+'" r="4.0" fill="'+(s.color||'#64dfc5')+'" stroke="#172334" stroke-width="1.6"><title>'+htmlSafe(readableDate(p.date)+': '+val(p.value)+' '+unit)+'</title></circle>';
  }
 }
 return out+'</svg>';
}
function weightGraph(){
 const actual=timeLine(),goal=state?.profile?.targetWeight,pr=projections();
 const zoom=chartZoom==='short';
 const last=actual.at(-1);
 let series=[
  {id:'real',color:'#64dfc5',points:actual.map(w=>({date:w.date,value:w.weight}))}
 ];
 if(pr.emp.length)series.push({id:'emp',color:'#b79bfa',dash:'9 7',points:pr.emp});
 if(pr.adjusted.length)series.push({id:'slow',color:'#8dbdff',dash:'6 7',points:pr.adjusted});
 if(zoom&&last){
  const begin=addDays(last.date,-30),end=addDays(last.date,30);
  series=series.map(s=>({...s,points:s.points.filter(p=>p.date>=begin&&p.date<=end)}));
 }
 const targetPart=isNumber(goal)?'<strong class="accent">Objetivo '+locale(goal,1)+' kg</strong>':'<span class="dim">Define tu peso objetivo en Ajustes</span>';
 return '<section class="section">'+
 '<div class="section-head"><div><h2>Tu peso y el objetivo</h2><p>Datos observados y dos proyecciones diferenciadas · '+htmlSafe(readableDate(trackingStart()))+' en adelante</p></div>'+
 '<div class="tools"><button type="button" class="pillbutton '+(zoom?'active':'')+'" data-action="chart-zoom" data-mode="short">±30 días</button>'+
 '<button type="button" class="pillbutton '+(!zoom?'active':'')+'" data-action="chart-zoom" data-mode="full">Hasta el objetivo</button></div></div>'+
 svgLine(series,{unit:'kg',showGoal:goal})+
 '<div class="chart-legend"><span><i class="legend-line"></i> Peso registrado</span><span><i class="legend-line emp"></i> Proyección del ritmo reciente</span><span><i class="legend-line dec"></i> Proyección con ralentización</span></div>'+
 '<div class="proj-info">'+
  '<div class="proj-stat"><span>Meta de peso</span><strong>'+targetPart+'</strong></div>'+
  '<div class="proj-stat"><span>Ritmo observado (últimos 14 días)</span><strong>'+(pr.slope!=null?locale(pr.slope*1000,0)+' g/día':'Aún sin tendencia suficiente')+'</strong></div>'+
  '<div class="proj-stat"><span>Proyección lineal</span><strong>'+(pr.empDate?htmlSafe(readableDate(pr.empDate)):'Pendiente')+'</strong></div>'+
  '<div class="proj-stat"><span>Con ralentización</span><strong>'+(pr.adjDate?htmlSafe(readableDate(pr.adjDate)):'Fuera del horizonte simulado')+'</strong></div>'+
 '</div><div class="tools section-gap"><span class="helper">Cardio VR hipotético:</span>'+
 [0,15,20].map(x=>'<button type="button" class="pillbutton '+(vrMinutes===x?'active':'')+'" data-action="set-vr" data-minutes="'+x+'">'+(x?x+' min × 4 días/semana':'Sin VR')+'</button>').join('')+
 '</div><p class="chart-comment">La línea verde representa las pesadas reales. Las líneas punteadas son cálculos a partir del ritmo reciente, no valores medidos. La segunda supone una desaceleración progresiva; VR añade gasto orientativo y no sustituye datos de actividad real. El historial antiguo se conserva por separado.</p>'+
 '</section>';
}
function metricGrid(){
 const points=timeLine();
 const cards=METRICS.map(m=>{
  const a=points.filter(w=>isNumber(w[m.id])).map(w=>({date:w.date,value:w[m.id]}));
  const last=a.at(-1);
  return '<button type="button" class="scale-card '+(selectedMetric===m.id?'active':'')+'" data-action="metric" data-id="'+m.id+'" aria-pressed="'+(selectedMetric===m.id)+'">'+
   '<span class="s-label">'+htmlSafe(m.name)+'</span><span class="s-value">'+(last?locale(last.value,m.decimals)+' <small>'+htmlSafe(m.unit)+'</small>':'—')+'</span>'+
   (a.length>1?svgLine([{points:a,color:selectedMetric===m.id?'#64dfc5':'#a4b6d6'}],{small:true,unit:m.unit}):'<span class="dim tiny">Sin evolución todavía</span>')+'</button>';
 }).join('');
 const metric=METRICS.find(x=>x.id===selectedMetric)||METRICS[1];
 const selectedPoints=metricData(metric.id);
 return '<section class="section"><div class="section-head"><div><h2>Composición corporal</h2><p>Los doce indicadores de tu báscula, con su gráfico individual.</p></div>'+
 '<button type="button" class="click sm" data-action="weight-new">+ Medición</button></div>'+
 '<div class="scale-grid">'+cards+'</div>'+
 '<div class="scale-detail"><div class="detail-header"><strong>'+htmlSafe(metric.name)+'</strong><span class="helper">'+selectedPoints.length+' lecturas</span></div>'+
 svgLine([{points:selectedPoints,color:'#b79bfa'}],{unit:metric.unit||'índice'})+
 '<p class="chart-comment">Los valores de composición son estimaciones de bioimpedancia y pueden variar con la hidratación y las condiciones de la medición.</p></div></section>';
}
function getActivity(d){
 return (state.activities||[]).filter(a=>a.date===d);
}
function currentDay(){
 const records=timeLine(),value=weightForDay(),last=latestWeight(),first=records[0],log=dayLogs();
 const sum=log.reduce((n,e)=>n+logTotal(e.parts),0);
 const change=last&&first?first.weight-last.weight:null;
 const latest=last?htmlSafe(readableDate(last.date)):'Sin datos';
 let rows=[
  ['Peso de '+htmlSafe(shortDate(selectedDate)),value?locale(value.weight,1):'—','kg',value?'Medición registrada':'No se pesó este día','metric-main'],
  ['Último peso conocido',last?locale(last.weight,1):'—','kg',latest,''],
  ['Desde el primer registro',change==null?'—':(change>=0?'−':'+')+locale(Math.abs(change),1),'kg',htmlSafe(readableDate(first?.date)),''],
  ['Comidas registradas',log.length?locale(sum,0):'—','kcal',log.length+' entradas','']
 ];
 let out='<div class="view-head"><span class="eyebrow">TU SEGUIMIENTO</span><h1>'+ (selectedDate===isoToday()?'Hoy':'Tu día')+' · '+htmlSafe(readableDate(selectedDate))+'</h1><p>Elige una fecha arriba para consultar o registrar sus datos.</p></div>';
 if(notice)out+='<div class="notice section-gap">'+htmlSafe(notice)+'</div>';
 out+='<div class="metrics-row">'+rows.map(([label,val,unit,hint,cls])=>'<section class="section metric-card '+cls+'"><span class="eyebrow">'+label+'</span><div class="'+(cls?'big':'value')+'">'+val+' <span>'+unit+'</span></div><div class="micro">'+hint+'</div></section>').join('')+'</div>';
 out+=weightGraph()+metricGrid()+quickFoods()+dayRecords();
 return out;
}
function quickFoods(){
 return '<section class="section"><div class="section-head"><div><h2>Añadir una comida</h2><p>Accesos rápidos a tus alimentos habituales · '+htmlSafe(readableDate(selectedDate))+'</p></div><span class="helper">Puedes ajustar cantidades</span></div>'+
 '<div class="quick-grid">'+RECIPES.map(r=>'<button class="food-button" type="button" data-action="add-food" data-recipe="'+r.id+'">'+
 '<span class="food-top"><span class="em" aria-hidden="true">'+r.emoji+'</span><span class="plus">＋</span></span><strong>'+htmlSafe(r.name)+'</strong><small>'+htmlSafe(r.hint)+'</small></button>').join('')+'</div></section>';
}
function dayRecords(){
 const entries=dayLogs().sort((a,b)=>(a.meal||'').localeCompare(b.meal||'')),activities=getActivity(selectedDate);
 let body=entries.length?entries.map(e=>'<div class="day-entry"><div><strong>'+htmlSafe(e.title||'Comida')+'</strong><small>'+htmlSafe(e.meal||'Otro')+' · '+(e.parts||[]).map(p=>htmlSafe(food(p.foodId)?.name||p.foodId)+' × '+locale(p.qty,0)).join(' · ')+'</small></div><span class="calories">'+locale(logTotal(e.parts))+' kcal</span><button type="button" class="click sm" data-action="edit-food" data-id="'+htmlSafe(e.id)+'">Editar</button></div>').join(''):
 '<div class="empty">Todavía no hay comidas registradas para esta fecha.</div>';
 let sport=activities.length?activities.map(a=>'<div class="day-entry"><div><strong>'+htmlSafe(a.type||'Actividad')+'</strong><small>'+htmlSafe(a.note||'Actividad física')+'</small></div><strong>'+locale(a.minutes,1)+' min</strong><button type="button" class="click sm" data-action="delete-activity" data-id="'+htmlSafe(a.id)+'">Eliminar</button></div>').join(''):
 '<div class="helper">Sin actividad registrada.</div>';
 return '<section class="section"><div class="section-head"><div><h2>Registro del día</h2><p>'+entries.length+' comidas anotadas</p></div>'+
 '<label class="checkrow"><input type="checkbox" id="dayComplete" '+((state.completeDays||[]).includes(selectedDate)?'checked':'')+'>Día completo</label></div>'+
 '<div class="day-entries">'+body+'</div><div class="section-gap section-head"><div><h3>Actividad física</h3><p>Minutos reales, sin confundirlos con sesiones simuladas.</p></div><button type="button" class="click sm" data-action="add-activity">+ Actividad</button></div>'+sport+'</section>';
}
function currentHistory(){
 const tracking=trackingStart(),valid=sortedWeights(),recent=valid.filter(w=>w.date>=tracking),older=valid.filter(w=>w.date<tracking);
 const history=Array.isArray(state.history)?state.history:[];
 let html='<div class="view-head"><span class="eyebrow">REGISTRO HISTÓRICO</span><h1>Historial de mediciones</h1><p>Mediciones recientes y lecturas antiguas conservadas por separado.</p></div>';
 html+=weightGraph();
 html+='<section class="section"><div class="section-head"><div><h2>Mediciones actuales</h2><p>'+recent.length+' días registrados desde '+htmlSafe(readableDate(tracking))+'</p></div><button class="click sm" data-action="weight-new">+ Medición</button></div>'+
 '<div class="history-scroll"><table class="history-table"><thead><tr><th>Fecha</th><th>Peso</th><th>Grasa</th><th>Músculo</th><th>Agua</th><th></th></tr></thead><tbody>'+
 recent.filter(w=>w.date<=selectedDate).slice().reverse().map(w=>'<tr><td>'+htmlSafe(readableDate(w.date))+'</td><td>'+locale(w.weight,1)+' kg</td><td>'+(!isNumber(w.bodyFat)?'—':locale(w.bodyFat,1)+' %')+'</td><td>'+(!isNumber(w.muscleMass)?'—':locale(w.muscleMass,1)+' kg')+'</td><td>'+(!isNumber(w.bodyWater)?'—':locale(w.bodyWater,1)+' %')+'</td><td><button type="button" class="click sm" data-action="weight-edit" data-date="'+w.date+'">Editar</button></td></tr>').join('')+
 '</tbody></table></div></section>';
 html+='<section class="section"><div class="section-head"><div><h2>Archivo anterior</h2><p>No se mezcla con la curva de seguimiento actual.</p></div><span class="helper">'+older.length+' lecturas anteriores</span></div>'+
 (older.length||history.length?'<details><summary class="click" style="display:inline-block">Mostrar archivo</summary><div class="history-scroll section-gap"><table class="history-table"><thead><tr><th>Fecha</th><th>Peso</th><th>Origen</th></tr></thead><tbody>'+
 older.map(w=>'<tr><td>'+htmlSafe(readableDate(w.date))+'</td><td>'+locale(w.weight,1)+' kg</td><td>Registro anterior</td></tr>').join('')+
 history.flatMap(h=>([{date:h.startDate,weight:h.start},...(h.weights||[])]).filter(w=>dateValid(w.date)&&isNumber(w.weight)).map(w=>'<tr><td>'+htmlSafe(readableDate(w.date))+'</td><td>'+locale(w.weight,1)+' kg</td><td>'+htmlSafe(h.name||'Archivo')+'</td></tr>')).join('')+
 '</tbody></table></div></details>':'<div class="empty">Sin lecturas archivadas.</div>')+'</section>';
 return html;
}
function currentSettings(){
 const p=state.profile;
 return '<div class="view-head"><span class="eyebrow">TU CUENTA</span><h1>Ajustes</h1><p>Objetivos, periodo de seguimiento, importación y exportación.</p></div>'+
 '<section class="section"><div class="section-head"><div><h2>Tu perfil</h2><p>Los cambios afectarán a tus proyecciones y gráficas.</p></div></div>'+
 '<form id="profileForm" class="profile-layout">'+
 '<label>Nombre visible<input name="profileName" maxlength="80" value="'+htmlSafe(p.name||'')+'" required></label>'+
 '<label>Peso objetivo (kg)<input name="targetWeight" type="number" min="20" max="500" step="0.1" inputmode="decimal" value="'+(isNumber(p.targetWeight)?p.targetWeight:'')+'"></label>'+
 '<label>Fecha de inicio del seguimiento actual<input name="trackingStartDate" type="date" value="'+trackingStart()+'"></label>'+
 '<label>Altura (cm)<input name="height" type="number" min="100" max="250" step="0.1" inputmode="decimal" value="'+(isNumber(p.height)?p.height:'')+'"></label>'+
 '<div><button type="submit" class="click primary">Guardar perfil</button></div></form></section>'+
 '<section class="section"><div class="section-head"><div><h2>Importar las mediciones de ChatGPT</h2><p>Incorpora varias fechas de golpe sin borrar registros anteriores.</p></div></div>'+
 '<p class="helper">Puedes abrir un enlace de importación preparado en esta conversación o pegar aquí un JSON. Solo se modifican los campos de las fechas incluidas.</p>'+
 '<textarea id="importJson" aria-label="JSON de mediciones" rows="6" class="section-gap" placeholder=\'{"type":"dinofit-chat-import-v1","weights":[{"date":"2026-01-15","weight":95.0}]}\'></textarea>'+
 '<div class="tools section-gap"><button type="button" class="click primary" data-action="import-paste">Importar ahora</button></div>'+
 (lastImportSummary?'<div class="notice success section-gap">'+htmlSafe(lastImportSummary)+'</div>':'')+'</section>'+
 '<section class="section"><h2>Copia de seguridad y sesión</h2><p class="helper section-gap">Exporta todas tus comidas, pesadas y actividad en un archivo JSON privado.</p><div class="tools section-gap"><button type="button" class="click" data-action="export">Descargar copia JSON</button><button type="button" class="click danger" data-action="logout">Cerrar sesión</button></div></section>';
}
function render(){
 if(!state||!account)return;
 renderCalendar();setSaveUI();
 for(const b of $$('button[data-view]'))b.classList.toggle('selected',b.dataset.view===activeView);
 const content=$('#content');if(!content)return;
 content.innerHTML=activeView==='history'?currentHistory():activeView==='settings'?currentSettings():currentDay();
}
